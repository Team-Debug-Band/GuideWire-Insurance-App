from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import jwt
from jwt.exceptions import InvalidTokenError
from uuid import UUID

from core.db import get_db
from core.security import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM
from models.models import Worker
from schemas.user import UserCreate, Token

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
        
    try:
        uid = UUID(user_id)
    except ValueError:
        raise credentials_exception
        
    user = db.query(Worker).filter(Worker.id == uid).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/signup", response_model=Token)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    if not user_in.email and not user_in.phone:
        raise HTTPException(status_code=400, detail="Either email or phone must be provided")
        
    # Check existing
    if user_in.email:
        existing = db.query(Worker).filter(Worker.email == user_in.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    if user_in.phone:
        existing = db.query(Worker).filter(Worker.phone == user_in.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone already registered")
            
    hashed_password = get_password_hash(user_in.password)
    new_worker = Worker(
        name=user_in.name,
        email=user_in.email,
        phone=user_in.phone,
        hashed_password=hashed_password,
        role="WORKER"
    )
    db.add(new_worker)
    db.commit()
    db.refresh(new_worker)
    
    access_token = create_access_token(subject=str(new_worker.id))
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Worker).filter(
        (Worker.email == form_data.username) | (Worker.phone == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email/phone or password")
        
    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer"}

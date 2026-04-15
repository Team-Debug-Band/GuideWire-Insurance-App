from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str

class UserLogin(BaseModel):
    username: str # email or phone
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

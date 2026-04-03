from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import datetime

from core.db import get_db
from models.models import Worker, PlatformAccount, Policy, WeeklyCycle, CycleStatus, PolicyStatus
from schemas.worker import (
    WorkerProfileUpdate, WorkerProfileResponse, 
    PlatformAccountCreate, PlatformAccountResponse,
    PolicyResponse, DashboardResponse, WeeklyCycleResponse
)
from api.auth import get_current_user

router = APIRouter()

@router.get("/me", response_model=WorkerProfileResponse)
def get_me(current_user: Worker = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=WorkerProfileResponse)
def update_profile(profile_in: WorkerProfileUpdate, db: Session = Depends(get_db), current_user: Worker = Depends(get_current_user)):
    if profile_in.name is not None:
        current_user.name = profile_in.name
    if profile_in.city is not None:
        current_user.city = profile_in.city
    if profile_in.primary_zone is not None:
        current_user.primary_zone = profile_in.primary_zone
    if profile_in.persona_type is not None:
        current_user.persona_type = profile_in.persona_type
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me/platforms", response_model=List[PlatformAccountResponse])
def get_platforms(current_user: Worker = Depends(get_current_user)):
    return current_user.platforms

@router.post("/me/platforms", response_model=PlatformAccountResponse)
def add_platform(platform_in: PlatformAccountCreate, db: Session = Depends(get_db), current_user: Worker = Depends(get_current_user)):
    platform = PlatformAccount(
        worker_id=current_user.id,
        platform_type=platform_in.platform_type,
        avg_weekly_hours=platform_in.avg_weekly_hours,
        avg_weekly_earnings=platform_in.avg_weekly_earnings,
    )
    db.add(platform)
    db.commit()
    db.refresh(platform)
    return platform

@router.post("/me/policy", response_model=PolicyResponse)
def create_policy(db: Session = Depends(get_db), current_user: Worker = Depends(get_current_user)):
    if not current_user.platforms:
        raise HTTPException(status_code=400, detail="Must link at least one platform before creating a policy")
        
    # See if active policy exists
    active_policy = db.query(Policy).filter(Policy.worker_id == current_user.id, Policy.status == PolicyStatus.ACTIVE).first()
    if active_policy:
        raise HTTPException(status_code=400, detail="Active policy already exists")
        
    expected_income = sum(float(p.avg_weekly_earnings) for p in current_user.platforms)
    
    # Simple coverage -> 60% of expected income
    max_weekly_coverage = expected_income * 0.60
    
    new_policy = Policy(
        worker_id=current_user.id,
        status=PolicyStatus.ACTIVE,
        max_weekly_coverage=max_weekly_coverage
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    
    return new_policy

@router.post("/me/weekly-cycle/start", response_model=WeeklyCycleResponse)
def start_weekly_cycle(db: Session = Depends(get_db), current_user: Worker = Depends(get_current_user)):
    active_policy = db.query(Policy).filter(Policy.worker_id == current_user.id, Policy.status == PolicyStatus.ACTIVE).first()
    if not active_policy:
        raise HTTPException(status_code=400, detail="No active policy found")
        
    active_cycle = db.query(WeeklyCycle).filter(WeeklyCycle.worker_id == current_user.id, WeeklyCycle.status == CycleStatus.ACTIVE).first()
    if active_cycle:
        raise HTTPException(status_code=400, detail="An active weekly cycle already exists")
        
    expected_income = sum(float(p.avg_weekly_earnings) for p in current_user.platforms)
    
    start_date = datetime.datetime.utcnow()
    end_date = start_date + datetime.timedelta(days=7)
    
    cycle = WeeklyCycle(
        worker_id=current_user.id,
        policy_id=active_policy.id,
        week_start=start_date,
        week_end=end_date,
        status=CycleStatus.ACTIVE,
        expected_income=expected_income,
        actual_income=0.0,
        risk_score=0.85, # mock score
        weekly_premium=expected_income * 0.05, # roughly 5% premium
        risk_components={"base_risk": 0.5, "zone_multiplier": 1.2}
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return cycle

@router.get("/me/dashboard", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db), current_user: Worker = Depends(get_current_user)):
    policy = db.query(Policy).filter(Policy.worker_id == current_user.id, Policy.status == PolicyStatus.ACTIVE).first()
    active_cycle = db.query(WeeklyCycle).filter(WeeklyCycle.worker_id == current_user.id, WeeklyCycle.status == CycleStatus.ACTIVE).first()
    
    return DashboardResponse(
        worker=current_user,
        platforms=current_user.platforms,
        policy=policy,
        active_cycle=active_cycle
    )

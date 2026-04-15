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
from services.pricing import compute_weekly_premium
import numpy as np

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
        
    # Build worker features for ML model
    city_risk_map = {"chennai": 0.70, "bangalore": 0.60}
    city_risk = city_risk_map.get((current_user.city or "").lower(), 0.65)
    
    now = datetime.datetime.utcnow()
    month = now.month
    if month in [6, 7, 8, 9]:
        season_risk = 0.85
    elif month in [10, 11]:
        season_risk = 0.55
    else:
        season_risk = 0.35
        
    forecast_risk = season_risk * 0.9 # Default
    
    # Income volatility: std_dev / mean of avg_weekly_earnings
    if len(current_user.platforms) > 1:
        earnings = [float(p.avg_weekly_earnings) for p in current_user.platforms]
        income_volatility = float(np.std(earnings) / np.mean(earnings))
        # Clip to model range
        income_volatility = max(0.1, min(0.8, income_volatility))
    else:
        income_volatility = 0.4
        
    platform_count = len(current_user.platforms)
    
    # Weeks active
    created_at = current_user.created_at or now
    weeks_active = max(1, (now - created_at).days // 7)
    weeks_active = min(52, weeks_active)
    
    persona_map = {"FOOD": 0, "GROCERY": 1, "ECOMMERCE": 2}
    persona_type = persona_map.get(current_user.persona_type, 0)
    
    worker_features = {
        "city_risk": city_risk,
        "season_risk": season_risk,
        "forecast_risk": forecast_risk,
        "income_volatility": income_volatility,
        "platform_count": platform_count,
        "weeks_active": weeks_active,
        "persona_type": persona_type
    }
    
    pricing_result = compute_weekly_premium(worker_features)
    
    expected_income = sum(float(p.avg_weekly_earnings) for p in current_user.platforms)
    
    start_date = now
    end_date = start_date + datetime.timedelta(days=7)
    
    cycle = WeeklyCycle(
        worker_id=current_user.id,
        policy_id=active_policy.id,
        week_start=start_date,
        week_end=end_date,
        status=CycleStatus.ACTIVE,
        expected_income=expected_income,
        actual_income=0.0,
        risk_score=pricing_result["risk_score"],
        weekly_premium=pricing_result["weekly_premium"],
        risk_components=pricing_result["xai_breakdown"]
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return cycle

@router.get("/me/payouts", response_model=List[PayoutResponse])
def get_payouts(db: Session = Depends(get_db), current_user: Worker = Depends(get_current_user)):
    # Join Payout with Claim to filter by worker_id
    return db.query(Payout).join(Claim).filter(Claim.worker_id == current_user.id).all()

@router.get("/me/dashboard", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db), current_user: Worker = Depends(get_current_user)):
    policy = db.query(Policy).filter(Policy.worker_id == current_user.id, Policy.status == PolicyStatus.ACTIVE).first()
    active_cycle = db.query(WeeklyCycle).filter(WeeklyCycle.worker_id == current_user.id, WeeklyCycle.status == CycleStatus.ACTIVE).first()
    
    # Also fetch recent payouts for the dashboard
    recent_payouts = db.query(Payout).join(Claim).filter(Claim.worker_id == current_user.id).order_by(Payout.id.desc()).limit(5).all()
    
    return DashboardResponse(
        worker=current_user,
        platforms=current_user.platforms,
        policy=policy,
        active_cycle=active_cycle,
        recent_payouts=recent_payouts
    )

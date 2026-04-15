from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import datetime
from uuid import UUID

class WorkerProfileUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    primary_zone: Optional[str] = None
    persona_type: Optional[str] = None # FOOD, GROCERY, ECOMMERCE

class PlatformAccountCreate(BaseModel):
    platform_type: str
    avg_weekly_hours: float
    avg_weekly_earnings: float

class WorkerProfileResponse(BaseModel):
    id: UUID
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    primary_zone: Optional[str] = None
    persona_type: Optional[str] = None
    role: str
    
    class Config:
        from_attributes = True

class PlatformAccountResponse(BaseModel):
    id: UUID
    platform_type: str
    avg_weekly_hours: float
    avg_weekly_earnings: float
    
    class Config:
        from_attributes = True

class PolicyResponse(BaseModel):
    id: UUID
    status: str
    max_weekly_coverage: float
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True

class WeeklyCycleResponse(BaseModel):
    id: UUID
    week_start: datetime.datetime
    week_end: datetime.datetime
    status: str
    risk_score: Optional[float] = None
    weekly_premium: Optional[float] = None
    expected_income: float
    actual_income: float
    total_payout: float
    risk_components: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class PayoutResponse(BaseModel):
    id: UUID
    claim_id: UUID
    amount: float
    status: str
    payment_provider: Optional[str] = None
    payment_ref: Optional[str] = None
    
    class Config:
        from_attributes = True

class DashboardResponse(BaseModel):
    worker: WorkerProfileResponse
    platforms: List[PlatformAccountResponse]
    policy: Optional[PolicyResponse] = None
    active_cycle: Optional[WeeklyCycleResponse] = None
    recent_payouts: List[PayoutResponse] = []

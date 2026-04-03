from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from uuid import UUID
import datetime

class SimulateEventRequest(BaseModel):
    city: str
    zone: Optional[str] = None
    severity: float

class SimulateResponse(BaseModel):
    event_id: UUID
    message: str
    affected_cycles: int

class ProcessClaimsResponse(BaseModel):
    processed_claims: int
    approved_claims: int
    rejected_claims: int
    fraud_flags: int

class ParametricSimulatorRequest(BaseModel):
    historical_start: datetime.datetime
    historical_end: datetime.datetime
    rain_threshold: float
    curfew_threshold: float

class ParametricSimulatorResponse(BaseModel):
    simulated_events: int
    projected_payout: float
    basis_risk_score: float

class ClaimResponse(BaseModel):
    id: UUID
    worker_id: UUID
    status: str
    claimed_amount: float
    approved_amount: float
    fraud_score: Optional[float] = None
    
    class Config:
        from_attributes = True

class FraudAlertResponse(BaseModel):
    id: UUID
    zone: str
    claim_count: int
    deviation_score: float
    status: str
    
    class Config:
        from_attributes = True

class MetricsResponse(BaseModel):
    total_active_policies: int
    total_weekly_premiums: float
    total_payouts: float
    active_fraud_alerts: int

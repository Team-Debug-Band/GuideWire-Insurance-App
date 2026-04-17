from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import datetime
import random

from core.db import get_db
from models.models import (
    Worker, WeeklyCycle, CycleStatus, ExternalEvent, EventType, 
    DisruptionEvent, Claim, ClaimStatus, Policy, PolicyStatus, ZoneFraudAlert, FraudAlertStatus, Payout, PaymentStatus
)
from schemas.admin import (
    SimulateEventRequest, SimulateResponse, ProcessClaimsResponse,
    ParametricSimulatorRequest, ParametricSimulatorResponse,
    ClaimResponse, FraudAlertResponse, MetricsResponse
)
from services.trigger_pipeline import run_trigger_pipeline


router = APIRouter()

@router.post("/simulate-rain", response_model=SimulateResponse)
async def simulate_rain(req: SimulateEventRequest, db: Session = Depends(get_db)):
    result = await run_trigger_pipeline(
        city=req.city,
        event_type="RAIN",
        severity=req.severity,
        db=db,
        source="admin_sim"
    )
    if result.get("status") == "duplicate":
        return SimulateResponse(event_id=result["event_id"], message="Duplicate event exists", affected_cycles=0)
    
    return SimulateResponse(
        event_id=result["event_id"],
        message="Rain simulated",
        affected_cycles=result.get("workers_affected", 0)
    )

@router.post("/simulate-aqi", response_model=SimulateResponse)
async def simulate_aqi(req: SimulateEventRequest, db: Session = Depends(get_db)):
    result = await run_trigger_pipeline(
        city=req.city,
        event_type="AQI",
        severity=req.severity,
        db=db,
        source="admin_sim"
    )
    if result.get("status") == "duplicate":
        return SimulateResponse(event_id=result["event_id"], message="Duplicate event exists", affected_cycles=0)
    
    return SimulateResponse(
        event_id=result["event_id"],
        message="AQI simulated",
        affected_cycles=result.get("workers_affected", 0)
    )

@router.post("/simulate-curfew", response_model=SimulateResponse)
def simulate_curfew(req: SimulateEventRequest, db: Session = Depends(get_db)):
    event = ExternalEvent(
        city=req.city,
        zone=req.zone,
        event_type=EventType.CURFEW,
        severity=req.severity,
        start_time=datetime.datetime.utcnow(),
        end_time=datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    # Very simple mock logic
    active_cycles = db.query(WeeklyCycle).filter(WeeklyCycle.status == CycleStatus.ACTIVE).all()
    
    for cycle in active_cycles:
        disruption = DisruptionEvent(
            worker_id=cycle.worker_id,
            cycle_id=cycle.id,
            event_type=EventType.CURFEW,
            start_time=event.start_time,
            end_time=event.end_time,
            estimated_loss=float(cycle.expected_income) * 0.25 * req.severity
        )
        db.add(disruption)
        
        claim = Claim(
            worker_id=cycle.worker_id,
            policy_id=cycle.policy_id,
            cycle_id=cycle.id,
            disruption_id=disruption.id,
            status=ClaimStatus.CREATED,
            claimed_amount=disruption.estimated_loss
        )
        db.add(claim)
    
    db.commit()
    return SimulateResponse(event_id=event.id, message="Curfew simulated", affected_cycles=len(active_cycles))

@router.post("/process-claims", response_model=ProcessClaimsResponse)
def process_claims(db: Session = Depends(get_db)):
    pending_claims = db.query(Claim).filter(Claim.status == ClaimStatus.CREATED).all()
    
    approved = 0
    rejected = 0
    flags = 0
    
    for claim in pending_claims:
        # Behavioral Fraud Engine Mock
        fraud_score = random.uniform(0, 1.0)
        claim.fraud_score = fraud_score
        
        if fraud_score > 0.8:
            claim.status = ClaimStatus.REJECTED
            claim.fraud_signal_log = {"reason": "GPS spoofing probability high", "confidence": fraud_score}
            rejected += 1
            flags += 1
        else:
            claim.status = ClaimStatus.APPROVED
            claim.approved_amount = claim.claimed_amount
            claim.fraud_signal_log = {"reason": "Valid parametric trigger", "confidence": 1.0 - fraud_score}
            approved += 1
            
            # Emit payout
            payout = Payout(
                claim_id=claim.id,
                amount=claim.approved_amount,
                payment_provider="RAZORPAY_SANDBOX",
                status=PaymentStatus.SUCCESS
            )
            db.add(payout)
            
            # Update cycle
            cycle = db.query(WeeklyCycle).filter(WeeklyCycle.id == claim.cycle_id).first()
            if cycle:
                cycle.total_payout = float(cycle.total_payout) + float(claim.approved_amount)
                
    db.commit()
    
    return ProcessClaimsResponse(
        processed_claims=len(pending_claims),
        approved_claims=approved,
        rejected_claims=rejected,
        fraud_flags=flags
    )

@router.get("/metrics", response_model=MetricsResponse)
def get_metrics(db: Session = Depends(get_db)):
    active_policies = db.query(Policy).filter(Policy.status == PolicyStatus.ACTIVE).count()
    total_prem = db.query(func.sum(WeeklyCycle.weekly_premium)).filter(WeeklyCycle.status == CycleStatus.ACTIVE).scalar() or 0.0
    total_payouts = db.query(func.sum(Payout.amount)).filter(Payout.status == PaymentStatus.SUCCESS).scalar() or 0.0
    active_alerts = db.query(ZoneFraudAlert).filter(ZoneFraudAlert.status == FraudAlertStatus.ACTIVE).count()
    
    return MetricsResponse(
        total_active_policies=active_policies,
        total_weekly_premiums=float(total_prem),
        total_payouts=float(total_payouts),
        active_fraud_alerts=active_alerts
    )

@router.get("/claims", response_model=List[ClaimResponse])
def get_claims(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Claim).offset(skip).limit(limit).all()

@router.get("/fraud-alerts", response_model=List[FraudAlertResponse])
def get_fraud_alerts(db: Session = Depends(get_db)):
    return db.query(ZoneFraudAlert).all()

@router.post("/parametric-simulator", response_model=ParametricSimulatorResponse)
def parametric_simulator(req: ParametricSimulatorRequest, db: Session = Depends(get_db)):
    # Mock behavior for explainable AI simulator
    return ParametricSimulatorResponse(
        simulated_events=random.randint(10, 50),
        projected_payout=random.uniform(10000, 50000),
        basis_risk_score=random.uniform(0.1, 0.4)
    )

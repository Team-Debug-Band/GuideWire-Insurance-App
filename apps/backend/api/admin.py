from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
import datetime
import random

from core.db import get_db
from models.models import (
    Worker,
    WeeklyCycle,
    CycleStatus,
    ExternalEvent,
    EventType,
    DisruptionEvent,
    Claim,
    ClaimStatus,
    Policy,
    PolicyStatus,
    ZoneFraudAlert,
    FraudAlertStatus,
    Payout,
    PaymentStatus,
)
from schemas.admin import (
    SimulateEventRequest,
    SimulateResponse,
    ProcessClaimsResponse,
    ParametricSimulatorRequest,
    ParametricSimulatorResponse,
    ClaimResponse,
    FraudAlertResponse,
    MetricsResponse,
    ClaimReviewRequest,
    FraudDashboardResponse,
    TopFlaggedWorker,
)
from services.fraud import (
    compute_fraud_score,
    check_and_raise_zone_alert,
)
from services.payouts import process_payout


router = APIRouter()


@router.post("/simulate-rain", response_model=SimulateResponse)
def simulate_rain(req: SimulateEventRequest, db: Session = Depends(get_db)):
    event, count = _process_disruption_internal(db, req, EventType.RAIN, 4)
    return SimulateResponse(
        event_id=event.id, message="Rain simulated and payouts processed", affected_cycles=count
    )

def _process_disruption_internal(db: Session, req: SimulateEventRequest, event_type: EventType, duration_hours: int):
    event = ExternalEvent(
        city=req.city,
        zone=req.zone,
        event_type=event_type,
        severity=req.severity,
        start_time=datetime.datetime.utcnow(),
        end_time=datetime.datetime.utcnow() + datetime.timedelta(hours=duration_hours),
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    active_cycles_query = (
        db.query(WeeklyCycle)
        .join(Worker)
        .filter(WeeklyCycle.status == CycleStatus.ACTIVE)
        .filter(func.lower(Worker.city) == func.lower(req.city))
    )
    
    if req.zone and req.zone.upper() != "ALL":
        active_cycles_query = active_cycles_query.filter(func.lower(Worker.primary_zone) == func.lower(req.zone))
        
    active_cycles = active_cycles_query.all()

    for cycle in active_cycles:
        _process_single_payout(db, cycle, event, req.severity, 0.1)

    db.commit()
    return event, len(active_cycles)

def _process_single_payout(db: Session, cycle: WeeklyCycle, event: ExternalEvent, severity: float, default_loss_factor: float):
    # loss factor depends on event type
    loss_map = {
        EventType.RAIN: 0.1,
        EventType.CURFEW: 0.25,
        EventType.AQI: 0.05
    }
    factor = loss_map.get(event.event_type, default_loss_factor)
    
    disruption = DisruptionEvent(
        worker_id=cycle.worker_id,
        cycle_id=cycle.id,
        event_type=event.event_type,
        start_time=event.start_time,
        end_time=event.end_time,
        estimated_loss=float(cycle.expected_income) * factor * severity,
    )
    db.add(disruption)

    # Auto create claim
    claim = Claim(
        worker_id=cycle.worker_id,
        policy_id=cycle.policy_id,
        cycle_id=cycle.id,
        disruption_id=disruption.id,
        status=ClaimStatus.APPROVED,
        claimed_amount=disruption.estimated_loss,
        approved_amount=disruption.estimated_loss,
        fraud_score=0.1,
    )
    db.add(claim)
    db.flush() 

    # Automatically call payout flow
    worker = cycle.worker
    result = process_payout(
        claim_id=str(claim.id),
        worker_phone=worker.phone if worker else "",
        amount_rupees=float(claim.approved_amount)
    )
    
    if result.get("status") == "SUCCESS":
        payout = Payout(
            claim_id=claim.id,
            amount=claim.approved_amount,
            provider=result.get("provider"),
            reference_id=result.get("reference_id"),
            status=PaymentStatus.SUCCESS,
            created_at=datetime.datetime.utcnow(),
        )
        db.add(payout)
        claim.status = ClaimStatus.PAID
        claim.paid_at = datetime.datetime.utcnow()
        
        cycle.total_payout = float(cycle.total_payout or 0) + float(claim.approved_amount)
    else:
        payout = Payout(
            claim_id=claim.id,
            amount=claim.approved_amount,
            provider=result.get("provider"),
            reference_id=result.get("reference_id"),
            status=PaymentStatus.FAILED,
            created_at=datetime.datetime.utcnow(),
        )
        db.add(payout)


@router.post("/simulate-curfew", response_model=SimulateResponse)
def simulate_curfew(req: SimulateEventRequest, db: Session = Depends(get_db)):
    event, count = _process_disruption_internal(db, req, EventType.CURFEW, 24)
    return SimulateResponse(
        event_id=event.id,
        message="Curfew simulated and payouts processed",
        affected_cycles=count,
    )


@router.post("/process-claims", response_model=ProcessClaimsResponse)
def process_claims(db: Session = Depends(get_db)):
    pending_claims = db.query(Claim).filter(Claim.status == ClaimStatus.CREATED).all()

    approved = 0
    rejected = 0
    flags = 0
    auto_approved = 0
    under_review = 0

    for claim in pending_claims:
        worker = db.query(Worker).filter(Worker.id == claim.worker_id).first()
        disruption = (
            db.query(DisruptionEvent)
            .filter(DisruptionEvent.id == claim.disruption_id)
            .first()
        )

        fraud_score, signal_log = compute_fraud_score(
            str(claim.id), str(claim.worker_id), db
        )
        claim.fraud_score = fraud_score
        claim.fraud_signal_log = signal_log

        if fraud_score < 0.3:
            claim.status = ClaimStatus.APPROVED
            claim.approved_amount = claim.claimed_amount
            
            result = process_payout(
                claim_id=str(claim.id),
                worker_phone=worker.phone if worker else "",
                amount_rupees=float(claim.approved_amount)
            )
            
            if result.get("status") == "SUCCESS":
                payout = Payout(
                    claim_id=claim.id,
                    amount=claim.approved_amount,
                    provider=result.get("provider"),
                    reference_id=result.get("reference_id"),
                    status=PaymentStatus.SUCCESS,
                    created_at=datetime.datetime.utcnow(),
                )
                db.add(payout)
                claim.status = ClaimStatus.PAID
                claim.paid_at = datetime.datetime.utcnow()
                cycle = db.query(WeeklyCycle).filter(WeeklyCycle.id == claim.cycle_id).first()
                if cycle:
                    cycle.total_payout = float(cycle.total_payout or 0) + float(claim.approved_amount)
            else:
                payout = Payout(
                    claim_id=claim.id,
                    amount=claim.approved_amount,
                    provider=result.get("provider"),
                    reference_id=result.get("reference_id"),
                    status=PaymentStatus.FAILED,
                    created_at=datetime.datetime.utcnow(),
                )
                db.add(payout)
                # Keep status as APPROVED so it can be retried, do not set paid_at
            
            approved += 1
            auto_approved += 1
        elif fraud_score <= 0.6:
            claim.status = ClaimStatus.UNDER_REVIEW
            claim.approved_amount = claim.claimed_amount
            under_review += 1
            flags += 1
        else:
            claim.status = ClaimStatus.UNDER_REVIEW
            claim.approved_amount = 0
            under_review += 1
            flags += 1

        if disruption and worker:
            external_event = (
                db.query(ExternalEvent)
                .filter(
                    ExternalEvent.city == worker.city,
                    ExternalEvent.start_time
                    >= disruption.start_time - datetime.timedelta(hours=3),
                    ExternalEvent.start_time
                    <= disruption.start_time + datetime.timedelta(hours=1),
                )
                .first()
            )

            if external_event:
                check_and_raise_zone_alert(
                    str(external_event.id), worker.city, worker.primary_zone, db
                )

    db.commit()

    return ProcessClaimsResponse(
        processed_claims=len(pending_claims),
        approved_claims=approved,
        rejected_claims=rejected,
        fraud_flags=flags,
    )


@router.get("/metrics", response_model=MetricsResponse)
def get_metrics(db: Session = Depends(get_db)):
    active_policies = (
        db.query(Policy).filter(Policy.status == PolicyStatus.ACTIVE).count()
    )
    total_prem = (
        db.query(func.sum(WeeklyCycle.weekly_premium))
        .filter(WeeklyCycle.status == CycleStatus.ACTIVE)
        .scalar()
        or 0.0
    )
    total_payouts = (
        db.query(func.sum(Payout.amount))
        .filter(Payout.status == PaymentStatus.SUCCESS)
        .scalar()
        or 0.0
    )
    active_alerts = (
        db.query(ZoneFraudAlert)
        .filter(ZoneFraudAlert.status == FraudAlertStatus.ACTIVE)
        .count()
    )

    return MetricsResponse(
        total_active_policies=active_policies,
        total_weekly_premiums=float(total_prem),
        total_payouts=float(total_payouts),
        active_fraud_alerts=active_alerts,
    )


@router.get("/claims", response_model=List[ClaimResponse])
def get_claims(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Claim).offset(skip).limit(limit).all()


@router.post("/simulate-aqi", response_model=SimulateResponse)
def simulate_aqi(req: SimulateEventRequest, db: Session = Depends(get_db)):
    event, count = _process_disruption_internal(db, req, EventType.AQI, 12)
    return SimulateResponse(
        event_id=event.id,
        message="AQI event simulated and payouts processed",
        affected_cycles=count,
    )


@router.get("/fraud-dashboard", response_model=FraudDashboardResponse)
def get_fraud_dashboard(db: Session = Depends(get_db)):
    active_alerts = (
        db.query(ZoneFraudAlert)
        .filter(ZoneFraudAlert.status == FraudAlertStatus.ACTIVE)
        .all()
    )

    claims_under_review = (
        db.query(Claim).filter(Claim.status == ClaimStatus.UNDER_REVIEW).count()
    )

    claims_held = (
        db.query(Claim)
        .filter(Claim.status == ClaimStatus.UNDER_REVIEW, Claim.approved_amount == 0)
        .count()
    )

    four_weeks_ago = datetime.datetime.utcnow() - datetime.timedelta(weeks=4)
    worker_scores = (
        db.query(Claim.worker_id, func.avg(Claim.fraud_score).label("avg_score"))
        .filter(Claim.fraud_score.isnot(None), Claim.created_at >= four_weeks_ago)
        .group_by(Claim.worker_id)
        .order_by(func.avg(Claim.fraud_score).desc())
        .limit(5)
        .all()
    )

    top_flagged_workers = []
    for worker_id, avg_score in worker_scores:
        worker = db.query(Worker).filter(Worker.id == worker_id).first()
        if worker:
            top_flagged_workers.append(
                TopFlaggedWorker(
                    worker_id=str(worker_id),
                    worker_name=worker.name or "Unknown",
                    avg_fraud_score=round(float(avg_score), 4),
                )
            )

    week_start = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    avg_this_week = (
        db.query(func.avg(Claim.fraud_score))
        .filter(Claim.fraud_score.isnot(None), Claim.created_at >= week_start)
        .scalar()
        or 0.0
    )

    return FraudDashboardResponse(
        active_zone_alerts=[
            FraudAlertResponse(
                id=a.id,
                zone=a.zone,
                claim_count=a.claim_count,
                deviation_score=a.deviation_score,
                status=a.status.value,
                event_id=str(a.event_id) if a.event_id else None,
                triggered_at=a.triggered_at,
            )
            for a in active_alerts
        ],
        claims_under_review=claims_under_review,
        claims_held=claims_held,
        top_flagged_workers=top_flagged_workers,
        avg_fraud_score_this_week=round(float(avg_this_week), 4),
    )


@router.post("/claims/{claim_id}/approve")
def approve_claim(
    claim_id: UUID, req: ClaimReviewRequest, db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status not in [ClaimStatus.UNDER_REVIEW, ClaimStatus.CREATED]:
        raise HTTPException(
            status_code=400, detail="Claim cannot be approved in current status"
        )

    claim.status = ClaimStatus.APPROVED
    claim.approved_amount = req.approved_amount

    if req.approved_amount > 0:
        worker = db.query(Worker).filter(Worker.id == claim.worker_id).first()
        result = process_payout(
            claim_id=str(claim.id),
            worker_phone=worker.phone if worker else "",
            amount_rupees=float(req.approved_amount)
        )
        if result.get("status") == "SUCCESS":
            payout = Payout(
                claim_id=claim.id,
                amount=req.approved_amount,
                provider=result.get("provider"),
                reference_id=result.get("reference_id"),
                status=PaymentStatus.SUCCESS,
                created_at=datetime.datetime.utcnow(),
            )
            db.add(payout)
            claim.status = ClaimStatus.PAID
            claim.paid_at = datetime.datetime.utcnow()
            cycle = db.query(WeeklyCycle).filter(WeeklyCycle.id == claim.cycle_id).first()
            if cycle:
                cycle.total_payout = float(cycle.total_payout or 0) + float(req.approved_amount)
        else:
            payout = Payout(
                claim_id=claim.id,
                amount=req.approved_amount,
                provider=result.get("provider"),
                reference_id=result.get("reference_id"),
                status=PaymentStatus.FAILED,
                created_at=datetime.datetime.utcnow(),
            )
            db.add(payout)

    db.commit()
    db.refresh(claim)

    response = {
        "message": "Claim approved",
        "claim_id": str(claim.id),
        "approved_amount": float(claim.approved_amount),
    }

    if 'result' in locals():
        response["payout"] = {
            "status": result.get("status"),
            "provider": result.get("provider"),
            "reference_id": result.get("reference_id"),
            "amount": result.get("amount"),
            "processed_at": result.get("processed_at")
        }

    return response


@router.post("/claims/{claim_id}/reject")
def reject_claim(claim_id: UUID, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status in [ClaimStatus.APPROVED, ClaimStatus.REJECTED, ClaimStatus.PAID]:
        raise HTTPException(
            status_code=400, detail="Claim cannot be rejected in current status"
        )

    claim.status = ClaimStatus.REJECTED
    claim.approved_amount = 0

    db.commit()
    db.refresh(claim)

    return {"message": "Claim rejected", "claim_id": str(claim.id)}


@router.post("/parametric-simulator", response_model=ParametricSimulatorResponse)
def parametric_simulator(
    req: ParametricSimulatorRequest, db: Session = Depends(get_db)
):
    # Mock behavior for explainable AI simulator
    return ParametricSimulatorResponse(
        simulated_events=random.randint(10, 50),
        projected_payout=random.uniform(10000, 50000),
        basis_risk_score=random.uniform(0.1, 0.4),
    )

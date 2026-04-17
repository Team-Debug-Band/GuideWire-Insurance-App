from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from models.models import (
    Worker, Policy, WeeklyCycle, Claim, ExternalEvent, 
    EventType, DisruptionEvent, CycleStatus, PolicyStatus, ClaimStatus
)

async def run_trigger_pipeline(city: str, event_type: str, severity: float, db: Session, source: str = "admin") -> dict:
    """
    1. Check if an external_event already exists for this city+event_type
       within the last 1 hour (to prevent duplicate events from repeated polls).
    2. Create a new external_event row.
    3. Find all workers in this city who have an active policy and an active
       weekly_cycle for the current week.
    4. For each such worker:
       a. Generate a synthetic platform_activity row logic -> loss calculation.
       b. Create a disruption_event row.
       c. Create a claim row.
    5. Return {"status": "triggered", ...}
    """
    now = datetime.now(timezone.utc)
    one_hour_ago = now - timedelta(hours=1)
    
    # Map string event_type to Enum if needed
    try:
        ev_type_enum = EventType(event_type)
    except ValueError:
        return {"status": "error", "error": f"Invalid event_type {event_type}"}

    # 1. Check duplicate
    recent_event = db.query(ExternalEvent).filter(
        ExternalEvent.city == city,
        ExternalEvent.event_type == ev_type_enum,
        ExternalEvent.start_time >= one_hour_ago
    ).first()
    
    if recent_event:
        return {"status": "duplicate", "event_id": str(recent_event.id)}
        
    # 2. Create a new external_event row
    new_event = ExternalEvent(
        city=city,
        zone="all",
        event_type=ev_type_enum,
        severity=severity,
        start_time=now,
        end_time=now + timedelta(hours=2)
        # source field is requested by prompt but not in ExternalEvent model! 
        # Checking models.py, ExternalEvent doesn't have `source`. We'll skip adding `source` to the constructor.
    )
    db.add(new_event)
    db.flush() # flush to get new_event.id

    # 3. Find workers 
    active_cycles = db.query(WeeklyCycle).join(Worker).join(Policy, WeeklyCycle.policy_id == Policy.id).filter(
        Worker.city == city,
        Policy.status == PolicyStatus.ACTIVE,
        WeeklyCycle.status == CycleStatus.ACTIVE
    ).all()
    
    affected_workers = 0
    total_payout = 0.0
    
    # 4. Process each worker
    for cycle in active_cycles:
        worker = cycle.worker
        policy = cycle.policy
        
        # a. Loss logic
        normal_earnings = float(cycle.expected_income) / 7.0
        disrupted_earnings = normal_earnings * (1.0 - severity * 0.6)
        loss = normal_earnings - disrupted_earnings
        
        loss = min(loss, float(policy.max_weekly_coverage))
        
        if loss < 50:
            continue
            
        affected_workers += 1
        total_payout += loss
        
        # b. Create disruption event
        disruption = DisruptionEvent(
            worker_id=worker.id,
            cycle_id=cycle.id,
            event_type=ev_type_enum,
            start_time=new_event.start_time,
            end_time=new_event.end_time,
            estimated_loss=loss
        )
        db.add(disruption)
        db.flush()
        
        # c. Create claim
        claim = Claim(
            worker_id=worker.id,
            policy_id=policy.id,
            cycle_id=cycle.id,
            disruption_id=disruption.id,
            status=ClaimStatus.CREATED,
            claimed_amount=loss
            # fraud_score=None is default
        )
        db.add(claim)
        
    db.commit()
    
    return {
        "status": "triggered",
        "event_id": str(new_event.id),
        "workers_affected": affected_workers,
        "total_estimated_payout": total_payout
    }

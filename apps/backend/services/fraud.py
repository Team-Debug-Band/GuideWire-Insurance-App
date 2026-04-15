import datetime
from datetime import timezone
from typing import Optional
from uuid import UUID
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session
import statistics

from models.models import (
    Claim,
    ClaimStatus,
    Worker,
    ExternalEvent,
    DisruptionEvent,
    PlatformActivity,
    ZoneFraudAlert,
    FraudAlertStatus,
    WeeklyCycle,
    CycleStatus,
)


def compute_fraud_score(
    claim_id: str, worker_id: str, db: Session
) -> tuple[float, dict]:
    """
    Computes fraud score (0.0-1.0) and returns signal log.
    fraud_score < 0.3: auto-approve
    fraud_score 0.3-0.6: flag for review but tentatively approve
    fraud_score > 0.6: hold for admin review
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        return 1.0, {"error": "Claim not found"}

    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        return 1.0, {"error": "Worker not found"}

    disruption = (
        db.query(DisruptionEvent)
        .filter(DisruptionEvent.id == claim.disruption_id)
        .first()
    )
    if not disruption:
        return 1.0, {"error": "Disruption event not found"}

    checks = {}

    check1_signal, check1_log = _check_event_existence(worker, claim, db)
    checks["event_existence"] = check1_log

    check2_signal, check2_log = _check_earnings_drop(worker, disruption, db)
    checks["earnings_drop"] = check2_log

    check3_signal, check3_log = _check_duplicate_claim(worker, disruption, claim, db)
    checks["duplicate_check"] = check3_log

    check4_signal, check4_log = _check_claim_frequency(worker, db)
    checks["claim_frequency"] = check4_log

    check5_signal, check5_log = _check_peer_benchmarking(claim, disruption, db)
    checks["peer_benchmark"] = check5_log

    check6_signal, check6_log = _check_zone_fraud_alert(worker, disruption, db)
    checks["zone_alert"] = check6_log

    fraud_score = (
        0.25 * check1_signal
        + 0.20 * check2_signal
        + 0.30 * check3_signal
        + 0.10 * check4_signal
        + 0.10 * check5_signal
        + 0.05 * check6_signal
    )
    fraud_score = round(min(max(fraud_score, 0.0), 1.0), 4)

    decision = (
        "AUTO_APPROVE"
        if fraud_score < 0.3
        else "REVIEW"
        if fraud_score <= 0.6
        else "HOLD"
    )

    signal_log = {
        "fraud_score": fraud_score,
        "decision": decision,
        "checks": checks,
        "computed_at": datetime.datetime.now(timezone.utc).isoformat(),
    }

    return fraud_score, signal_log


def _check_event_existence(
    worker: Worker, claim: Claim, db: Session
) -> tuple[float, dict]:
    """
    CHECK 1 — Event existence (weight: 0.25)
    Query: does an external_event exist for the worker's city and zone,
    with start_time within 3 hours before the claim's created_at?
    """
    if not claim.created_at:
        claim_time = datetime.datetime.utcnow()
    else:
        claim_time = claim.created_at

    three_hours_before = claim_time - datetime.timedelta(hours=3)

    query = db.query(ExternalEvent).filter(
        ExternalEvent.city == worker.city,
        ExternalEvent.start_time >= three_hours_before,
        ExternalEvent.start_time <= claim_time,
    )

    if worker.primary_zone:
        query = query.filter(
            or_(ExternalEvent.zone == worker.primary_zone, ExternalEvent.zone == None)
        )

    event = query.first()

    if event:
        return 0.0, {"passed": True, "event_id": str(event.id)}
    return 1.0, {"passed": False, "event_id": None}


def _check_earnings_drop(
    worker: Worker, disruption: DisruptionEvent, db: Session
) -> tuple[float, dict]:
    """
    CHECK 2 — Earnings drop verification (weight: 0.20)
    Compare actual_earnings vs 4-week historical average for same weekday+hour.
    """
    if not disruption.start_time:
        return 0.4, {"actual": 0.0, "historical_avg": 0.0, "ratio": 1.0}

    weekday = disruption.start_time.weekday()
    hour = disruption.start_time.hour

    four_weeks_ago = disruption.start_time - datetime.timedelta(weeks=4)

    historical = (
        db.query(PlatformActivity)
        .filter(
            PlatformActivity.worker_id == worker.id,
            PlatformActivity.timestamp >= four_weeks_ago,
            PlatformActivity.timestamp <= disruption.start_time,
        )
        .all()
    )

    same_time_activities = [
        a
        for a in historical
        if a.timestamp and a.timestamp.weekday() == weekday and a.timestamp.hour == hour
    ]

    if same_time_activities:
        historical_avg = float(
            sum(float(a.earnings or 0) for a in same_time_activities)
            / len(same_time_activities)
        )
    else:
        all_earnings = [float(a.earnings or 0) for a in historical if a.earnings]
        if all_earnings:
            historical_avg = statistics.mean(all_earnings)
        else:
            cycle = (
                db.query(WeeklyCycle)
                .filter(
                    WeeklyCycle.worker_id == worker.id,
                    WeeklyCycle.status == CycleStatus.ACTIVE,
                )
                .first()
            )
            if cycle:
                expected_weekly = float(cycle.expected_income or 0)
                historical_avg = (
                    expected_weekly / (24 * 7) if expected_weekly else 100.0
                )
            else:
                historical_avg = 100.0

    activity_at_disruption = (
        db.query(PlatformActivity)
        .filter(
            PlatformActivity.worker_id == worker.id,
            PlatformActivity.timestamp
            >= disruption.start_time - datetime.timedelta(hours=1),
            PlatformActivity.timestamp <= disruption.end_time
            if disruption.end_time
            else disruption.start_time + datetime.timedelta(hours=1),
        )
        .first()
    )

    actual_earnings = (
        float(activity_at_disruption.earnings)
        if activity_at_disruption and activity_at_disruption.earnings
        else 0.0
    )

    if historical_avg > 0:
        ratio = actual_earnings / historical_avg
    else:
        ratio = 1.0

    if ratio < 0.7:
        signal = 0.0
    elif ratio >= 0.9:
        signal = 1.0
    else:
        signal = 0.4

    return signal, {
        "actual": round(actual_earnings, 2),
        "historical_avg": round(historical_avg, 2),
        "ratio": round(ratio, 4),
    }


def _check_duplicate_claim(
    worker: Worker, disruption: DisruptionEvent, current_claim: Claim, db: Session
) -> tuple[float, dict]:
    """
    CHECK 3 — Duplicate claim (weight: 0.30)
    Does any other claim exist for this worker where disruption windows overlap?
    """
    other_claims = (
        db.query(Claim)
        .filter(Claim.worker_id == worker.id, Claim.id != current_claim.id)
        .all()
    )

    for other in other_claims:
        other_disruption = (
            db.query(DisruptionEvent)
            .filter(DisruptionEvent.id == other.disruption_id)
            .first()
        )
        if other_disruption:
            if _time_overlaps(
                disruption.start_time,
                disruption.end_time,
                other_disruption.start_time,
                other_disruption.end_time,
            ):
                return 1.0, {"is_duplicate": True, "existing_claim_id": str(other.id)}

    return 0.0, {"is_duplicate": False, "existing_claim_id": None}


def _time_overlaps(start1, end1, start2, end2) -> bool:
    if not all([start1, start2]):
        return False
    s1 = start1
    e1 = end1 or (start1 + datetime.timedelta(hours=1))
    s2 = start2
    e2 = end2 or (start2 + datetime.timedelta(hours=1))
    return s1 < e2 and s2 < e1


def _check_claim_frequency(worker: Worker, db: Session) -> tuple[float, dict]:
    """
    CHECK 4 — Claim frequency (weight: 0.10)
    Count claims filed by this worker in the last 4 weeks.
    """
    four_weeks_ago = datetime.datetime.utcnow() - datetime.timedelta(weeks=4)

    count = (
        db.query(Claim)
        .filter(Claim.worker_id == worker.id, Claim.created_at >= four_weeks_ago)
        .count()
    )

    if count <= 1:
        signal = 0.0
    elif count == 2:
        signal = 0.2
    elif count == 3:
        signal = 0.5
    else:
        signal = 0.9

    return signal, {"claims_last_4_weeks": count}


def _check_peer_benchmarking(
    claim: Claim, disruption: DisruptionEvent, db: Session
) -> tuple[float, dict]:
    """
    CHECK 5 — Peer benchmarking (weight: 0.10)
    Compare this claim's amount vs approved claims for same external_event.
    """
    disruption_with_event = (
        db.query(DisruptionEvent)
        .filter(DisruptionEvent.id == claim.disruption_id)
        .first()
    )

    external_event_id = None
    if disruption_with_event:
        events = (
            db.query(ExternalEvent)
            .filter(
                ExternalEvent.city == disruption_with_event.worker_id,
                ExternalEvent.start_time <= disruption_with_event.start_time,
                or_(
                    ExternalEvent.end_time >= disruption_with_event.start_time,
                    ExternalEvent.end_time == None,
                ),
            )
            .all()
        )
        if events:
            external_event_id = events[0].id

    if not external_event_id:
        return 0.1, {
            "peer_mean": 0.0,
            "peer_std": 0.0,
            "this_amount": float(claim.claimed_amount or 0),
        }

    related_disruptions = (
        db.query(DisruptionEvent)
        .join(
            ExternalEvent,
            and_(
                ExternalEvent.start_time <= disruption_with_event.start_time,
                or_(
                    ExternalEvent.end_time >= disruption_with_event.start_time,
                    ExternalEvent.end_time == None,
                ),
            ),
        )
        .all()
    )

    disruption_ids = [d.id for d in related_disruptions]

    peer_claims = (
        db.query(Claim)
        .filter(
            Claim.disruption_id.in_(disruption_ids),
            Claim.status == ClaimStatus.APPROVED,
            Claim.id != claim.id,
        )
        .all()
    )

    if not peer_claims:
        return 0.1, {
            "peer_mean": 0.0,
            "peer_std": 0.0,
            "this_amount": float(claim.claimed_amount or 0),
        }

    peer_amounts = [
        float(c.approved_amount or 0) for c in peer_claims if c.approved_amount
    ]
    if not peer_amounts:
        return 0.1, {
            "peer_mean": 0.0,
            "peer_std": 0.0,
            "this_amount": float(claim.claimed_amount or 0),
        }

    peer_mean = statistics.mean(peer_amounts)
    peer_std = statistics.stdev(peer_amounts) if len(peer_amounts) > 1 else 0.0

    this_amount = float(claim.claimed_amount or 0)

    if this_amount > peer_mean + 2 * peer_std:
        signal = 0.8
    elif this_amount > peer_mean + peer_std:
        signal = 0.4
    else:
        signal = 0.0

    return signal, {
        "peer_mean": round(peer_mean, 2),
        "peer_std": round(peer_std, 2),
        "this_amount": round(this_amount, 2),
    }


def _check_zone_fraud_alert(
    worker: Worker, disruption: DisruptionEvent, db: Session
) -> tuple[float, dict]:
    """
    CHECK 6 — Zone fraud alert check (weight: 0.05)
    Is there an active alert on this worker's city/zone?
    """
    zone = worker.primary_zone or "DEFAULT"

    alert = (
        db.query(ZoneFraudAlert)
        .filter(
            ZoneFraudAlert.zone == zone,
            ZoneFraudAlert.status == FraudAlertStatus.ACTIVE,
        )
        .first()
    )

    if alert:
        return 0.5, {"alert_active": True, "alert_id": str(alert.id)}
    return 0.0, {"alert_active": False, "alert_id": None}


def check_and_raise_zone_alert(
    event_id: str, city: str, zone: str, db: Session
) -> None:
    """
    Count claims in last 2 hours for this event.
    Compare against historical average for same city+event_type.
    Raise alert if current > mean + 3*std_dev (3-sigma rule).
    """
    event = db.query(ExternalEvent).filter(ExternalEvent.id == event_id).first()
    if not event:
        return

    two_hours_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=2)

    current_count = (
        db.query(Claim)
        .join(DisruptionEvent)
        .filter(DisruptionEvent.start_time >= two_hours_ago)
        .count()
    )

    twelve_months_ago = datetime.datetime.utcnow() - datetime.timedelta(days=365)

    historical_events = (
        db.query(ExternalEvent)
        .filter(
            ExternalEvent.city == city,
            ExternalEvent.event_type == event.event_type,
            ExternalEvent.id != event.id,
            ExternalEvent.start_time >= twelve_months_ago,
        )
        .all()
    )

    if not historical_events:
        return

    event_ids = [e.id for e in historical_events]

    claim_counts = []
    for hist_event in historical_events:
        count = (
            db.query(Claim)
            .join(DisruptionEvent)
            .filter(
                DisruptionEvent.start_time
                >= hist_event.start_time - datetime.timedelta(hours=1),
                DisruptionEvent.start_time
                <= hist_event.start_time + datetime.timedelta(hours=1),
            )
            .count()
        )
        claim_counts.append(count)

    if not claim_counts or len(claim_counts) < 2:
        return

    mean = statistics.mean(claim_counts)
    std_dev = statistics.stdev(claim_counts)

    if std_dev == 0:
        return

    threshold = mean + 3 * std_dev

    if current_count > threshold:
        existing_alert = (
            db.query(ZoneFraudAlert)
            .filter(
                ZoneFraudAlert.event_id == event_id,
                ZoneFraudAlert.status == FraudAlertStatus.ACTIVE,
            )
            .first()
        )

        if not existing_alert:
            alert = ZoneFraudAlert(
                event_id=event_id,
                zone=zone or "DEFAULT",
                claim_count=current_count,
                expected_claim_count=int(mean),
                deviation_score=round((current_count - mean) / std_dev, 4),
                status=FraudAlertStatus.ACTIVE,
            )
            db.add(alert)
            db.commit()


def process_payout(claim: Claim, db: Session) -> None:
    """
    Process payout for an approved claim.
    """
    from models.models import Payout, PaymentStatus, WeeklyCycle

    payout = Payout(
        claim_id=claim.id,
        amount=claim.approved_amount,
        payment_provider="RAZORPAY_SANDBOX",
        status=PaymentStatus.SUCCESS,
    )
    db.add(payout)

    cycle = db.query(WeeklyCycle).filter(WeeklyCycle.id == claim.cycle_id).first()
    if cycle:
        cycle.total_payout = float(cycle.total_payout or 0) + float(
            claim.approved_amount or 0
        )

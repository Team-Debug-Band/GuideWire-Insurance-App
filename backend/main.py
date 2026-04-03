import random
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input models
class EventSimulationInput(BaseModel):
    event_type: str # RAIN, CURFEW, FLOOD
    city: str
    zone: str
    severity: float # 0 to 1

# In-memory data
workers = [
    {
        "id": 1,
        "name": "Rahul",
        "city": "Chennai",
        "zone": "T Nagar",
        "weekly_income": 4500,
        "coverage": 2700
    },
    {
        "id": 2,
        "name": "Asha",
        "city": "Bangalore",
        "zone": "Whitefield",
        "weekly_income": 5200,
        "coverage": 3120
    }
]

claims = []
payouts = []

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/simulate-event")
async def simulate_event(input_data: EventSimulationInput):
    matching_workers = [
        w for w in workers 
        if w["city"] == input_data.city and w["zone"] == input_data.zone
    ]
    
    total_payout = 0.0
    affected_count = 0
    claims_created_count = 0
    
    for worker in matching_workers:
        # 1. Calc expected daily
        expected_daily = worker["weekly_income"] / 7.0
        
        # 2. Simulate actual based on severity
        # actual = expected_daily * (1 - severity * random(0.8 to 1.0))
        severity_factor = input_data.severity * random.uniform(0.8, 1.0)
        actual_daily = expected_daily * (1 - severity_factor)
        
        # 3. Compute loss
        loss = expected_daily - actual_daily
        
        affected_count += 1

        # Claim logic: if loss > 50
        if loss > 50:
            # 1. Compute fraud_score and collect reasons
            fraud_score = 0.0
            fraud_reasons = []
            
            if input_data.event_type not in ["RAIN", "CURFEW", "FLOOD"]:
                fraud_score += 0.5
                fraud_reasons.append("Unrecognized event type")
            
            if loss > (expected_daily * 0.9):
                fraud_score += 0.2
                fraud_reasons.append(f"Loss ratio too high ({round(loss/expected_daily*100, 1)}% of income)")
            
            worker_prev_claims = [c for c in claims if c["worker_id"] == worker["id"]]
            if len(worker_prev_claims) > 0:
                fraud_score += 0.5
                fraud_reasons.append(f"Duplicate claim patterns (worker has {len(worker_prev_claims)} existing records)")

            fraud_score = min(fraud_score, 1.0)

            # 2. Decision logic and claim status
            claim_status = "PAID"
            decision_reason = "Low risk profile - automated payment successful"
            payout_amount = round(loss, 2)

            if fraud_score > 0.6:
                claim_status = "REJECTED"
                decision_reason = "High fraud probability - payout denied"
                payout_amount = 0.0
            elif fraud_score >= 0.3:
                claim_status = "UNDER_REVIEW"
                decision_reason = "Medium risk profile - escalated for manual verification"
                payout_amount = 0.0

            # 3. Create Explainable AI (XAI) object
            explanation = {
                "risk_breakdown": {
                    "event_type": input_data.event_type,
                    "severity": input_data.severity,
                    "expected_daily_income": round(expected_daily, 2),
                    "actual_income": round(actual_daily, 2),
                    "loss": round(loss, 2)
                },
                "fraud_breakdown": {
                    "fraud_score": round(fraud_score, 2),
                    "reasons": fraud_reasons
                },
                "payout_breakdown": {
                    "claim_status": claim_status,
                    "payout_amount": payout_amount,
                    "decision_reason": decision_reason
                }
            }

            # 4. Create the claim object (adding city/zone for alerts)
            claim_id = len(claims) + 1
            claim = {
                "id": claim_id,
                "worker_id": worker["id"],
                "worker_name": worker["name"],
                "city": worker["city"],
                "zone": worker["zone"],
                "event_type": input_data.event_type,
                "amount": round(loss, 2),
                "fraud_score": round(fraud_score, 2),
                "status": claim_status,
                "explanation": explanation
            }
            claims.append(claim)
            claims_created_count += 1

            # 5. Create a payout ONLY for low-risk claims
            if claim_status == "PAID":
                payout_id = len(payouts) + 1
                payout = {
                    "id": payout_id,
                    "claim_id": claim_id,
                    "amount": round(loss, 2),
                    "status": "SUCCESS"
                }
                payouts.append(payout)
                total_payout += loss
        
    return {
        "event_type": input_data.event_type,
        "severity": input_data.severity,
        "affected_workers": affected_count,
        "claims_created": claims_created_count,
        "total_payout": round(total_payout, 2)
    }

@app.get("/claims")
def get_claims():
    """Return all processed claims with XAI explanations."""
    return claims

@app.get("/payouts")
def get_payouts():
    """Return all successful payouts."""
    return payouts

@app.get("/fraud-alerts")
def get_fraud_alerts():
    """Aggregate claims by location and flag high-frequency alerts."""
    location_stats = {}
    for c in claims:
        key = f"{c['city']} - {c['zone']}"
        location_stats[key] = location_stats.get(key, 0) + 1
    
    alerts = []
    for loc, count in location_stats.items():
        alerts.append({
            "zone": loc,
            "claim_count": count,
            "alert_status": "HIGH RISK" if count > 2 else "NORMAL"
        })
    return alerts

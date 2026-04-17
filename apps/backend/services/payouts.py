import os
import logging
import razorpay
from datetime import datetime, timezone

# Configure logging
logger = logging.getLogger(__name__)

# Read environment variables
PAYOUT_ENV = os.getenv("PAYOUT_ENV", "MOCK").upper()
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

# Validate configuration
if PAYOUT_ENV == "RAZORPAY" and not (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET):
    logger.error("PAYOUT CONFIG ERROR: PAYOUT_ENV set to RAZORPAY but keys are missing! Falling back to safe error state.")

logger.info(f"PAYOUT SERVICE: Active Environment -> {PAYOUT_ENV}")

def process_payout(claim_id: str, worker_phone: str, amount_rupees: float) -> dict:
    """
    Processes a payout for an approved claim using Razorpay API or Mock Mode.
    
    Returns:
        dict: {
            "provider": str,
            "reference_id": str or None,
            "status": str (SUCCESS/FAILED),
            "processed_at": str (ISO),
            "amount": float,
            "error": str or None
        }
    """
    # Convert amount to paise (Razorpay standard)
    amount_paise = int(amount_rupees * 100)
    processed_at = datetime.now(timezone.utc).isoformat()
    
    if PAYOUT_ENV == "MOCK":
        mock_ref = f"mock_rzp_{claim_id}_{int(datetime.now().timestamp())}"
        logger.warning(f"MOCK PAYOUT: Success for claim {claim_id}, Amount ₹{amount_rupees}, Ref {mock_ref}")
        return {
            "provider": "MOCK",
            "reference_id": mock_ref,
            "status": "SUCCESS",
            "processed_at": processed_at,
            "amount": amount_rupees,
            "error": None
        }

    try:
        # Initialize Razorpay Client
        client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        
        # Create Order
        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"surelyai_claim_{claim_id}",
            "notes": {
                "claim_id": str(claim_id),
                "worker_phone": worker_phone,
                "type": "parametric_payout",
                "platform": "SurelyAI"
            }
        }
        
        order = client.order.create(data=order_data)
        reference_id = order.get("id")
        
        logger.info(f"RAZORPAY PAYOUT SUCCESS: order_id={reference_id}, claim_id={claim_id}, amount=₹{amount_rupees}")
        
        return {
            "provider": "RAZORPAY",
            "reference_id": reference_id,
            "status": "SUCCESS",
            "processed_at": processed_at,
            "amount": amount_rupees,
            "error": None
        }
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"RAZORPAY PAYOUT ERROR: claim_id={claim_id}, error={error_msg}")
        
        return {
            "provider": "RAZORPAY",
            "reference_id": None,
            "status": "FAILED",
            "processed_at": processed_at,
            "amount": amount_rupees,
            "error": error_msg
        }

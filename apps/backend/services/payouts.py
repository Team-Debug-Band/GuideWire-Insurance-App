import os
import logging
import razorpay
from datetime import datetime, timezone

# Configure logging
logger = logging.getLogger(__name__)

# Read environment variables
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

# Set MOCK_MODE for development/demo if keys are missing
MOCK_MODE = not (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)

def process_payout(claim_id: str, worker_phone: str, amount_rupees: float) -> dict:
    """
    Processes a payout for an approved claim using Razorpay API or Mock Mode.
    
    Returns:
        dict: {
            "success": bool,
            "payment_ref": str,
            "provider": str,
            "amount": float,
            "timestamp": str (ISO),
            "error": str or None
        }
    """
    # Convert amount to paise (Razorpay standard)
    amount_paise = int(amount_rupees * 100)
    timestamp = datetime.now(timezone.utc).isoformat()
    
    if MOCK_MODE:
        mock_ref = f"mock_rzp_{claim_id}_{int(datetime.now().timestamp())}"
        logger.warning(f"MOCK PAYOUT: Success for claim {claim_id}, Amount ₹{amount_rupees}, Ref {mock_ref}")
        return {
            "success": True,
            "payment_ref": mock_ref,
            "provider": "MOCK",
            "amount": amount_rupees,
            "timestamp": timestamp,
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
        payment_ref = order.get("id")
        
        logger.info(f"RAZORPAY PAYOUT SUCCESS: order_id={payment_ref}, claim_id={claim_id}, amount=₹{amount_rupees}")
        
        return {
            "success": True,
            "payment_ref": payment_ref,
            "provider": "RAZORPAY",
            "amount": amount_rupees,
            "timestamp": timestamp,
            "error": None
        }
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"RAZORPAY PAYOUT ERROR: claim_id={claim_id}, error={error_msg}")
        
        return {
            "success": False,
            "payment_ref": None,
            "provider": "RAZORPAY",
            "amount": amount_rupees,
            "timestamp": timestamp,
            "error": error_msg
        }

import json
import os
import joblib
import numpy as np
from pathlib import Path

MODEL_PATH = Path(__file__).parent.parent / "ml" / "risk_model.pkl"
FI_PATH = Path(__file__).parent.parent / "ml" / "feature_importances.json"

_model = None
_feature_importances = None

def _load_model():
    global _model, _feature_importances
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Please run training scripts first.")
        _model = joblib.load(MODEL_PATH)
    if _feature_importances is None:
        if not FI_PATH.exists():
            raise FileNotFoundError(f"Feature importances file not found at {FI_PATH}. Please run training scripts first.")
        with open(FI_PATH) as f:
            _feature_importances = json.load(f)
    return _model, _feature_importances

FEATURE_LABELS = {
    "city_risk": "Location risk in your city",
    "season_risk": "Current season disruption risk",
    "forecast_risk": "Weather forecast for this week",
    "income_volatility": "Your income stability",
    "platform_count": "Number of platforms you work on",
    "weeks_active": "Your tenure on the platform",
    "persona_type": "Your delivery category"
}

def compute_weekly_premium(worker_features: dict) -> dict:
    """
    worker_features must contain:
      city_risk (float), season_risk (float), forecast_risk (float),
      income_volatility (float), platform_count (int),
      weeks_active (int), persona_type (int: 0=FOOD,1=GROCERY,2=ECOMMERCE)

    Returns dict with:
      weekly_premium (float, rounded to 2dp)
      risk_score (float, 0-1 normalised)
      xai_breakdown (list of dicts sorted by contribution desc):
        [{"feature": str, "label": str, "contribution": float, "direction": "increase"|"decrease"}, ...]
    """
    model, feature_importances = _load_model()

    feature_order = ["city_risk", "season_risk", "forecast_risk",
                     "income_volatility", "platform_count", "weeks_active", "persona_type"]

    X = np.array([[worker_features[f] for f in feature_order]])
    predicted_premium = float(model.predict(X)[0])
    predicted_premium = round(max(50.0, min(180.0, predicted_premium)), 2)

    # Derive normalised risk_score from premium: (premium - 50) / 130
    risk_score = round((predicted_premium - 50) / 130, 4)

    # Build XAI breakdown from feature importances × feature value (normalised)
    breakdown = []
    for feat, importance in feature_importances.items():
        val = worker_features.get(feat, 0)
        # Normalise val to 0-1 range per feature
        norm_ranges = {
            "city_risk": (0.3, 0.9), "season_risk": (0.2, 1.0),
            "forecast_risk": (0.0, 1.0), "income_volatility": (0.1, 0.8),
            "platform_count": (1, 3), "weeks_active": (1, 52), "persona_type": (0, 2)
        }
        lo, hi = norm_ranges.get(feat, (0, 1))
        norm_val = (val - lo) / (hi - lo) if hi != lo else 0.5
        contribution = round(importance * norm_val * 100, 1)  # as % of premium
        # For platform_count and weeks_active, higher = lower risk
        direction = "decrease" if feat in ["platform_count", "weeks_active"] else "increase"
        breakdown.append({
            "feature": feat,
            "label": FEATURE_LABELS.get(feat, feat),
            "contribution": contribution,
            "direction": direction
        })

    breakdown.sort(key=lambda x: x["contribution"], reverse=True)

    return {
        "weekly_premium": predicted_premium,
        "risk_score": risk_score,
        "xai_breakdown": breakdown
    }

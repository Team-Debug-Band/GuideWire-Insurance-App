import json
import os
import joblib
import numpy as np
import pandas as pd
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
    """
    model, feature_importances = _load_model()

    feature_order = ["city_risk", "season_risk", "forecast_risk",
                     "income_volatility", "platform_count", "weeks_active", "persona_type"]

    # Use a DataFrame to avoid UserWarning about feature names
    X_df = pd.DataFrame([worker_features], columns=feature_order)
    
    predicted_premium = float(model.predict(X_df)[0])
    predicted_premium = round(max(50.0, min(180.0, predicted_premium)), 2)

    # Risk score calculation
    risk_score = round((predicted_premium - 50) / 130, 4)

    # Advanced Insight: Impact Calculation
    # We compare the current feature value to the "average" value used in training
    # and weight it by the model's feature importance.
    
    averages = {
        "city_risk": 0.625, "season_risk": 0.55,
        "forecast_risk": 0.50, "income_volatility": 0.45,
        "platform_count": 2, "weeks_active": 26, "persona_type": 1
    }
    
    breakdown = []
    for feat, importance in feature_importances.items():
        val = worker_features.get(feat, 0)
        avg_val = averages.get(feat, 0)
        
        # Calculate how much this feature deviates from the "norm"
        # and how much that deviation matters based on importance.
        norm_ranges = {
            "city_risk": (0.3, 0.9), "season_risk": (0.2, 1.0),
            "forecast_risk": (0.0, 1.0), "income_volatility": (0.1, 0.8),
            "platform_count": (1, 3), "weeks_active": (1, 52), "persona_type": (0, 2)
        }
        lo, hi = norm_ranges.get(feat, (0, 1))
        
        # Shift: (current - average) / range
        shift = (val - avg_val) / (hi - lo) if hi != lo else 0
        
        # Impact: how much this feature "pushed" the premium up or down
        # scaled by importance to ensure sum of absolute impacts relates to total shift
        impact = shift * importance * 100 
        
        # Direction logic: 
        # For most, higher value = higher risk (increase)
        # For platform_count and weeks_active, higher = lower risk (so positive shift = decrease)
        is_inverse = feat in ["platform_count", "weeks_active"]
        
        if is_inverse:
            actual_direction = "decrease" if shift > 0 else "increase"
        else:
            actual_direction = "increase" if shift > 0 else "decrease"
            
        breakdown.append({
            "feature": feat,
            "label": FEATURE_LABELS.get(feat, feat),
            "contribution": round(abs(impact), 1),
            "direction": actual_direction
        })

    # Sort by absolute impact to show the most "insightful" factors first
    breakdown.sort(key=lambda x: x["contribution"], reverse=True)

    return {
        "weekly_premium": predicted_premium,
        "risk_score": risk_score,
        "xai_breakdown": breakdown
    }

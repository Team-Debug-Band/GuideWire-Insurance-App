import sys
import os
from pathlib import Path

# Add apps/backend to sys.path
backend_path = Path(__file__).parent.parent
sys.path.append(str(backend_path))

from services.pricing import compute_weekly_premium

def test_pricing():
    worker_features = {
        "city_risk": 0.70,
        "season_risk": 0.85,
        "forecast_risk": 0.75,
        "income_volatility": 0.4,
        "platform_count": 2,
        "weeks_active": 12,
        "persona_type": 0 # FOOD
    }
    
    try:
        result = compute_weekly_premium(worker_features)
        print("Pricing Result:")
        print(f"Weekly Premium: {result['weekly_premium']}")
        print(f"Risk Score: {result['risk_score']}")
        print("XAI Breakdown (Top 3):")
        for item in result['xai_breakdown'][:3]:
            print(f" - {item['label']}: {item['contribution']}% ({item['direction']})")
        
        # Test basic range constraints
        assert 50.0 <= result['weekly_premium'] <= 180.0
        assert 0.0 <= result['risk_score'] <= 1.0
        print("\nTest Passed: Results are within valid ranges.")
        
    except Exception as e:
        print(f"Test Failed: {e}")

if __name__ == "__main__":
    test_pricing()

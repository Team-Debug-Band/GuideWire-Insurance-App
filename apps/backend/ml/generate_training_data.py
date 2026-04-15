import csv
import random
import math
import os

def generate_data(num_records=5000):
    output_path = os.path.join(os.path.dirname(__file__), "training_data.csv")
    
    with open(output_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "city_risk", "season_risk", "forecast_risk", 
            "income_volatility", "platform_count", "weeks_active", 
            "persona_type", "weekly_premium"
        ])
        
        for _ in range(num_records):
            # City Risk
            is_chennai = random.choice([True, False])
            if is_chennai:
                city_risk = random.normalvariate(0.65, 0.05)
            else:
                city_risk = random.normalvariate(0.60, 0.05)
            city_risk = max(0.3, min(0.9, city_risk))
            
            # Season Risk
            month = random.randint(1, 12)
            if month in [6, 7, 8, 9]:
                season_risk = random.uniform(0.65, 1.0)
            elif month in [10, 11]:
                season_risk = random.uniform(0.40, 0.70)
            else:
                season_risk = random.uniform(0.20, 0.45)
            
            # Forecast Risk
            forecast_risk = season_risk * random.uniform(0.7, 1.3)
            forecast_risk = max(0.0, min(1.0, forecast_risk))
            
            # Income Volatility
            income_volatility = random.uniform(0.1, 0.8)
            
            # Platform Count
            platform_count = random.randint(1, 3)
            
            # Weeks Active
            weeks_active = random.randint(1, 52)
            
            # Persona Type (0=FOOD, 1=GROCERY, 2=ECOMMERCE)
            persona_type = random.randint(0, 2)
            
            # Weekly Premium Calculation
            base = 50
            risk_score = (0.30 * city_risk) + (0.30 * season_risk) + \
                         (0.20 * forecast_risk) + (0.20 * income_volatility)
            
            platform_modifier = -0.05 * (platform_count - 1)
            
            weekly_premium = base + ((risk_score + platform_modifier) * 100)
            
            # Add Gaussian noise
            weekly_premium += random.gauss(0, 5)
            
            # Clip
            weekly_premium = max(50.0, min(180.0, weekly_premium))
            
            writer.writerow([
                round(city_risk, 4),
                round(season_risk, 4),
                round(forecast_risk, 4),
                round(income_volatility, 4),
                platform_count,
                weeks_active,
                persona_type,
                round(weekly_premium, 2)
            ])
            
    print(f"Generated {num_records} records to {output_path}")

if __name__ == "__main__":
    generate_data()

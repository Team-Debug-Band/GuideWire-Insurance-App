import pandas as pd
import json
import joblib
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

def train_model():
    data_path = os.path.join(os.path.dirname(__file__), "training_data.csv")
    model_path = os.path.join(os.path.dirname(__file__), "risk_model.pkl")
    fi_path = os.path.join(os.path.dirname(__file__), "feature_importances.json")
    
    if not os.path.exists(data_path):
        print("Training data not found. Run generate_training_data.py first.")
        return

    df = pd.read_csv(data_path)
    
    X = df.drop("weekly_premium", axis=1)
    y = df["weekly_premium"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model Training Complete.")
    print(f"Mean Absolute Error: {mae:.4f}")
    print(f"R2 Score: {r2:.4f}")
    
    # Save model
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    
    # Save feature importances
    importances = dict(zip(X.columns, model.feature_importances_))
    # Convert numpy floats to standard floats for JSON
    importances = {k: float(v) for k, v in importances.items()}
    
    with open(fi_path, "w") as f:
        json.dump(importances, f, indent=4)
    print(f"Feature importances saved to {fi_path}")

if __name__ == "__main__":
    train_model()

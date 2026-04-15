# ML Model Setup

Welcome to the SurelyAI ML module. This system replaces hardcoded risk formulas with a trained Random Forest model to predict weekly premiums and provide XAI (Explainable AI) breakdowns.

## Setup Instructions

Run these steps once before starting the backend to ensure the model and feature importance data are available:

1.  **Navigate to the ML directory**:
    ```bash
    cd apps/backend/ml
    ```

2.  **Generate Synthetic Training Data**:
    This creates `training_data.csv` with 5000 records.
    ```bash
    python generate_training_data.py
    ```

3.  **Train the Model**:
    This trains the Random Forest Regressor and saves `risk_model.pkl` and `feature_importances.json`.
    ```bash
    python train_model.py
    ```

## How it Works

- **Pricing Service**: `apps/backend/services/pricing.py` loads the saved model and importances to calculate premiums.
- **XAI Breakdown**: For every premium calculated, we generate a breakdown of how each feature (e.g., City Risk, Seasonality) contributed to the final score.
- **Integration**: The `start_weekly_cycle` endpoint automatically uses this model when a worker starts a new insurance cycle.

## Troubleshooting

- If you see `FileNotFoundError` when starting a cycle, ensure you have run the training steps above.
- No API keys are required for the ML model itself as it runs entirely on local data and scikit-learn.

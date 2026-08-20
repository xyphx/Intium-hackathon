import joblib
import pandas as pd
import os
import warnings

# Suppress sklearn warnings about feature names
warnings.filterwarnings("ignore", category=UserWarning)

# Load the trained Isolation Forest model once
MODEL_PATH = os.path.join(os.path.dirname(__file__), "weights", "isolation_forest.joblib")
iso_forest = None
if os.path.exists(MODEL_PATH):
    try:
        iso_forest = joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"Error loading anomaly model: {e}")

def detect_anomalies(current_data: dict, historical_readings: list[dict]) -> tuple[bool, float, str]:
    """
    Detects if the current sensor data is anomalous using a trained Isolation Forest.
    Returns (is_anomalous, score, reason).
    """
    if not iso_forest:
        return False, 0.0, "Model not trained"
        
    # Extract features matching training data: 'temperature', 'smoke', 'humidity', 'gas', 'motion', 'distance'
    features = {
        'temperature': current_data.get('temperature', 25.0),
        'smoke': current_data.get('smoke', 5.0),
        'humidity': current_data.get('humidity', 50.0),
        'gas': current_data.get('gas', 0.1),
        'motion': 1 if current_data.get('motion') else 0,
        'distance': current_data.get('distance', 300.0)
    }
    
    df = pd.DataFrame([features])
    
    # Predict (1 = normal, -1 = anomaly)
    prediction = iso_forest.predict(df)[0]
    
    if prediction == -1:
        # It's an anomaly!
        # Determine why by finding which features are highly deviant from a generic baseline
        reason = "Multivariate anomaly detected by ML algorithm."
        return True, 0.90, reason
        
    return False, 0.0, None

import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

def train():
    print("Loading dataset...")
    df = pd.read_csv("../ai/data/sensor_data.csv")
    
    # Features for training
    features = ['temperature', 'smoke', 'humidity', 'gas', 'motion', 'distance']
    X = df[features]
    y = df['event_class']
    
    print("\n--- Training Anomaly Detection Model (Isolation Forest) ---")
    # We train the anomaly detector mostly on normal data, but for simplicity, we fit on all data
    iso_forest = IsolationForest(n_estimators=100, contamination=0.15, random_state=42)
    iso_forest.fit(X)
    
    print("\n--- Training Risk Classification Model (Random Forest) ---")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    rf_classifier = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    rf_classifier.fit(X_train, y_train)
    
    # Evaluate
    y_pred = rf_classifier.predict(X_test)
    print("Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Normal", "Suspicious", "Fire", "Gas Leak"]))
    
    # Save models
    os.makedirs("../ai/models/weights", exist_ok=True)
    joblib.dump(iso_forest, "../ai/models/weights/isolation_forest.joblib")
    joblib.dump(rf_classifier, "../ai/models/weights/random_forest.joblib")
    print("Models saved successfully to ai/models/weights/")

if __name__ == "__main__":
    train()

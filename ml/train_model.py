import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

def train_performance_model():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "student_data.csv")
    model_path = os.path.join(current_dir, "model.pkl")

    if not os.path.exists(data_path):
        print("Data file not found. Generating data first...")
        from generate_data import generate_student_dataset
        generate_student_dataset()

    # Load dataset
    df = pd.read_csv(data_path)
    
    # Split features and target
    X = df[['study_hours', 'completion_percentage', 'quiz_average']]
    y = df['final_score']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Initialize and train RandomForestRegressor
    # n_estimators=100 is standard and robust, max_depth=8 prevents overfitting
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print("--- ML Model Training Evaluation ---")
    print(f"Mean Absolute Error (MAE): {round(mae, 4)} marks")
    print(f"R-squared Score (R2): {round(r2, 4)} (indicates {round(r2 * 100, 2)}% variance explained)")
    
    # Save the trained model
    joblib.dump(model, model_path)
    print(f"Saved trained Random Forest model successfully to {model_path}")

if __name__ == "__main__":
    train_performance_model()

import numpy as np
import pandas as pd
import os

def generate_student_dataset(num_records=1000, filename="student_data.csv"):
    np.random.seed(42) # Set seed for reproducibility
    
    # Generate study hours (ranging from 10 to 200 hours)
    study_hours = np.random.uniform(10, 200, num_records)
    
    # Generate course completion percentage (ranging from 10% to 100%)
    # Let's correlate it slightly with study hours
    completion_percentage = np.clip(
        study_hours * 0.5 + np.random.uniform(5, 40, num_records), 
        10, 
        100
    )
    
    # Generate average quiz scores (ranging from 30% to 100%)
    # Slightly correlated with study hours and completion
    quiz_average = np.clip(
        study_hours * 0.2 + completion_percentage * 0.4 + np.random.uniform(10, 30, num_records),
        30,
        100
    )
    
    # Generate final score based on a realistic academic function:
    # Final Score = 15 + 0.15 * Study Hours + 0.3 * Completion % + 0.35 * Quiz Average + noise
    base_score = 15 + (study_hours * 0.12) + (completion_percentage * 0.25) + (quiz_average * 0.38)
    noise = np.random.normal(0, 4, num_records) # Add normal noise
    
    final_score = np.clip(base_score + noise, 0, 100)
    
    # Save into pandas DataFrame
    df = pd.DataFrame({
        'study_hours': np.round(study_hours, 2),
        'completion_percentage': np.round(completion_percentage, 2),
        'quiz_average': np.round(quiz_average, 2),
        'final_score': np.round(final_score, 2)
    })
    
    # Save file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    filepath = os.path.join(current_dir, filename)
    df.to_csv(filepath, index=False)
    print(f"Generated synthetic dataset with {num_records} records at {filepath}")

if __name__ == "__main__":
    generate_student_dataset()

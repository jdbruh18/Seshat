import os
import datetime
import joblib
import numpy as np
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, Student, Prediction, StudyLog, Topic, TopicProgress, QuizAttempt

predictions_bp = Blueprint('predictions', __name__)

# Load ML Model dynamically
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(os.path.dirname(backend_dir), 'ml', 'model.pkl')

model = None
try:
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        print("ML Model loaded successfully in predictions route.")
    else:
        print(f"ML Model binary not found at {model_path}. Prediction endpoint will return simulated scores.")
except Exception as e:
    print(f"Error loading ML Model: {e}")

def get_predicted_grade(score):
    if score >= 90.0: return 'A'
    if score >= 80.0: return 'B'
    if score >= 70.0: return 'C'
    if score >= 60.0: return 'D'
    return 'F'

@predictions_bp.route('/predict', methods=['GET'])
@jwt_required()
def get_prediction():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role != 'student' or not user.student:
        return jsonify({'message': 'Unauthorized. Student role required.'}), 403

    student_id = user.student.student_id

    # 1. Gather Input Features
    # Feature A: Study Hours
    study_logs = StudyLog.query.filter_by(student_id=student_id).all()
    study_hours = sum(log.duration_minutes for log in study_logs) / 60.0

    # Feature B: Syllabus Completion Percentage
    total_topics = Topic.query.count()
    completed_topics_count = TopicProgress.query.filter_by(student_id=student_id, status='completed').count()
    completion_percentage = (completed_topics_count / total_topics * 100.0) if total_topics > 0 else 0.0

    # Feature C: Quiz Average Score
    quiz_attempts = QuizAttempt.query.filter_by(student_id=student_id).all()
    # If student has no attempts, we pass a safe median baseline (50.0%) to prevent model distortion
    quiz_average = sum(att.score for att in quiz_attempts) / len(quiz_attempts) if quiz_attempts else 50.0

    predicted_score = 0.0
    
    # 2. Run Random Forest Regressor Prediction
    if model is not None:
        try:
            import pandas as pd
            # Pack features into DataFrame to match model feature names exactly
            features = pd.DataFrame([{
                'study_hours': study_hours,
                'completion_percentage': completion_percentage,
                'quiz_average': quiz_average
            }])
            predicted_score = float(model.predict(features)[0])
            predicted_score = min(max(predicted_score, 0.0), 100.0) # Clip between 0 and 100
        except Exception as e:
            print(f"Prediction execution failed: {e}")
            # Fallback mathematical approximation if execution errors out
            predicted_score = 15.0 + (study_hours * 0.12) + (completion_percentage * 0.25) + (quiz_average * 0.38)
    else:
        # Fallback simulation matching the generator formula if model file is not present
        predicted_score = 15.0 + (study_hours * 0.12) + (completion_percentage * 0.25) + (quiz_average * 0.38)

    predicted_score = round(predicted_score, 2)
    predicted_grade = get_predicted_grade(predicted_score)

    # 3. Save / Update in predictions table
    try:
        prediction = Prediction.query.filter_by(student_id=student_id).first()
        if not prediction:
            prediction = Prediction(student_id=student_id)
            db.session.add(prediction)
            
        prediction.predicted_score = predicted_score
        prediction.predicted_grade = predicted_grade
        prediction.generated_at = datetime.datetime.utcnow()
        
        db.session.commit()
        return jsonify(prediction.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to calculate and save prediction: {str(e)}'}), 500

import datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, Student, Recommendation, Subject, Topic, TopicProgress, QuizAttempt, StudyLog, Quiz

recommendations_bp = Blueprint('recommendations', __name__)

def generate_student_recommendations(student):
    student_id = student.student_id
    recs = []

    # 1. Syllabus Completion Rule
    total_topics = Topic.query.count()
    completed_count = TopicProgress.query.filter_by(student_id=student_id, status='completed').count()
    completion_percentage = (completed_count / total_topics * 100.0) if total_topics > 0 else 100.0
    
    if completion_percentage < 50.0:
        recs.append(
            f"Your overall syllabus completion is at {round(completion_percentage, 1)}%, which is below the 50% milestone. "
            "We recommend scheduling regular study slots this week to cover pending topics."
        )

    # 2. Quiz Performance Rule (revision recommendation for low scoring quizzes)
    # Get all quizzes
    quizzes = Quiz.query.all()
    # Find student's best score for each quiz
    best_scores = {}
    attempts = QuizAttempt.query.filter_by(student_id=student_id).all()
    for att in attempts:
        best_scores[att.quiz_id] = max(best_scores.get(att.quiz_id, 0), att.score)

    for quiz in quizzes:
        if quiz.quiz_id in best_scores:
            score = best_scores[quiz.quiz_id]
            if score < 60.0:
                recs.append(
                    f"You scored {round(score, 1)}% in the quiz '{quiz.title}'. We recommend revising the "
                    f"syllabus topics under '{quiz.subject.subject_name}' and retaking this quiz to boost your understanding."
                )

    # 3. Inactivity Rule (no study logs for 5 days)
    last_log = StudyLog.query.filter_by(student_id=student_id).order_by(StudyLog.study_date.desc()).first()
    today = datetime.date.today()
    
    if not last_log:
        recs.append(
            "Welcome! You haven't logged any study sessions yet. We recommend logging your first study "
            "session today to start tracking your learning progress."
        )
    else:
        days_inactive = (today - last_log.study_date).days
        if days_inactive >= 5:
            recs.append(
                f"You haven't logged any study sessions in the last {days_inactive} days. "
                "Try logging just 15 minutes of revision today to rebuild your learning consistency streak!"
            )

    # Database Synchronization
    # Clear old recommendations for this student
    Recommendation.query.filter_by(student_id=student_id).delete()
    
    # Save new recommendations
    saved_recs = []
    for text in recs:
        new_rec = Recommendation(student_id=student_id, recommendation_text=text)
        db.session.add(new_rec)
        saved_recs.append(new_rec)
        
    db.session.commit()
    return saved_recs

@recommendations_bp.route('', methods=['GET'])
@jwt_required()
def get_recommendations():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role != 'student' or not user.student:
        return jsonify({'message': 'Unauthorized. Student role required.'}), 403

    try:
        # Generate fresh recommendations
        generate_student_recommendations(user.student)
        
        # Load from DB to ensure it's connected
        recs = Recommendation.query.filter_by(student_id=user.student.student_id).order_by(Recommendation.generated_at.desc()).all()
        return jsonify([r.to_dict() for r in recs]), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to load recommendations: {str(e)}'}), 500

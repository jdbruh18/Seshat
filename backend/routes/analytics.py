import datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, Student, Subject, Unit, Topic, TopicProgress, StudyLog, QuizAttempt, Quiz, Teacher, Prediction

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/progress', methods=['GET'])
@jwt_required()
def get_progress_analytics():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role != 'student' or not user.student:
        return jsonify({'message': 'Unauthorized. Student role required.'}), 403

    student_id = user.student.student_id
    
    # Get all subjects
    subjects = Subject.query.all()
    
    # Get student progress mapping
    progress_records = TopicProgress.query.filter_by(student_id=student_id).all()
    progress_map = {p.topic_id: p.status for p in progress_records}

    result = []
    
    overall_total_topics = 0
    overall_completed_topics = 0

    for sub in subjects:
        sub_total_topics = 0
        sub_completed_topics = 0
        units_data = []

        for unit in sub.units:
            unit_total_topics = 0
            unit_completed_topics = 0

            for topic in unit.topics:
                unit_total_topics += 1
                sub_total_topics += 1
                overall_total_topics += 1
                
                status = progress_map.get(topic.topic_id, 'pending')
                if status == 'completed':
                    unit_completed_topics += 1
                    sub_completed_topics += 1
                    overall_completed_topics += 1

            unit_pct = (unit_completed_topics / unit_total_topics * 100) if unit_total_topics > 0 else 0
            units_data.append({
                'unit_id': unit.unit_id,
                'unit_name': unit.unit_name,
                'total_topics': unit_total_topics,
                'completed_topics': unit_completed_topics,
                'completion_percentage': round(unit_pct, 2)
            })

        sub_pct = (sub_completed_topics / sub_total_topics * 100) if sub_total_topics > 0 else 0
        result.append({
            'subject_id': sub.subject_id,
            'subject_name': sub.subject_name,
            'description': sub.description,
            'total_topics': sub_total_topics,
            'completed_topics': sub_completed_topics,
            'completion_percentage': round(sub_pct, 2),
            'units': units_data
        })

    overall_pct = (overall_completed_topics / overall_total_topics * 100) if overall_total_topics > 0 else 0

    return jsonify({
        'overall_progress': {
            'total_topics': overall_total_topics,
            'completed_topics': overall_completed_topics,
            'completion_percentage': round(overall_pct, 2)
        },
        'subjects_progress': result
    }), 200

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_analytics():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role != 'student' or not user.student:
        return jsonify({'message': 'Unauthorized. Student role required.'}), 403

    student_id = user.student.student_id

    # 1. Total Study Hours
    study_logs = StudyLog.query.filter_by(student_id=student_id).all()
    total_minutes = sum(log.duration_minutes for log in study_logs)
    total_hours = round(total_minutes / 60.0, 2)

    # 2. Syllabus Completion Percentage
    total_topics = Topic.query.count()
    completed_progress = TopicProgress.query.filter_by(student_id=student_id, status='completed').all()
    completed_topics_count = len(completed_progress)
    completion_percentage = round((completed_topics_count / total_topics * 100.0), 2) if total_topics > 0 else 0.0

    # 3. Quiz Average Score
    quiz_attempts = QuizAttempt.query.filter_by(student_id=student_id).all()
    quiz_avg = 0.0
    if quiz_attempts:
        quiz_avg = round(sum(att.score for att in quiz_attempts) / len(quiz_attempts), 2)

    # 4. Learning Speed (Completed Topics / Total Study Hours)
    learning_speed = 0.0
    if total_hours > 0:
        learning_speed = round(completed_topics_count / total_hours, 2)

    # 5. Study Consistency (Active Days & Streaks)
    unique_dates = {log.study_date for log in study_logs}
    active_days = len(unique_dates)
    
    # Calculate streak
    streak = 0
    if unique_dates:
        sorted_dates = sorted(list(unique_dates), reverse=True)
        today = datetime.date.today()
        yesterday = today - datetime.timedelta(days=1)
        
        # Streak can start from today or yesterday
        start_date = None
        if today in unique_dates:
            start_date = today
        elif yesterday in unique_dates:
            start_date = yesterday
            
        if start_date:
            streak = 1
            current = start_date
            while True:
                prev_day = current - datetime.timedelta(days=1)
                if prev_day in unique_dates:
                    streak += 1
                    current = prev_day
                else:
                    break

    # 6. Strong & Weak Subjects
    subjects = Subject.query.all()
    strong_subjects = []
    weak_subjects = []

    # Map progress
    progress_map = {p.topic_id: p.status for p in completed_progress}

    for sub in subjects:
        sub_total_topics = 0
        sub_completed_topics = 0
        for unit in sub.units:
            for topic in unit.topics:
                sub_total_topics += 1
                if topic.topic_id in progress_map:
                    sub_completed_topics += 1

        sub_completion = (sub_completed_topics / sub_total_topics * 100.0) if sub_total_topics > 0 else 0.0
        
        # Subject quiz average
        sub_quizzes = [q.quiz_id for q in sub.quizzes]
        sub_quiz_attempts = [att for att in quiz_attempts if att.quiz_id in sub_quizzes]
        sub_quiz_avg = None
        if sub_quiz_attempts:
            sub_quiz_avg = sum(att.score for att in sub_quiz_attempts) / len(sub_quiz_attempts)

        # Classification Criteria
        # Strong: Completion >= 50% and (Quiz Avg >= 70% or no attempts yet)
        # Weak: Completion < 50% or Quiz Avg < 60%
        is_strong = sub_completion >= 50.0 and (sub_quiz_avg is None or sub_quiz_avg >= 70.0)
        is_weak = sub_completion < 50.0 or (sub_quiz_avg is not None and sub_quiz_avg < 60.0)

        subject_info = {
            'subject_id': sub.subject_id,
            'subject_name': sub.subject_name,
            'completion_percentage': round(sub_completion, 2),
            'quiz_average': round(sub_quiz_avg, 2) if sub_quiz_avg is not None else None
        }

        if is_strong:
            strong_subjects.append(subject_info)
        elif is_weak:
            weak_subjects.append(subject_info)

    return jsonify({
        'total_study_hours': total_hours,
        'completion_percentage': completion_percentage,
        'quiz_average': quiz_avg,
        'learning_speed': learning_speed,
        'active_days': active_days,
        'streak': streak,
        'strong_subjects': strong_subjects,
        'weak_subjects': weak_subjects
    }), 200

@analytics_bp.route('/teacher', methods=['GET'])
@jwt_required()
def get_teacher_analytics():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role not in ['teacher', 'admin']:
        return jsonify({'message': 'Unauthorized. Teacher role required.'}), 403

    total_students = Student.query.count()
    
    # Calculate subject-wise performance
    subjects = Subject.query.all()
    subject_perf = []
    
    for sub in subjects:
        # Get completion averages of all students
        sub_topics = [t.topic_id for u in sub.units for t in u.topics]
        total_sub_topics = len(sub_topics)
        
        avg_completion = 0.0
        if total_students > 0 and total_sub_topics > 0:
            completed_records = TopicProgress.query.filter(
                TopicProgress.topic_id.in_(sub_topics),
                TopicProgress.status == 'completed'
            ).count()
            # average percentage completion: total completed across all students / (total_students * total_topics) * 100
            avg_completion = (completed_records / (total_students * total_sub_topics)) * 100.0

        # Calculate subject class quiz average
        quiz_ids = [q.quiz_id for q in sub.quizzes]
        quiz_attempts = QuizAttempt.query.filter(QuizAttempt.quiz_id.in_(quiz_ids)).all() if quiz_ids else []
        class_quiz_avg = sum(att.score for att in quiz_attempts) / len(quiz_attempts) if quiz_attempts else 0.0
        
        subject_perf.append({
            'subject_id': sub.subject_id,
            'subject_name': sub.subject_name,
            'average_completion': round(avg_completion, 2),
            'class_quiz_average': round(class_quiz_avg, 2),
            'total_quizzes': len(sub.quizzes)
        })

    # Weak Topics: Topics where completed student percentage < 50%
    weak_topics = []
    topics = Topic.query.all()
    for topic in topics:
        if total_students > 0:
            completed_students = TopicProgress.query.filter_by(topic_id=topic.topic_id, status='completed').count()
            completed_pct = (completed_students / total_students) * 100.0
            if completed_pct < 50.0:
                weak_topics.append({
                    'topic_id': topic.topic_id,
                    'topic_name': topic.topic_name,
                    'unit_name': topic.unit.unit_name,
                    'subject_name': topic.unit.subject.subject_name,
                    'completed_percentage': round(completed_pct, 2)
                })
        else:
            weak_topics.append({
                'topic_id': topic.topic_id,
                'topic_name': topic.topic_name,
                'unit_name': topic.unit.unit_name,
                'subject_name': topic.unit.subject.subject_name,
                'completed_percentage': 0.0
            })
            
    # Grades Distribution
    grades = {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0}
    predictions = Prediction.query.all()
    for pred in predictions:
        g = pred.predicted_grade
        if g in grades:
            grades[g] += 1
            
    grades_breakdown = [{'grade': k, 'count': v} for k, v in grades.items()]

    return jsonify({
        'total_students': total_students,
        'subject_performance': subject_perf,
        'weak_topics': weak_topics[:5], # top 5 weakest topics
        'grades_breakdown': grades_breakdown
    }), 200

@analytics_bp.route('/admin', methods=['GET'])
@jwt_required()
def get_admin_analytics():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role != 'admin':
        return jsonify({'message': 'Unauthorized. Admin role required.'}), 403

    total_users = User.query.count()
    total_subjects = Subject.query.count()
    total_study_sessions = StudyLog.query.count()
    
    # Role Breakdown
    students_count = Student.query.count()
    teachers_count = Teacher.query.count()
    admins_count = User.query.filter_by(role='admin').count()
    
    role_breakdown = [
        {'role': 'Students', 'count': students_count},
        {'role': 'Teachers', 'count': teachers_count},
        {'role': 'Administrators', 'count': admins_count}
    ]

    # Platform activity stats
    total_minutes = sum(log.duration_minutes for log in StudyLog.query.all())
    total_study_hours = round(total_minutes / 60.0, 2)
    total_quiz_attempts = QuizAttempt.query.count()

    return jsonify({
        'total_users': total_users,
        'total_subjects': total_subjects,
        'total_study_sessions': total_study_sessions,
        'role_breakdown': role_breakdown,
        'total_study_hours': total_study_hours,
        'total_quiz_attempts': total_quiz_attempts
    }), 200


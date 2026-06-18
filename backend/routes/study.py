import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, StudyLog, Subject, Topic, Student

study_bp = Blueprint('study', __name__)

@study_bp.route('/log', methods=['POST'])
@jwt_required()
def log_study_session():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role != 'student' or not user.student:
        return jsonify({'message': 'Unauthorized. Student role required.'}), 403

    student_id = user.student.student_id
    data = request.get_json() or {}

    subject_id = data.get('subject_id')
    topic_id = data.get('topic_id')
    
    try:
        duration = int(data.get('duration_minutes', 0))
    except ValueError:
        return jsonify({'message': 'Duration must be an integer.'}), 400

    notes = data.get('notes', '').strip()
    date_str = data.get('study_date')

    if not subject_id or not topic_id or duration <= 0:
        return jsonify({'message': 'Subject, Topic, and positive study duration are required.'}), 400

    if duration > 1440:
        return jsonify({'message': 'Duration cannot exceed 1440 minutes (24 hours).'}), 400

    if len(notes) > 500:
        return jsonify({'message': 'Study notes cannot exceed 500 characters.'}), 400

    # Verify subject and topic exist
    subject = db.session.get(Subject, subject_id)
    topic = db.session.get(Topic, topic_id)
    if not subject or not topic:
        return jsonify({'message': 'Invalid Subject or Topic.'}), 404

    # Verify topic is associated with subject
    if topic.unit.subject_id != subject_id:
        return jsonify({'message': 'Selected Topic does not belong to the selected Subject.'}), 400

    # Parse date
    study_date = datetime.date.today()
    if date_str:
        try:
            study_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD.'}), 400

    if study_date > datetime.date.today():
        return jsonify({'message': 'Study date cannot be in the future.'}), 400

    try:
        log = StudyLog(
            student_id=student_id,
            subject_id=subject_id,
            topic_id=topic_id,
            study_date=study_date,
            duration_minutes=duration,
            notes=notes
        )
        db.session.add(log)
        db.session.commit()
        return jsonify(log.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to log study session: {str(e)}'}), 500

@study_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_study_logs():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role != 'student' or not user.student:
        return jsonify({'message': 'Unauthorized. Student role required.'}), 403

    student_id = user.student.student_id
    logs = StudyLog.query.filter_by(student_id=student_id).order_by(StudyLog.study_date.desc(), StudyLog.log_id.desc()).all()
    
    return jsonify([log.to_dict() for log in logs]), 200

@study_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_study_stats():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role != 'student' or not user.student:
        return jsonify({'message': 'Unauthorized. Student role required.'}), 403

    student_id = user.student.student_id
    logs = StudyLog.query.filter_by(student_id=student_id).all()

    today = datetime.date.today()
    
    # Calculate daily, weekly, monthly study minutes
    daily_min = 0
    weekly_min = 0
    monthly_min = 0

    # Time boundaries
    seven_days_ago = today - datetime.timedelta(days=6)
    thirty_days_ago = today - datetime.timedelta(days=29)

    # Dictionary to collect weekly trend data
    # (initialize last 7 days with 0 minutes)
    weekly_trend = {}
    for i in range(7):
        date_key = (today - datetime.timedelta(days=i)).isoformat()
        weekly_trend[date_key] = 0

    for log in logs:
        log_date = log.study_date
        
        # Daily sum
        if log_date == today:
            daily_min += log.duration_minutes

        # Weekly sum (rolling 7 days)
        if log_date >= seven_days_ago and log_date <= today:
            weekly_min += log.duration_minutes
            
            # Map into trend
            date_key = log_date.isoformat()
            if date_key in weekly_trend:
                weekly_trend[date_key] += log.duration_minutes

        # Monthly sum (rolling 30 days)
        if log_date >= thirty_days_ago and log_date <= today:
            monthly_min += log.duration_minutes

    # Formulate trend payload ordered chronologically (oldest to newest)
    trend_data = []
    for date_str in sorted(weekly_trend.keys()):
        trend_data.append({
            'date': date_str,
            # Format nicely for UI: e.g. "Jun 15"
            'label': datetime.datetime.strptime(date_str, '%Y-%m-%d').strftime('%b %d'),
            'hours': round(weekly_trend[date_str] / 60.0, 2)
        })

    # Group by subject to see progress
    subject_hours = {}
    for log in logs:
        sub_name = log.subject.subject_name if log.subject else 'Unknown'
        subject_hours[sub_name] = subject_hours.get(sub_name, 0) + log.duration_minutes

    subject_breakdown = [
        {'subject_name': sub, 'hours': round(mins / 60.0, 2)}
        for sub, mins in subject_hours.items()
    ]

    return jsonify({
        'daily_hours': round(daily_min / 60.0, 2),
        'weekly_hours': round(weekly_min / 60.0, 2),
        'monthly_hours': round(monthly_min / 60.0, 2),
        'weekly_trend': trend_data,
        'subject_breakdown': subject_breakdown
    }), 200

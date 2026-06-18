import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, Subject, Unit, Topic, TopicProgress, Student

subjects_bp = Blueprint('subjects', __name__)

# Helper to check if user is teacher or admin
def require_teacher_or_admin(user):
    return user and user.role in ['teacher', 'admin']

@subjects_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def get_subjects():
    # Fetch all subjects
    subjects = Subject.query.all()
    
    # Check if student is requesting, to attach completion status
    student_id = None
    identity = get_jwt_identity()
    if identity:
        user_id = int(identity)
        user = db.session.get(User, user_id)
        if user and user.role == 'student' and user.student:
            student_id = user.student.student_id

    # If student, fetch progress mapping
    progress_map = {}
    if student_id:
        progress_records = TopicProgress.query.filter_by(student_id=student_id).all()
        progress_map = {p.topic_id: p.status for p in progress_records}

    result = []
    for sub in subjects:
        sub_data = sub.to_dict()
        sub_data['units'] = []
        for unit in sub.units:
            unit_data = unit.to_dict()
            unit_data['topics'] = []
            for topic in unit.topics:
                topic_data = topic.to_dict()
                if student_id:
                    topic_data['status'] = progress_map.get(topic.topic_id, 'pending')
                else:
                    topic_data['status'] = 'pending'
                unit_data['topics'].append(topic_data)
            sub_data['units'].append(unit_data)
        result.append(sub_data)
        
    return jsonify(result), 200

@subjects_bp.route('', methods=['POST'])
@jwt_required()
def create_subject():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not require_teacher_or_admin(user):
        return jsonify({'message': 'Unauthorized. Teacher or Admin privileges required.'}), 403

    data = request.get_json() or {}
    name = data.get('subject_name', '').strip()
    description = data.get('description', '').strip()

    if not name:
        return jsonify({'message': 'Subject name is required.'}), 400

    if len(name) > 100:
        return jsonify({'message': 'Subject name cannot exceed 100 characters.'}), 400

    if len(description) > 500:
        return jsonify({'message': 'Description cannot exceed 500 characters.'}), 400

    if Subject.query.filter_by(subject_name=name).first():
        return jsonify({'message': 'Subject name already exists.'}), 409

    try:
        new_sub = Subject(subject_name=name, description=description)
        db.session.add(new_sub)
        db.session.commit()
        return jsonify(new_sub.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create subject: {str(e)}'}), 500

@subjects_bp.route('/<int:subject_id>', methods=['PUT'])
@jwt_required()
def update_subject(subject_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not require_teacher_or_admin(user):
        return jsonify({'message': 'Unauthorized.'}), 403

    sub = db.session.get(Subject, subject_id)
    if not sub:
        return jsonify({'message': 'Subject not found.'}), 404

    data = request.get_json() or {}
    name = data.get('subject_name', '').strip()
    description = data.get('description', '').strip()

    if name:
        if len(name) > 100:
            return jsonify({'message': 'Subject name cannot exceed 100 characters.'}), 400
        existing = Subject.query.filter_by(subject_name=name).first()
        if existing and existing.subject_id != subject_id:
            return jsonify({'message': 'Subject name already exists.'}), 409
        sub.subject_name = name

    if description is not None:
        if len(description) > 500:
            return jsonify({'message': 'Description cannot exceed 500 characters.'}), 400
        sub.description = description

    try:
        db.session.commit()
        return jsonify(sub.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update subject: {str(e)}'}), 500

@subjects_bp.route('/<int:subject_id>', methods=['DELETE'])
@jwt_required()
def delete_subject(subject_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not require_teacher_or_admin(user):
        return jsonify({'message': 'Unauthorized.'}), 403

    sub = db.session.get(Subject, subject_id)
    if not sub:
        return jsonify({'message': 'Subject not found.'}), 404

    try:
        db.session.delete(sub)
        db.session.commit()
        return jsonify({'message': 'Subject deleted successfully.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete subject: {str(e)}'}), 500

# Unit Endpoints
@subjects_bp.route('/<int:subject_id>/units', methods=['POST'])
@jwt_required()
def create_unit(subject_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not require_teacher_or_admin(user):
        return jsonify({'message': 'Unauthorized.'}), 403

    sub = db.session.get(Subject, subject_id)
    if not sub:
        return jsonify({'message': 'Subject not found.'}), 404

    data = request.get_json() or {}
    name = data.get('unit_name', '').strip()

    if not name:
        return jsonify({'message': 'Unit name is required.'}), 400

    if len(name) > 100:
        return jsonify({'message': 'Unit name cannot exceed 100 characters.'}), 400

    try:
        new_unit = Unit(subject_id=subject_id, unit_name=name)
        db.session.add(new_unit)
        db.session.commit()
        return jsonify(new_unit.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create unit: {str(e)}'}), 500

@subjects_bp.route('/units/<int:unit_id>', methods=['PUT'])
@jwt_required()
def update_unit(unit_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not require_teacher_or_admin(user):
        return jsonify({'message': 'Unauthorized.'}), 403

    unit = db.session.get(Unit, unit_id)
    if not unit:
        return jsonify({'message': 'Unit not found.'}), 404

    data = request.get_json() or {}
    name = data.get('unit_name', '').strip()

    if name:
        if len(name) > 100:
            return jsonify({'message': 'Unit name cannot exceed 100 characters.'}), 400
        unit.unit_name = name

    try:
        db.session.commit()
        return jsonify(unit.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update unit: {str(e)}'}), 500

@subjects_bp.route('/units/<int:unit_id>', methods=['DELETE'])
@jwt_required()
def delete_unit(unit_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not require_teacher_or_admin(user):
        return jsonify({'message': 'Unauthorized.'}), 403

    unit = db.session.get(Unit, unit_id)
    if not unit:
        return jsonify({'message': 'Unit not found.'}), 404

    try:
        db.session.delete(unit)
        db.session.commit()
        return jsonify({'message': 'Unit deleted successfully.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete unit: {str(e)}'}), 500

# Topic Endpoints
@subjects_bp.route('/units/<int:unit_id>/topics', methods=['POST'])
@jwt_required()
def create_topic(unit_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not require_teacher_or_admin(user):
        return jsonify({'message': 'Unauthorized.'}), 403

    unit = db.session.get(Unit, unit_id)
    if not unit:
        return jsonify({'message': 'Unit not found.'}), 404

    data = request.get_json() or {}
    name = data.get('topic_name', '').strip()
    description = data.get('description', '').strip()
    try:
        est_hours = float(data.get('estimated_hours', 1.0))
    except ValueError:
        return jsonify({'message': 'Estimated hours must be a number.'}), 400
    difficulty = data.get('difficulty_level', 'Medium').strip()

    if not name:
        return jsonify({'message': 'Topic name is required.'}), 400

    if len(name) > 100:
        return jsonify({'message': 'Topic name cannot exceed 100 characters.'}), 400

    if len(description) > 1000:
        return jsonify({'message': 'Description cannot exceed 1000 characters.'}), 400

    if est_hours < 0.0 or est_hours > 200.0:
        return jsonify({'message': 'Estimated hours must be between 0 and 200.'}), 400

    if difficulty not in ['Easy', 'Medium', 'Hard']:
        return jsonify({'message': 'Difficulty level must be Easy, Medium, or Hard.'}), 400

    try:
        new_topic = Topic(
            unit_id=unit_id,
            topic_name=name,
            description=description,
            estimated_hours=est_hours,
            difficulty_level=difficulty
        )
        db.session.add(new_topic)
        db.session.commit()
        return jsonify(new_topic.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create topic: {str(e)}'}), 500

@subjects_bp.route('/topics/<int:topic_id>', methods=['PUT'])
@jwt_required()
def update_topic(topic_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not require_teacher_or_admin(user):
        return jsonify({'message': 'Unauthorized.'}), 403

    topic = db.session.get(Topic, topic_id)
    if not topic:
        return jsonify({'message': 'Topic not found.'}), 404

    data = request.get_json() or {}
    name = data.get('topic_name', '').strip()
    description = data.get('description', '').strip()
    est_hours = data.get('estimated_hours')
    difficulty = data.get('difficulty_level', '').strip()

    if name:
        if len(name) > 100:
            return jsonify({'message': 'Topic name cannot exceed 100 characters.'}), 400
        topic.topic_name = name
    if description is not None:
        if len(description) > 1000:
            return jsonify({'message': 'Description cannot exceed 1000 characters.'}), 400
        topic.description = description
    if est_hours is not None:
        try:
            val = float(est_hours)
            if val < 0.0 or val > 200.0:
                return jsonify({'message': 'Estimated hours must be between 0 and 200.'}), 400
            topic.estimated_hours = val
        except ValueError:
            return jsonify({'message': 'Estimated hours must be a number.'}), 400
    if difficulty:
        if difficulty not in ['Easy', 'Medium', 'Hard']:
            return jsonify({'message': 'Difficulty level must be Easy, Medium, or Hard.'}), 400
        topic.difficulty_level = difficulty

    try:
        db.session.commit()
        return jsonify(topic.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update topic: {str(e)}'}), 500

@subjects_bp.route('/topics/<int:topic_id>', methods=['DELETE'])
@jwt_required()
def delete_topic(topic_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not require_teacher_or_admin(user):
        return jsonify({'message': 'Unauthorized.'}), 403

    topic = db.session.get(Topic, topic_id)
    if not topic:
        return jsonify({'message': 'Topic not found.'}), 404

    try:
        db.session.delete(topic)
        db.session.commit()
        return jsonify({'message': 'Topic deleted successfully.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete topic: {str(e)}'}), 500

# Topic Progress Endpoint
@subjects_bp.route('/topics/<int:topic_id>/progress', methods=['POST'])
@jwt_required()
def update_topic_progress(topic_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role != 'student' or not user.student:
        return jsonify({'message': 'Unauthorized. Student role required.'}), 403

    student_id = user.student.student_id
    topic = db.session.get(Topic, topic_id)
    if not topic:
        return jsonify({'message': 'Topic not found.'}), 404

    data = request.get_json() or {}
    status = data.get('status', 'pending').strip().lower()

    if status not in ['completed', 'pending']:
        return jsonify({'message': 'Status must be completed or pending.'}), 400

    try:
        progress = TopicProgress.query.filter_by(student_id=student_id, topic_id=topic_id).first()
        
        if not progress:
            progress = TopicProgress(student_id=student_id, topic_id=topic_id)
            db.session.add(progress)
            
        progress.status = status
        if status == 'completed':
            progress.completion_date = datetime.datetime.utcnow()
        else:
            progress.completion_date = None
            
        db.session.commit()
        return jsonify(progress.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update topic progress: {str(e)}'}), 500

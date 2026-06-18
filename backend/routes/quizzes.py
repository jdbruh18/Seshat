from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, Subject, Quiz, Question, QuizAttempt, Student

quizzes_bp = Blueprint('quizzes', __name__)

def require_teacher_or_admin(user):
    return user and user.role in ['teacher', 'admin']

@quizzes_bp.route('', methods=['GET'])
@jwt_required()
def get_quizzes():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'message': 'User not found.'}), 404

    quizzes = Quiz.query.all()
    
    # If student, fetch their best attempts
    best_scores = {}
    if user.role == 'student' and user.student:
        student_id = user.student.student_id
        attempts = QuizAttempt.query.filter_by(student_id=student_id).all()
        for att in attempts:
            best_scores[att.quiz_id] = max(best_scores.get(att.quiz_id, 0), att.score)

    result = []
    for q in quizzes:
        q_data = q.to_dict()
        q_data['total_questions'] = len(q.questions)
        if user.role == 'student':
            q_data['best_score'] = best_scores.get(q.quiz_id, None)
            q_data['attempted'] = q.quiz_id in best_scores
        result.append(q_data)

    return jsonify(result), 200

@quizzes_bp.route('/<int:quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz_details(quiz_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'message': 'User not found.'}), 404

    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found.'}), 404

    quiz_data = quiz.to_dict()
    
    # Return answers only if teacher/admin
    include_answers = require_teacher_or_admin(user)
    quiz_data['questions'] = [q.to_dict(include_answer=include_answers) for q in quiz.questions]
    
    return jsonify(quiz_data), 200

@quizzes_bp.route('', methods=['POST'])
@jwt_required()
def create_quiz():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not require_teacher_or_admin(user):
        return jsonify({'message': 'Unauthorized.'}), 403

    data = request.get_json() or {}
    subject_id = data.get('subject_id')
    title = data.get('title', '').strip()
    difficulty = data.get('difficulty', 'Medium').strip()

    if not subject_id or not title:
        return jsonify({'message': 'Subject and Title are required.'}), 400

    subject = db.session.get(Subject, subject_id)
    if not subject:
        return jsonify({'message': 'Subject not found.'}), 404

    try:
        quiz = Quiz(subject_id=subject_id, title=title, difficulty=difficulty)
        db.session.add(quiz)
        db.session.commit()
        return jsonify(quiz.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create quiz: {str(e)}'}), 500

@quizzes_bp.route('/<int:quiz_id>/questions', methods=['POST'])
@jwt_required()
def add_quiz_question(quiz_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not require_teacher_or_admin(user):
        return jsonify({'message': 'Unauthorized.'}), 403

    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found.'}), 404

    data = request.get_json() or {}
    q_text = data.get('question_text', '').strip()
    opt_a = data.get('option_a', '').strip()
    opt_b = data.get('option_b', '').strip()
    opt_c = data.get('option_c', '').strip()
    opt_d = data.get('option_d', '').strip()
    correct = data.get('correct_answer', '').strip().upper()

    if not q_text or not opt_a or not opt_b or not opt_c or not opt_d or not correct:
        return jsonify({'message': 'Question text, 4 options, and correct answer (A/B/C/D) are required.'}), 400

    if correct not in ['A', 'B', 'C', 'D']:
        return jsonify({'message': 'Correct answer must be A, B, C, or D.'}), 400

    try:
        question = Question(
            quiz_id=quiz_id,
            question_text=q_text,
            option_a=opt_a,
            option_b=opt_b,
            option_c=opt_c,
            option_d=opt_d,
            correct_answer=correct
        )
        db.session.add(question)
        db.session.commit()
        return jsonify(question.to_dict(include_answer=True)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to add question: {str(e)}'}), 500

@quizzes_bp.route('/<int:quiz_id>/attempt', methods=['POST'])
@jwt_required()
def attempt_quiz(quiz_id):
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role != 'student' or not user.student:
        return jsonify({'message': 'Unauthorized. Student role required.'}), 403

    student_id = user.student.student_id
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found.'}), 404

    if len(quiz.questions) == 0:
        return jsonify({'message': 'This quiz has no questions.'}), 400

    data = request.get_json() or {}
    answers = data.get('answers', {}) # Dict of {question_id: selected_option}

    correct_count = 0
    total_questions = len(quiz.questions)
    review_details = []

    for q in quiz.questions:
        q_id_str = str(q.question_id)
        selected = answers.get(q_id_str, '').strip().upper()
        is_correct = (selected == q.correct_answer)
        if is_correct:
            correct_count += 1
            
        review_details.append({
            'question_id': q.question_id,
            'question_text': q.question_text,
            'selected_option': selected,
            'correct_option': q.correct_answer,
            'is_correct': is_correct
        })

    score_pct = (correct_count / total_questions) * 100

    try:
        attempt = QuizAttempt(
            student_id=student_id,
            quiz_id=quiz_id,
            score=round(score_pct, 2)
        )
        db.session.add(attempt)
        db.session.commit()

        return jsonify({
            'attempt_id': attempt.attempt_id,
            'score': round(score_pct, 2),
            'correct_count': correct_count,
            'total_questions': total_questions,
            'review': review_details
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to save quiz attempt: {str(e)}'}), 500

@quizzes_bp.route('/attempts', methods=['GET'])
@jwt_required()
def get_quiz_attempts():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role != 'student' or not user.student:
        return jsonify({'message': 'Unauthorized.'}), 403

    student_id = user.student.student_id
    attempts = QuizAttempt.query.filter_by(student_id=student_id).order_by(QuizAttempt.attempt_date.desc()).all()
    
    return jsonify([att.to_dict() for att in attempts]), 200

@quizzes_bp.route('/attempts/stats', methods=['GET'])
@jwt_required()
def get_quiz_stats():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or user.role != 'student' or not user.student:
        return jsonify({'message': 'Unauthorized.'}), 403

    student_id = user.student.student_id
    attempts = QuizAttempt.query.filter_by(student_id=student_id).order_by(QuizAttempt.attempt_date.asc()).all()

    if not attempts:
        return jsonify({
            'quiz_average': 0,
            'total_attempts': 0,
            'attempts_history': []
        }), 200

    scores = [att.score for att in attempts]
    avg_score = sum(scores) / len(scores)

    history = []
    for att in attempts:
        history.append({
            'attempt_id': att.attempt_id,
            'quiz_title': att.quiz.title if att.quiz else 'Unknown',
            'subject_name': att.quiz.subject.subject_name if att.quiz and att.quiz.subject else 'Unknown',
            'score': att.score,
            'date': att.attempt_date.strftime('%b %d')
        })

    return jsonify({
        'quiz_average': round(avg_score, 2),
        'total_attempts': len(attempts),
        'attempts_history': history
    }), 200

import datetime
import bcrypt
import base64
import hashlib
from cryptography.fernet import Fernet
from config import Config
from database import db

# Helper to derive a valid 32-byte url-safe base64 key from any secret string
def get_fernet_key(secret: str) -> bytes:
    hashed = hashlib.sha256(secret.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(hashed)

# Initialize Fernet cipher
fernet_key = get_fernet_key(Config.SECRET_KEY)
cipher = Fernet(fernet_key)

def encrypt_text(text: str) -> str:
    if not text:
        return ""
    return cipher.encrypt(text.encode('utf-8')).decode('utf-8')

def decrypt_text(cipher_text: str) -> str:
    if not cipher_text:
        return ""
    try:
        return cipher.decrypt(cipher_text.encode('utf-8')).decode('utf-8')
    except Exception:
        # Fallback to returning raw text in case it was stored unencrypted
        return cipher_text

# Password hashing utilities
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'student', 'teacher', 'admin'
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    # Relationships
    student = db.relationship('Student', back_populates='user', uselist=False, cascade="all, delete-orphan")
    teacher = db.relationship('Teacher', back_populates='user', uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'full_name': self.full_name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }

class Student(db.Model):
    __tablename__ = 'students'
    student_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), unique=True, nullable=False)
    institution = db.Column(db.String(150), nullable=False)
    course = db.Column(db.String(100), nullable=False)
    semester = db.Column(db.Integer, nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='student')
    progress = db.relationship('TopicProgress', back_populates='student', cascade="all, delete-orphan")
    study_logs = db.relationship('StudyLog', back_populates='student', cascade="all, delete-orphan")
    quiz_attempts = db.relationship('QuizAttempt', back_populates='student', cascade="all, delete-orphan")
    recommendations = db.relationship('Recommendation', back_populates='student', cascade="all, delete-orphan")
    predictions = db.relationship('Prediction', back_populates='student', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'student_id': self.student_id,
            'user_id': self.user_id,
            'full_name': self.user.full_name if self.user else None,
            'email': self.user.email if self.user else None,
            'institution': self.institution,
            'course': self.course,
            'semester': self.semester
        }

class Teacher(db.Model):
    __tablename__ = 'teachers'
    teacher_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), unique=True, nullable=False)
    department = db.Column(db.String(100), nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='teacher')

    def to_dict(self):
        return {
            'teacher_id': self.teacher_id,
            'user_id': self.user_id,
            'full_name': self.user.full_name if self.user else None,
            'email': self.user.email if self.user else None,
            'department': self.department
        }

class Subject(db.Model):
    __tablename__ = 'subjects'
    subject_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    subject_name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)

    # Relationships
    units = db.relationship('Unit', back_populates='subject', cascade="all, delete-orphan")
    study_logs = db.relationship('StudyLog', back_populates='subject')
    quizzes = db.relationship('Quiz', back_populates='subject', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'subject_id': self.subject_id,
            'subject_name': self.subject_name,
            'description': self.description
        }

class Unit(db.Model):
    __tablename__ = 'units'
    unit_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.subject_id', ondelete='CASCADE'), nullable=False)
    unit_name = db.Column(db.String(100), nullable=False)

    # Relationships
    subject = db.relationship('Subject', back_populates='units')
    topics = db.relationship('Topic', back_populates='unit', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'unit_id': self.unit_id,
            'subject_id': self.subject_id,
            'unit_name': self.unit_name
        }

class Topic(db.Model):
    __tablename__ = 'topics'
    topic_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.unit_id', ondelete='CASCADE'), nullable=False)
    topic_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    estimated_hours = db.Column(db.Float, default=1.0)
    difficulty_level = db.Column(db.String(20), default='Medium') # 'Easy', 'Medium', 'Hard'

    # Relationships
    unit = db.relationship('Unit', back_populates='topics')
    progress = db.relationship('TopicProgress', back_populates='topic', cascade="all, delete-orphan")
    study_logs = db.relationship('StudyLog', back_populates='topic')

    def to_dict(self):
        return {
            'topic_id': self.topic_id,
            'unit_id': self.unit_id,
            'topic_name': self.topic_name,
            'description': self.description,
            'estimated_hours': self.estimated_hours,
            'difficulty_level': self.difficulty_level
        }

class TopicProgress(db.Model):
    __tablename__ = 'topic_progress'
    progress_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id', ondelete='CASCADE'), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.topic_id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String(20), default='pending') # 'pending', 'completed'
    completion_date = db.Column(db.DateTime, nullable=True)

    # Relationships
    student = db.relationship('Student', back_populates='progress')
    topic = db.relationship('Topic', back_populates='progress')

    def to_dict(self):
        return {
            'progress_id': self.progress_id,
            'student_id': self.student_id,
            'topic_id': self.topic_id,
            'status': self.status,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None
        }

class StudyLog(db.Model):
    __tablename__ = 'study_logs'
    log_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.subject_id'), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.topic_id'), nullable=False)
    study_date = db.Column(db.Date, default=datetime.date.today)
    duration_minutes = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text, nullable=True)

    # Relationships
    student = db.relationship('Student', back_populates='study_logs')
    subject = db.relationship('Subject', back_populates='study_logs')
    topic = db.relationship('Topic', back_populates='study_logs')

    def to_dict(self):
        return {
            'log_id': self.log_id,
            'student_id': self.student_id,
            'subject_id': self.subject_id,
            'subject_name': self.subject.subject_name if self.subject else None,
            'topic_id': self.topic_id,
            'topic_name': self.topic.topic_name if self.topic else None,
            'study_date': self.study_date.isoformat(),
            'duration_minutes': self.duration_minutes,
            'notes': decrypt_text(self.notes)
        }

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    quiz_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.subject_id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    difficulty = db.Column(db.String(20), default='Medium') # 'Easy', 'Medium', 'Hard'

    # Relationships
    subject = db.relationship('Subject', back_populates='quizzes')
    questions = db.relationship('Question', back_populates='quiz', cascade="all, delete-orphan")
    attempts = db.relationship('QuizAttempt', back_populates='quiz', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'quiz_id': self.quiz_id,
            'subject_id': self.subject_id,
            'subject_name': self.subject.subject_name if self.subject else None,
            'title': self.title,
            'difficulty': self.difficulty
        }

class Question(db.Model):
    __tablename__ = 'questions'
    question_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.quiz_id', ondelete='CASCADE'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.String(255), nullable=False)
    option_b = db.Column(db.String(255), nullable=False)
    option_c = db.Column(db.String(255), nullable=False)
    option_d = db.Column(db.String(255), nullable=False)
    correct_answer = db.Column(db.String(1), nullable=False) # 'A', 'B', 'C', 'D'

    # Relationships
    quiz = db.relationship('Quiz', back_populates='questions')

    def to_dict(self, include_answer=False):
        data = {
            'question_id': self.question_id,
            'quiz_id': self.quiz_id,
            'question_text': self.question_text,
            'option_a': self.option_a,
            'option_b': self.option_b,
            'option_c': self.option_c,
            'option_d': self.option_d
        }
        if include_answer:
            data['correct_answer'] = self.correct_answer
        return data

class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'
    attempt_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id', ondelete='CASCADE'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.quiz_id', ondelete='CASCADE'), nullable=False)
    score = db.Column(db.Float, nullable=False) # percentage or raw score
    attempt_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    # Relationships
    student = db.relationship('Student', back_populates='quiz_attempts')
    quiz = db.relationship('Quiz', back_populates='attempts')

    def to_dict(self):
        return {
            'attempt_id': self.attempt_id,
            'student_id': self.student_id,
            'quiz_id': self.quiz_id,
            'quiz_title': self.quiz.title if self.quiz else None,
            'subject_name': self.quiz.subject.subject_name if self.quiz and self.quiz.subject else None,
            'score': self.score,
            'attempt_date': self.attempt_date.isoformat()
        }

class Recommendation(db.Model):
    __tablename__ = 'recommendations'
    recommendation_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id', ondelete='CASCADE'), nullable=False)
    recommendation_text = db.Column(db.Text, nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    # Relationships
    student = db.relationship('Student', back_populates='recommendations')

    def to_dict(self):
        return {
            'recommendation_id': self.recommendation_id,
            'student_id': self.student_id,
            'recommendation_text': self.recommendation_text,
            'generated_at': self.generated_at.isoformat()
        }

class Prediction(db.Model):
    __tablename__ = 'predictions'
    prediction_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id', ondelete='CASCADE'), nullable=False)
    predicted_score = db.Column(db.Float, nullable=False)
    predicted_grade = db.Column(db.String(2), nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    # Relationships
    student = db.relationship('Student', back_populates='predictions')

    def to_dict(self):
        return {
            'prediction_id': self.prediction_id,
            'student_id': self.student_id,
            'predicted_score': self.predicted_score,
            'predicted_grade': self.predicted_grade,
            'generated_at': self.generated_at.isoformat()
        }

import unittest
import json
from app import create_app
from database import db
from models import User, Subject, Unit, Topic, StudyLog, TopicProgress, Prediction
from config import Config

class TestConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    TESTING = True
    JWT_SECRET_KEY = 'test-secret-key-that-is-at-least-thirty-two-bytes-long'

class TestPredictionsAPI(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        
        # Register and log in a Student
        student_payload = {
            "email": "student@test.com",
            "password": "Password1",
            "full_name": "Alex",
            "role": "student",
            "institution": "Stanford",
            "course": "MCA",
            "semester": 1
        }
        self.client.post('/api/auth/register', data=json.dumps(student_payload), content_type='application/json')
        student_login = self.client.post('/api/auth/login', data=json.dumps({"email": "student@test.com", "password": "Password1"}), content_type='application/json')
        self.student_token = json.loads(student_login.data)['token']

        # Setup mock course structure so logs can be associated
        teacher_payload = {
            "email": "teacher@test.com",
            "password": "Password1",
            "full_name": "Dr. Sarah",
            "role": "teacher",
            "department": "Computer Science"
        }
        self.client.post('/api/auth/register', data=json.dumps(teacher_payload), content_type='application/json')
        teacher_login = self.client.post('/api/auth/login', data=json.dumps({"email": "teacher@test.com", "password": "Password1"}), content_type='application/json')
        teacher_token = json.loads(teacher_login.data)['token']

        teacher_headers = {'Authorization': f'Bearer {teacher_token}'}
        resp = self.client.post('/api/subjects', data=json.dumps({"subject_name": "Databases"}), content_type='application/json', headers=teacher_headers)
        self.subject_id = json.loads(resp.data)['subject_id']

        resp = self.client.post(f'/api/subjects/{self.subject_id}/units', data=json.dumps({"unit_name": "SQL"}), content_type='application/json', headers=teacher_headers)
        self.unit_id = json.loads(resp.data)['unit_id']

        resp = self.client.post(f'/api/subjects/units/{self.unit_id}/topics', data=json.dumps({"topic_name": "Joins"}), content_type='application/json', headers=teacher_headers)
        self.topic_id = json.loads(resp.data)['topic_id']

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_performance_prediction_engine(self):
        """Verify model prediction triggers, updates predictions table, and correlates score shifts with study increases"""
        student_headers = {'Authorization': f'Bearer {self.student_token}'}

        # 1. Trigger initial prediction
        resp = self.client.get('/api/predictions/predict', headers=student_headers)
        self.assertEqual(resp.status_code, 200)
        pred_data = json.loads(resp.data)
        
        self.assertIn('predicted_score', pred_data)
        self.assertIn('predicted_grade', pred_data)
        initial_score = pred_data['predicted_score']
        
        # Verify saved in DB
        db_pred = Prediction.query.first()
        self.assertIsNotNone(db_pred)
        self.assertEqual(db_pred.predicted_score, initial_score)
        
        # 2. Student logs study hours, completes the topic, and takes a quiz
        # A. Log study log (15 hours)
        study_payload = {
            "subject_id": self.subject_id,
            "topic_id": self.topic_id,
            "duration_minutes": 900,
            "notes": "Intense database joins practice",
            "study_date": "2026-06-15"
        }
        self.client.post('/api/study/log', data=json.dumps(study_payload), content_type='application/json', headers=student_headers)

        # B. Mark topic as completed (makes completion = 100%)
        self.client.post(f'/api/subjects/topics/{self.topic_id}/progress', data=json.dumps({"status": "completed"}), content_type='application/json', headers=student_headers)

        # C. Teacher creates a quiz and student attempts it
        teacher_login = self.client.post('/api/auth/login', data=json.dumps({"email": "teacher@test.com", "password": "Password1"}), content_type='application/json')
        teacher_token = json.loads(teacher_login.data)['token']
        teacher_headers = {'Authorization': f'Bearer {teacher_token}'}

        resp_quiz = self.client.post('/api/quizzes', data=json.dumps({
            "subject_id": self.subject_id,
            "title": "SQL Quiz",
            "difficulty": "Easy"
        }), content_type='application/json', headers=teacher_headers)
        quiz_id = json.loads(resp_quiz.data)['quiz_id']

        resp_q = self.client.post(f'/api/quizzes/{quiz_id}/questions', data=json.dumps({
            "question_text": "What is SQL?",
            "option_a": "Query Language", "option_b": "Format", "option_c": "OS", "option_d": "None",
            "correct_answer": "A"
        }), content_type='application/json', headers=teacher_headers)
        q_id = json.loads(resp_q.data)['question_id']

        # Student takes the quiz and gets 100%
        self.client.post(f'/api/quizzes/{quiz_id}/attempt', data=json.dumps({
            "answers": {str(q_id): "A"}
        }), content_type='application/json', headers=student_headers)

        # 3. Trigger prediction again and verify that predicted score increases!
        resp = self.client.get('/api/predictions/predict', headers=student_headers)
        pred_data_new = json.loads(resp.data)
        new_score = pred_data_new['predicted_score']
        
        print(f"Initial Predicted Score: {initial_score} -> Updated: {new_score}")
        self.assertGreater(new_score, initial_score, "Model should predict a higher score after student completes study, topics, and quiz.")

if __name__ == '__main__':
    unittest.main()

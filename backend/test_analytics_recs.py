import unittest
import json
import datetime
from app import create_app
from database import db
from models import User, Subject, Unit, Topic, Quiz, Question, QuizAttempt, StudyLog, TopicProgress
from config import Config

class TestConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    TESTING = True
    JWT_SECRET_KEY = 'test-secret-key-that-is-at-least-thirty-two-bytes-long'

class TestAnalyticsAndRecommendationsAPI(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        
        # Register and log in a Teacher
        teacher_payload = {
            "email": "teacher@test.com",
            "password": "Password1",
            "full_name": "Dr. Sarah",
            "role": "teacher",
            "department": "Computer Science"
        }
        self.client.post('/api/auth/register', data=json.dumps(teacher_payload), content_type='application/json')
        teacher_login = self.client.post('/api/auth/login', data=json.dumps({"email": "teacher@test.com", "password": "Password1"}), content_type='application/json')
        self.teacher_token = json.loads(teacher_login.data)['token']
        
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

        # Setup syllabus dependencies (1 Subject, 1 Unit, 2 Topics)
        teacher_headers = {'Authorization': f'Bearer {self.teacher_token}'}
        resp = self.client.post('/api/subjects', data=json.dumps({"subject_name": "Data Structures"}), content_type='application/json', headers=teacher_headers)
        self.subject_id = json.loads(resp.data)['subject_id']

        resp = self.client.post(f'/api/subjects/{self.subject_id}/units', data=json.dumps({"unit_name": "Trees"}), content_type='application/json', headers=teacher_headers)
        self.unit_id = json.loads(resp.data)['unit_id']

        resp = self.client.post(f'/api/subjects/units/{self.unit_id}/topics', data=json.dumps({"topic_name": "BST"}), content_type='application/json', headers=teacher_headers)
        self.topic1_id = json.loads(resp.data)['topic_id']

        resp = self.client.post(f'/api/subjects/units/{self.unit_id}/topics', data=json.dumps({"topic_name": "AVL"}), content_type='application/json', headers=teacher_headers)
        self.topic2_id = json.loads(resp.data)['topic_id']

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_analytics_and_recommendations_rules(self):
        """Test initial state, logging sessions, progress updates, quiz failure triggers, and classifications"""
        student_headers = {'Authorization': f'Bearer {self.student_token}'}
        teacher_headers = {'Authorization': f'Bearer {self.teacher_token}'}

        # 1. Verify initial stats state
        resp = self.client.get('/api/analytics/dashboard', headers=student_headers)
        self.assertEqual(resp.status_code, 200)
        stats = json.loads(resp.data)
        self.assertEqual(stats['total_study_hours'], 0.0)
        self.assertEqual(stats['streak'], 0)
        self.assertEqual(stats['learning_speed'], 0.0)
        self.assertEqual(len(stats['strong_subjects']), 0)
        # It should show Data Structures as Weak since completion is 0.0% (< 50%)
        self.assertEqual(len(stats['weak_subjects']), 1)
        self.assertEqual(stats['weak_subjects'][0]['subject_name'], 'Data Structures')

        # 2. Verify initial recommendations generated
        resp = self.client.get('/api/recommendations', headers=student_headers)
        self.assertEqual(resp.status_code, 200)
        recs = json.loads(resp.data)
        self.assertTrue(len(recs) >= 2) # Inactivity alert + syllabus < 50%
        recs_texts = [r['recommendation_text'] for r in recs]
        self.assertTrue(any("syllabus completion" in text.lower() for text in recs_texts))
        self.assertTrue(any("haven't logged any study" in text.lower() for text in recs_texts))

        # 3. Log a study session for today (60 minutes)
        study_payload = {
            "subject_id": self.subject_id,
            "topic_id": self.topic1_id,
            "duration_minutes": 60,
            "notes": "Studied Binary Search Trees",
            "study_date": datetime.date.today().isoformat()
        }
        self.client.post('/api/study/log', data=json.dumps(study_payload), content_type='application/json', headers=student_headers)

        # 4. Student marks both topics as completed (100% completion)
        self.client.post(f'/api/subjects/topics/{self.topic1_id}/progress', data=json.dumps({"status": "completed"}), content_type='application/json', headers=student_headers)
        self.client.post(f'/api/subjects/topics/{self.topic2_id}/progress', data=json.dumps({"status": "completed"}), content_type='application/json', headers=student_headers)

        # 5. Verify stats updates (hours, streak, speed, strong subject classification)
        resp = self.client.get('/api/analytics/dashboard', headers=student_headers)
        stats = json.loads(resp.data)
        self.assertEqual(stats['total_study_hours'], 1.0)
        self.assertEqual(stats['streak'], 1)
        self.assertEqual(stats['learning_speed'], 2.0) # 2 completed topics / 1.0 hour = 2.0 speed
        
        # Subject should move from Weak to Strong (since completion is 100% and no failed quizzes)
        self.assertEqual(len(stats['strong_subjects']), 1)
        self.assertEqual(stats['strong_subjects'][0]['subject_name'], 'Data Structures')
        self.assertEqual(len(stats['weak_subjects']), 0)

        # 6. Teacher creates a quiz and Student fails it
        resp = self.client.post('/api/quizzes', data=json.dumps({
            "subject_id": self.subject_id,
            "title": "Trees Quiz",
            "difficulty": "Medium"
        }), content_type='application/json', headers=teacher_headers)
        quiz_id = json.loads(resp.data)['quiz_id']

        # Add question
        self.client.post(f'/api/quizzes/{quiz_id}/questions', data=json.dumps({
            "question_text": "Is AVL self-balancing?",
            "option_a": "Yes", "option_b": "No", "option_c": "Maybe", "option_d": "N/A",
            "correct_answer": "A"
        }), content_type='application/json', headers=teacher_headers)

        # Student submits wrong answer -> gets 0.0%
        self.client.post(f'/api/quizzes/{quiz_id}/attempt', data=json.dumps({
            "answers": {"1": "B"}
        }), content_type='application/json', headers=student_headers)

        # 7. Verify failed quiz triggers a recommendation alert
        resp = self.client.get('/api/recommendations', headers=student_headers)
        recs = json.loads(resp.data)
        recs_texts = [r['recommendation_text'] for r in recs]
        self.assertTrue(any("quiz 'Trees Quiz'" in text for text in recs_texts))

        # 8. Verify Subject is reclassified as Weak because average quiz score < 60%
        resp = self.client.get('/api/analytics/dashboard', headers=student_headers)
        stats = json.loads(resp.data)
        self.assertEqual(len(stats['strong_subjects']), 0)
        self.assertEqual(len(stats['weak_subjects']), 1)
        self.assertEqual(stats['weak_subjects'][0]['subject_name'], 'Data Structures')

if __name__ == '__main__':
    unittest.main()

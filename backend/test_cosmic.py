import unittest
import json
import datetime
from app import create_app
from database import db
from models import User, Subject, Unit, Topic, StudyLog, Quiz, QuizAttempt
from config import Config

class TestConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    TESTING = True
    JWT_SECRET_KEY = 'test-secret-key-that-is-at-least-thirty-two-bytes-long'

class TestCosmicRhythmsAndConstellationsAPI(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        
        # 1. Register and login a Student
        student_payload = {
            "email": "student@test.com",
            "password": "Password1",
            "full_name": "Galileo",
            "role": "student",
            "institution": "Pisa University",
            "course": "Physics",
            "semester": 1
        }
        self.client.post('/api/auth/register', data=json.dumps(student_payload), content_type='application/json')
        
        student_login = self.client.post('/api/auth/login', data=json.dumps({"email": "student@test.com", "password": "Password1"}), content_type='application/json')
        self.student_token = json.loads(student_login.data)['token']
        
        # 2. Register and login a Teacher to build syllabus
        teacher_payload = {
            "email": "teacher@test.com",
            "password": "Password1",
            "full_name": "Dr. Kepler",
            "role": "teacher",
            "department": "Astronomy"
        }
        self.client.post('/api/auth/register', data=json.dumps(teacher_payload), content_type='application/json')
        
        teacher_login = self.client.post('/api/auth/login', data=json.dumps({"email": "teacher@test.com", "password": "Password1"}), content_type='application/json')
        self.teacher_token = json.loads(teacher_login.data)['token']

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_default_chronotype_and_constellations(self):
        """Verify that a brand new student defaults to Golden Bear chronotype and gets empty constellations if no subjects exist"""
        headers = {'Authorization': f'Bearer {self.student_token}'}
        response = self.client.get('/api/cosmic/rhythm', headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data["chronotype"], "Golden Bear")
        self.assertEqual(len(data["constellations"]), 0)
        self.assertEqual(sum(data["hourly_distribution"]), 0)

    def test_chronotype_classification_lark_and_constellation_stars(self):
        """Verify study logs map to correct chronotypes and constellations map topics to stars"""
        teacher_headers = {'Authorization': f'Bearer {self.teacher_token}'}
        student_headers = {'Authorization': f'Bearer {self.student_token}'}

        # 1. Create a subject, unit, and topics
        resp = self.client.post('/api/subjects', data=json.dumps({"subject_name": "Astronomy"}), content_type='application/json', headers=teacher_headers)
        sub_id = json.loads(resp.data)['subject_id']

        resp = self.client.post(f'/api/subjects/{sub_id}/units', data=json.dumps({"unit_name": "Solar Physics"}), content_type='application/json', headers=teacher_headers)
        unit_id = json.loads(resp.data)['unit_id']

        resp = self.client.post(f'/api/subjects/units/{unit_id}/topics', data=json.dumps({"topic_name": "Sunspots"}), content_type='application/json', headers=teacher_headers)
        topic_id1 = json.loads(resp.data)['topic_id']

        resp = self.client.post(f'/api/subjects/units/{unit_id}/topics', data=json.dumps({"topic_name": "Solar Flares"}), content_type='application/json', headers=teacher_headers)
        topic_id2 = json.loads(resp.data)['topic_id']

        # 2. Log study sessions (this will map deterministically using log_id to test hourly distributions)
        # First log_id (1) maps to hour (1 * 5 + 9) % 24 = 14 (Golden Bear)
        # We can add a QuizAttempt with actual DateTime to precisely force the hour!
        # Let's create a quiz and attempts at specific hours
        quiz = Quiz(subject_id=sub_id, title="Solar Quiz", difficulty="Medium")
        db.session.add(quiz)
        db.session.commit()
        quiz_id = quiz.quiz_id
        
        # Get student ID
        student_user = User.query.filter_by(email="student@test.com").first()
        student_id = student_user.student.student_id

        # Quiz attempts at 8 AM (Morning Lark range)
        attempt_time = datetime.datetime.utcnow().replace(hour=8, minute=30)
        attempt1 = QuizAttempt(
            student_id=student_id,
            quiz_id=quiz_id,
            score=85.0,
            attempt_date=attempt_time
        )
        attempt2 = QuizAttempt(
            student_id=student_id,
            quiz_id=quiz_id,
            score=90.0,
            attempt_date=attempt_time
        )
        db.session.add(attempt1)
        db.session.add(attempt2)
        db.session.commit()

        # 3. Request rhythm endpoint -> should classify as Morning Lark (Lion)
        response = self.client.get('/api/cosmic/rhythm', headers=student_headers)
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data["chronotype"], "Morning Lark (Lion)")
        self.assertEqual(data["chronotype_key"], "morning_lark")
        self.assertTrue(data["hourly_distribution"][8] >= 2)
        self.assertTrue("weakest subject" in data["scientific_insight"] or "Astronomy" in data["scientific_insight"])

        # Check constellation payload
        self.assertEqual(len(data["constellations"]), 1)
        const = data["constellations"][0]
        self.assertEqual(const["subject_name"], "Astronomy")
        self.assertEqual(len(const["stars"]), 2)
        self.assertEqual(const["stars"][0]["topic_name"], "Sunspots")
        self.assertFalse(const["stars"][0]["is_completed"])
        
        # Mark one topic complete and verify status update in star chart
        self.client.post(f'/api/subjects/topics/{topic_id1}/progress', data=json.dumps({"status": "completed"}), content_type='application/json', headers=student_headers)
        
        response2 = self.client.get('/api/cosmic/rhythm', headers=student_headers)
        data2 = json.loads(response2.data)
        const2 = data2["constellations"][0]
        self.assertTrue(const2["stars"][0]["is_completed"])
        self.assertFalse(const2["stars"][1]["is_completed"])
        self.assertFalse(const2["is_completed"]) # Not fully completed yet

    def test_cosmic_observatory_and_news_proxy(self):
        """Verify that the observatory and space-news proxy routes return valid structures"""
        student_headers = {'Authorization': f'Bearer {self.student_token}'}

        # 1. Test observatory endpoint
        response = self.client.get('/api/cosmic/observatory', headers=student_headers)
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn("apod", data)
        self.assertIn("iss", data)
        
        # Check structure
        self.assertIn("title", data["apod"])
        self.assertIn("explanation", data["apod"])
        self.assertIn("url", data["apod"])
        
        self.assertIn("latitude", data["iss"])
        self.assertIn("longitude", data["iss"])
        self.assertIn("velocity_kmh", data["iss"])
        self.assertIn("altitude_km", data["iss"])

        # 2. Test space-news endpoint
        news_response = self.client.get('/api/cosmic/space-news', headers=student_headers)
        self.assertEqual(news_response.status_code, 200)
        
        news_data = json.loads(news_response.data)
        self.assertTrue(isinstance(news_data, list))
        self.assertTrue(len(news_data) > 0)
        
        # Check article structure
        article = news_data[0]
        self.assertIn("title", article)
        self.assertIn("summary", article)
        self.assertIn("news_site", article)
        self.assertIn("url", article)

if __name__ == '__main__':
    unittest.main()

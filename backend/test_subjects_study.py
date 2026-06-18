import unittest
import json
import datetime
from app import create_app
from database import db
from models import User, Subject, Unit, Topic, StudyLog, TopicProgress
from config import Config

class TestConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    TESTING = True
    JWT_SECRET_KEY = 'test-secret-key-that-is-at-least-thirty-two-bytes-long'

class TestSubjectsAndStudyAPI(unittest.TestCase):
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

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_role_based_course_creation(self):
        """Verify only teachers/admins can create courses/syllabus"""
        subject_payload = {
            "subject_name": "Artificial Intelligence",
            "description": "Introduction to AI & ML"
        }
        
        # Student attempts to create subject -> should fail
        student_headers = {'Authorization': f'Bearer {self.student_token}'}
        response = self.client.post('/api/subjects', 
                                    data=json.dumps(subject_payload), 
                                    content_type='application/json', 
                                    headers=student_headers)
        self.assertEqual(response.status_code, 403)

        # Teacher attempts to create subject -> should succeed
        teacher_headers = {'Authorization': f'Bearer {self.teacher_token}'}
        response = self.client.post('/api/subjects', 
                                    data=json.dumps(subject_payload), 
                                    content_type='application/json', 
                                    headers=teacher_headers)
        self.assertEqual(response.status_code, 201)
        sub_data = json.loads(response.data)
        subject_id = sub_data['subject_id']

        # Teacher adds a Unit
        unit_payload = {"unit_name": "Unit 1: Search Algorithms"}
        response = self.client.post(f'/api/subjects/{subject_id}/units',
                                    data=json.dumps(unit_payload),
                                    content_type='application/json',
                                    headers=teacher_headers)
        self.assertEqual(response.status_code, 201)
        unit_id = json.loads(response.data)['unit_id']

        # Teacher adds a Topic
        topic_payload = {
            "topic_name": "A* Search",
            "description": "Heuristic search algorithm",
            "estimated_hours": 3.5,
            "difficulty_level": "Hard"
        }
        response = self.client.post(f'/api/subjects/units/{unit_id}/topics',
                                    data=json.dumps(topic_payload),
                                    content_type='application/json',
                                    headers=teacher_headers)
        self.assertEqual(response.status_code, 201)

    def test_student_view_and_progress_tracking(self):
        """Verify syllabus nesting, progress checking, and study logging"""
        teacher_headers = {'Authorization': f'Bearer {self.teacher_token}'}
        student_headers = {'Authorization': f'Bearer {self.student_token}'}

        # 1. Create a subject structure
        resp = self.client.post('/api/subjects', data=json.dumps({"subject_name": "Maths"}), content_type='application/json', headers=teacher_headers)
        sub_id = json.loads(resp.data)['subject_id']

        resp = self.client.post(f'/api/subjects/{sub_id}/units', data=json.dumps({"unit_name": "Calculus"}), content_type='application/json', headers=teacher_headers)
        unit_id = json.loads(resp.data)['unit_id']

        resp = self.client.post(f'/api/subjects/units/{unit_id}/topics', data=json.dumps({"topic_name": "Derivatives"}), content_type='application/json', headers=teacher_headers)
        topic_id = json.loads(resp.data)['topic_id']

        # 2. Get subjects structure as student -> check default pending status
        resp = self.client.get('/api/subjects', headers=student_headers)
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['units'][0]['topics'][0]['status'], 'pending')

        # 3. Student marks topic as completed
        resp = self.client.post(f'/api/subjects/topics/{topic_id}/progress', data=json.dumps({"status": "completed"}), content_type='application/json', headers=student_headers)
        self.assertEqual(resp.status_code, 200)

        # 4. Get subjects structure as student again -> check completed status
        resp = self.client.get('/api/subjects', headers=student_headers)
        data = json.loads(resp.data)
        self.assertEqual(data[0]['units'][0]['topics'][0]['status'], 'completed')

        # 5. Student logs study session
        study_payload = {
            "subject_id": sub_id,
            "topic_id": topic_id,
            "duration_minutes": 120,
            "notes": "Studied derivative rules",
            "study_date": datetime.date.today().isoformat()
        }
        resp = self.client.post('/api/study/log', data=json.dumps(study_payload), content_type='application/json', headers=student_headers)
        self.assertEqual(resp.status_code, 201)

        # 5.5 Verify notes are stored encrypted in the database but decrypted in to_dict()
        raw_log = StudyLog.query.filter_by(duration_minutes=120).first()
        self.assertIsNotNone(raw_log)
        self.assertNotEqual(raw_log.notes, "Studied derivative rules")
        self.assertTrue(len(raw_log.notes) > 40) # Ciphertext is long base64 string
        self.assertEqual(raw_log.to_dict()['notes'], "Studied derivative rules")

        # 6. Retrieve student study logs
        resp = self.client.get('/api/study/logs', headers=student_headers)
        logs = json.loads(resp.data)
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0]['duration_minutes'], 120)

        # 7. Check study stats
        resp = self.client.get('/api/study/stats', headers=student_headers)
        stats = json.loads(resp.data)
        self.assertEqual(stats['daily_hours'], 2.0)
        self.assertEqual(stats['weekly_hours'], 2.0)
        self.assertEqual(stats['monthly_hours'], 2.0)
        self.assertEqual(len(stats['weekly_trend']), 7)
        self.assertEqual(stats['weekly_trend'][-1]['hours'], 2.0) # Today should show 2.0 hours

    def test_data_retention_purging(self):
        """Verify that records older than 1 year (365 days) are purged from the database"""
        # We need a student and a subject/topic first
        teacher_headers = {'Authorization': f'Bearer {self.teacher_token}'}
        resp = self.client.post('/api/subjects', data=json.dumps({"subject_name": "History"}), content_type='application/json', headers=teacher_headers)
        sub_id = json.loads(resp.data)['subject_id']

        resp = self.client.post(f'/api/subjects/{sub_id}/units', data=json.dumps({"unit_name": "WWII"}), content_type='application/json', headers=teacher_headers)
        unit_id = json.loads(resp.data)['unit_id']

        resp = self.client.post(f'/api/subjects/units/{unit_id}/topics', data=json.dumps({"topic_name": "D-Day"}), content_type='application/json', headers=teacher_headers)
        topic_id = json.loads(resp.data)['topic_id']

        # Get student ID
        from models import User, StudyLog, Quiz, QuizAttempt
        student_user = User.query.filter_by(email="student@test.com").first()
        student_id = student_user.student.student_id

        # Create old and new study logs
        today = datetime.date.today()
        old_date = today - datetime.timedelta(days=366)
        new_date = today - datetime.timedelta(days=100)

        old_log = StudyLog(
            student_id=student_id,
            subject_id=sub_id,
            topic_id=topic_id,
            study_date=old_date,
            duration_minutes=60,
            notes="Old study log notes"
        )
        new_log = StudyLog(
            student_id=student_id,
            subject_id=sub_id,
            topic_id=topic_id,
            study_date=new_date,
            duration_minutes=45,
            notes="New study log notes"
        )
        db.session.add(old_log)
        db.session.add(new_log)

        # Create old and new quiz attempts
        # First create a quiz
        quiz = Quiz(subject_id=sub_id, title="WWII History Quiz", difficulty="Medium")
        db.session.add(quiz)
        db.session.commit() # save to generate quiz_id
        quiz_id = quiz.quiz_id

        now = datetime.datetime.utcnow()
        old_time = now - datetime.timedelta(days=366)
        new_time = now - datetime.timedelta(days=100)

        old_attempt = QuizAttempt(
            student_id=student_id,
            quiz_id=quiz_id,
            score=75.0,
            attempt_date=old_time
        )
        new_attempt = QuizAttempt(
            student_id=student_id,
            quiz_id=quiz_id,
            score=90.0,
            attempt_date=new_time
        )
        db.session.add(old_attempt)
        db.session.add(new_attempt)
        db.session.commit()

        # Check they exist in DB
        self.assertEqual(StudyLog.query.filter_by(student_id=student_id).count(), 2)
        self.assertEqual(QuizAttempt.query.filter_by(student_id=student_id).count(), 2)

        # Run purging query logic
        cutoff_datetime = datetime.datetime.utcnow() - datetime.timedelta(days=365)
        cutoff_date = datetime.date.today() - datetime.timedelta(days=365)
        
        StudyLog.query.filter(StudyLog.study_date < cutoff_date).delete()
        QuizAttempt.query.filter(QuizAttempt.attempt_date < cutoff_datetime).delete()
        db.session.commit()

        # Verify old records are deleted, new records remain
        self.assertEqual(StudyLog.query.filter_by(student_id=student_id).count(), 1)
        self.assertEqual(StudyLog.query.filter_by(student_id=student_id).first().duration_minutes, 45)

        self.assertEqual(QuizAttempt.query.filter_by(student_id=student_id).count(), 1)
        self.assertEqual(QuizAttempt.query.filter_by(student_id=student_id).first().score, 90.0)

if __name__ == '__main__':
    unittest.main()

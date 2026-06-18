import unittest
import json
from app import create_app
from database import db
from models import User, Subject, Unit, Topic, Quiz, Question, QuizAttempt, TopicProgress
from config import Config

class TestConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    TESTING = True
    JWT_SECRET_KEY = 'test-secret-key-that-is-at-least-thirty-two-bytes-long'

class TestQuizAndProgressAPI(unittest.TestCase):
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
        resp = self.client.post('/api/subjects', data=json.dumps({"subject_name": "Operating Systems"}), content_type='application/json', headers=teacher_headers)
        self.subject_id = json.loads(resp.data)['subject_id']

        resp = self.client.post(f'/api/subjects/{self.subject_id}/units', data=json.dumps({"unit_name": "Processes"}), content_type='application/json', headers=teacher_headers)
        self.unit_id = json.loads(resp.data)['unit_id']

        resp = self.client.post(f'/api/subjects/units/{self.unit_id}/topics', data=json.dumps({"topic_name": "Scheduling"}), content_type='application/json', headers=teacher_headers)
        self.topic1_id = json.loads(resp.data)['topic_id']

        resp = self.client.post(f'/api/subjects/units/{self.unit_id}/topics', data=json.dumps({"topic_name": "Deadlocks"}), content_type='application/json', headers=teacher_headers)
        self.topic2_id = json.loads(resp.data)['topic_id']

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_quiz_lifecycle_and_security(self):
        """Verify quiz creation, question building, anti-cheat security, attempts, scoring, and history stats"""
        teacher_headers = {'Authorization': f'Bearer {self.teacher_token}'}
        student_headers = {'Authorization': f'Bearer {self.student_token}'}

        # 1. Create a Quiz
        resp = self.client.post('/api/quizzes', data=json.dumps({
            "subject_id": self.subject_id,
            "title": "Process Scheduling Basics",
            "difficulty": "Easy"
        }), content_type='application/json', headers=teacher_headers)
        self.assertEqual(resp.status_code, 201)
        quiz_id = json.loads(resp.data)['quiz_id']

        # 2. Add Questions
        q1_payload = {
            "question_text": "What does FIFO stand for?",
            "option_a": "First In First Out",
            "option_b": "Fast Input Fast Output",
            "option_c": "File Input File Output",
            "option_d": "None of the above",
            "correct_answer": "A"
        }
        resp = self.client.post(f'/api/quizzes/{quiz_id}/questions', data=json.dumps(q1_payload), content_type='application/json', headers=teacher_headers)
        self.assertEqual(resp.status_code, 201)
        q1_id = json.loads(resp.data)['question_id']

        q2_payload = {
            "question_text": "Is round robin scheduling pre-emptive?",
            "option_a": "No",
            "option_b": "Yes",
            "option_c": "Sometimes",
            "option_d": "Depends on OS",
            "correct_answer": "B"
        }
        resp = self.client.post(f'/api/quizzes/{quiz_id}/questions', data=json.dumps(q2_payload), content_type='application/json', headers=teacher_headers)
        self.assertEqual(resp.status_code, 201)
        q2_id = json.loads(resp.data)['question_id']

        # 3. Retrieve Quiz details as Student (Anti-cheat test: verify correct_answer is omitted!)
        resp = self.client.get(f'/api/quizzes/{quiz_id}', headers=student_headers)
        self.assertEqual(resp.status_code, 200)
        quiz_details = json.loads(resp.data)
        self.assertEqual(len(quiz_details['questions']), 2)
        
        # Omission assertion
        for q in quiz_details['questions']:
            self.assertNotIn('correct_answer', q)

        # 4. Student attempts Quiz
        attempt_payload = {
            "answers": {
                str(q1_id): "A",  # Correct
                str(q2_id): "A"   # Incorrect (Correct was B)
            }
        }
        resp = self.client.post(f'/api/quizzes/{quiz_id}/attempt', data=json.dumps(attempt_payload), content_type='application/json', headers=student_headers)
        self.assertEqual(resp.status_code, 201)
        attempt_result = json.loads(resp.data)
        self.assertEqual(attempt_result['score'], 50.0)
        self.assertEqual(attempt_result['correct_count'], 1)
        self.assertEqual(attempt_result['total_questions'], 2)

        # 5. Fetch Quiz History
        resp = self.client.get('/api/quizzes/attempts', headers=student_headers)
        attempts_list = json.loads(resp.data)
        self.assertEqual(len(attempts_list), 1)
        self.assertEqual(attempts_list[0]['score'], 50.0)

        # 6. Fetch Quiz Stats Trend
        resp = self.client.get('/api/quizzes/attempts/stats', headers=student_headers)
        stats = json.loads(resp.data)
        self.assertEqual(stats['quiz_average'], 50.0)
        self.assertEqual(stats['total_attempts'], 1)

    def test_progress_tracking_analytics(self):
        """Verify syllabus topic completion percentages (Module 4)"""
        student_headers = {'Authorization': f'Bearer {self.student_token}'}

        # 1. Fetch initial progress -> should show 0%
        resp = self.client.get('/api/analytics/progress', headers=student_headers)
        self.assertEqual(resp.status_code, 200)
        progress = json.loads(resp.data)
        self.assertEqual(progress['overall_progress']['completion_percentage'], 0.0)
        self.assertEqual(progress['subjects_progress'][0]['completion_percentage'], 0.0)
        self.assertEqual(progress['subjects_progress'][0]['units'][0]['completion_percentage'], 0.0)

        # 2. Student completes topic 1 (out of 2 topics)
        self.client.post(f'/api/subjects/topics/{self.topic1_id}/progress', data=json.dumps({"status": "completed"}), content_type='application/json', headers=student_headers)

        # 3. Fetch progress -> should show 50%
        resp = self.client.get('/api/analytics/progress', headers=student_headers)
        progress = json.loads(resp.data)
        self.assertEqual(progress['overall_progress']['completion_percentage'], 50.0)
        self.assertEqual(progress['subjects_progress'][0]['completion_percentage'], 50.0)
        self.assertEqual(progress['subjects_progress'][0]['units'][0]['completion_percentage'], 50.0)

        # 4. Student completes topic 2
        self.client.post(f'/api/subjects/topics/{self.topic2_id}/progress', data=json.dumps({"status": "completed"}), content_type='application/json', headers=student_headers)

        # 5. Fetch progress -> should show 100%
        resp = self.client.get('/api/analytics/progress', headers=student_headers)
        progress = json.loads(resp.data)
        self.assertEqual(progress['overall_progress']['completion_percentage'], 100.0)
        self.assertEqual(progress['subjects_progress'][0]['completion_percentage'], 100.0)
        self.assertEqual(progress['subjects_progress'][0]['units'][0]['completion_percentage'], 100.0)

if __name__ == '__main__':
    unittest.main()

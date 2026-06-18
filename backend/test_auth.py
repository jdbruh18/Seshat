import unittest
import json
from app import create_app
from database import db
from models import User, Student, Teacher
from config import Config

class TestConfig(Config):
    # Use in-memory SQLite database for fast, isolated testing
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    TESTING = True
    JWT_SECRET_KEY = 'test-secret-key-that-is-at-least-thirty-two-bytes-long'

class TestAuthenticationAPI(unittest.TestCase):
    def setUp(self):
        # Create app with testing configurations
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_health_check(self):
        """Test API Health check route"""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')

    def test_register_student_validation(self):
        """Test student registration requirements and fields"""
        # Missing semester/institution/course
        payload = {
            "email": "student@test.com",
            "password": "Password123",
            "full_name": "Test Student",
            "role": "student"
        }
        response = self.client.post('/api/auth/register', 
                                    data=json.dumps(payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400) # Bad Request

        # Password validation check (weak password)
        payload = {
            "email": "student@test.com",
            "password": "123",
            "full_name": "Test Student",
            "role": "student",
            "institution": "MIT",
            "course": "MCA"
        }
        response = self.client.post('/api/auth/register', 
                                    data=json.dumps(payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)

        # Successful registration
        payload["password"] = "SecurePassword1"
        response = self.client.post('/api/auth/register', 
                                    data=json.dumps(payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        # Verify db insertion
        user = User.query.filter_by(email="student@test.com").first()
        self.assertIsNotNone(user)
        self.assertEqual(user.role, 'student')
        self.assertEqual(user.student.institution, 'MIT')

    def test_register_teacher_validation(self):
        """Test teacher registration and department check"""
        payload = {
            "email": "teacher@test.com",
            "password": "TeacherPassword1",
            "full_name": "Test Teacher",
            "role": "teacher",
            "department": "AI & ML"
        }
        response = self.client.post('/api/auth/register', 
                                    data=json.dumps(payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 201)

        user = User.query.filter_by(email="teacher@test.com").first()
        self.assertIsNotNone(user)
        self.assertEqual(user.teacher.department, 'AI & ML')

    def test_duplicate_email_prevention(self):
        """Test that registering two users with same email fails"""
        payload = {
            "email": "duplicate@test.com",
            "password": "Password123",
            "full_name": "User One",
            "role": "admin"
        }
        response = self.client.post('/api/auth/register', 
                                    data=json.dumps(payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 201)

        # Register again
        payload["full_name"] = "User Two"
        response = self.client.post('/api/auth/register', 
                                    data=json.dumps(payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 409) # Conflict

    def test_login_and_jwt_profile(self):
        """Test login returns token and profile can be fetched and updated"""
        # Register a student
        reg_payload = {
            "email": "testuser@gmail.com",
            "password": "Password99",
            "full_name": "John Doe",
            "role": "student",
            "institution": "Stanford",
            "course": "CS",
            "semester": 2
        }
        self.client.post('/api/auth/register', 
                         data=json.dumps(reg_payload),
                         content_type='application/json')

        # Login
        login_payload = {
            "email": "testuser@gmail.com",
            "password": "Password99"
        }
        response = self.client.post('/api/auth/login', 
                                    data=json.dumps(login_payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        login_data = json.loads(response.data)
        token = login_data['token']
        self.assertIsNotNone(token)

        # Get profile with JWT
        headers = {'Authorization': f'Bearer {token}'}
        profile_response = self.client.get('/api/auth/profile', headers=headers)
        self.assertEqual(profile_response.status_code, 200)
        profile_data = json.loads(profile_response.data)
        self.assertEqual(profile_data['full_name'], 'John Doe')
        self.assertEqual(profile_data['student_details']['course'], 'CS')

        # Update profile
        update_payload = {
            "full_name": "John Updated",
            "course": "AI & ML",
            "semester": 3
        }
        update_response = self.client.put('/api/auth/profile', 
                                           data=json.dumps(update_payload),
                                           content_type='application/json',
                                           headers=headers)
        self.assertEqual(update_response.status_code, 200)
        
        # Verify changes in DB
        user = User.query.filter_by(email="testuser@gmail.com").first()
        self.assertEqual(user.full_name, 'John Updated')
        self.assertEqual(user.student.course, 'AI & ML')
        self.assertEqual(user.student.semester, 3)

if __name__ == '__main__':
    unittest.main()

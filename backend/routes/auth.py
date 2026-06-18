import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from database import db
from models import User, Student, Teacher, hash_password, check_password

auth_bp = Blueprint('auth', __name__)

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

def is_valid_email(email):
    return re.match(EMAIL_REGEX, email) is not None

def is_strong_password(password):
    # Min 6 characters, at least 1 letter and 1 number
    if len(password) < 6:
        return False
    if not any(c.isalpha() for c in password):
        return False
    if not any(c.isdigit() for c in password):
        return False
    return True

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    # Validation
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    full_name = data.get('full_name', '').strip()
    role = data.get('role', '').strip().lower()
    
    if not email or not password or not full_name or not role:
        return jsonify({'message': 'Missing required fields: email, password, full_name, and role.'}), 400
        
    if len(full_name) < 2 or len(full_name) > 80:
        return jsonify({'message': 'Full name must be between 2 and 80 characters.'}), 400

    if len(email) > 100 or not is_valid_email(email):
        return jsonify({'message': 'Invalid email format or email exceeds 100 characters.'}), 400
        
    if len(password) > 50 or not is_strong_password(password):
        return jsonify({'message': 'Password must be at least 6 characters (max 50) and contain both letters and numbers.'}), 400

    if role not in ['student', 'teacher', 'admin']:
        return jsonify({'message': 'Invalid role. Must be student, teacher, or admin.'}), 400
        
    # Role Specific Validation (Do this before database operations to prevent partial inserts)
    institution = ""
    course = ""
    semester = 1
    department = ""

    if role == 'student':
        institution = data.get('institution', '').strip()
        course = data.get('course', '').strip()
        try:
            semester = int(data.get('semester', 1))
        except ValueError:
            return jsonify({'message': 'Semester must be an integer.'}), 400
            
        if not institution or not course:
            return jsonify({'message': 'Students require institution and course fields.'}), 400
            
        if len(institution) > 150 or len(course) > 100:
            return jsonify({'message': 'Institution (max 150) or course (max 100) length exceeded.'}), 400

    elif role == 'teacher':
        department = data.get('department', '').strip()
        if not department:
            return jsonify({'message': 'Teachers require a department field.'}), 400
            
        if len(department) > 100:
            return jsonify({'message': 'Department length exceeded (max 100).'}), 400

    # Check duplicate
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'A user with this email already exists.'}), 409

    try:
        # Create User
        new_user = User(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role=role
        )
        db.session.add(new_user)
        db.session.flush() # Flush to get new_user.user_id

        # Role Specific Records
        if role == 'student':
            student = Student(
                user_id=new_user.user_id,
                institution=institution,
                course=course,
                semester=semester
            )
            db.session.add(student)

        elif role == 'teacher':
            teacher = Teacher(
                user_id=new_user.user_id,
                department=department
            )
            db.session.add(teacher)

        db.session.commit()
        return jsonify({'message': 'Registration successful.', 'user': new_user.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'message': 'Missing email or password.'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not check_password(password, user.password_hash):
        return jsonify({'message': 'Invalid email or password.'}), 401
        
    # Get role details if student or teacher
    role_id = None
    if user.role == 'student' and user.student:
        role_id = user.student.student_id
    elif user.role == 'teacher' and user.teacher:
        role_id = user.teacher.teacher_id
        
    # Create JWT
    # We include user_id as a string in identity
    access_token = create_access_token(identity=str(user.user_id))
    
    user_dict = user.to_dict()
    if user.role == 'student' and user.student:
        user_dict['student_id'] = user.student.student_id
    elif user.role == 'teacher' and user.teacher:
        user_dict['teacher_id'] = user.teacher.teacher_id
        
    return jsonify({
        'token': access_token,
        'user': user_dict
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # In token-based (bearer token) auth, client destroys token.
    # We return success for consistency.
    return jsonify({'message': 'Logout successful.'}), 200

@auth_bp.route('/google', methods=['POST'])
def google_login():
    data = request.get_json() or {}
    id_token = data.get('id_token')
    if not id_token:
        return jsonify({'message': 'Missing Google ID token.'}), 400

    # In production, we verify using Google oauth library:
    # idinfo = id_token.verify_oauth2_token(id_token, requests.Request(), CLIENT_ID)
    # email = idinfo['email']
    # name = idinfo['name']
    
    # Mock Google identity verification and auto-provisioning
    mock_email = "google_student@test.com"
    user = User.query.filter_by(email=mock_email).first()
    
    if not user:
        try:
            # Auto-provision a default Student account for the Google OAuth identity
            user = User(
                full_name="Google Scholar",
                email=mock_email,
                password_hash=hash_password("GoogleOAuthPass1"),
                role="student"
            )
            db.session.add(user)
            db.session.flush()

            student = Student(
                user_id=user.user_id,
                institution="Google Cloud Academy",
                course="Computer Science",
                semester=1
            )
            db.session.add(student)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Google auto-provisioning failed: {str(e)}'}), 500

    access_token = create_access_token(identity=str(user.user_id))
    user_dict = user.to_dict()
    user_dict['student_id'] = user.student.student_id

    return jsonify({
        'token': access_token,
        'user': user_dict
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'message': 'User not found.'}), 404
        
    res = user.to_dict()
    if user.role == 'student' and user.student:
        res['student_details'] = user.student.to_dict()
    elif user.role == 'teacher' and user.teacher:
        res['teacher_details'] = user.teacher.to_dict()
        
    return jsonify(res), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'message': 'User not found.'}), 404
        
    data = request.get_json() or {}
    
    # Update base fields
    full_name = data.get('full_name', '').strip()
    if full_name:
        user.full_name = full_name
        
    # Update password if requested
    password = data.get('password', '')
    if password:
        if not is_strong_password(password):
            return jsonify({'message': 'Password must be at least 6 characters and contain both letters and numbers.'}), 400
        user.password_hash = hash_password(password)
        
    # Update role-specific fields
    if user.role == 'student' and user.student:
        institution = data.get('institution', '').strip()
        course = data.get('course', '').strip()
        semester = data.get('semester')
        
        if institution:
            user.student.institution = institution
        if course:
            user.student.course = course
        if semester is not None:
            try:
                user.student.semester = int(semester)
            except ValueError:
                return jsonify({'message': 'Semester must be an integer.'}), 400
                
    elif user.role == 'teacher' and user.teacher:
        department = data.get('department', '').strip()
        if department:
            user.teacher.department = department
            
    try:
        db.session.commit()
        
        res = user.to_dict()
        if user.role == 'student' and user.student:
            res['student_details'] = user.student.to_dict()
        elif user.role == 'teacher' and user.teacher:
            res['teacher_details'] = user.teacher.to_dict()
            
        return jsonify({'message': 'Profile updated successfully.', 'user': res}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Profile update failed: {str(e)}'}), 500

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    user_id = int(get_jwt_identity())
    admin_user = db.session.get(User, user_id)
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Unauthorized. Admin role required.'}), 403

    users = User.query.all()
    res = []
    for u in users:
        u_data = u.to_dict()
        if u.role == 'student' and u.student:
            u_data['details'] = f"{u.student.course}, Sem {u.student.semester} ({u.student.institution})"
        elif u.role == 'teacher' and u.teacher:
            u_data['details'] = f"Dept: {u.teacher.department}"
        else:
            u_data['details'] = "System Administrator"
        res.append(u_data)
        
    return jsonify(res), 200

@auth_bp.route('/users/<int:target_user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(target_user_id):
    user_id = int(get_jwt_identity())
    admin_user = db.session.get(User, user_id)
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Unauthorized.'}), 403

    if user_id == target_user_id:
        return jsonify({'message': 'You cannot delete your own admin account.'}), 400

    user_to_delete = db.session.get(User, target_user_id)
    if not user_to_delete:
        return jsonify({'message': 'User not found.'}), 404

    try:
        db.session.delete(user_to_delete)
        db.session.commit()
        return jsonify({'message': 'User account deleted successfully.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete user: {str(e)}'}), 500

import sys
import os
import json
import logging

# Save the true stdout for JSON-RPC communication
original_stdout = sys.stdout
# Redirect default stdout to stderr so prints/warnings from imports/libraries go to stderr (ignored by MCP client)
sys.stdout = sys.stderr

# Set up logging to a file so it doesn't interfere with stdio
log_file = os.path.join(os.path.dirname(__file__), 'mcp_server.log')
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Add backend directory to system path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

try:
    from app import create_app
    from database import db
    from models import User, Student, StudyLog, Prediction, Teacher, QuizAttempt
    logging.info("Backend imports successful.")
except Exception as e:
    logging.error(f"Failed to import backend modules: {e}")
    sys.exit(1)

# Initialize Flask App
flask_app = create_app()

def handle_get_student_study_stats(arguments):
    email = arguments.get("email")
    if not email:
        return {"isError": True, "content": [{"type": "text", "text": "Email is required."}]}
    
    user = User.query.filter_by(email=email).first()
    if not user or user.role != 'student' or not user.student:
        return {"isError": True, "content": [{"type": "text", "text": f"No student found with email {email}."}]}
    
    student = user.student
    logs = StudyLog.query.filter_by(student_id=student.student_id).all()
    
    total_minutes = sum(log.duration_minutes for log in logs)
    subject_hours = {}
    for log in logs:
        sub_name = log.subject.subject_name if log.subject else "Unknown"
        subject_hours[sub_name] = subject_hours.get(sub_name, 0) + log.duration_minutes
        
    subject_breakdown = {sub: round(mins / 60.0, 2) for sub, mins in subject_hours.items()}
    
    stats = {
        "student_name": user.full_name,
        "email": user.email,
        "institution": student.institution,
        "course": student.course,
        "semester": student.semester,
        "total_study_hours": round(total_minutes / 60.0, 2),
        "subject_breakdown_hours": subject_breakdown,
        "total_sessions_logged": len(logs)
    }
    
    return {
        "content": [{"type": "text", "text": json.dumps(stats, indent=2)}]
    }

def handle_get_student_predictions(arguments):
    email = arguments.get("email")
    if not email:
        return {"isError": True, "content": [{"type": "text", "text": "Email is required."}]}
    
    user = User.query.filter_by(email=email).first()
    if not user or user.role != 'student' or not user.student:
        return {"isError": True, "content": [{"type": "text", "text": f"No student found with email {email}."}]}
    
    student = user.student
    predictions = Prediction.query.filter_by(student_id=student.student_id).order_by(Prediction.generated_at.desc()).all()
    
    if not predictions:
        return {
            "content": [{"type": "text", "text": f"No academic performance predictions generated yet for {user.full_name}."}]
        }
        
    latest = predictions[0]
    result = {
        "student_name": user.full_name,
        "predicted_score": latest.predicted_score,
        "predicted_grade": latest.predicted_grade,
        "generated_at": latest.generated_at.isoformat(),
        "history": [
            {"score": p.predicted_score, "grade": p.predicted_grade, "date": p.generated_at.isoformat()}
            for p in predictions[1:5]
        ]
    }
    
    return {
        "content": [{"type": "text", "text": json.dumps(result, indent=2)}]
    }

def handle_get_classroom_analytics(arguments):
    teacher_email = arguments.get("teacher_email")
    if not teacher_email:
        return {"isError": True, "content": [{"type": "text", "text": "Teacher email is required."}]}
        
    user = User.query.filter_by(email=teacher_email).first()
    if not user or user.role != 'teacher' or not user.teacher:
        return {"isError": True, "content": [{"type": "text", "text": f"No teacher found with email {teacher_email}."}]}
        
    # Get all students
    students = Student.query.all()
    if not students:
        return {
            "content": [{"type": "text", "text": "No students registered in the system yet."}]
        }
        
    total_students = len(students)
    
    # Calculate averages
    total_study_minutes = 0
    total_quiz_score_sum = 0
    total_quiz_count = 0
    predicted_score_sum = 0
    predicted_count = 0
    
    for s in students:
        logs = StudyLog.query.filter_by(student_id=s.student_id).all()
        total_study_minutes += sum(l.duration_minutes for l in logs)
        
        attempts = QuizAttempt.query.filter_by(student_id=s.student_id).all()
        if attempts:
            total_quiz_score_sum += sum(a.score for a in attempts)
            total_quiz_count += len(attempts)
            
        pred = Prediction.query.filter_by(student_id=s.student_id).order_by(Prediction.generated_at.desc()).first()
        if pred:
            predicted_score_sum += pred.predicted_score
            predicted_count += 1
            
    avg_study_hours = round((total_study_minutes / 60.0) / total_students, 2)
    avg_quiz_score = round(total_quiz_score_sum / total_quiz_count, 2) if total_quiz_count > 0 else 0.0
    avg_predicted_score = round(predicted_score_sum / predicted_count, 2) if predicted_count > 0 else 0.0
    
    analytics = {
        "teacher_name": user.full_name,
        "department": user.teacher.department,
        "total_students": total_students,
        "average_study_hours_per_student": avg_study_hours,
        "average_quiz_score_percent": avg_quiz_score,
        "average_predicted_exam_score": avg_predicted_score
    }
    
    return {
        "content": [{"type": "text", "text": json.dumps(analytics, indent=2)}]
    }

TOOLS = [
    {
        "name": "get_student_study_stats",
        "description": "Fetches study hours and subject breakdown for a specific student.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "email": {"type": "string", "description": "The student email address to look up."}
            },
            "required": ["email"]
        }
    },
    {
        "name": "get_student_predictions",
        "description": "Retrieves the ML academic grade and performance predictions for a student.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "email": {"type": "string", "description": "The student email address to look up."}
            },
            "required": ["email"]
        }
    },
    {
        "name": "get_classroom_analytics",
        "description": "Computes classroom aggregate analytics including average study hours and exam scores.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "teacher_email": {"type": "string", "description": "The teacher's email address to authenticate/verify access."}
            },
            "required": ["teacher_email"]
        }
    }
]

def main():
    logging.info("Starting local MCP stdio server...")
    
    with flask_app.app_context():
        try:
            for line in sys.stdin:
                line = line.strip()
                if not line:
                    continue
                    
                logging.info(f"Received message: {line}")
                try:
                    request = json.loads(line)
                except Exception as e:
                    logging.error(f"Malformed JSON request: {e}")
                    continue
                
                # Check JSON-RPC 2.0 structure
                if not isinstance(request, dict) or "jsonrpc" not in request:
                    continue
                    
                method = request.get("method")
                req_id = request.get("id")
                
                # Handle initialize
                if method == "initialize":
                    response = {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "protocolVersion": "2024-11-05",
                            "capabilities": {
                                "tools": {}
                            },
                            "serverInfo": {
                                "name": "AcademicAssistantServer",
                                "version": "1.0.0"
                            }
                        }
                    }
                    original_stdout.write(json.dumps(response) + "\n")
                    original_stdout.flush()
                    logging.info("Sent initialize response.")
                    
                # Handle initialized notification
                elif method == "notifications/initialized":
                    logging.info("Client successfully initialized MCP session.")
                    
                # Handle tools/list
                elif method == "tools/list":
                    response = {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "tools": TOOLS
                        }
                    }
                    original_stdout.write(json.dumps(response) + "\n")
                    original_stdout.flush()
                    logging.info("Sent tools/list response.")
                    
                # Handle tools/call
                elif method == "tools/call":
                    params = request.get("params", {})
                    tool_name = params.get("name")
                    arguments = params.get("arguments", {})
                    
                    logging.info(f"Calling tool: {tool_name} with args {arguments}")
                    
                    if tool_name == "get_student_study_stats":
                        result = handle_get_student_study_stats(arguments)
                    elif tool_name == "get_student_predictions":
                        result = handle_get_student_predictions(arguments)
                    elif tool_name == "get_classroom_analytics":
                        result = handle_get_classroom_analytics(arguments)
                    else:
                        result = {
                            "isError": True,
                            "content": [{"type": "text", "text": f"Tool '{tool_name}' not found."}]
                        }
                        
                    response = {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": result
                    }
                    original_stdout.write(json.dumps(response) + "\n")
                    original_stdout.flush()
                    logging.info(f"Sent tools/call response for {tool_name}.")
                else:
                    if req_id is not None:
                        response = {
                            "jsonrpc": "2.0",
                            "id": req_id,
                            "error": {
                                "code": -32601,
                                "message": f"Method '{method}' not found."
                            }
                        }
                        original_stdout.write(json.dumps(response) + "\n")
                        original_stdout.flush()
        except KeyboardInterrupt:
            logging.info("MCP server shutting down due to interrupt.")
        except Exception as e:
            logging.error(f"Error in main server loop: {e}")

if __name__ == '__main__':
    main()

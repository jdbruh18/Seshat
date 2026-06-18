-- Database Schema for Self-Learning AI Academic Assistant
-- Designed for MySQL

CREATE DATABASE IF NOT EXISTS academic_assistant;
USE academic_assistant;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'student', 'teacher', 'admin'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    institution VARCHAR(150) NOT NULL,
    course VARCHAR(100) NOT NULL,
    semester INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Units Table
CREATE TABLE IF NOT EXISTS units (
    unit_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    unit_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Topics Table
CREATE TABLE IF NOT EXISTS topics (
    topic_id INT AUTO_INCREMENT PRIMARY KEY,
    unit_id INT NOT NULL,
    topic_name VARCHAR(100) NOT NULL,
    description TEXT,
    estimated_hours FLOAT DEFAULT 1.0,
    difficulty_level VARCHAR(20) DEFAULT 'Medium', -- 'Easy', 'Medium', 'Hard'
    FOREIGN KEY (unit_id) REFERENCES units(unit_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. TopicProgress Table
CREATE TABLE IF NOT EXISTS topic_progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    topic_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed'
    completion_date DATETIME NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. StudyLogs Table
CREATE TABLE IF NOT EXISTS study_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    topic_id INT NOT NULL,
    study_date DATE NOT NULL,
    duration_minutes INT NOT NULL,
    notes TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE RESTRICT,
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'Medium',
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_answer VARCHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D'
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. QuizAttempts Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    attempt_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    quiz_id INT NOT NULL,
    score FLOAT NOT NULL,
    attempt_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    recommendation_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    recommendation_text TEXT NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    prediction_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    predicted_score FLOAT NOT NULL,
    predicted_grade VARCHAR(2) NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

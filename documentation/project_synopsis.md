# Academic Project Synopsis & Viva Presentation Guide

This document provides a formal **Project Synopsis** as required for university submissions (MCA/M.Tech/B.Tech) and a strategic **Walkthrough Guide** on how to explain the project to examiners during your viva.

---

# PART 1: FORMAL PROJECT SYNOPSIS

## 1. Project Title
**Self-Learning AI Academic Assistant for Student Performance Analysis and Personalized Study Recommendations**

## 2. Introduction & Background
In modern education, students often struggle to maintain consistency, track their syllabus completion, and identify their academic weaknesses early enough to prevent poor exam results. Traditional learning management systems (LMS) act only as passive storage for notes. 

This project proposes an active, self-learning AI academic assistant that bridges this gap. By combining personal study logging, automated progress tracking, mock assessments, rule-based expert systems (recommendations), and machine learning models (exam predictions), it provides a complete closed-loop feedback system to help students maximize their academic outcomes.

## 3. Problem Statement
Many students face academic failure or underperformance because:
1.  **Lack of early warnings**: They do not realize they are failing a course until the final exam results are declared.
2.  **Syllabus mismanagement**: They do not track how much of the syllabus has actually been completed.
3.  **Inconsistent study habits**: Without streaks and tracking, consistency drops.
4.  **Generic advice**: Students do not receive personalized recommendations on which topics to study next based on their unique performance.

## 4. Objectives of the Proposed System
*   To design a student-centric system to monitor curriculum/syllabus completion at a granular level (Subject $\rightarrow$ Unit $\rightarrow$ Topic).
*   To implement a study tracking utility to log session duration, subject, and topic associations.
*   To design a mock quiz environment that evaluates student comprehension without letting students cheat (hiding keys in transit).
*   To build an AI advisory system using expert rules that triggers personalized warnings and focus areas.
*   To implement a Machine Learning Regressor (Random Forest) that reads study hours, quiz averages, and completion levels to project final exam marks and letter grades.
*   To provide separate dashboards for students (personal insights), teachers (class average, weak topics), and admins (system maintenance).

## 5. System Modules Description

### Module 1: Authentication & RBAC (Role-Based Access Control)
*   **Description**: Handles secure registration and login using JWT. Separates users into Students, Teachers, and Administrators.
*   **Key Tech**: Flask-JWT-Extended, BCrypt hashing.

### Module 2: Course & Syllabus Builder
*   **Description**: Allows teachers and admins to build a hierarchal database of Subjects, Units, and Topics. Students can check off topics to mark them completed.
*   **Key Tech**: Recursive relational SQL tables.

### Module 3: Study Tracker
*   **Description**: Logs student study sessions (Date, Duration, Notes, linked Subject and Topic). Aggregates data into daily, weekly, and monthly totals.
*   **Key Tech**: Relational keys mapping study logs to topics.

### Module 4: Anti-Cheat Quiz Engine
*   **Description**: Renders multiple-choice questions (MCQs) for students. The API excludes answers in transit to prevent client-side inspection. Once submitted, the backend grades the attempt and stores the score.
*   **Key Tech**: Secure API payloads, relational attempts mapping.

### Module 5: Expert Advisory (Recommendation) System
*   **Description**: Evaluates database records to issue recommendations, e.g., identifying low quiz score areas, reminding inactive students, and highlighting incomplete modules.
*   **Key Tech**: Heuristics, date differences, and query filters.

### Module 6: ML Performance Predictor
*   **Description**: Runs inference using a trained Random Forest Regressor to project exam percentage (0-100) and letter grade (A, B, C, D, F).
*   **Key Tech**: Scikit-Learn, Pandas dataframes, Joblib serialization.

---

## 6. Technical Specifications

### Hardware Requirements
*   **Processor**: Intel i3/i5/i7 or AMD Ryzen 3/5/7 (Minimum 1.6 GHz)
*   **RAM**: 4 GB (8 GB Recommended for running local React + Flask environments)
*   **Storage**: 500 MB free space (for virtual environments and databases)

### Software Requirements
*   **Operating System**: Windows 10/11, macOS, or Linux (Ubuntu/Debian)
*   **Programming Languages**: Python 3.8+, JavaScript (ES6+)
*   **Frameworks**: Flask (Backend), React (Frontend)
*   **Database**: SQLite (Zero-configuration dev) or MySQL 8.0+
*   **Libraries**: Scikit-Learn, Pandas, NumPy, SQLAlchemy, Axios, Tailwind CSS

---

# PART 2: HOW TO EXPLAIN THE PROJECT TO EXAMINERS (VIVA GUIDE)

Examiners usually evaluate students on **clarity of concepts**, **database design**, **algorithm choices**, and **live system workflows**. Use these guides based on your slot duration.

---

## ⏱️ The 2-Minute Explanation (Elevator Pitch)
> "Good morning, respected examiners. My project is a **Self-Learning AI Academic Assistant**. 
>
> In universities, students often struggle to track their syllabus coverage and don't know if they are going to perform poorly until it's too late. To solve this, my system has three pillars:
> 1.  **Granular Progress Tracking**: Students check off syllabus topics and log study sessions, giving them a real-time progress bar.
> 2.  **Anti-Cheat Quiz Engine**: Students take mock exams, and the backend grades their answers securely.
> 3.  **Machine Learning Performance Predictor**: We trained a **Random Forest Regressor** on 1,000 synthetic student records. By looking at a student's total study hours, quiz averages, and syllabus completion rate, the model predicts their final exam percentage and letter grade.
>
> If they are falling behind, our **AI Recommendation Engine** automatically flags weak subjects and outputs custom study advice. The project has unique portals for Students (logs and predictions), Teachers (managing courses and seeing weak class areas), and Admins (deleting/managing accounts)."

---

## ⏱️ The 5-Minute Explanation (Detailed System Walkthrough)
1.  **The Architecture (1 Min)**: 
    *   Explain that the project uses a modern **decoupled full-stack design**.
    *   The frontend is built on **React (Vite)** with Tailwind CSS for glassmorphism styling, and uses Axios with a JWT token interceptor.
    *   The backend is a **Flask REST API** with SQLAlchemy ORM, which connects to **SQLite** (by default for zero-setup grading) but can switch to **MySQL** by toggling a single flag in `config.py`.
2.  **The Database Integrity (1 Min)**:
    *   Show that the DB has 13 relational tables (Users, Students, Teachers, Subjects, Units, Topics, TopicProgress, StudyLogs, Quizzes, Questions, QuizAttempts, Predictions, Recommendations).
    *   Highlight **Cascade Deletes**: *"All tables are linked with strict foreign key constraints. If a student account is deleted, all their progress, quiz attempts, and predictions are cascade-deleted to prevent database anomalies."*
3.  **The Machine Learning Core (1.5 Min)**:
    *   Explain the model pipeline: *"We generated a synthetic dataset of 1,000 students in `ml/generate_data.py` containing study hours, quiz scores, syllabus completion rates, and exam marks. We trained a **Random Forest Regressor** which achieved an R-squared score of **95.6%** and a Mean Absolute Error of **3.55** marks. We serialize this using joblib and load it on the Flask server."*
    *   Explain how the feature names warning was solved: *"We pass data to the model as named Pandas DataFrames rather than raw NumPy arrays to preserve feature headers and avoid scikit-learn warnings."*
4.  **The AI Advisory Rule Engine (1 Min)**:
    *   Explain that the recommendations are rule-based: *"If a student's average quiz score in a subject is <60%, it recommends revision. If completion is <50%, it flags focus areas. If they are inactive for 3 days, it creates an activity reminder."*
5.  **Role Separation Demo (0.5 Min)**:
    *   Explain that a **Student** sees charts, logs study hours, and requests predictions.
    *   A **Teacher** builds courses, manages quizzes, and checks which topics the class is weak in (under 50% completion).
    *   An **Admin** manages database accounts and deletes profiles.

---

## ⏱️ The 10-Minute Technical Interview (Answering Tough Questions)

If the examiner starts drilling down into code and implementation:

### 1. "Show me how the ML Prediction is connected to the database."
*   **How to answer**: Explain that in `backend/routes/predictions.py`, when a student clicks "Sync", the backend:
    1. Queries the database for total study minutes from `StudyLogs` and converts it to hours.
    2. Computes the syllabus completion percentage from `TopicProgress` (completed vs total topics).
    3. Computes the average score from `QuizAttempts`.
    4. Formulates a DataFrame with headers: `study_hours`, `quiz_average`, `completion_percentage`.
    5. Calls `model.predict(input_df)` to get the final score.
    6. Maps that score to a grade and writes/updates a row in the `predictions` table.
*   **Show code symbol**: Point them to [predict_performance](file:///C:/Users/MSI/.gemini/antigravity/scratch/academic_assistant/backend/routes/predictions.py#L35-L95) in `backend/routes/predictions.py`.

### 2. "How did you prevent students from cheating in the quizzes?"
*   **How to answer**: *"If we return the quiz questions containing the correct answers to the browser, any student can open the Chrome DevTools network tab and see the answer keys. To prevent this, in `backend/routes/quizzes.py` under the `/api/quizzes/<id>/questions` endpoint, we query the database but transform the output list to exclude the `correct_answer` field. The correct answers are kept strictly on the backend, and grading occurs securely on attempt submission."*
*   **Show code symbol**: Point them to [get_quiz_questions](file:///C:/Users/MSI/.gemini/antigravity/scratch/academic_assistant/backend/routes/quizzes.py#L75-L103) in `backend/routes/quizzes.py`.

### 3. "How does the backend authenticate users? How is session state maintained?"
*   **How to answer**: *"We use stateless JWT authentication. In `auth.py`, when credentials match, the server issues a signed token containing the string identity of the `user_id`. The client saves this token in `localStorage`. In React, we use an Axios interceptor in `AuthContext.jsx` that reads the token from local storage and appends it as `Authorization: Bearer <token>` on every API call. This eliminates the need for cookie-based sessions."*
*   **Show code symbol**: Point them to [login](file:///C:/Users/MSI/.gemini/antigravity/scratch/academic_assistant/backend/routes/auth.py#L107-L140) and [AuthContext.jsx](file:///C:/Users/MSI/.gemini/antigravity/scratch/academic_assistant/frontend/src/context/AuthContext.jsx#L11-L21).

### 4. "Why did you use SQLite and MySQL together? Isn't that redundant?"
*   **How to answer**: *"No, it provides deployment flexibility. For actual production, MySQL is preferred. But during an academic viva or grading, configuring a MySQL server, importing SQL dumps, and setting up users is error-prone. By creating a switch `USE_MYSQL` in `config.py` that defaults to `False`, the system automatically provisions an SQLite database file. The database tables are auto-created by Flask-SQLAlchemy on startup, allowing the examiner to run the project with zero database installation."*
*   **Show code symbol**: Point them to [config.py](file:///C:/Users/MSI/.gemini/antigravity/scratch/academic_assistant/backend/config.py) and [app.py:L50-L58](file:///C:/Users/MSI/.gemini/antigravity/scratch/academic_assistant/backend/app.py#L50-L58).

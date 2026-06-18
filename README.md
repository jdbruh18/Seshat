# Seshat: Self-Learning AI Academic Assistant

A complete full-stack web application designed for students, teachers, and administrators to track study activities, monitor syllabus completion, take practice quizzes, analyze learning behavior, predict academic performance using Machine Learning, and receive personalized, rule-based study recommendations.

This project is built specifically as an **MCA (Master of Computer Applications) Artificial Intelligence & Machine Learning academic project**, focusing on clean modularity, simple deployment, and comprehensive viva preparation features.

---

## 🚀 Key Features

*   **Authentication & Role-Based Access Control (RBAC)**: Secure user sign-up/login with specific dashboards for **Students**, **Teachers**, and **Administrators** (using JWT and BCrypt).
*   **Curriculum & Syllabus Builder**: Allows teachers to create/update subjects, units, and topics. Students can check off topics as they complete them to track their syllabus progress.
*   **Study Tracker & Analytics**: A logging tool for study sessions that generates weekly consistency charts, daily/weekly stats, and calculates learning streak metrics.
*   **Interactive MCQ Quiz Engine**: Pre-built mock exams with randomized multiple-choice questions, live timer, and score submission features.
*   **AI Study Advisor (Recommendation Engine)**: A rule-based engine that evaluates student activity (quiz performance, syllabus completion, inactivity) and writes actionable recommendations to the database.
*   **Performance Predictor (Scikit-Learn ML)**: A trained **Random Forest Regressor** model running on the backend that reads the student's study logs and quiz grades to predict their final exam percentage and letter grade.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), Tailwind CSS (sleek dark/glassmorphic theme), Lucide React (icons), Axios (API client), React Router v6.
*   **Backend**: Python, Flask, Flask-SQLAlchemy (ORM), Flask-JWT-Extended, Flask-BCrypt (security), PyMySQL (MySQL driver).
*   **Machine Learning**: Scikit-Learn, Pandas, NumPy, Joblib (Model training & inference).
*   **Database**:
    *   **SQLite** (Default configuration): Enabled for zero-setup execution, ideal for instant grading, evaluation, and offline viva presentations.
    *   **MySQL**: Fully supported with schema definition scripts and driver configuration for deployment.

---

## 📁 Directory Structure

```
academic_assistant/
├── backend/
│   ├── app.py                 # Flask server initialization & blueprint registry
│   ├── config.py              # Configuration manager (SQLite & MySQL toggle)
│   ├── database.py            # SQLAlchemy db instance
│   ├── models.py              # 13 relational database models with Cascade-Deletes
│   ├── requirements.txt       # Backend dependencies
│   ├── routes/
│   │   ├── auth.py            # Authentication, Profile, & User Management routes
│   │   ├── subjects.py        # Subject, Unit, Topic, & Progress builder routes
│   │   ├── study.py           # Study logging & stats calculation routes
│   │   ├── quizzes.py         # Quiz builder, player, & grading routes
│   │   ├── analytics.py       # Dashboards (Student, Teacher, Admin) aggregates
│   │   ├── recommendations.py # Rule-based study suggestions manager
│   │   └── predictions.py     # Random Forest model predictor endpoint
│   └── venv/                  # Python virtual environment (ignored)
├── database/
│   └── schema.sql             # SQL script for manual MySQL execution
├── documentation/
│   └── viva_prep.md           # Viva preparation guide, architecture & ER diagrams
├── frontend/
│   ├── src/
│   │   ├── components/        # ProtectedRoute, Sidebar layout
│   │   ├── context/           # JWT AuthContext
│   │   ├── pages/             # Login, Register, Profile, Dashboards, Quizzes, Tracker
│   │   ├── App.jsx            # React Router configurations
│   │   ├── main.jsx           # App entrypoint
│   │   └── index.css          # Main styling & custom glassmorphism styles
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Port configuration & dev API proxy
└── ml/
    ├── generate_data.py       # Synthetic dataset generator (1000 student rows)
    ├── train_model.py         # Random Forest training & evaluation script
    └── model.pkl              # Saved model binary
```

---

## ⚙️ Installation & Setup

### Prerequisites
*   Python 3.8+
*   Node.js 16+
*   *(Optional)* MySQL Server

### 1. Backend Setup
1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment and activate it:
    *   **Windows**:
        ```bash
        python -m venv venv
        .\venv\Scripts\activate
        ```
    *   **macOS/Linux**:
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  *(Optional)* By default, the app runs on **SQLite** (`database.db` will be auto-created). If you wish to switch to **MySQL**, open `config.py` and modify the credentials block:
    ```python
    # Set to True to use MySQL, False to fall back to SQLite
    USE_MYSQL = False 
    ```
5.  Start the Flask backend server:
    ```bash
    python app.py
    ```
    The backend runs at `http://localhost:5000`.

### 2. Machine Learning Model Training (Optional)
The pre-trained model `ml/model.pkl` is already packaged in the project. If you wish to re-generate the dataset and re-train the model:
1.  Navigate to the `ml` folder.
2.  Run data generation:
    ```bash
    python generate_data.py
    ```
3.  Run model training:
    ```bash
    python train_model.py
    ```

### 3. Frontend Setup
1.  Navigate to the `frontend` directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to `http://localhost:3000`.

---

## 🧪 Verification & Automated Tests

To ensure the backend APIs function correctly, a comprehensive suite of unit tests has been written. To run the automated tests:
1.  Navigate to the `backend` folder and activate the virtual environment.
2.  Execute the following command:
    ```bash
    python -m unittest discover -p "test_*.py"
    ```
    This will run all test suites (Authentication, Subject Builder, Study Logging, Quizzes, Analytics, recommendations, and ML Predictions) and report validation results.

---

## 👥 Default Accounts for Testing

During viva/demonstrations, you can register new accounts using the UI, or use default roles. For testing, registration adapts automatically to the selected role:
*   **Student**: Requires `Institution`, `Course`, and `Semester`.
*   **Teacher**: Requires `Department`.
*   **Admin**: Standard registration fields.

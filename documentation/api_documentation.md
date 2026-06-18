# REST API Documentation

This document provides detailed API specifications for the **Self-Learning AI Academic Assistant** backend server. All routes are prefixed with `/api`.

---

## 1. Authentication Module (`/api/auth`)

### Register User
*   **Endpoint**: `POST /register`
*   **Headers**: `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "email": "student@test.com",
      "password": "Password123",
      "full_name": "John Doe",
      "role": "student",
      "institution": "MIT University",
      "course": "MCA",
      "semester": 2
    }
    ```
    *(For teachers, omit student fields and include `"department": "AI & ML"`)*
*   **Response (201 Created)**:
    ```json
    {
      "message": "Registration successful.",
      "user": {
        "user_id": 1,
        "email": "student@test.com",
        "full_name": "John Doe",
        "role": "student",
        "created_at": "2026-06-15T11:45:00Z"
      }
    }
    ```

### Login User
*   **Endpoint**: `POST /login`
*   **Headers**: `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "email": "student@test.com",
      "password": "Password123"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "user_id": 1,
        "email": "student@test.com",
        "full_name": "John Doe",
        "role": "student",
        "student_id": 1
      }
    }
    ```

### Get Profile
*   **Endpoint**: `GET /profile`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    {
      "user_id": 1,
      "email": "student@test.com",
      "full_name": "John Doe",
      "role": "student",
      "student_details": {
        "student_id": 1,
        "institution": "MIT University",
        "course": "MCA",
        "semester": 2
      }
    }
    ```

### Get All Users (Admin Only)
*   **Endpoint**: `GET /users`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    [
      {
        "user_id": 1,
        "email": "student@test.com",
        "full_name": "John Doe",
        "role": "student",
        "details": "MCA, Sem 2 (MIT University)"
      }
    ]
    ```

### Delete User (Admin Only)
*   **Endpoint**: `DELETE /users/<id>`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    {
      "message": "User account deleted successfully."
    }
    ```

---

## 2. Subject & Syllabus Module (`/api/subjects`)

### List Subjects
*   **Endpoint**: `GET /`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    [
      {
        "subject_id": 1,
        "subject_name": "Machine Learning",
        "description": "Introduction to supervised and unsupervised learning",
        "units": [
          {
            "unit_id": 1,
            "unit_name": "Unit 1: Linear Regression",
            "topics": [
              {
                "topic_id": 1,
                "topic_name": "Least Squares Method",
                "estimated_hours": 2.5,
                "difficulty_level": "Medium",
                "completed": true
              }
            ]
          }
        ]
      }
    ]
    ```

### Create Subject (Teacher/Admin Only)
*   **Endpoint**: `POST /`
*   **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "subject_name": "Artificial Intelligence",
      "description": "Heuristic search, logic, and planning"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "message": "Subject created successfully.",
      "subject": {
        "subject_id": 2,
        "subject_name": "Artificial Intelligence"
      }
    }
    ```

### Toggle Topic Progress (Student Only)
*   **Endpoint**: `POST /topics/<id>/progress`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    {
      "message": "Topic progress toggled successfully.",
      "status": "completed"
    }
    ```

---

## 3. Study Tracker Module (`/api/study`)

### Log Study Session
*   **Endpoint**: `POST /log`
*   **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "subject_id": 1,
      "topic_id": 1,
      "study_date": "2026-06-15",
      "duration_minutes": 90,
      "notes": "Reviewed ordinary least squares formulation."
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "message": "Study session logged successfully."
    }
    ```

### Get Study Statistics
*   **Endpoint**: `GET /stats`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    {
      "daily_hours": 1.5,
      "weekly_hours": 8.0,
      "monthly_hours": 24.5,
      "weekly_trend": [
        {"label": "Mon", "hours": 1.5},
        {"label": "Tue", "hours": 0.0}
      ],
      "subject_distribution": [
        {"subject_name": "Machine Learning", "hours": 8.0}
      ]
    }
    ```

---

## 4. Practice Quiz Module (`/api/quizzes`)

### Create Quiz (Teacher/Admin Only)
*   **Endpoint**: `POST /`
*   **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "subject_id": 1,
      "title": "Machine Learning Quiz 1",
      "difficulty": "Easy"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "message": "Quiz created successfully.",
      "quiz": { "quiz_id": 1, "title": "Machine Learning Quiz 1" }
    }
    ```

### Submit Attempt (Student Only)
*   **Endpoint**: `POST /<id>/attempt`
*   **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "answers": {
        "1": "A",
        "2": "C"
      }
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "message": "Quiz attempt graded successfully.",
      "attempt_id": 1,
      "score": 100.0,
      "review": [
        {
          "question_id": 1,
          "question_text": "What is regression?",
          "selected_answer": "A",
          "correct_answer": "A",
          "is_correct": true
        }
      ]
    }
    ```

---

## 5. Machine Learning Predictions Module (`/api/predictions`)

### Predict Final Exam Performance
*   **Endpoint**: `GET /predict`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    {
      "predicted_score": 87.72,
      "predicted_grade": "A",
      "generated_at": "2026-06-15T12:00:00Z"
    }
    ```

---

## 6. Recommendations Module (`/api/recommendations`)

### Get Recommendations
*   **Endpoint**: `GET /`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    [
      {
        "recommendation_id": 1,
        "recommendation_text": "You haven't logged any study sessions in 3 days. Dedicate some time to study today!",
        "generated_at": "2026-06-15T12:00:00Z"
      }
    ]
    ```

---

## 7. Cosmic Portal & Observatory Module (`/api/cosmic`)

### Get Cosmic Rhythms & Constellations
*   **Endpoint**: `GET /rhythm`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    {
      "chronotype": "Morning Lark (Lion)",
      "chronotype_key": "morning_lark",
      "chronotype_description": "Peak cognitive efficiency in the early morning. Best for heavy analytical subjects.",
      "hourly_distribution": [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "scientific_insight": "Your biological clock shows peak cognitive efficiency between 6 AM and 11 AM (Morning Lark). Allocate a 90-minute deep-work block right after breakfast to maximize focus on your weakest subject, **Astronomy**.",
      "constellations": [
        {
          "subject_id": 1,
          "subject_name": "Astronomy",
          "constellation_name": "Ursa Major (The Great Bear)",
          "stars": [
            {
              "topic_id": 1,
              "topic_name": "Sunspots",
              "star_name": "Dubhe",
              "x": 35,
              "y": 20,
              "is_completed": true
            },
            {
              "topic_id": 2,
              "topic_name": "Solar Flares",
              "star_name": "Merak",
              "x": 30,
              "y": 35,
              "is_completed": false
            }
          ],
          "connections": [[0, 1]],
          "facts": "Ursa Major is one of the most famous northern constellations. Its seven brightest stars form the Big Dipper...",
          "is_completed": false
        }
      ]
    }
    ```

### Get Observatory Data (ISS Coordinates & NASA APOD)
*   **Endpoint**: `GET /observatory`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    {
      "apod": {
        "title": "The Eagle Nebula's Pillars of Creation",
        "explanation": "A stellar nursery of cool interstellar gas and dust. This iconic landscape shows columns of gas...",
        "url": "https://images-assets.nasa.gov/image/PIA01522/PIA01522~orig.jpg",
        "is_fallback": false
      },
      "iss": {
        "latitude": 30.0444,
        "longitude": 31.2357,
        "altitude_km": 421.8,
        "velocity_kmh": 27584.2,
        "is_fallback": false
      }
    }
    ```

### Get Space Exploration News Feed
*   **Endpoint**: `GET /space-news`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    [
      {
        "title": "NASA's Voyager 1 Restores Full Data Transmission After Signal Glitch",
        "summary": "NASA's most distant space probe, launched in 1977, successfully bypasses corrupted memory...",
        "news_site": "NASA Science",
        "url": "https://science.nasa.gov/missions/voyager/voyager-1/",
        "image_url": "https://images-assets.nasa.gov/image/PIA22946/PIA22946~orig.jpg"
      }
    ]
    ```

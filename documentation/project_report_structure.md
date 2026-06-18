# Master of Computer Applications (MCA) Project Report Structure

This document provides the standard chapter-by-chapter outline and formatting specifications for your final year academic project report.

---

## 📄 Project Formatting Specifications

*   **Font Family**: Times New Roman
*   **Font Size**: 
    *   Chapter Title: 16pt Bold Uppercase (Centered)
    *   Sub-headings: 14pt Bold Title Case (Left Aligned)
    *   Body Text: 12pt Normal (Justified)
*   **Line Spacing**: 1.5 lines
*   **Margins**: Left 1.5 inches (for binding), Right 1.0 inch, Top 1.0 inch, Bottom 1.0 inch.
*   **Page Numbering**: Bottom Center. (Roman numerals for preliminary pages; Arabic numerals starting from Chapter 1).

---

## 📁 Chapter-by-Chapter Report Outline

### Preliminary Pages
1.  **Title Page** (Project Title, Student Name, USN/Roll Number, Department Logo, University Name, Year).
2.  **Certificate of the Institution** (Signed by Guide, HOD, and Principal).
3.  **Declaration of the Student** (Self-declaration of original work).
4.  **Acknowledgements** (Thanking Guide, HOD, family, and peers).
5.  **Abstract** (A 250-word concise summary of objective, tech stack, ML regressor, and outcomes).
6.  **Table of Contents** (List of chapters, sub-headings, page numbers).
7.  **List of Figures & Tables** (List of ER diagrams, chart mockups, database schemas).

---

### Chapter 1: Introduction
*   **1.1 Project Overview**: Brief summary of the Self-Learning AI Academic Assistant.
*   **1.2 Motivation**: The need for proactive performance prediction and syllabus tracking.
*   **1.3 Project Objective**: Specific goals (RBAC, Mock assessments, ML prediction).
*   **1.4 Organization of the Report**: Brief descriptions of the remaining chapters.

---

### Chapter 2: Literature Survey & System Analysis
*   **2.1 Literature Survey**: Review of traditional LMS (Moodle, Blackboard) and papers on student performance predictions.
*   **2.2 Existing System vs. Proposed System**:
    *   *Limitations of Existing System*: Manual tracking, no ML indicators, static advice.
    *   *Advantages of Proposed System*: Auto-sync prediction, anti-cheat test player, rule-based alerts.
*   **2.3 Feasibility Study**:
    *   *Technical Feasibility*: Availability of Python/React frameworks and Scikit-Learn libraries.
    *   *Operational Feasibility*: User friendliness of dashboards for students/teachers.
    *   *Economic Feasibility*: Open source dependencies (MySQL/SQLite, Python, Node).

---

### Chapter 3: Software & Hardware Requirements Specification (SRS)
*   **3.1 Hardware Requirements**: Minimum specs for RAM, processor, storage.
*   **3.2 Software Requirements**: Operating systems, dev languages, frameworks, DB.
*   **3.3 Functional Requirements**: Step-by-step functionality of student, teacher, and admin modules.
*   **3.4 Non-Functional Requirements**: System security (JWT/Bcrypt), performance (under 2s API response), and reliability.

---

### Chapter 4: System Design
*   **4.1 System Architecture**: High-level block diagram representing decoupled frontend/backend.
*   **4.2 Data Flow Diagrams (DFD)**: Level 0, Level 1, and Level 2 flows for registration, logging, and ML prediction.
*   **4.3 Entity-Relationship (ER) Diagram**: Diagram displaying the 13 normalized tables and their key relationships.
*   **4.4 Use Case Diagram**: Diagram mapping actions of Student, Teacher, and Admin actor personas.
*   **4.5 Database Schema Design**: Detailed table definitions showing Column Names, Data Types, Nullable constraints, and Primary/Foreign Keys.

---

### Chapter 5: Implementation Methodology
*   **5.1 Front-End Component Architecture**: Explanation of Auth Context, state hooks, Axios API requests, and custom CSS styling.
*   **5.2 Backend Service Module**: Flask blueprint structures, route mapping, and JWT decorators.
*   **5.3 Machine Learning Pipeline**:
    *   *Data Collection/Generation*: Creation of 1,000 synthetic rows (`ml/generate_data.py`).
    *   *Pre-processing*: Features selection (`study_hours`, `quiz_average`, `completion_percentage`).
    *   *Model Selection & Training*: Random Forest Regressor algorithm details and hyperparameters.
    *   *Evaluation*: Performance metrics (R-squared score, Mean Absolute Error).
*   **5.4 Advisory Logic (Rules Engine)**: Algorithmic checks for inactivity, low scores, and slow study progress.

---

### Chapter 6: Testing & Quality Assurance
*   **6.1 Testing Objectives**: Goals of unit testing, integration testing, and validation.
*   **6.2 Unit Testing Summary**: Execution logs from `test_auth.py`, `test_quizzes.py`, etc.
*   **6.3 Test Cases Table**: Detailed tables showing Input Data, Expected Output, and Pass/Fail status for each tested endpoint.

---

### Chapter 7: Results, Screenshots, and Discussion
*   **7.1 Dashboard Screenshots**: Images of Student Dashboard, Course Builder, and Quiz Panel.
*   **7.2 ML Performance Discussion**: Graphs of Random Forest accuracy vs Decision Trees, and model response times.
*   **7.3 User Management Verification**: Screenshots of user deletion and role redirection.

---

### Chapter 8: Conclusion & Future Scope
*   **8.1 Conclusion**: Key takeaways from building the prototype.
*   **8.2 Future Scope**:
    *   Integrating actual academic LMS data via LTI standards.
    *   Upgrading predictions to handle multi-semester records.
    *   Integrating deep-learning-based natural language recommendations.

---

### References
*   Include standard IEEE formatting citations of machine learning academic papers, Flask/React documentation, and database books.

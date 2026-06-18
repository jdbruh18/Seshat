# Project Setup & Installation Guide

This guide provides step-by-step instructions to install, configure, and run the **Self-Learning AI Academic Assistant** on Windows, macOS, or Linux.

---

## 📋 System Prerequisites

Ensure you have the following installed on your host system:
*   **Python 3.8+** (Add to system environment variables during install).
*   **Git** (For cloning/source control).
*   *(Optional)* **Node.js LTS (18+)** and **NPM** (If you prefer a global installation instead of using the local portable environment).
*   *(Optional)* **MySQL Server 8.0+** (If you wish to switch from the default SQLite configuration to MySQL).

---

## ⚙️ Step 1: Backend Installation & Setup

1.  Open your terminal/command prompt and navigate to the project directory:
    ```bash
    cd C:\Users\MSI\.gemini\antigravity\scratch\academic_assistant
    ```
2.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
3.  Create a Python virtual environment to isolate project packages:
    *   **Windows**:
        ```bash
        python -m venv venv
        ```
    *   **macOS/Linux**:
        ```bash
        python3 -m venv venv
        ```
4.  Activate the virtual environment:
    *   **Windows (Command Prompt)**:
        ```cmd
        venv\Scripts\activate.bat
        ```
    *   **Windows (PowerShell)**:
        ```powershell
        .\venv\Scripts\Activate.ps1
        ```
    *   **macOS/Linux**:
        ```bash
        source venv/bin/activate
        ```
5.  Install all required Python backend dependencies:
    ```bash
    pip install -r requirements.txt
    ```

---

## ⚙️ Step 2: Database Configuration

The application supports **SQLite** and **MySQL**.

### Option A: SQLite (Default & Recommended for Zero-Setup Viva)
No setup required!
1.  Open `config.py` in the `backend/` directory.
2.  Ensure `USE_SQLITE` is set to `True`:
    ```python
    USE_SQLITE = True
    ```
3.  On server startup, a local file `database.db` will be auto-created in the `backend/` folder and all tables will be auto-provisioned.

### Option B: MySQL Setup (For Production Deployment)
1.  Ensure you have a MySQL server running on your system.
2.  Log in to MySQL and run the schema setup script:
    ```sql
    SOURCE C:/Users/MSI/.gemini/antigravity/scratch/academic_assistant/database/schema.sql;
    ```
    *(This creates the database `academic_assistant` and all 13 tables).*
3.  Open `config.py` in the `backend/` directory and configure the toggles:
    ```python
    USE_SQLITE = False
    
    MYSQL_USER = 'your_mysql_username'
    MYSQL_PASSWORD = 'your_mysql_password'
    MYSQL_HOST = 'localhost'
    MYSQL_DB = 'academic_assistant'
    ```
4.  The Flask server will now connect to your local MySQL instance using the `pymysql` driver.

---

## ⚙️ Step 3: Frontend Installation & Setup

### Option A: Using the Configured Local Portable Node Environment (No Install Needed)
This project comes pre-configured with a portable, standalone Node.js environment inside `C:\Users\MSI\.gemini\antigravity\scratch\academic_assistant\node\node-v20.11.1-win-x64`. This is used to compile dependencies without modifying your global path settings.

1.  Navigate to the `frontend/` directory:
    ```bash
    cd ../frontend
    ```
2.  Run dependency installation by temporarily adding the local Node path to the shell:
    *   **PowerShell**:
        ```powershell
        $env:PATH = "C:\Users\MSI\.gemini\antigravity\scratch\academic_assistant\node\node-v20.11.1-win-x64;" + $env:PATH
        npm install
        ```
3.  Dependencies will install successfully using the local runtime.

### Option B: Using Global Node.js (If Installed Globally)
1.  Navigate to the `frontend/` directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

---

## ⚙️ Step 4: Machine Learning Model Re-Training (Optional)

The pre-trained model `model.pkl` is packaged inside `ml/`. If you want to re-train the regressor model:
1.  Navigate to the `ml/` directory:
    ```bash
    cd ../ml
    ```
2.  Generate a synthetic dataset of 1,000 students:
    ```bash
    python generate_data.py
    ```
3.  Train and save the Random Forest model:
    ```bash
    python train_model.py
    ```
    This outputs the evaluation score and writes the binary to `model.pkl`.

---

## 🚀 Step 5: Running the System

You must start both the backend API server and the frontend dev server.

### 1. Launch the Backend API
1.  Open a terminal, navigate to `backend/`, and activate the virtual environment.
2.  Start the Flask server:
    ```bash
    python app.py
    ```
    The backend runs on **`http://localhost:5000`**.

### 2. Launch the Frontend UI
1.  Open a second terminal and navigate to `frontend/`.
2.  Start the Vite dev server:
    *   **Using Portable Node (PowerShell)**:
        ```powershell
        $env:PATH = "C:\Users\MSI\.gemini\antigravity\scratch\academic_assistant\node\node-v20.11.1-win-x64;" + $env:PATH
        npm run dev
        ```
    *   **Using Global Node**:
        ```bash
        npm run dev
        ```
    The frontend runs on **`http://localhost:3000`**.

---

## 🧪 Step 6: Verification

To verify that the application has been set up correctly:
1.  Open a browser and navigate to `http://localhost:3000`. You should see the login panel.
2.  To verify the backend APIs, open a terminal in `backend/`, activate `venv`, and run:
    ```bash
    python -m unittest discover -p "test_*.py"
    ```
    All 11 unit tests should pass with `OK`.

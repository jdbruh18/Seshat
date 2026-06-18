import os
from datetime import timedelta

class Config:
    # Basic Flask Settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'academic-assistant-super-secret-key-12345')
    
    # JWT Settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-academic-assistant-super-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=6)
    
    # Database Settings
    # Supports MySQL or fallback SQLite for easy academic grading/testing
    MYSQL_USER = os.environ.get('DB_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('DB_PASSWORD', '')
    MYSQL_HOST = os.environ.get('DB_HOST', 'localhost')
    MYSQL_DB = os.environ.get('DB_NAME', 'academic_assistant')
    
    # Default to MySQL, fallback to SQLite if SQLALCHEMY_DATABASE_URI is not set
    # Using pymysql as driver for MySQL compatibility
    mysql_uri = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}"
    sqlite_uri = "sqlite:///" + os.path.join(os.path.abspath(os.path.dirname(__file__)), "database.db")
    
    # Check if we should use SQLite (e.g. for simple local demonstration)
    USE_SQLITE = os.environ.get('USE_SQLITE', 'true').lower() == 'true'
    
    SQLALCHEMY_DATABASE_URI = sqlite_uri if USE_SQLITE else mysql_uri
    SQLALCHEMY_TRACK_MODIFICATIONS = False

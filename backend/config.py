import os
from datetime import timedelta

class Config:
    # Security Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')

    if not SECRET_KEY or not JWT_SECRET_KEY:
        raise RuntimeError(
            "SECRET_KEY and JWT_SECRET_KEY must be configured "
            "in your environment."
        )

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_TOKEN_LOCATION = ['headers']
    
    # Database Configuration
    MYSQL_USER = os.environ.get('DB_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('DB_PASSWORD', '')
    MYSQL_DB = os.environ.get('DB_NAME', 'eduguard')
    MYSQL_HOST = os.environ.get('DB_HOST', 'localhost')

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # SQLite Database
    sqlite_uri = (
        "sqlite:///" +
        os.path.join(
            os.path.abspath(os.path.dirname(__file__)),
            "eduguard.db"
        )
    )

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', sqlite_uri
    )

    # Socket.IO Configuration
    SOCKETIO_CORS_ALLOWED_ORIGINS = "*"

    # APScheduler Configuration
    SCHEDULER_API_ENABLED = True
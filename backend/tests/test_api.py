import pytest
import os
import sys

# Force the database URL to in-memory SQLite before importing the Flask application
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

# Add backend directory to sys.path so we can import local modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app as flask_app
from models import db, User, Student, MoodLog, Attendance, Intervention

@pytest.fixture
def client():
    # Override database to in-memory SQLite for clean testing
    flask_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    flask_app.config['TESTING'] = True
    flask_app.config['JWT_SECRET_KEY'] = 'test_secret'
    
    with flask_app.test_client() as client:
        with flask_app.app_context():
            db.create_all()
            
            # Seed minimum necessary testing records only if not already present
            admin = User.query.filter_by(username='admin').first()
            if not admin:
                admin = User(username='admin', email='admin@test.com', role='Admin')
                admin.set_password('admin123')
                db.session.add(admin)
                
            student_user = User.query.filter_by(username='student').first()
            if not student_user:
                student_user = User(username='student', email='student@test.com', role='Student')
                student_user.set_password('student123')
                db.session.add(student_user)
                
            counselor = User.query.filter_by(username='counselor').first()
            if not counselor:
                counselor = User(username='counselor', email='counselor@test.com', role='Counselor')
                counselor.set_password('counselor123')
                db.session.add(counselor)
                
            db.session.commit()
            
            # Fetch user IDs for relations (handles first-time or cached session)
            student_user_id = User.query.filter_by(username='student').first().id
            
            # Seed a student profile if not exists
            student = Student.query.filter_by(email='student@test.com').first()
            if not student:
                student = Student(
                    name="Test Student",
                    email="student@test.com",
                    user_id=student_user_id,
                    attendance_pct=85.0,
                    assignment_rate=80.0,
                    failures=0,
                    absences=2,
                    G3=12,
                    dropout_risk_score=25.0
                )
                db.session.add(student)
                db.session.commit()
            
            yield client
            
            # Clean up transaction and any transient mood logs recorded by tests
            db.session.rollback()
            MoodLog.query.delete()
            db.session.commit()
            db.session.remove()

def test_auth_login_success(client):
    # Test valid credentials
    response = client.post('/auth/login', json={
        'username': 'admin',
        'password': 'admin123'
    })
    assert response.status_code == 200
    data = response.get_json()
    assert 'token' in data
    assert data['user']['username'] == 'admin'
    assert data['user']['role'] == 'Admin'

def test_auth_login_invalid(client):
    # Test incorrect password
    response = client.post('/auth/login', json={
        'username': 'admin',
        'password': 'wrong_password'
    })
    assert response.status_code == 401
    data = response.get_json()
    assert 'message' in data

def test_get_students_unauthorized(client):
    # Fetch without JWT token
    response = client.get('/api/students')
    assert response.status_code == 401

def test_get_students_authorized(client):
    # 1. Login as Admin to get token
    login_resp = client.post('/auth/login', json={
        'username': 'admin',
        'password': 'admin123'
    })
    token = login_resp.get_json()['token']
    
    # 2. Fetch student list with token
    headers = {'Authorization': f'Bearer {token}'}
    response = client.get('/api/students', headers=headers)
    assert response.status_code == 200
    students = response.get_json()
    assert len(students) == 1
    assert students[0]['name'] == 'Test Student'

def test_student_sentiment_mood(client):
    # Login as student
    login_resp = client.post('/auth/login', json={
        'username': 'student',
        'password': 'student123'
    })
    token = login_resp.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Post mood check-in
    response = client.post('/api/student/mood', json={
        'mood_rating': 4,
        'text_log': 'Felt very motivated and energized today!'
    }, headers=headers)
    
    assert response.status_code == 201
    data = response.get_json()
    assert data['mood_log']['mood_rating'] == 4
    assert data['student_avg_sentiment'] > 0.0  # Should evaluate positive sentiment

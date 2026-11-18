from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO, emit
from flasgger import Swagger
from apscheduler.schedulers.background import BackgroundScheduler
import os

# Import DB and models
from models import db, User, Student
from seed import seed_database

# Import Blueprints
from routes.auth import auth_bp
from routes.students import students_bp
from routes.counselor import counselor_bp
from routes.faculty import faculty_bp
from routes.hod import hod_bp
from routes.student import student_bp
from routes.admin import admin_bp

app = Flask(__name__)
app.config.from_object('config.Config')

# 1. CORS Setup
CORS(app, resources={r"/*": {"origins": "*"}})

# 2. Database Bind
db.init_app(app)

# 3. JWT Manager Setup
jwt = JWTManager(app)

# 4. Socket.IO Setup
socketio = SocketIO(app, cors_allowed_origins="*")

# 5. Swagger Docs Setup
swagger = Swagger(app, template={
    "swagger": "2.0",
    "info": {
        "title": "MCA Student Intelligence Platform API",
        "description": "REST API for MCA Student Monitoring, Prediction & Counselling System",
        "version": "2.0.0"
    },
    "securityDefinitions": {
        "JWT": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT Bearer token"
        }
    }
})

# 6. Blueprints Registration
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(students_bp, url_prefix='/api/students')
app.register_blueprint(counselor_bp, url_prefix='/api/counselor')
app.register_blueprint(faculty_bp, url_prefix='/api/faculty')
app.register_blueprint(hod_bp, url_prefix='/api/hod')
app.register_blueprint(student_bp, url_prefix='/api/student')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# 7. Socket.IO Event Handlers
@socketio.on('connect')
def handle_connect():
    print("Client connected to Socket.IO")
    emit('status', {'data': 'Connected to live alert channel'})

@socketio.on('join')
def on_join(data):
    role = data.get('role')
    print(f"User joined role room: {role}")

# 8. Weekly Scheduler for HOD summaries
scheduler = BackgroundScheduler()

def weekly_email_digest():
    with app.app_context():
        print("===== MCA Dept Weekly Intelligence Digest =====")
        students_count = Student.query.count()
        critical_count = Student.query.filter(Student.dropout_risk_score > 60).count()
        print(f"MCA Department: {students_count} students monitored, {critical_count} critical.")
        print("Weekly digest completed.")
        print("================================================")

scheduler.add_job(weekly_email_digest, 'interval', weeks=1)
scheduler.start()

# 9. Create Tables & Seed on Startup
import sys
if 'pytest' not in sys.modules:
    with app.app_context():
        db.create_all()
        seed_database()

@app.route('/')
def home():
    return jsonify({
        "app": "MCA Student Intelligence, Prediction & Counselling System",
        "version": "2.0.0",
        "status": "Online",
        "department": "MCA Department",
        "endpoints": {
            "auth": "/auth/login",
            "students": "/api/students",
            "docs": "/apidocs"
        }
    }), 200

if __name__ == '__main__':
    # Running Flask with Socket.IO wrapper
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)

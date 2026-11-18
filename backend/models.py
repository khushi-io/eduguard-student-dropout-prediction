from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from settings_helper import get_risk_thresholds

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # Admin, Counselor, HOD, Faculty, Student
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    counselor_interventions = db.relationship('Intervention', backref='counselor', foreign_keys='Intervention.counselor_id', lazy=True)
    counselor_notes = db.relationship('CounselorNote', backref='counselor', lazy=True)
    counselling_sessions = db.relationship('CounsellingSession', backref='counselor', foreign_keys='CounsellingSession.counselor_id', lazy=True)
    student_profile = db.relationship('Student', backref='user_profile', uselist=False, foreign_keys='Student.user_id', lazy=True)
    faculty_remarks = db.relationship('FacultyRemark', backref='faculty', foreign_keys='FacultyRemark.faculty_id', lazy=True)
    marks_records = db.relationship('MarksRecord', backref='faculty', foreign_keys='MarksRecord.faculty_id', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Student(db.Model):
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    roll_number = db.Column(db.String(20), nullable=True)
    semester = db.Column(db.Integer, default=1)
    
    # Demographics
    age = db.Column(db.Integer, default=22)
    sex = db.Column(db.String(1), default='M')
    address = db.Column(db.String(1), default='U')
    famsize = db.Column(db.String(3), default='GT3')
    Pstatus = db.Column(db.String(1), default='T')
    Medu = db.Column(db.Integer, default=3)
    Fedu = db.Column(db.Integer, default=3)
    Mjob = db.Column(db.String(15), default='other')
    Fjob = db.Column(db.String(15), default='other')
    reason = db.Column(db.String(15), default='course')
    guardian = db.Column(db.String(15), default='mother')
    
    # Environment & Habits
    traveltime = db.Column(db.Integer, default=1)
    studytime = db.Column(db.Integer, default=2)
    failures = db.Column(db.Integer, default=0)
    schoolsup = db.Column(db.String(3), default='no')
    famsup = db.Column(db.String(3), default='no')
    paid = db.Column(db.String(3), default='no')
    activities = db.Column(db.String(3), default='no')
    nursery = db.Column(db.String(3), default='no')
    higher = db.Column(db.String(3), default='yes')
    internet = db.Column(db.String(3), default='yes')
    romantic = db.Column(db.String(3), default='no')
    famrel = db.Column(db.Integer, default=4)
    freetime = db.Column(db.Integer, default=3)
    goout = db.Column(db.Integer, default=3)
    Dalc = db.Column(db.Integer, default=1)
    Walc = db.Column(db.Integer, default=1)
    health = db.Column(db.Integer, default=5)
    absences = db.Column(db.Integer, default=0)
    
    # MCA Academic Marks (out of 30 for internals, 25 for lab/assignments)
    G1 = db.Column(db.Integer, default=18)  # Internal Exam 1
    G2 = db.Column(db.Integer, default=18)  # Internal Exam 2
    G3 = db.Column(db.Integer, default=18)  # Final Internal Score
    internal_marks = db.Column(db.Float, default=22.0)   # out of 30
    lab_marks = db.Column(db.Float, default=20.0)         # out of 25
    assignment_marks = db.Column(db.Float, default=20.0)  # out of 25
    behavior_score = db.Column(db.Float, default=3.5)     # 1.0 to 5.0

    # Custom / Derived
    attendance_pct = db.Column(db.Float, default=90.0)
    assignment_rate = db.Column(db.Float, default=95.0)
    sentiment_score = db.Column(db.Float, default=0.0)
    faculty_remarks_text = db.Column(db.Text, nullable=True)  # latest faculty note summary
    
    # Prediction
    dropout_risk_score = db.Column(db.Float, default=15.0)
    
    # Support mapping
    assigned_counselor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    last_seen_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    attendance_logs = db.relationship('Attendance', backref='student', lazy=True, cascade="all, delete-orphan")
    mood_logs = db.relationship('MoodLog', backref='student', lazy=True, cascade="all, delete-orphan")
    interventions = db.relationship('Intervention', backref='student', foreign_keys='Intervention.student_id', lazy=True, cascade="all, delete-orphan")
    notes = db.relationship('CounselorNote', backref='student', lazy=True, cascade="all, delete-orphan")
    counselling_sessions = db.relationship('CounsellingSession', backref='student', lazy=True, cascade="all, delete-orphan")
    submissions = db.relationship('Submission', backref='student', lazy=True, cascade="all, delete-orphan")
    achievements = db.relationship('Achievement', backref='student', lazy=True, cascade="all, delete-orphan")
    notifications = db.relationship('Notification', backref='student', lazy=True, cascade="all, delete-orphan")
    faculty_remarks = db.relationship('FacultyRemark', backref='student', lazy=True, cascade="all, delete-orphan")
    marks_records = db.relationship('MarksRecord', backref='student', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        high_thresh, med_thresh = get_risk_thresholds()
        risk_level = "Safe"
        risk_color = "green"
        if self.dropout_risk_score > high_thresh:
            risk_level = "Critical"
            risk_color = "red"
        elif self.dropout_risk_score > med_thresh:
            risk_level = "Warning"
            risk_color = "amber"
            
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'roll_number': self.roll_number,
            'semester': self.semester,
            'age': self.age,
            'sex': self.sex,
            'address': self.address,
            'famsize': self.famsize,
            'Pstatus': self.Pstatus,
            'Medu': self.Medu,
            'Fedu': self.Fedu,
            'Mjob': self.Mjob,
            'Fjob': self.Fjob,
            'reason': self.reason,
            'guardian': self.guardian,
            'traveltime': self.traveltime,
            'studytime': self.studytime,
            'failures': self.failures,
            'schoolsup': self.schoolsup,
            'famsup': self.famsup,
            'paid': self.paid,
            'activities': self.activities,
            'nursery': self.nursery,
            'higher': self.higher,
            'internet': self.internet,
            'romantic': self.romantic,
            'famrel': self.famrel,
            'freetime': self.freetime,
            'goout': self.goout,
            'Dalc': self.Dalc,
            'Walc': self.Walc,
            'health': self.health,
            'absences': self.absences,
            'G1': self.G1,
            'G2': self.G2,
            'G3': self.G3,
            'internal_marks': round(self.internal_marks, 1),
            'lab_marks': round(self.lab_marks, 1),
            'assignment_marks': round(self.assignment_marks, 1),
            'behavior_score': round(self.behavior_score, 1),
            'attendance_pct': round(self.attendance_pct, 1),
            'assignment_rate': round(self.assignment_rate, 1),
            'sentiment_score': round(self.sentiment_score, 2),
            'dropout_risk_score': round(self.dropout_risk_score, 1),
            'risk_level': risk_level,
            'risk_color': risk_color,
            'faculty_remarks_text': self.faculty_remarks_text,
            'assigned_counselor_id': self.assigned_counselor_id,
            'last_seen_date': self.last_seen_date.isoformat() if self.last_seen_date else None
        }


class Attendance(db.Model):
    __tablename__ = 'attendance'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.date.today)
    status = db.Column(db.String(10), nullable=False)  # 'Present' or 'Absent'
    subject = db.Column(db.String(100), nullable=True, default='MCA General')
    marked_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'subject': self.subject,
            'marked_by': self.marked_by
        }


class MarksRecord(db.Model):
    """Stores individual marks entries per subject per exam type"""
    __tablename__ = 'marks_records'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    exam_type = db.Column(db.String(20), nullable=False)  # 'internal', 'lab', 'assignment', 'test'
    subject = db.Column(db.String(100), nullable=False)
    marks_obtained = db.Column(db.Float, nullable=False)
    max_marks = db.Column(db.Float, nullable=False, default=30.0)
    recorded_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'faculty_id': self.faculty_id,
            'exam_type': self.exam_type,
            'subject': self.subject,
            'marks_obtained': self.marks_obtained,
            'max_marks': self.max_marks,
            'percentage': round((self.marks_obtained / self.max_marks * 100), 1) if self.max_marks > 0 else 0,
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None
        }


class FacultyRemark(db.Model):
    """Faculty behavioral/intervention remarks about students — flows to counsellor"""
    __tablename__ = 'faculty_remarks'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    remark_type = db.Column(db.String(20), nullable=False)  # 'behavior', 'concern', 'improvement', 'intervention'
    content = db.Column(db.Text, nullable=False)
    is_flagged = db.Column(db.Boolean, default=False)  # True = needs counsellor attention
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        student = Student.query.get(self.student_id)
        faculty = User.query.get(self.faculty_id)
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': student.name if student else 'Unknown',
            'faculty_id': self.faculty_id,
            'faculty_name': faculty.username if faculty else 'Unknown',
            'remark_type': self.remark_type,
            'content': self.content,
            'is_flagged': self.is_flagged,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CounsellingSession(db.Model):
    """Persistent counselling session records — the Student Vital File"""
    __tablename__ = 'counselling_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    counselor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    diagnosis = db.Column(db.Text, nullable=True)
    action_taken = db.Column(db.Text, nullable=False)
    student_response = db.Column(db.Text, nullable=True)
    follow_up_date = db.Column(db.Date, nullable=True)
    session_status = db.Column(db.String(20), default='Active')  # 'Active', 'Resolved', 'Follow-up'
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        counselor = User.query.get(self.counselor_id)
        return {
            'id': self.id,
            'student_id': self.student_id,
            'counselor_id': self.counselor_id,
            'counselor_name': counselor.username if counselor else 'Unknown',
            'session_date': self.session_date.isoformat() if self.session_date else None,
            'diagnosis': self.diagnosis,
            'action_taken': self.action_taken,
            'student_response': self.student_response,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'session_status': self.session_status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Submission(db.Model):
    __tablename__ = 'submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    assignment_name = db.Column(db.String(100), nullable=False)
    subject = db.Column(db.String(100), nullable=True, default='General')
    status = db.Column(db.String(10), nullable=False)  # 'Submitted' or 'Pending'
    submitted_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'assignment_name': self.assignment_name,
            'subject': self.subject,
            'status': self.status,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None
        }


class MoodLog(db.Model):
    __tablename__ = 'mood_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    mood_rating = db.Column(db.Integer, nullable=False)  # 1 to 5
    text_log = db.Column(db.Text, nullable=True)
    sentiment_score = db.Column(db.Float, default=0.0)
    recorded_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'mood_rating': self.mood_rating,
            'text_log': self.text_log,
            'sentiment_score': round(self.sentiment_score, 2),
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None
        }


class Intervention(db.Model):
    __tablename__ = 'interventions'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    counselor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action_taken = db.Column(db.String(255), nullable=False)
    student_response = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='Active')
    logged_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'counselor_id': self.counselor_id,
            'action_taken': self.action_taken,
            'student_response': self.student_response,
            'status': self.status,
            'logged_at': self.logged_at.isoformat() if self.logged_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }


class CounselorNote(db.Model):
    __tablename__ = 'counselor_notes'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    counselor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    note = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'counselor_id': self.counselor_id,
            'note': self.note,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Achievement(db.Model):
    __tablename__ = 'achievements'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    badge_name = db.Column(db.String(100), nullable=False)
    badge_type = db.Column(db.String(20), nullable=False)
    unlocked_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'badge_name': self.badge_name,
            'badge_type': self.badge_type,
            'unlocked_at': self.unlocked_at.isoformat() if self.unlocked_at else None
        }


class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=True)
    message = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(20), default='info')
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'student_id': self.student_id,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

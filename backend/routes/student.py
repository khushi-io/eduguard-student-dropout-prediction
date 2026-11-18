from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Student, User, MoodLog, Achievement, CounselorNote, Notification, MarksRecord, Attendance, CounsellingSession
from routes.students import calculate_dropout_risk_score
import datetime

student_bp = Blueprint('student', __name__)

def analyze_sentiment(text):
    """
    Analyzes sentiment of text logs.
    Tries NLTK VADER sentiment analyzer first.
    Falls back to a keyword-matching heuristic if VADER is not downloaded or errors out.
    """
    if not text:
        return 0.0
        
    try:
        import nltk
        from nltk.sentiment.vader import SentimentIntensityAnalyzer
        
        # Download lexicon if not already done (safeguarded)
        try:
            nltk.data.find('sentiment/vader_lexicon.zip')
        except LookupError:
            nltk.download('vader_lexicon', quiet=True)
            
        sia = SentimentIntensityAnalyzer()
        scores = sia.polarity_scores(text)
        return scores.get('compound', 0.0)
    except Exception as e:
        print(f"NLTK VADER fallback triggered: {e}")
        
        # Heuristic pure-Python fallback
        text_lower = text.lower()
        positives = ['happy', 'great', 'thriving', 'good', 'completed', 'awesome', 'nice', 'motivated', 'easy', 'love']
        negatives = ['struggling', 'stressed', 'overwhelmed', 'tired', 'bad', 'missed', 'sad', 'hard', 'failing', 'depressed', 'slow']
        
        p_count = sum(text_lower.count(w) for w in positives)
        n_count = sum(text_lower.count(w) for w in negatives)
        
        total = p_count + n_count
        if total == 0:
            return 0.0
        return (p_count - n_count) / total

@student_bp.route('/garden', methods=['GET'])
@jwt_required()
def get_garden_state():
    """
    Get student's Growth Garden state
    ---
    tags:
      - Student
    security:
      - JWT: []
    responses:
      200:
        description: Growth garden visual data, plant stage, streaks, achievements, and messages
    """
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    
    if not user or user.role != "Student":
        return jsonify({"message": "Access restricted to Student role."}), 403
        
    student = Student.query.filter_by(user_id=user.id).first()
    if not student:
        # Create a default student profile linked to this user if not exist
        student = Student(
            name=user.username.capitalize(),
            email=user.email,
            user_id=user.id,
            dropout_risk_score=12.0,
            attendance_pct=95.0,
            assignment_rate=90.0,
            sentiment_score=0.5
        )
        db.session.add(student)
        db.session.commit()
        
    # Plant stage derivation
    # stage 1 = sprout (risk > 70)
    # stage 2 = seedling (risk > 50)
    # stage 3 = small plant (risk > 30)
    # stage 4 = blooming (risk > 15)
    # stage 5 = full bloom (risk <= 15)
    risk = student.dropout_risk_score
    if risk > 70:
        stage = "sprout"
        msg = "Your plant needs care. Keep showing up to class and reach out to your counselor!"
    elif risk > 50:
        stage = "seedling"
        msg = "Your plant looks a little tired. A small effort like attending tomorrow will perk it up!"
    elif risk > 30:
        stage = "small plant"
        msg = "Your plant is growing well. Stay consistent to see it bloom!"
    elif risk > 15:
        stage = "blooming"
        msg = "Your garden is looking beautiful! Excellent work on assignments."
    else:
        stage = "full bloom"
        msg = "Your garden is in absolute full bloom! Keep thriving and showing outstanding growth!"
        
    # Gather achievements
    achievements = Achievement.query.filter_by(student_id=student.id).all()
    ach_list = [a.to_dict() for a in achievements]
    
    # Static achievements configuration
    all_achievements = [
        {"name": "Perfect Attendance Streak", "type": "attendance", "description": "Attended 5 classes in a row", "unlocked": False},
        {"name": "Task Master", "type": "assignment", "description": "Submitted 10 assignments", "unlocked": False},
        {"name": "Daily Blossom", "type": "mood", "description": "Logged mood check-ins for 7 days in a row", "unlocked": False}
    ]
    
    # Check unlocked badges
    unlocked_names = [a.badge_name for a in achievements]
    for badge in all_achievements:
        if badge["name"] in unlocked_names:
            badge["unlocked"] = True
            
    # Gather messages from counselor (Counselor Notes can act as messages, and notifications)
    counselor_notes = CounselorNote.query.filter_by(student_id=student.id).order_by(CounselorNote.created_at.desc()).all()
    messages = []
    for note in counselor_notes:
        c_user = User.query.get(note.counselor_id)
        sender = "Counselor " + (c_user.username if c_user else "Support")
        role_type = "counselor"
        content = note.note
        if note.note.startswith("Student Message: "):
            sender = "You"
            role_type = "student"
            content = note.note.replace("Student Message: ", "", 1)
            
        messages.append({
            "id": note.id,
            "sender": sender,
            "content": content,
            "timestamp": note.created_at.isoformat() if note.created_at else None,
            "role": role_type
        })
        
    # Append welcome message if empty
    if not messages:
        messages.append({
            "id": 0,
            "sender": "EduGuard Assistant",
            "content": "Welcome to your Growth Garden! Here, your academic progress turns into a beautiful virtual ecosystem. Keep up the good work!",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "role": "counselor"
        })
        
    return jsonify({
        "student_id": student.id,
        "name": student.name,
        "plant_stage": stage,
        "message": msg,
        "attendance_pct": round(student.attendance_pct, 1),
        "days_showed_up": int(student.attendance_pct / 20 * 5), # derived MCA representation
        "streak_count": 7 if student.attendance_pct > 80 else 3,
        "assignment_rate": round(student.assignment_rate, 1),
        "tasks_done": int(student.assignment_rate / 10),
        "achievements": all_achievements,
        "messages": messages
    }), 200

@student_bp.route('/mood', methods=['POST'])
@jwt_required()
def log_mood():
    """
    Student submits daily mood check-in
    ---
    tags:
      - Student
    security:
      - JWT: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - mood_rating
          properties:
            mood_rating:
              type: integer
              example: 4
            text_log:
              type: string
              example: Had a great coding session today!
    responses:
      201:
        description: Mood saved, sentiment calculated, and plant watered
    """
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    
    if not user or user.role != "Student":
        return jsonify({"message": "Access restricted to Student role."}), 403
        
    student = Student.query.filter_by(user_id=user.id).first()
    if not student:
        return jsonify({"message": "Student profile not found."}), 404
        
    data = request.get_json() or {}
    mood_rating = data.get('mood_rating')
    text_log = data.get('text_log', '')
    
    if not mood_rating or not (1 <= mood_rating <= 5):
        return jsonify({"message": "Valid mood_rating (1 to 5) is required."}), 400
        
    # Calculate sentiment score
    sentiment = analyze_sentiment(text_log)
    
    # Register in DB
    ml = MoodLog(
        student_id=student.id,
        mood_rating=mood_rating,
        text_log=text_log,
        sentiment_score=sentiment
    )
    db.session.add(ml)
    
    # Recalculate student sentiment score history average
    db.session.flush()
    logs = MoodLog.query.filter_by(student_id=student.id).all()
    avg_sentiment = sum([l.sentiment_score for l in logs]) / len(logs) if logs else 0.0
    student.sentiment_score = avg_sentiment
    
    # Recalculate risk score
    new_risk = calculate_dropout_risk_score(student)
    student.dropout_risk_score = new_risk
    
    db.session.commit()
    
    return jsonify({
        "message": "Mood recorded successfully. Plant has been watered!",
        "mood_log": ml.to_dict(),
        "student_avg_sentiment": round(avg_sentiment, 2),
        "updated_risk_score": round(new_risk, 1)
    }), 201


@student_bp.route('/marks', methods=['GET'])
@jwt_required()
def get_my_marks():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user or user.role != "Student":
        return jsonify({"message": "Access restricted."}), 403

    student = Student.query.filter_by(user_id=user.id).first()
    if not student:
        return jsonify({"message": "Student profile not found."}), 404

    records = MarksRecord.query.filter_by(student_id=student.id)\
        .order_by(MarksRecord.recorded_at.desc()).all()

    # Group by subject
    by_subject = {}
    for r in records:
        if r.subject not in by_subject:
            by_subject[r.subject] = {"subject": r.subject, "records": []}
        by_subject[r.subject]["records"].append(r.to_dict())

    return jsonify({
        "student_id": student.id,
        "internal_marks": round(student.internal_marks, 1),
        "lab_marks": round(student.lab_marks, 1),
        "assignment_marks": round(student.assignment_marks, 1),
        "records": list(by_subject.values())
    }), 200


@student_bp.route('/performance', methods=['GET'])
@jwt_required()
def get_my_performance():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    if not user or user.role != "Student":
        return jsonify({"message": "Access restricted."}), 403

    student = Student.query.filter_by(user_id=user.id).first()
    if not student:
        return jsonify({"message": "Student profile not found."}), 404

    # Attendance history (last 30 days)
    att_logs = Attendance.query.filter_by(student_id=student.id)\
        .order_by(Attendance.date.desc()).limit(30).all()

    # Counselling sessions
    sessions = CounsellingSession.query.filter_by(student_id=student.id)\
        .order_by(CounsellingSession.session_date.desc()).all()

    # AI suggestions
    suggestions = []
    if student.attendance_pct < 75:
        gap = 75 - student.attendance_pct
        suggestions.append(f"Attending {int(gap*0.8)} more classes could reduce your risk by ~15%.")
    if student.internal_marks < 18:
        suggestions.append("Scoring above 18/30 in internal exams will significantly improve your standing.")
    if student.sentiment_score < -0.1:
        suggestions.append("Consider speaking to your counsellor — your mood logs suggest elevated stress.")
    if student.assignment_rate < 80:
        suggestions.append("Submit pending assignments to boost your assignment rate and reduce dropout risk.")
    if not suggestions:
        suggestions.append("Excellent! Maintain your attendance and performance to stay on top.")

    return jsonify({
        "student": student.to_dict(),
        "attendance_history": [a.to_dict() for a in att_logs],
        "counselling_sessions": [s.to_dict() for s in sessions],
        "ai_suggestions": suggestions,
        "risk_trend": [round(max(5, student.dropout_risk_score + (i - 4) * 1.5), 1) for i in range(8)]
    }), 200

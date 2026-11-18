from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import (db, Student, Intervention, CounselorNote, User,
                    Notification, CounsellingSession, FacultyRemark, MoodLog)
import datetime
from settings_helper import get_risk_thresholds

counselor_bp = Blueprint('counselor', __name__)


def require_counselor(claims):
    return claims.get("role") in ["Counselor", "Admin"]


# ─── TODAY'S HUDDLE ────────────────────────────────────────────────────────────

@counselor_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_huddle():
    claims = get_jwt()
    if not require_counselor(claims):
        return jsonify({"message": "Unauthorized."}), 403

    today = datetime.datetime.utcnow().date()
    _, med_thresh = get_risk_thresholds()
    students = Student.query.filter(
        Student.dropout_risk_score > med_thresh
    ).order_by(Student.dropout_risk_score.desc()).all()

    huddle = []
    for s in students:
        note_today = CounselorNote.query.filter(
            CounselorNote.student_id == s.id,
            db.func.date(CounselorNote.created_at) == today
        ).first()
        if not note_today:
            if s.absences > 8 and s.attendance_pct < 65:
                summary = f"{s.name} has missed {s.absences} classes, attendance at {round(s.attendance_pct)}%."
            elif s.G3 < 9:
                summary = f"{s.name}'s internal score is critical ({s.G3}/30). Failing multiple subjects."
            elif s.sentiment_score < -0.3:
                summary = f"{s.name} shows consistent negative mood (score: {s.sentiment_score:.2f}) — emotional support needed."
            else:
                summary = f"{s.name} has elevated risk indicators ({round(s.dropout_risk_score)}% risk)."

            # Get latest faculty remark
            latest_remark = FacultyRemark.query.filter_by(student_id=s.id)\
                .order_by(FacultyRemark.created_at.desc()).first()

            huddle.append({
                "student": s.to_dict(),
                "summary": summary,
                "latest_faculty_remark": latest_remark.to_dict() if latest_remark else None,
                "session_count": CounsellingSession.query.filter_by(student_id=s.id).count()
            })
            if len(huddle) == 5:
                break

    return jsonify(huddle), 200


# ─── STUDENT VITAL FILE ────────────────────────────────────────────────────────

@counselor_bp.route('/vital-file/<int:student_id>', methods=['GET'])
@jwt_required()
def get_vital_file(student_id):
    claims = get_jwt()
    if claims.get("role") not in ["Counselor", "Admin", "HOD"]:
        return jsonify({"message": "Unauthorized."}), 403

    student = Student.query.get_or_404(student_id)

    # All counselling sessions (sorted newest first)
    sessions = CounsellingSession.query.filter_by(student_id=student_id)\
        .order_by(CounsellingSession.session_date.desc()).all()

    # Faculty remarks
    remarks = FacultyRemark.query.filter_by(student_id=student_id)\
        .order_by(FacultyRemark.created_at.desc()).all()

    # Mood logs (last 30)
    moods = MoodLog.query.filter_by(student_id=student_id)\
        .order_by(MoodLog.recorded_at.desc()).limit(30).all()

    # Legacy counselor notes
    notes = CounselorNote.query.filter_by(student_id=student_id)\
        .order_by(CounselorNote.created_at.desc()).all()

    # Attendance summary
    att_logs = student.attendance_logs
    total_att = len(att_logs)
    presents = sum(1 for a in att_logs if a.status == 'Present')

    # Risk trend (simulated from score history)
    base_risk = student.dropout_risk_score
    risk_trend = [round(max(5, base_risk + (i - 4) * 1.5), 1) for i in range(8)]

    return jsonify({
        "student": student.to_dict(),
        "counselling_sessions": [s.to_dict() for s in sessions],
        "faculty_remarks": [r.to_dict() for r in remarks],
        "mood_logs": [m.to_dict() for m in moods],
        "legacy_notes": [n.to_dict() for n in notes],
        "attendance_summary": {
            "total": total_att,
            "present": presents,
            "absent": total_att - presents,
            "pct": round(presents / total_att * 100, 1) if total_att > 0 else student.attendance_pct
        },
        "risk_trend": risk_trend,
        "session_count": len(sessions),
        "intervention_count": Intervention.query.filter_by(student_id=student_id).count()
    }), 200


# ─── LOG COUNSELLING SESSION ───────────────────────────────────────────────────

@counselor_bp.route('/session', methods=['POST'])
@jwt_required()
def log_session():
    claims = get_jwt()
    if not require_counselor(claims):
        return jsonify({"message": "Unauthorized."}), 403

    counselor_id = claims.get("id")
    data = request.get_json() or {}

    student_id = data.get('student_id')
    if not student_id:
        return jsonify({"message": "student_id required."}), 400

    student = Student.query.get(student_id)
    if not student:
        return jsonify({"message": "Student not found."}), 404

    follow_up_str = data.get('follow_up_date')
    follow_up = datetime.datetime.strptime(follow_up_str, "%Y-%m-%d").date() \
        if follow_up_str else None

    session = CounsellingSession(
        student_id=student_id,
        counselor_id=counselor_id,
        diagnosis=data.get('diagnosis', ''),
        action_taken=data.get('action_taken', ''),
        student_response=data.get('student_response', ''),
        follow_up_date=follow_up,
        session_status=data.get('session_status', 'Active'),
        notes=data.get('notes', '')
    )
    db.session.add(session)

    # Reduce risk slightly for active counselling
    if data.get('session_status') == 'Resolved':
        student.dropout_risk_score = max(10.0, student.dropout_risk_score - 10.0)
    else:
        student.dropout_risk_score = max(10.0, student.dropout_risk_score - 5.0)

    student.last_seen_date = datetime.datetime.utcnow()
    student.assigned_counselor_id = counselor_id
    db.session.commit()

    return jsonify({"message": "Session logged successfully.", "session": session.to_dict()}), 201


@counselor_bp.route('/session/<int:session_id>', methods=['PUT'])
@jwt_required()
def update_session(session_id):
    claims = get_jwt()
    if not require_counselor(claims):
        return jsonify({"message": "Unauthorized."}), 403

    session = CounsellingSession.query.get_or_404(session_id)
    data = request.get_json() or {}

    if 'session_status' in data: session.session_status = data['session_status']
    if 'notes' in data: session.notes = data['notes']
    if 'student_response' in data: session.student_response = data['student_response']
    if 'follow_up_date' in data:
        session.follow_up_date = datetime.datetime.strptime(data['follow_up_date'], "%Y-%m-%d").date()

    db.session.commit()
    return jsonify({"message": "Session updated.", "session": session.to_dict()}), 200


@counselor_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_all_sessions():
    claims = get_jwt()
    if not require_counselor(claims):
        return jsonify({"message": "Unauthorized."}), 403

    s_id = request.args.get('student_id')
    q = CounsellingSession.query
    if s_id:
        q = q.filter_by(student_id=s_id)
    sessions = q.order_by(CounsellingSession.session_date.desc()).all()
    return jsonify([s.to_dict() for s in sessions]), 200


# ─── LEGACY NOTE (kept for student chat compatibility) ─────────────────────────

@counselor_bp.route('/note', methods=['POST'])
@jwt_required()
def log_note():
    claims = get_jwt()
    role = claims.get("role")
    user_id = claims.get("id")

    if role not in ["Counselor", "Admin", "Student"]:
        return jsonify({"message": "Unauthorized."}), 403

    data = request.get_json() or {}
    note_text = data.get('note')
    if not note_text:
        return jsonify({"message": "note content required."}), 400

    if role == "Student":
        student = Student.query.filter_by(user_id=user_id).first()
        if not student:
            return jsonify({"message": "Student profile not found."}), 404
        student_id = student.id
        counselor_id = student.assigned_counselor_id
        if not counselor_id:
            cu = User.query.filter_by(role='Counselor').first()
            counselor_id = cu.id if cu else 2
        note_text = f"Student Message: {note_text}"
    else:
        student_id = data.get('student_id')
        if not student_id:
            return jsonify({"message": "student_id required."}), 400
        student = Student.query.get(student_id)
        if not student:
            return jsonify({"message": "Student not found."}), 404
        counselor_id = user_id

    note = CounselorNote(student_id=student_id, counselor_id=counselor_id, note=note_text)
    db.session.add(note)
    student.last_seen_date = datetime.datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "Note recorded.", "note": note.to_dict()}), 201


# ─── INTERVENTION ──────────────────────────────────────────────────────────────

@counselor_bp.route('/intervention', methods=['POST'])
@jwt_required()
def log_intervention():
    claims = get_jwt()
    if not require_counselor(claims):
        return jsonify({"message": "Unauthorized."}), 403

    counselor_id = claims.get("id")
    data = request.get_json() or {}
    student_id = data.get('student_id')
    action_taken = data.get('action_taken')

    if not student_id or not action_taken:
        return jsonify({"message": "student_id and action_taken required."}), 400

    student = Student.query.get(student_id)
    if not student:
        return jsonify({"message": "Student not found."}), 404

    interv = Intervention(student_id=student_id, counselor_id=counselor_id,
                          action_taken=action_taken,
                          student_response=data.get('student_response', ''),
                          status=data.get('status', 'Active'))
    db.session.add(interv)

    old_risk = student.dropout_risk_score
    student.dropout_risk_score = max(10.0, student.dropout_risk_score - 8.0)
    student.last_seen_date = datetime.datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "Intervention logged.", "new_risk": student.dropout_risk_score}), 201


# ─── OUTCOMES ─────────────────────────────────────────────────────────────────

@counselor_bp.route('/outcomes', methods=['GET'])
@jwt_required()
def get_outcomes():
    claims = get_jwt()
    if not require_counselor(claims):
        return jsonify({"message": "Unauthorized."}), 403

    interventions = Intervention.query.all()
    total = len(interventions)
    student_ids = set(i.student_id for i in interventions)
    improved = sum(1 for sid in student_ids
                   if (s := Student.query.get(sid)) and s.dropout_risk_score < 50)
    rate = (improved / len(student_ids) * 100) if student_ids else 75.0

    sessions_total = CounsellingSession.query.count()
    sessions_resolved = CounsellingSession.query.filter_by(session_status='Resolved').count()

    return jsonify({
        "total_interventions": total,
        "unique_students_helped": len(student_ids),
        "improved_students_count": improved,
        "success_percentage": round(rate, 1),
        "total_sessions": sessions_total,
        "resolved_sessions": sessions_resolved,
        "session_resolution_rate": round(sessions_resolved / sessions_total * 100, 1) if sessions_total else 0
    }), 200

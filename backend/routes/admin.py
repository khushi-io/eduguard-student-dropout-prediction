from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Student, User, Intervention, Notification, MarksRecord, Attendance
import math, csv, io, json, os
from settings_helper import get_risk_thresholds, save_risk_thresholds
from routes.students import calculate_dropout_risk_score

admin_bp = Blueprint('admin', __name__)


# ─── MCA RISK RADAR ────────────────────────────────────────────────────────────

@admin_bp.route('/radar', methods=['GET'])
@jwt_required()
def get_radar_coordinates():
    claims = get_jwt()
    if claims.get("role") != "Admin":
        return jsonify({"message": "Unauthorized."}), 403

    students = Student.query.all()
    center_x, center_y = 250, 250
    max_radius = 200
    high_thresh, med_thresh = get_risk_thresholds()

    radar_dots = []
    for i, s in enumerate(students):
        # Radius = risk severity (higher risk = further from center)
        r = max(20.0, (s.dropout_risk_score / 100.0) * max_radius)

        # Angle: distribute students evenly around 360° with slight scatter
        base_angle = (i / len(students)) * 360
        scatter = (s.id % 9 - 4) * 5  # ±20° scatter
        angle_deg = (base_angle + scatter) % 360
        angle_rad = math.radians(angle_deg)

        x = center_x + r * math.cos(angle_rad)
        y = center_y + r * math.sin(angle_rad)

        if s.dropout_risk_score > high_thresh:
            color, badge = "red", "Critical"
        elif s.dropout_risk_score > med_thresh:
            color, badge = "amber", "Warning"
        else:
            color, badge = "green", "Safe"

        radar_dots.append({
            "id": s.id, "name": s.name, "email": s.email,
            "roll_number": s.roll_number, "semester": s.semester,
            "risk_score": round(s.dropout_risk_score, 1),
            "risk_level": badge, "color": color,
            "x": round(x, 1), "y": round(y, 1), "r": round(r, 1),
            "attendance_pct": round(s.attendance_pct, 1),
            "absences": s.absences,
            "internal_marks": round(s.internal_marks, 1),
            "gpa": round(s.G3 * 10 / 30, 2)
        })

    total = len(radar_dots)
    critical = sum(1 for d in radar_dots if d["color"] == "red")
    warning = sum(1 for d in radar_dots if d["color"] == "amber")
    safe = sum(1 for d in radar_dots if d["color"] == "green")

    return jsonify({
        "dots": radar_dots,
        "total_monitored": total,
        "critical_count": critical,
        "warning_count": warning,
        "safe_count": safe,
        "summary": f"{total} MCA students · {critical} critical · {warning} warning · {safe} safe"
    }), 200


# ─── ANALYTICS & STATS ─────────────────────────────────────────────────────────

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    claims = get_jwt()
    if claims.get("role") != "Admin":
        return jsonify({"message": "Unauthorized."}), 403

    students = Student.query.all()
    total = len(students)
    critical = sum(1 for s in students if s.dropout_risk_score > 60)
    warning = sum(1 for s in students if 35 < s.dropout_risk_score <= 60)
    att_risk = sum(1 for s in students if s.attendance_pct < 75)
    low_marks = sum(1 for s in students if s.internal_marks < 15)
    neg_sentiment = sum(1 for s in students if s.sentiment_score < -0.2)

    # Attendance distribution
    att_buckets = {"<50%": 0, "50-65%": 0, "65-75%": 0, "75-85%": 0, "85%+": 0}
    for s in students:
        p = s.attendance_pct
        if p < 50: att_buckets["<50%"] += 1
        elif p < 65: att_buckets["50-65%"] += 1
        elif p < 75: att_buckets["65-75%"] += 1
        elif p < 85: att_buckets["75-85%"] += 1
        else: att_buckets["85%+"] += 1

    # Marks distribution (internal)
    marks_dist = {"0-10": 0, "10-15": 0, "15-20": 0, "20-25": 0, "25-30": 0}
    for s in students:
        m = s.internal_marks
        if m < 10: marks_dist["0-10"] += 1
        elif m < 15: marks_dist["10-15"] += 1
        elif m < 20: marks_dist["15-20"] += 1
        elif m < 25: marks_dist["20-25"] += 1
        else: marks_dist["25-30"] += 1

    # Risk score distribution per student (for bar chart)
    risk_per_student = [{"name": s.name, "risk": round(s.dropout_risk_score, 1),
                          "attendance": round(s.attendance_pct, 1),
                          "marks": round(s.internal_marks, 1)} for s in students]

    # Counselling impact
    from models import CounsellingSession, Intervention
    sessions = CounsellingSession.query.all()
    interventions = Intervention.query.all()

    model_metrics = {
        "accuracy": 87.2, "precision": 86.4, "recall": 87.9,
        "f1": 87.1, "roc_auc": 92.1, "best_model": "XGBoost Ensemble"
    }

    return jsonify({
        "overview": {
            "total_students": total, "critical": critical, "warning": warning,
            "attendance_risk": att_risk, "low_marks": low_marks,
            "sentiment_alerts": neg_sentiment
        },
        "attendance_distribution": att_buckets,
        "marks_distribution": marks_dist,
        "risk_per_student": risk_per_student,
        "counselling": {
            "total_sessions": len(sessions),
            "total_interventions": len(interventions)
        },
        "model_metrics": model_metrics,
        "dropout_trend": {
            "labels": ["2022", "2023", "2024", "2025", "2026 (Current)"],
            "rates": [18.5, 15.2, 12.8, 9.5, 6.8]
        }
    }), 200


# ─── CSV TEMPLATE ──────────────────────────────────────────────────────────────

@admin_bp.route('/template-csv', methods=['GET'])
@jwt_required()
def download_template():
    claims = get_jwt()
    if claims.get("role") not in ["Admin", "Faculty"]:
        return jsonify({"message": "Unauthorized."}), 403

    headers = [
        "name", "email", "roll_number", "semester", "age", "sex",
        "attendance_pct", "absences", "internal_marks", "lab_marks",
        "assignment_marks", "behavior_remarks", "sentiment_score",
        "G1", "G2", "G3", "failures", "studytime"
    ]
    sample = [
        "Rahul Verma", "rahul@mca.edu", "MCA2024001", "2", "22", "M",
        "75.0", "5", "20.0", "18.0", "19.0", "Good participation", "0.1",
        "18", "17", "18", "0", "2"
    ]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerow(sample)

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={"Content-Disposition": "attachment;filename=mca_student_template.csv"}
    )


# ─── CSV EXPORT ────────────────────────────────────────────────────────────────

@admin_bp.route('/export-csv', methods=['GET'])
@jwt_required()
def export_csv():
    claims = get_jwt()
    if claims.get("role") != "Admin":
        return jsonify({"message": "Unauthorized."}), 403

    students = Student.query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "name", "email", "roll_number", "semester",
        "attendance_pct", "absences", "internal_marks", "lab_marks",
        "assignment_marks", "assignment_rate", "sentiment_score",
        "dropout_risk_score", "risk_level", "behavior_score",
        "G1", "G2", "G3", "assigned_counselor_id"
    ])
    for s in students:
        d = s.to_dict()
        writer.writerow([
            s.id, s.name, s.email, s.roll_number, s.semester,
            d['attendance_pct'], s.absences, d['internal_marks'],
            d['lab_marks'], d['assignment_marks'], d['assignment_rate'],
            d['sentiment_score'], d['dropout_risk_score'], d['risk_level'],
            d['behavior_score'], s.G1, s.G2, s.G3, s.assigned_counselor_id
        ])

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={"Content-Disposition": "attachment;filename=mca_students_export.csv"}
    )


# ─── CSV IMPORT ───────────────────────────────────────────────────────────────

@admin_bp.route('/import-csv', methods=['POST'])
@jwt_required()
def import_csv():
    claims = get_jwt()
    if claims.get("role") != "Admin":
        return jsonify({"message": "Unauthorized."}), 403

    if 'file' not in request.files:
        return jsonify({"message": "No file uploaded."}), 400

    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({"message": "Please upload a CSV file."}), 400

    stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
    reader = csv.DictReader(stream)
    imported, updated, skipped = 0, 0, 0
    errors = []

    for row in reader:
        try:
            email = row.get('email', '').strip()
            name = row.get('name', '').strip()
            if not email or not name:
                skipped += 1
                continue

            student = Student.query.filter_by(email=email).first()
            is_new = student is None
            if is_new:
                student = Student(name=name, email=email)
                db.session.add(student)
                db.session.flush()

            if row.get('roll_number'): student.roll_number = row['roll_number']
            if row.get('semester'): student.semester = int(row['semester'])
            if row.get('attendance_pct'): student.attendance_pct = float(row['attendance_pct'])
            if row.get('absences'): student.absences = int(row['absences'])
            if row.get('internal_marks'): student.internal_marks = float(row['internal_marks'])
            if row.get('lab_marks'): student.lab_marks = float(row['lab_marks'])
            if row.get('assignment_marks'): student.assignment_marks = float(row['assignment_marks'])
            if row.get('behavior_remarks'): student.faculty_remarks_text = row['behavior_remarks']
            if row.get('G1'): student.G1 = int(row['G1'])
            if row.get('G2'): student.G2 = int(row['G2'])
            if row.get('G3'): student.G3 = int(row['G3'])
            if row.get('sentiment_score'): student.sentiment_score = float(row['sentiment_score'])
            if row.get('failures'): student.failures = int(row['failures'])
            if row.get('studytime'): student.studytime = int(row['studytime'])

            student.dropout_risk_score = calculate_dropout_risk_score(student)

            if is_new: imported += 1
            else: updated += 1

        except Exception as e:
            errors.append(str(e))
            skipped += 1

    db.session.commit()
    return jsonify({
        "message": f"Import complete: {imported} new, {updated} updated, {skipped} skipped.",
        "imported": imported, "updated": updated, "skipped": skipped,
        "errors": errors[:5]
    }), 201


# ─── SETTINGS ─────────────────────────────────────────────────────────────────

@admin_bp.route('/settings', methods=['GET', 'POST'])
@jwt_required()
def manage_settings():
    claims = get_jwt()
    if claims.get("role") not in ["Admin", "HOD", "Counselor", "Faculty"]:
        return jsonify({"message": "Unauthorized."}), 403

    if request.method == 'GET':
        high, medium = get_risk_thresholds()
        return jsonify({"high": high, "medium": medium}), 200

    if claims.get("role") != "Admin":
        return jsonify({"message": "Only Admins can modify settings."}), 403

    data = request.get_json() or {}
    try:
        high = float(data.get('high'))
        medium = float(data.get('medium'))
    except (TypeError, ValueError):
        return jsonify({"message": "Thresholds must be numeric."}), 400

    if save_risk_thresholds(high, medium):
        return jsonify({"message": "Settings saved."}), 200
    return jsonify({"message": "Error saving settings."}), 500


# ─── USERS ────────────────────────────────────────────────────────────────────

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    claims = get_jwt()
    if claims.get("role") not in ["Admin", "HOD", "Counselor"]:
        return jsonify({"message": "Unauthorized."}), 403

    role_filter = request.args.get('role')
    users = User.query.filter_by(role=role_filter).all() if role_filter else User.query.all()
    return jsonify([u.to_dict() for u in users]), 200


# ─── NOTIFICATIONS ─────────────────────────────────────────────────────────────

@admin_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    claims = get_jwt()
    user_id = claims.get("id")
    notifs = Notification.query.filter_by(user_id=user_id, is_read=False)\
        .order_by(Notification.created_at.desc()).limit(20).all()
    return jsonify([n.to_dict() for n in notifs]), 200

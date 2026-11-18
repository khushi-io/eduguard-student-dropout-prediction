from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from models import db, Student, Attendance, User, Notification, MarksRecord, FacultyRemark
from routes.students import calculate_dropout_risk_score
import datetime, csv, io

faculty_bp = Blueprint('faculty', __name__)

MCA_SUBJECTS = ['MCA-101 Data Structures', 'MCA-102 OOPs with Java', 'MCA-103 DBMS', 'MCA-104 Computer Networks']


def require_faculty(claims):
    return claims.get("role") in ["Faculty", "Admin"]


# ─── ATTENDANCE ────────────────────────────────────────────────────────────────

@faculty_bp.route('/attendance', methods=['POST'])
@jwt_required()
def submit_attendance():
    claims = get_jwt()
    if not require_faculty(claims):
        return jsonify({"message": "Unauthorized."}), 403

    faculty_id = claims.get("id")
    data = request.get_json() or {}
    class_name = data.get('class_name', 'MCA General')
    marked_date_str = data.get('marked_date')
    records = data.get('records', [])

    if not records:
        return jsonify({"message": "No attendance records provided."}), 400

    marked_date = datetime.datetime.strptime(marked_date_str, "%Y-%m-%d").date() \
        if marked_date_str else datetime.date.today()

    updated = []
    for rec in records:
        s_id, status = rec.get('student_id'), rec.get('status')
        if not s_id or not status:
            continue
        student = Student.query.get(s_id)
        if not student:
            continue

        existing = Attendance.query.filter_by(student_id=s_id, date=marked_date).first()
        if existing:
            existing.status = status
            existing.marked_by = faculty_id
        else:
            db.session.add(Attendance(student_id=s_id, date=marked_date,
                                      status=status, subject=class_name, marked_by=faculty_id))

        db.session.flush()
        logs = Attendance.query.filter_by(student_id=s_id).all()
        total = len(logs)
        presents = sum(1 for l in logs if l.status == 'Present')
        student.attendance_pct = (presents / total * 100) if total > 0 else 90.0
        student.absences = total - presents
        student.dropout_risk_score = calculate_dropout_risk_score(student)

        if status == 'Absent':
            sorted_logs = sorted(logs, key=lambda x: x.date, reverse=True)
            consec = 0
            for l in sorted_logs:
                if l.status == 'Absent':
                    consec += 1
                else:
                    break
            if consec >= 3:
                msg = f"AI Flag: {student.name} absent for {consec} consecutive classes!"
                if not Notification.query.filter_by(student_id=s_id, message=msg).first():
                    c = User.query.filter_by(role='Counselor').first()
                    db.session.add(Notification(user_id=c.id if c else faculty_id,
                                                 student_id=s_id, message=msg, type="danger"))

        updated.append({"student_id": s_id, "name": student.name,
                         "attendance_pct": round(student.attendance_pct, 1),
                         "risk_score": round(student.dropout_risk_score, 1)})

    db.session.commit()
    return jsonify({"message": f"Attendance recorded for {len(updated)} students.",
                    "class": class_name, "date": marked_date.isoformat(), "students": updated}), 201


@faculty_bp.route('/history', methods=['GET'])
@jwt_required()
def get_attendance_history():
    claims = get_jwt()
    if not require_faculty(claims):
        return jsonify({"message": "Unauthorized."}), 403

    logs = Attendance.query.order_by(Attendance.date.desc()).all()
    grouped = {}
    for l in logs:
        ds = l.date.isoformat()
        if ds not in grouped:
            grouped[ds] = {"date": ds, "total_students": 0, "present_count": 0,
                           "absent_count": 0, "records": []}
        s = Student.query.get(l.student_id)
        grouped[ds]["total_students"] += 1
        if l.status == 'Present':
            grouped[ds]["present_count"] += 1
        else:
            grouped[ds]["absent_count"] += 1
        grouped[ds]["records"].append({"student_id": l.student_id,
                                        "name": s.name if s else "Unknown", "status": l.status})
    return jsonify(list(grouped.values())), 200


# ─── STUDENTS OVERVIEW ─────────────────────────────────────────────────────────

@faculty_bp.route('/students', methods=['GET'])
@jwt_required()
def get_faculty_students():
    claims = get_jwt()
    if not require_faculty(claims):
        return jsonify({"message": "Unauthorized."}), 403
    students = Student.query.order_by(Student.dropout_risk_score.desc()).all()
    return jsonify([s.to_dict() for s in students]), 200


# ─── MARKS ────────────────────────────────────────────────────────────────────

@faculty_bp.route('/marks', methods=['POST'])
@jwt_required()
def submit_marks():
    claims = get_jwt()
    if not require_faculty(claims):
        return jsonify({"message": "Unauthorized."}), 403

    faculty_id = claims.get("id")
    data = request.get_json() or {}
    records = data.get('records', [data])  # accept single or batch

    saved = []
    for rec in records:
        s_id = rec.get('student_id')
        exam_type = rec.get('exam_type', 'internal')
        subject = rec.get('subject', 'MCA-101 Data Structures')
        marks_obtained = rec.get('marks_obtained')
        max_marks = rec.get('max_marks', 30.0)

        if not s_id or marks_obtained is None:
            continue
        student = Student.query.get(s_id)
        if not student:
            continue

        mr = MarksRecord(student_id=s_id, faculty_id=faculty_id,
                         exam_type=exam_type, subject=subject,
                         marks_obtained=float(marks_obtained), max_marks=float(max_marks))
        db.session.add(mr)

        # Update student summary fields
        if exam_type == 'internal':
            student.internal_marks = float(marks_obtained)
            student.G3 = int(marks_obtained * 20 / max_marks) if max_marks > 0 else student.G3
        elif exam_type == 'lab':
            student.lab_marks = float(marks_obtained)
        elif exam_type == 'assignment':
            student.assignment_marks = float(marks_obtained)
            total_sub = max(1, len([r for r in student.submissions]))
            student.assignment_rate = min(100.0, float(marks_obtained) / max_marks * 100)

        student.dropout_risk_score = calculate_dropout_risk_score(student)
        saved.append({"student_id": s_id, "subject": subject, "marks": marks_obtained})

    db.session.commit()
    return jsonify({"message": f"{len(saved)} marks record(s) saved.", "saved": saved}), 201


@faculty_bp.route('/marks', methods=['GET'])
@jwt_required()
def get_marks():
    claims = get_jwt()
    if not require_faculty(claims):
        return jsonify({"message": "Unauthorized."}), 403

    s_id = request.args.get('student_id')
    if s_id:
        records = MarksRecord.query.filter_by(student_id=s_id).order_by(MarksRecord.recorded_at.desc()).all()
    else:
        records = MarksRecord.query.order_by(MarksRecord.recorded_at.desc()).limit(200).all()
    return jsonify([r.to_dict() for r in records]), 200


# ─── FACULTY REMARKS ──────────────────────────────────────────────────────────

@faculty_bp.route('/remark', methods=['POST'])
@jwt_required()
def add_remark():
    claims = get_jwt()
    if not require_faculty(claims):
        return jsonify({"message": "Unauthorized."}), 403

    faculty_id = claims.get("id")
    data = request.get_json() or {}
    s_id = data.get('student_id')
    remark_type = data.get('remark_type', 'behavior')
    content = data.get('content', '')
    is_flagged = data.get('is_flagged', remark_type in ['concern', 'intervention'])

    if not s_id or not content:
        return jsonify({"message": "student_id and content required."}), 400

    student = Student.query.get(s_id)
    if not student:
        return jsonify({"message": "Student not found."}), 404

    remark = FacultyRemark(student_id=s_id, faculty_id=faculty_id,
                            remark_type=remark_type, content=content, is_flagged=is_flagged)
    db.session.add(remark)

    # Update student's latest remark summary
    student.faculty_remarks_text = content

    # Adjust behavior score
    if remark_type == 'improvement':
        student.behavior_score = min(5.0, student.behavior_score + 0.3)
    elif remark_type == 'concern':
        student.behavior_score = max(1.0, student.behavior_score - 0.3)

    student.dropout_risk_score = calculate_dropout_risk_score(student)

    # Notify counsellor if flagged
    if is_flagged:
        c = student.assigned_counselor_id and User.query.get(student.assigned_counselor_id) \
            or User.query.filter_by(role='Counselor').first()
        if c:
            db.session.add(Notification(user_id=c.id, student_id=s_id,
                message=f"Faculty flagged {student.name}: {content[:80]}...", type="warning"))

    db.session.commit()
    return jsonify({"message": "Remark logged.", "remark": remark.to_dict()}), 201


@faculty_bp.route('/remarks', methods=['GET'])
@jwt_required()
def get_remarks():
    claims = get_jwt()
    if claims.get("role") not in ["Faculty", "Admin", "Counselor", "HOD"]:
        return jsonify({"message": "Unauthorized."}), 403

    s_id = request.args.get('student_id')
    flagged_only = request.args.get('flagged') == 'true'

    q = FacultyRemark.query
    if s_id:
        q = q.filter_by(student_id=s_id)
    if flagged_only:
        q = q.filter_by(is_flagged=True)
    remarks = q.order_by(FacultyRemark.created_at.desc()).all()
    return jsonify([r.to_dict() for r in remarks]), 200


# ─── CSV UPLOAD ───────────────────────────────────────────────────────────────

@faculty_bp.route('/upload-csv', methods=['POST'])
@jwt_required()
def upload_csv():
    claims = get_jwt()
    if not require_faculty(claims):
        return jsonify({"message": "Unauthorized."}), 403

    if 'file' not in request.files:
        return jsonify({"message": "No file uploaded."}), 400

    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({"message": "Please upload a CSV file."}), 400

    stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
    reader = csv.DictReader(stream)
    imported, skipped = 0, 0

    for row in reader:
        email = row.get('email', '').strip()
        name = row.get('name', '').strip()
        if not email or not name:
            skipped += 1
            continue

        student = Student.query.filter_by(email=email).first()
        if not student:
            student = Student(name=name, email=email)
            db.session.add(student)
            db.session.flush()

        # Update fields from CSV
        if row.get('attendance_pct'): student.attendance_pct = float(row['attendance_pct'])
        if row.get('internal_marks'): student.internal_marks = float(row['internal_marks'])
        if row.get('lab_marks'): student.lab_marks = float(row['lab_marks'])
        if row.get('assignment_marks'): student.assignment_marks = float(row['assignment_marks'])
        if row.get('absences'): student.absences = int(row['absences'])
        if row.get('behavior_remarks'): student.faculty_remarks_text = row['behavior_remarks']
        if row.get('semester'): student.semester = int(row['semester'])
        if row.get('roll_number'): student.roll_number = row['roll_number']

        student.dropout_risk_score = calculate_dropout_risk_score(student)
        imported += 1

    db.session.commit()
    return jsonify({"message": f"CSV processed: {imported} updated, {skipped} skipped.",
                    "imported": imported, "skipped": skipped}), 201

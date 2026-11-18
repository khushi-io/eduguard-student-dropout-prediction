import datetime
from models import (db, User, Student, Attendance, Submission, MoodLog,
                    Intervention, CounselorNote, Achievement, Notification,
                    FacultyRemark, CounsellingSession, MarksRecord)

MCA_SUBJECTS = ['MCA-101 Data Structures', 'MCA-102 OOPs with Java', 'MCA-103 DBMS', 'MCA-104 Computer Networks']

def seed_database():
    if User.query.filter_by(username='admin').first():
        print("Database already seeded.")
        return

    print("Seeding MCA Intelligence Platform database...")

    # ── 1. USERS ──────────────────────────────────────────────────────────────
    admin = User(username='admin', email='admin@mca.edu', role='Admin')
    admin.set_password('admin123')

    counselor = User(username='counselor', email='counselor@mca.edu', role='Counselor')
    counselor.set_password('counselor123')

    hod = User(username='hod', email='hod@mca.edu', role='HOD')
    hod.set_password('hod123')

    faculty = User(username='faculty', email='faculty@mca.edu', role='Faculty')
    faculty.set_password('faculty123')

    student_user = User(username='student', email='student@mca.edu', role='Student')
    student_user.set_password('student123')

    db.session.add_all([admin, counselor, hod, faculty, student_user])
    db.session.commit()
    print("[OK] Users seeded")

    # ── 2. MCA STUDENTS ───────────────────────────────────────────────────────
    students_data = [
        # HIGH RISK
        {
            "name": "Rahul Verma", "email": "rahul.verma@mca.edu", "roll_number": "MCA2024001", "semester": 2,
            "age": 22, "sex": "M", "address": "U", "failures": 2, "studytime": 1,
            "goout": 4, "Dalc": 2, "Walc": 3, "absences": 18,
            "G1": 9, "G2": 8, "G3": 7, "internal_marks": 14.0, "lab_marks": 10.0, "assignment_marks": 12.0,
            "attendance_pct": 48.0, "assignment_rate": 30.0, "sentiment_score": -0.55,
            "dropout_risk_score": 87.5, "behavior_score": 1.5,
            "faculty_remarks_text": "Student frequently absent, disengaged in class.",
            "user_id": student_user.id
        },
        {
            "name": "Rohan Mehra", "email": "rohan.mehra@mca.edu", "roll_number": "MCA2024007", "semester": 2,
            "age": 23, "sex": "M", "address": "R", "failures": 2, "studytime": 1,
            "goout": 5, "Dalc": 2, "Walc": 4, "absences": 20,
            "G1": 7, "G2": 6, "G3": 5, "internal_marks": 11.0, "lab_marks": 9.0, "assignment_marks": 8.0,
            "attendance_pct": 42.0, "assignment_rate": 18.0, "sentiment_score": -0.70,
            "dropout_risk_score": 91.2, "behavior_score": 1.2,
            "faculty_remarks_text": "Extremely concerning — missed 3 weeks consecutively.",
            "user_id": None
        },
        {
            "name": "Arjun Sharma", "email": "arjun.sharma@mca.edu", "roll_number": "MCA2024003", "semester": 2,
            "age": 22, "sex": "M", "address": "R", "failures": 1, "studytime": 1,
            "goout": 4, "Dalc": 2, "Walc": 3, "absences": 13,
            "G1": 10, "G2": 9, "G3": 8, "internal_marks": 16.0, "lab_marks": 13.0, "assignment_marks": 14.0,
            "attendance_pct": 58.0, "assignment_rate": 42.0, "sentiment_score": -0.45,
            "dropout_risk_score": 74.8, "behavior_score": 2.0,
            "faculty_remarks_text": "Shows potential but attendance is a serious concern.",
            "user_id": None
        },
        # MEDIUM RISK
        {
            "name": "Sneha Reddy", "email": "sneha.reddy@mca.edu", "roll_number": "MCA2024002", "semester": 2,
            "age": 21, "sex": "F", "address": "U", "failures": 0, "studytime": 2,
            "goout": 3, "Dalc": 1, "Walc": 1, "absences": 7,
            "G1": 13, "G2": 12, "G3": 12, "internal_marks": 20.0, "lab_marks": 17.0, "assignment_marks": 18.0,
            "attendance_pct": 76.0, "assignment_rate": 72.0, "sentiment_score": -0.18,
            "dropout_risk_score": 44.2, "behavior_score": 3.0,
            "faculty_remarks_text": "Participates but seems stressed about exams.",
            "user_id": None
        },
        {
            "name": "Anjali Das", "email": "anjali.das@mca.edu", "roll_number": "MCA2024006", "semester": 2,
            "age": 21, "sex": "F", "address": "U", "failures": 0, "studytime": 2,
            "goout": 3, "Dalc": 1, "Walc": 1, "absences": 8,
            "G1": 12, "G2": 12, "G3": 11, "internal_marks": 19.0, "lab_marks": 16.0, "assignment_marks": 17.0,
            "attendance_pct": 72.0, "assignment_rate": 65.0, "sentiment_score": 0.05,
            "dropout_risk_score": 39.5, "behavior_score": 3.2,
            "faculty_remarks_text": "Consistent performance but missing lab assignments.",
            "user_id": None
        },
        {
            "name": "Divya Teja", "email": "divya.teja@mca.edu", "roll_number": "MCA2024009", "semester": 2,
            "age": 22, "sex": "F", "address": "R", "failures": 1, "studytime": 2,
            "goout": 3, "Dalc": 1, "Walc": 2, "absences": 9,
            "G1": 11, "G2": 10, "G3": 9, "internal_marks": 17.0, "lab_marks": 14.0, "assignment_marks": 15.0,
            "attendance_pct": 70.0, "assignment_rate": 68.0, "sentiment_score": -0.10,
            "dropout_risk_score": 56.1, "behavior_score": 2.8,
            "faculty_remarks_text": "Struggling with practical subjects, needs guidance.",
            "user_id": None
        },
        # LOW RISK / SAFE
        {
            "name": "Priya Patel", "email": "priya.patel@mca.edu", "roll_number": "MCA2024004", "semester": 2,
            "age": 21, "sex": "F", "address": "U", "failures": 0, "studytime": 4,
            "goout": 2, "Dalc": 1, "Walc": 1, "absences": 1,
            "G1": 28, "G2": 27, "G3": 29, "internal_marks": 28.5, "lab_marks": 24.0, "assignment_marks": 24.5,
            "attendance_pct": 97.0, "assignment_rate": 100.0, "sentiment_score": 0.78,
            "dropout_risk_score": 6.2, "behavior_score": 5.0,
            "faculty_remarks_text": "Exceptional student — class topper.",
            "user_id": None
        },
        {
            "name": "Vikram Malhotra", "email": "vikram.malhotra@mca.edu", "roll_number": "MCA2024005", "semester": 2,
            "age": 22, "sex": "M", "address": "U", "failures": 0, "studytime": 3,
            "goout": 3, "Dalc": 1, "Walc": 2, "absences": 2,
            "G1": 22, "G2": 21, "G3": 22, "internal_marks": 25.0, "lab_marks": 22.0, "assignment_marks": 23.0,
            "attendance_pct": 92.0, "assignment_rate": 92.0, "sentiment_score": 0.45,
            "dropout_risk_score": 11.8, "behavior_score": 4.5,
            "faculty_remarks_text": "Hardworking, good lab performance.",
            "user_id": None
        },
        {
            "name": "Karan Johar", "email": "karan.johar@mca.edu", "roll_number": "MCA2024008", "semester": 2,
            "age": 21, "sex": "M", "address": "U", "failures": 0, "studytime": 2,
            "goout": 4, "Dalc": 1, "Walc": 2, "absences": 4,
            "G1": 18, "G2": 17, "G3": 17, "internal_marks": 22.0, "lab_marks": 20.0, "assignment_marks": 21.0,
            "attendance_pct": 84.0, "assignment_rate": 80.0, "sentiment_score": 0.28,
            "dropout_risk_score": 27.3, "behavior_score": 4.0,
            "faculty_remarks_text": "Good student, participates well.",
            "user_id": None
        },
    ]

    student_instances = []
    for sv in students_data:
        c_id = counselor.id if sv["dropout_risk_score"] > 35 else None
        s = Student(
            name=sv["name"], email=sv["email"], roll_number=sv["roll_number"], semester=sv["semester"],
            age=sv["age"], sex=sv["sex"], address=sv["address"],
            failures=sv["failures"], studytime=sv["studytime"], goout=sv["goout"],
            Dalc=sv["Dalc"], Walc=sv["Walc"], absences=sv["absences"],
            G1=sv["G1"], G2=sv["G2"], G3=sv["G3"],
            internal_marks=sv["internal_marks"], lab_marks=sv["lab_marks"],
            assignment_marks=sv["assignment_marks"], behavior_score=sv["behavior_score"],
            attendance_pct=sv["attendance_pct"], assignment_rate=sv["assignment_rate"],
            sentiment_score=sv["sentiment_score"], dropout_risk_score=sv["dropout_risk_score"],
            faculty_remarks_text=sv["faculty_remarks_text"],
            assigned_counselor_id=c_id, user_id=sv["user_id"],
            last_seen_date=datetime.datetime.utcnow() - datetime.timedelta(days=int(sv["absences"]/2))
        )
        db.session.add(s)
        student_instances.append(s)

    db.session.commit()
    print("[OK] Students seeded")

    # ── 3. ATTENDANCE, MARKS, MOOD, SUBMISSIONS, REMARKS, SESSIONS ───────────
    today = datetime.date.today()

    for s in student_instances:
        # Attendance — last 10 days
        for i in range(10):
            day = today - datetime.timedelta(days=i)
            status = "Absent" if (s.attendance_pct < 60 and i in [0, 1, 3, 5, 7]) \
                     else "Absent" if (s.attendance_pct < 80 and i in [2]) \
                     else "Present"
            att = Attendance(student_id=s.id, date=day, status=status,
                             subject='MCA-101 Data Structures', marked_by=faculty.id)
            db.session.add(att)

        # Marks Records
        for subj in MCA_SUBJECTS:
            base = s.internal_marks
            mr = MarksRecord(
                student_id=s.id, faculty_id=faculty.id,
                exam_type='internal', subject=subj,
                marks_obtained=max(5.0, base + (hash(subj) % 5) - 2),
                max_marks=30.0
            )
            db.session.add(mr)
            lab_mr = MarksRecord(
                student_id=s.id, faculty_id=faculty.id,
                exam_type='lab', subject=subj,
                marks_obtained=max(3.0, s.lab_marks + (hash(subj+'l') % 4) - 2),
                max_marks=25.0
            )
            db.session.add(lab_mr)

        # Mood logs
        if s.dropout_risk_score > 60:
            moods = [
                MoodLog(student_id=s.id, mood_rating=1, text_log="Struggling a lot, very overwhelmed.", sentiment_score=-0.65, recorded_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)),
                MoodLog(student_id=s.id, mood_rating=2, text_log="Not doing well, missing classes.", sentiment_score=-0.4, recorded_at=datetime.datetime.utcnow() - datetime.timedelta(days=3)),
            ]
        elif s.dropout_risk_score > 35:
            moods = [
                MoodLog(student_id=s.id, mood_rating=3, text_log="Managing but feeling stressed.", sentiment_score=-0.1, recorded_at=datetime.datetime.utcnow() - datetime.timedelta(days=2)),
            ]
        else:
            moods = [
                MoodLog(student_id=s.id, mood_rating=5, text_log="Feeling great! Ready for exams.", sentiment_score=0.8, recorded_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)),
            ]
        for m in moods:
            db.session.add(m)

        # Submissions
        for i, subj in enumerate(MCA_SUBJECTS):
            stat = "Submitted" if (s.assignment_rate > 50 or i < 2) else "Pending"
            db.session.add(Submission(student_id=s.id, assignment_name=f"{subj} Assignment",
                                      subject=subj, status=stat,
                                      submitted_at=datetime.datetime.utcnow() - datetime.timedelta(days=i*5)))

        # Faculty Remarks
        if s.dropout_risk_score > 60:
            rtype = 'concern'
            is_flagged = True
        elif s.dropout_risk_score > 35:
            rtype = 'behavior'
            is_flagged = False
        else:
            rtype = 'improvement'
            is_flagged = False

        fr = FacultyRemark(
            student_id=s.id, faculty_id=faculty.id,
            remark_type=rtype, content=s.faculty_remarks_text or "No remarks.",
            is_flagged=is_flagged,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=2)
        )
        db.session.add(fr)

        # Counselling Sessions for high-risk
        if s.dropout_risk_score > 60:
            session1 = CounsellingSession(
                student_id=s.id, counselor_id=counselor.id,
                session_date=datetime.datetime.utcnow() - datetime.timedelta(days=10),
                diagnosis="Student is experiencing academic pressure and transport difficulties.",
                action_taken="Scheduled weekly check-in. Referred to academic remediation.",
                student_response="Responsive but says commuting is a major barrier.",
                follow_up_date=(today + datetime.timedelta(days=7)),
                session_status="Follow-up",
                notes="Monitor attendance closely over next 2 weeks."
            )
            db.session.add(session1)

            # Legacy counselor note for compatibility
            note = CounselorNote(
                student_id=s.id, counselor_id=counselor.id,
                note=f"{s.name} is showing alarming dropout indicators. Risk: {s.dropout_risk_score}%. Initial session completed.",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=10)
            )
            db.session.add(note)

            interv = Intervention(
                student_id=s.id, counselor_id=counselor.id,
                action_taken="Scheduled academic review and mentoring session",
                student_response="Willing to attend but needs transport support",
                status="Active"
            )
            db.session.add(interv)

            # Notifications
            db.session.add(Notification(user_id=counselor.id, student_id=s.id,
                message=f"Critical: {s.name}'s dropout risk is {s.dropout_risk_score}%!", type="danger"))
            db.session.add(Notification(user_id=admin.id, student_id=s.id,
                message=f"Alert: {s.name} is at {s.dropout_risk_score}% risk.", type="danger"))

        # Achievements for safe students
        if s.dropout_risk_score < 15:
            db.session.add(Achievement(student_id=s.id, badge_name="Perfect Attendance", badge_type="attendance"))
            db.session.add(Achievement(student_id=s.id, badge_name="Assignment Champion", badge_type="assignment"))
            db.session.add(Achievement(student_id=s.id, badge_name="Academic Excellence", badge_type="academic"))
        elif s.dropout_risk_score < 30:
            db.session.add(Achievement(student_id=s.id, badge_name="Consistent Performer", badge_type="academic"))

    db.session.commit()
    print("[OK] Full MCA dataset seeded successfully")

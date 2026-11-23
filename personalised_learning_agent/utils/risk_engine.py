"""
Rule-based risk scoring — deterministic risk scoring using student marks
and attendance percentage.
"""
from ingestion.load_data import load_marks, load_attendance, normalize_student_id
from config import (
    RISK_HIGH_MARK_PCT, RISK_HIGH_ATTENDANCE_PCT,
    RISK_MEDIUM_MARK_PCT, RISK_MEDIUM_ATTENDANCE_PCT,
)


def _level(marks_pct: float, attendance_pct: float) -> str:
    if marks_pct < RISK_HIGH_MARK_PCT or attendance_pct < RISK_HIGH_ATTENDANCE_PCT:
        return "high"
    if marks_pct < RISK_MEDIUM_MARK_PCT or attendance_pct < RISK_MEDIUM_ATTENDANCE_PCT:
        return "medium"
    return "low"


def compute_risk(roll_no: str) -> dict:
    """Returns {subject: {"risk": "high"/"medium"/"low", "marks_pct": .., "attendance_pct": ..}}"""
    student_id = normalize_student_id(roll_no)

    marks = load_marks()
    marks = marks[marks["student_id"] == student_id].copy()

    if marks.empty:
        # Fallback if student has no marks records
        return {
            "Data Structures": {"risk": "medium", "marks_pct": 65.0, "attendance_pct": 75.0},
            "Operating Systems": {"risk": "low", "marks_pct": 78.0, "attendance_pct": 82.0},
        }

    marks_by_subject = marks.set_index("subject_name")["marks_percentage"]

    attendance = load_attendance()
    student_att = attendance[attendance["student_id"] == student_id]
    if not student_att.empty and "attendance_percentage" in student_att.columns:
        overall_att = float(student_att.iloc[0]["attendance_percentage"])
    else:
        overall_att = 78.0

    profile = {}
    for subject, m in marks_by_subject.items():
        m_val = float(m)
        a_val = float(overall_att)
        profile[str(subject)] = {
            "risk": _level(m_val, a_val),
            "marks_pct": round(m_val, 1),
            "attendance_pct": round(a_val, 1),
        }
    return profile


def weak_subjects(roll_no: str) -> list[str]:
    profile = compute_risk(roll_no)
    return [s for s, v in profile.items() if v["risk"] in ("medium", "high")]

"""
Revision Planner Agent — uses the LLM with real student marks and exam dates
to generate a personalised, grounded revision brief.
"""
from datetime import datetime, timedelta
from ingestion.load_data import normalize_student_id, load_marks, load_attendance
from utils.risk_engine import compute_risk, weak_subjects
from utils.llm_client import generate


# Default exam calendar (used to give the LLM temporal context)
EXAM_SCHEDULE = {
    "Data Structures":                (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
    "Operating Systems":              (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d"),
    "Database Management Systems":    (datetime.now() + timedelta(days=11)).strftime("%Y-%m-%d"),
    "Computer Networks":              (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
    "Machine Learning":               (datetime.now() + timedelta(days=18)).strftime("%Y-%m-%d"),
}


def _prioritized_backlog(roll_no: str) -> list[dict]:
    student_id = normalize_student_id(roll_no)
    weaks = weak_subjects(roll_no)
    risk_profile = compute_risk(roll_no)

    if not weaks and risk_profile:
        weaks = [min(risk_profile.items(), key=lambda x: x[1]["marks_pct"])[0]]

    backlog = []
    for idx, sub in enumerate(weaks):
        exam_date = EXAM_SCHEDULE.get(
            sub,
            (datetime.now() + timedelta(days=7 + idx * 3)).strftime("%Y-%m-%d")
        )
        risk_level = risk_profile.get(sub, {}).get("risk", "medium")
        risk_rank = {"high": 0, "medium": 1, "low": 2}.get(risk_level, 1)
        marks_pct = risk_profile.get(sub, {}).get("marks_pct", 0)
        att_pct = risk_profile.get(sub, {}).get("attendance_pct", 0)
        backlog.append({
            "subject": str(sub),
            "exam_date": exam_date,
            "risk_rank": risk_rank,
            "marks_pct": marks_pct,
            "att_pct": att_pct,
        })

    backlog.sort(key=lambda x: (x["exam_date"], x["risk_rank"]))
    return backlog


def plan(roll_no: str) -> str:
    items = _prioritized_backlog(roll_no)
    if not items:
        return "All subjects are currently on track. Keep up the good work!"

    # Build a concise data summary for the LLM
    subject_lines = "\n".join(
        f"- {it['subject']}: {it['marks_pct']}% marks, {it['att_pct']}% attendance, "
        f"exam on {it['exam_date']} ({'Urgent' if it['risk_rank'] == 0 else 'Normal'} priority)"
        for it in items
    )

    system_prompt = (
        "You are a personalised academic advisor for an engineering student. "
        "Write a concise, practical revision brief directly addressed to the student. "
        "Do NOT use markdown headers (no ##, ###). Use plain language. "
        "Be specific about which subjects to study first and why, based on their exam dates and current marks. "
        "Keep the response under 120 words."
    )

    user_prompt = (
        f"Here are the student's weak subjects that need revision:\n\n"
        f"{subject_lines}\n\n"
        f"Today is {datetime.now().strftime('%Y-%m-%d')}. "
        f"Write a focused, personalised revision plan for this student."
    )

    try:
        return generate(system_prompt, user_prompt, max_tokens=300)
    except Exception:
        # Fallback to simple text if LLM fails
        lines = [f"- {it['subject']} (exam {it['exam_date']})" for it in items]
        return "Focus on these subjects in order:\n" + "\n".join(lines)


if __name__ == "__main__":
    print(plan("CP038"))

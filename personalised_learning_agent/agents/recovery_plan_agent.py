"""
Recovery Plan Agent — uses the LLM with the student's real subject marks
to generate a personalised, prioritised catch-up study plan for each weak subject.
"""
from ingestion.load_data import normalize_student_id, load_marks
from utils.risk_engine import compute_risk, weak_subjects
from utils.llm_client import generate


def build(roll_no: str) -> dict:
    """Returns {subject: {"risk": ..., "plan_text": ..., "topics": [topic names]}}"""
    student_id = normalize_student_id(roll_no)
    risk_profile = compute_risk(roll_no)
    weaks = weak_subjects(roll_no)

    if not weaks and risk_profile:
        lowest_sub = min(risk_profile.items(), key=lambda x: x[1]["marks_pct"])[0]
        weaks = [lowest_sub]

    # Load marks for subject-level breakdown
    marks_df = load_marks()
    student_marks = marks_df[marks_df["student_id"] == student_id]

    plan = {}
    for subject in weaks:
        risk_level = risk_profile.get(subject, {}).get("risk", "medium")
        marks_pct = risk_profile.get(subject, {}).get("marks_pct", 0)
        att_pct = risk_profile.get(subject, {}).get("attendance_pct", 0)

        system_prompt = (
            "You are a personalised academic advisor for an engineering student. "
            "Write a numbered study plan (3 steps) for the given subject, directly based on the student's marks. "
            "Each step should be: a specific topic to study, followed by a dash and one sentence explaining why it matters. "
            "Do NOT use markdown symbols like **, ##, or *. Use plain text only. "
            "Keep the total response under 100 words."
        )

        user_prompt = (
            f"Subject: {subject}\n"
            f"Student's current marks: {marks_pct}%\n"
            f"Attendance: {att_pct}%\n"
            f"Risk Level: {risk_level}\n\n"
            f"Create a 3-step catch-up plan for this student to improve in {subject}."
        )

        try:
            plan_text = generate(system_prompt, user_prompt, max_tokens=200)
        except Exception:
            plan_text = (
                f"1. Review foundational concepts in {subject}.\n"
                f"2. Practice previous exam questions.\n"
                f"3. Focus on highest-weightage topics."
            )

        # Extract topic names from the LLM output (first sentence of each numbered line)
        topics = []
        for line in plan_text.strip().split("\n"):
            line = line.strip()
            if line and line[0].isdigit():
                # Take only the topic part before the dash/period
                topic_part = line.split(".")[1].split("-")[0].strip() if "." in line else line
                if topic_part:
                    topics.append(topic_part[:60])  # cap length

        if not topics:
            topics = [f"Core concepts in {subject}"]

        plan[subject] = {
            "risk": risk_level,
            "plan_text": plan_text,
            "topics": topics,
        }

    return plan


if __name__ == "__main__":
    import json
    print(json.dumps(build("CP038"), indent=2))

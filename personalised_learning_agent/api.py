from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

from utils.risk_engine import compute_risk
from ingestion.load_data import (
    load_marks, load_attendance, load_students, normalize_student_id
)
from agents import (
    recovery_plan_agent,
    difficulty_adaptation_agent,
    resource_recommendation_agent,
    revision_planner_agent,
)
import chat_agent

app = FastAPI(title="Personalised Learning API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# STUDENT DATA ENDPOINTS
# ─────────────────────────────────────────────

@app.get("/api/students/{roll_no}/risk")
def get_risk(roll_no: str):
    return compute_risk(roll_no)


@app.get("/api/students/{roll_no}/recovery-plan")
def get_recovery_plan(roll_no: str):
    return recovery_plan_agent.build(roll_no)


@app.get("/api/students/{roll_no}/intensity")
def get_intensity(roll_no: str):
    plan = recovery_plan_agent.build(roll_no)
    return difficulty_adaptation_agent.adjust(plan)


@app.get("/api/students/{roll_no}/resources")
def get_resources(roll_no: str):
    plan = recovery_plan_agent.build(roll_no)
    return resource_recommendation_agent.recommend(plan)


@app.get("/api/students/{roll_no}/revision-plan")
def get_revision_plan(roll_no: str):
    return {
        "backlog": revision_planner_agent._prioritized_backlog(roll_no),
        "revision_text": revision_planner_agent.plan(roll_no),
    }


@app.get("/api/academic/performance/{roll_no}")
def get_academic_performance(roll_no: str):
    """Full academic profile for charts: subject scores, attendance, rank, dept comparison."""
    sid = normalize_student_id(roll_no)
    marks_df = load_marks()
    att_df = load_attendance()
    students_df = load_students()

    # ── Student subject scores ──
    student_marks = marks_df[marks_df["student_id"] == sid]
    subject_scores = (
        student_marks.groupby("subject_name")["marks_percentage"]
        .mean().round(1).sort_values().to_dict()
    )

    # ── Student attendance ──
    student_att = att_df[att_df["student_id"] == sid]
    attendance_info = {}
    if not student_att.empty:
        row = student_att.iloc[0]
        attendance_info = {
            "total_classes": int(row["total_classes"]),
            "present": int(row["present_count"]),
            "absent": int(row["absent_count"]),
            "late": int(row["late_count"]),
            "percentage": round(float(row["attendance_percentage"]), 1),
            "status": str(row["attendance_status"]),
            "risk": str(row["shortage_risk"]),
        }

    # ── Department subject averages for comparison ──
    dept_subject_avg = (
        marks_df.groupby("subject_name")["marks_percentage"]
        .mean().round(1).to_dict()
    )

    # ── Student rank (by overall avg marks) ──
    student_avgs = marks_df.groupby("student_id")["marks_percentage"].mean()
    sorted_avgs = student_avgs.sort_values(ascending=False).reset_index()
    rank = int(sorted_avgs[sorted_avgs["student_id"] == sid].index[0]) + 1 if sid in sorted_avgs["student_id"].values else None
    total_students = len(sorted_avgs)
    my_avg = round(float(student_avgs.get(sid, 0)), 1)

    # ── Dept-wide distribution buckets (for histogram) ──
    buckets = {"0-40": 0, "40-60": 0, "60-75": 0, "75-90": 0, "90-100": 0}
    for avg in student_avgs:
        if avg < 40: buckets["0-40"] += 1
        elif avg < 60: buckets["40-60"] += 1
        elif avg < 75: buckets["60-75"] += 1
        elif avg < 90: buckets["75-90"] += 1
        else: buckets["90-100"] += 1

    # ── Student name ──
    student_row = students_df[students_df["student_id"] == sid]
    name = str(student_row.iloc[0]["name"]) if not student_row.empty else roll_no

    return {
        "student_id": roll_no,
        "name": name,
        "overall_avg": my_avg,
        "rank": rank,
        "total_students": total_students,
        "subject_scores": subject_scores,
        "dept_subject_avg": dept_subject_avg,
        "attendance": attendance_info,
        "score_distribution": buckets,
    }


# ─────────────────────────────────────────────
# MENTOR / HOD SUMMARY ENDPOINTS (real CSV data)
# ─────────────────────────────────────────────

def _compute_department_summary(subject_filter: str = None):
    """Compute real department-wide stats from CSVs."""
    marks_df = load_marks()
    att_df = load_attendance()
    students_df = load_students()

    if subject_filter:
        marks_df = marks_df[marks_df["subject_name"] == subject_filter]

    total_students = len(students_df)
    avg_marks = round(marks_df["marks_percentage"].mean(), 1) if not marks_df.empty else 0
    avg_attendance = round(att_df["attendance_percentage"].mean(), 1) if not att_df.empty else 0

    # Risk distribution — classify each student's average marks
    student_avg = marks_df.groupby("student_id")["marks_percentage"].mean()
    high = int((student_avg < 40).sum())
    medium = int(((student_avg >= 40) & (student_avg < 60)).sum())
    low = int((student_avg >= 60).sum())

    # Subject-wise averages
    subject_avg = (
        marks_df.groupby("subject_name")["marks_percentage"]
        .mean()
        .round(1)
        .sort_values()
        .to_dict()
    )

    # Attendance risk counts
    at_risk_attendance = int((att_df["attendance_percentage"] < 75).sum()) if not att_df.empty else 0

    # Top 5 at-risk students (lowest avg marks)
    worst = (
        student_avg.nsmallest(5)
        .reset_index()
        .rename(columns={"student_id": "student_id", "marks_percentage": "avg_marks"})
    )
    # Map student IDs to names
    id_to_name = students_df.set_index("student_id")["name"].to_dict()
    at_risk_students = [
        {
            "student_id": row["student_id"],
            "name": id_to_name.get(row["student_id"], row["student_id"]),
            "avg_marks": round(row["avg_marks"], 1),
            "risk": "high" if row["avg_marks"] < 40 else "medium",
        }
        for _, row in worst.iterrows()
    ]

    return {
        "total_students": total_students,
        "avg_marks": avg_marks,
        "avg_attendance": avg_attendance,
        "risk_distribution": {"high": high, "medium": medium, "low": low},
        "subject_averages": subject_avg,
        "at_risk_attendance_count": at_risk_attendance,
        "at_risk_students": at_risk_students,
    }


@app.get("/api/mentor/summary")
def get_mentor_summary(subject: str = None):
    return _compute_department_summary(subject)


@app.get("/api/hod/summary")
def get_hod_summary():
    return _compute_department_summary()


@app.get("/api/students")
def list_students(subject: str = None):
    """Return all students with their avg marks and attendance."""
    students_df = load_students()
    marks_df = load_marks()
    att_df = load_attendance()

    if subject:
        marks_df = marks_df[marks_df["subject_name"] == subject]

    student_avg_marks = marks_df.groupby("student_id")["marks_percentage"].mean().round(1)
    student_avg_att = att_df.set_index("student_id")["attendance_percentage"] if not att_df.empty else {}

    result = []
    for _, row in students_df.iterrows():
        sid = row["student_id"]
        avg_m = float(student_avg_marks.get(sid, 0))
        avg_a = float(student_avg_att.get(sid, 0)) if hasattr(student_avg_att, "get") else 0
        result.append({
            "student_id": sid,
            "name": row["name"],
            "department": row.get("department", ""),
            "year": int(row.get("year", 0)) if pd.notna(row.get("year", None)) else 0,
            "avg_marks": avg_m,
            "avg_attendance": avg_a,
            "risk": "high" if avg_m < 40 else "medium" if avg_m < 60 else "low",
        })

    result.sort(key=lambda x: x["avg_marks"])
    return result


# ─────────────────────────────────────────────
# CHAT & PLACEMENT ENDPOINTS
# ─────────────────────────────────────────────

@app.get("/api/companies/student")
def list_companies():
    """Return mock companies with their eligibility criteria."""
    return [
        {
            "id": "c1",
            "name": "TechNova Solutions",
            "role": "Software Development Engineer",
            "ctc": "12 LPA",
            "min_avg_marks": 75.0,
            "allow_high_risk": False,
            "description": "Requires strong foundation in Data Structures and no high-risk subjects."
        },
        {
            "id": "c2",
            "name": "GlobalFinance",
            "role": "Data Analyst",
            "ctc": "8 LPA",
            "min_avg_marks": 65.0,
            "allow_high_risk": True,
            "description": "Looking for analytical skills. Moderate academic performance acceptable."
        },
        {
            "id": "c3",
            "name": "StartupX",
            "role": "Frontend Developer",
            "ctc": "6 LPA",
            "min_avg_marks": 50.0,
            "allow_high_risk": True,
            "description": "Focuses more on skills than academics. Lower cutoff."
        },
        {
            "id": "c4",
            "name": "Quantum AI",
            "role": "AI/ML Engineer",
            "ctc": "18 LPA",
            "min_avg_marks": 85.0,
            "allow_high_risk": False,
            "description": "Strict academic criteria. Requires 85% average and no backlogs or high-risk subjects."
        }
    ]

# Company catalogue — shared between /companies/student and /placement/eligibility
_COMPANIES = [
    {"id": "c1", "name": "TechNova Solutions", "role": "Software Development Engineer", "ctc": "12 LPA", "min_avg_marks": 75.0, "allow_high_risk": False, "description": "Strong CS fundamentals required. No academic backlogs."},
    {"id": "c2", "name": "GlobalFinance",      "role": "Data Analyst",                  "ctc": "8 LPA",  "min_avg_marks": 65.0, "allow_high_risk": True,  "description": "Analytical skills valued. Moderate academic performance acceptable."},
    {"id": "c3", "name": "StartupX",           "role": "Frontend Developer",            "ctc": "6 LPA",  "min_avg_marks": 50.0, "allow_high_risk": True,  "description": "Skills over grades. Low academic cutoff."},
    {"id": "c4", "name": "Quantum AI",         "role": "AI/ML Engineer",               "ctc": "18 LPA", "min_avg_marks": 85.0, "allow_high_risk": False, "description": "Strict criteria. Requires 85%+ average and no high-risk subjects."},
]


@app.get("/api/placement/eligibility")
def get_placement_eligibility(student_id: str):
    """
    Resolve any student ID (CP### or S###) to its canonical form,
    pull real marks & attendance from CSV, and return per-company
    eligibility + what the student is missing.
    """
    from ingestion.load_data import normalize_student_id as _norm

    canonical_id = _norm(student_id)          # CP005 → S005, CP038 → S038

    marks_df   = load_marks()
    att_df     = load_attendance()
    students_df = load_students()

    # ── Pull student marks ──────────────────────────
    student_marks = marks_df[marks_df["student_id"] == canonical_id]
    student_att   = att_df[att_df["student_id"] == canonical_id]

    if student_marks.empty:
        # Student exists in login system but not in the marks CSV.
        # Return a descriptive profile so the frontend stays useful.
        return {
            "student_id": canonical_id,
            "found": False,
            "avg_marks": None,
            "avg_attendance": None,
            "risk": "unknown",
            "subject_scores": [],
            "companies": [
                {**c, "eligible": False, "reasons": ["Academic records not yet available in the system."]}
                for c in _COMPANIES
            ],
        }

    avg_marks = round(float(student_marks["marks_percentage"].mean()), 1)
    avg_att   = round(float(student_att["attendance_percentage"].mean()), 1) if not student_att.empty else 0.0
    risk      = "high" if avg_marks < 40 else "medium" if avg_marks < 60 else "low"

    # Per-subject breakdown for the RAG explanation context
    subject_scores = (
        student_marks.groupby("subject_name")["marks_percentage"]
        .mean().round(1)
        .reset_index()
        .rename(columns={"marks_percentage": "avg"})
        .to_dict("records")
    )

    # ── Per-company eligibility ──────────────────────
    companies_result = []
    for c in _COMPANIES:
        reasons = []
        eligible = True

        if avg_marks < c["min_avg_marks"]:
            eligible = False
            gap = round(c["min_avg_marks"] - avg_marks, 1)
            reasons.append(
                f"Your average marks ({avg_marks}%) is {gap}% below the required {c['min_avg_marks']}%."
            )
            # Identify the weakest subjects dragging the average
            weak = sorted(subject_scores, key=lambda s: s["avg"])[:3]
            for s in weak:
                if s["avg"] < c["min_avg_marks"]:
                    reasons.append(
                        f"  — {s['subject_name']}: {s['avg']}% (needs improvement)"
                    )

        if not c["allow_high_risk"] and risk == "high":
            eligible = False
            reasons.append(
                f"Your overall risk level is '{risk}'. This company requires no high-risk subjects."
            )

        companies_result.append({
            **c,
            "eligible": eligible,
            "reasons": reasons,
        })

    return {
        "student_id": canonical_id,
        "found": True,
        "avg_marks": avg_marks,
        "avg_attendance": avg_att,
        "risk": risk,
        "subject_scores": subject_scores,
        "companies": companies_result,
    }


class ChatRequest(BaseModel):
    student_id: str
    question: str
    role: str = "Student"


@app.post("/api/chat")
def chat(req: ChatRequest):
    """Delegates to chat_agent: CSV context + Chroma RAG + OpenRouter LLM."""
    try:
        answer = chat_agent.answer_question(
            student_id=req.student_id,
            question=req.question,
            role=req.role,
        )
        return {"answer": answer}
    except Exception as e:
        return {"answer": f"⚠️ Error: {str(e)}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)


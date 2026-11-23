from ingestion.load_data import (
    get_valid_student_ids,
    load_attendance,
    load_hackathon_deadlines,
    load_marks,
    load_students,
    load_tasks,
    normalize_student_id,
)
from rag.retriever import semantic_search
from utils.llm_client import generate


def rows_for_student(dataframe, student_id: str):
    if "student_id" not in dataframe.columns:
        return dataframe.iloc[0:0]

    return dataframe[
        dataframe["student_id"] == student_id
    ]


def format_dataframe(dataframe, empty_message: str) -> str:
    if dataframe.empty:
        return empty_message

    return dataframe.to_string(index=False)


def get_student_context(student_id: str) -> str:
    student_id = normalize_student_id(student_id)

    students = load_students()
    student = rows_for_student(students, student_id)

    if student.empty:
        raise ValueError(
            f"Student ID {student_id} was not found."
        )

    marks = rows_for_student(
        load_marks(),
        student_id,
    )
    attendance = rows_for_student(
        load_attendance(),
        student_id,
    )
    tasks = rows_for_student(
        load_tasks(),
        student_id,
    )
    deadlines = rows_for_student(
        load_hackathon_deadlines(),
        student_id,
    )

    return f"""
STUDENT PROFILE
{format_dataframe(student, "No profile found")}

MARKS
{format_dataframe(marks, "No marks available")}

ATTENDANCE
{format_dataframe(attendance, "No attendance available")}

TASKS
{format_dataframe(tasks, "No tasks available")}

HACKATHON DEADLINES
{format_dataframe(deadlines, "No hackathon deadlines available")}
""".strip()


def get_department_context() -> str:
    """Build a department-wide summary for Mentor / HOD users."""
    marks = load_marks()
    att = load_attendance()
    students = load_students()

    total = len(students)
    avg_marks = round(marks["marks_percentage"].mean(), 1) if not marks.empty else 0
    avg_att = round(att["attendance_percentage"].mean(), 1) if not att.empty else 0

    # Per-subject averages
    subject_avg = (
        marks.groupby("subject_name")["marks_percentage"]
        .mean().round(1).to_dict()
    )

    # Risk distribution
    student_avgs = marks.groupby("student_id")["marks_percentage"].mean()
    high_risk = int((student_avgs < 40).sum())
    medium_risk = int(((student_avgs >= 40) & (student_avgs < 60)).sum())
    low_risk = int((student_avgs >= 60).sum())

    # Students at risk (bottom 10)
    at_risk = student_avgs.sort_values().head(10).reset_index()
    at_risk.columns = ["student_id", "avg_marks"]

    return f"""
DEPARTMENT OVERVIEW
Total students: {total}
Average marks: {avg_marks}%
Average attendance: {avg_att}%

RISK DISTRIBUTION
High risk (< 40%): {high_risk} students
Medium risk (40-60%): {medium_risk} students
Low risk (> 60%): {low_risk} students

SUBJECT-WISE AVERAGES
{subject_avg}

STUDENTS AT RISK (lowest 10 averages)
{at_risk.to_string(index=False)}
""".strip()


def answer_question(
    student_id: str,
    question: str,
    role: str = "Student",
) -> str:
    is_staff = role in ("Mentor", "HOD") or not student_id.strip().upper().startswith(("CP", "S"))

    if is_staff:
        # ── Mentor / HOD path ── no student lookup needed
        context = get_department_context()

        retrieved_results = semantic_search(
            query=question,
            k=8,
        )

        resource_context = "\n\n".join(
            f"Retrieved record {index}:\n"
            f"{content}\n"
            f"Metadata: {metadata}"
            for index, (content, metadata) in enumerate(
                retrieved_results,
                start=1,
            )
        )

        system_prompt = """
You are the CampusPulse academic assistant for faculty and administrators.

Answer the user's question using the supplied department overview
and retrieved CampusPulse records.

Rules:
1. Answer the question directly.
2. Use only the data supplied in the prompt.
3. Do not invent marks, percentages, or student names.
4. For department-level questions, summarize trends and risk distributions.
5. Identify students or subjects that need attention when relevant.
6. Provide actionable recommendations for improving outcomes.
7. Do not output a safety classification.
"""

        user_prompt = f"""
Role: {role}
User ID: {student_id}

Department information:
{context}

Relevant records retrieved from RAG:
{resource_context}

User's question:
{question}
"""
    else:
        # ── Student path ── original logic
        student_id = normalize_student_id(student_id)
        student_context = get_student_context(student_id)

        retrieved_results = semantic_search(
            query=f"{student_id} {question}",
            k=8,
        )

        resource_context = "\n\n".join(
            f"Retrieved record {index}:\n"
            f"{content}\n"
            f"Metadata: {metadata}"
            for index, (content, metadata) in enumerate(
                retrieved_results,
                start=1,
            )
        )

        system_prompt = """
You are the CampusPulse personalised learning assistant.

Answer the student's question using the supplied student
profile, marks, attendance, tasks, hackathon deadlines and
retrieved CampusPulse records.

Rules:
1. Answer the question directly.
2. Use only the data supplied in the prompt.
3. Do not invent marks, percentages, tasks or deadlines.
4. Mention exact values when they are available.
5. Clearly distinguish completed and pending tasks.
6. For study-priority questions, compare marks percentages.
7. For attendance questions, use attendance_percentage,
   shortage_risk and attendance_status.
8. For deadline questions, mention the task, deadline,
   days left, priority and status.
9. Provide practical and personalised recommendations.
10. Do not output a safety classification.
"""

        user_prompt = f"""
Student ID: {student_id}

Student information:
{student_context}

Relevant records retrieved from RAG:
{resource_context}

Student's question:
{question}
"""

    answer = generate(
        system_prompt,
        user_prompt,
        max_tokens=1200,
    )

    invalid_answers = {
        "safe",
        "unsafe",
        "user safety: safe",
        "user safety: unsafe",
    }

    if answer.strip().lower() in invalid_answers:
        answer = generate(
            system_prompt,
            user_prompt
            + "\nGive the academic answer directly. "
            + "Do not provide a safety classification.",
            max_tokens=1200,
        )

    return answer


def request_valid_student_id() -> str:
    valid_ids = get_valid_student_ids()

    while True:
        student_id = normalize_student_id(
            input("Enter your student ID: ")
        )

        if student_id in valid_ids:
            return student_id

        print(
            "\nStudent ID not found. "
            "Please enter a valid student ID."
        )
        print(
            "Examples:",
            ", ".join(valid_ids[:10]),
            "\n",
        )


def start_chat() -> None:
    print("\nCampusPulse Personalised Learning Agent")
    print("---------------------------------------")

    student_id = request_valid_student_id()

    print(f"\nLogged in as: {student_id}")
    print("Type your questions below.")
    print("Type 'exit' to stop the chat.\n")

    while True:
        question = input("You: ").strip()

        if question.lower() in {
            "exit",
            "quit",
            "stop",
        }:
            print("Agent: Goodbye!")
            break

        if not question:
            print(
                "Agent: Please enter a question."
            )
            continue

        try:
            answer = answer_question(
                student_id,
                question,
            )
            print(f"\nAgent: {answer}\n")

        except Exception as error:
            print(f"\nError: {error}\n")


if __name__ == "__main__":
    start_chat()
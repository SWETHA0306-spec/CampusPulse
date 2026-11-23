from pathlib import Path

import pandas as pd

from config import CSV_PATHS


def _read(path: Path) -> pd.DataFrame:
    """Read a CSV or Excel dataset."""

    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found: {path}\n"
            "Place the required file inside the data folder."
        )

    if path.suffix.lower() in {".xlsx", ".xls"}:
        dataframe = pd.read_excel(path)
    else:
        dataframe = pd.read_csv(path)

    dataframe.columns = [
        str(column).strip().lower()
        for column in dataframe.columns
    ]

    return dataframe


def normalize_student_id(student_id: str) -> str:
    """
    Convert IDs such as CP001 to S001.

    New students.csv uses S001 while Attendance.csv and
    Hackathon_Deadlines.csv use CP001.
    """

    value = str(student_id).strip().upper()

    if value.startswith("CP") and value[2:].isdigit():
        return f"S{value[2:]}"

    return value


def _normalize_id_column(dataframe: pd.DataFrame) -> pd.DataFrame:
    dataframe = dataframe.copy()

    if "student_id" in dataframe.columns:
        dataframe["student_id"] = (
            dataframe["student_id"]
            .astype(str)
            .map(normalize_student_id)
        )

    return dataframe


def load_students() -> pd.DataFrame:
    return _normalize_id_column(
        _read(CSV_PATHS["students"])
    )


def load_marks() -> pd.DataFrame:
    dataframe = _normalize_id_column(
        _read(CSV_PATHS["marks"])
    )

    dataframe["marks"] = pd.to_numeric(
        dataframe["marks"],
        errors="coerce",
    )
    dataframe["max_marks"] = pd.to_numeric(
        dataframe["max_marks"],
        errors="coerce",
    )

    dataframe["marks_percentage"] = (
        dataframe["marks"]
        / dataframe["max_marks"].replace(0, pd.NA)
        * 100
    ).round(2)

    return dataframe


def load_attendance() -> pd.DataFrame:
    dataframe = _normalize_id_column(
        _read(CSV_PATHS["attendance"])
    )

    numeric_columns = [
        "total_classes",
        "present_count",
        "absent_count",
        "late_count",
        "attendance_percentage",
    ]

    for column in numeric_columns:
        if column in dataframe.columns:
            dataframe[column] = pd.to_numeric(
                dataframe[column],
                errors="coerce",
            )

    return dataframe


def load_hackathon_deadlines() -> pd.DataFrame:
    dataframe = _normalize_id_column(
        _read(CSV_PATHS["hackathon_deadlines"])
    )

    if "deadline_date" in dataframe.columns:
        dataframe["deadline_date"] = pd.to_datetime(
            dataframe["deadline_date"],
            errors="coerce",
        )

    return dataframe


def load_faculty() -> pd.DataFrame:
    return _read(CSV_PATHS["faculty"])


def load_hod() -> pd.DataFrame:
    return _read(CSV_PATHS["hod"])


def load_hackathons() -> pd.DataFrame:
    dataframe = _read(CSV_PATHS["hackathons"])

    if "deadline" in dataframe.columns:
        dataframe["deadline"] = pd.to_datetime(
            dataframe["deadline"],
            errors="coerce",
        )

    return dataframe


def load_tasks() -> pd.DataFrame:
    dataframe = _normalize_id_column(
        _read(CSV_PATHS["tasks"])
    )

    if "deadline_date" in dataframe.columns:
        dataframe["deadline_date"] = pd.to_datetime(
            dataframe["deadline_date"],
            errors="coerce",
        )

    return dataframe


def get_student(student_id: str) -> dict:
    student_id = normalize_student_id(student_id)

    students = load_students()
    matched = students[
        students["student_id"] == student_id
    ]

    if matched.empty:
        raise ValueError(
            f"No student found with student_id={student_id}"
        )

    return matched.iloc[0].to_dict()


def get_valid_student_ids() -> list[str]:
    return (
        load_students()["student_id"]
        .dropna()
        .astype(str)
        .tolist()
    )
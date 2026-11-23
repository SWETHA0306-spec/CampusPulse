import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(override=True)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
CHROMA_DIR = BASE_DIR / "chroma_db"

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

RISK_HIGH_MARK_PCT = float(os.getenv("RISK_HIGH_MARK_PCT", "40"))
RISK_HIGH_ATTENDANCE_PCT = float(
    os.getenv("RISK_HIGH_ATTENDANCE_PCT", "65")
)
RISK_MEDIUM_MARK_PCT = float(
    os.getenv("RISK_MEDIUM_MARK_PCT", "60")
)
RISK_MEDIUM_ATTENDANCE_PCT = float(
    os.getenv("RISK_MEDIUM_ATTENDANCE_PCT", "75")
)

BASE_HOURS_PER_WEEK = float(
    os.getenv("BASE_HOURS_PER_WEEK", "6")
)
BASE_DAYS_PER_WEEK = int(
    os.getenv("BASE_DAYS_PER_WEEK", "4")
)

INTENSITY_MULTIPLIER = {
    "low": 0.6,
    "medium": 1.0,
    "high": 1.5,
}

CSV_PATHS = {
    "students": DATA_DIR / "students.csv",
    "marks": DATA_DIR / "marks.csv",
    "attendance": DATA_DIR / "Attendance.csv",
    "hackathon_deadlines": DATA_DIR / "Hackathon_Deadlines.csv",
    "faculty": DATA_DIR / "faculty.csv",
    "hod": DATA_DIR / "hod.csv",
    "hackathons": DATA_DIR / "hackathons_seed.csv",
    "tasks": DATA_DIR / "tasks_dataset.csv",
}
# CampusPulse: Implemented Features & Technical Walkthrough

This document provides a detailed breakdown of the features currently implemented in CampusPulse and how they work under the hood.

---

## 1. Role-Based Architecture & Dashboards

### How it works
The frontend (React/Vite) implements a mock authentication system using an `AuthContext`. 
- **Roles:** Students (`CP005`), Mentors (`swetha_mentor`), and HODs (`nitin_hod`).
- **Routing:** Based on the `user.role`, the main layout conditionally renders different navigation tabs (e.g., only HODs and Mentors see the "Mentor" tab, while Students see "Placement" and "Smart Campus").

### Specific Implementations:
- **Mentor Dashboard (`MentorDashboard.jsx`)**:
  - **Dynamic Filtering:** The frontend passes a `?subject=Machine Learning` query parameter to the backend `/api/students` endpoint.
  - **Data Visualization:** It renders charts (using Recharts) to show score distributions and risk levels *specifically for that mentor's subject*. Top and bottom performers are calculated by sorting the filtered student data.

---

## 2. Intelligent Placement Eligibility (Student View)

### How it works
The placement feature dynamically evaluates a student's academic profile against mock company criteria, providing RAG-backed explanations for rejections.

### Implementation Details:
- **Backend Endpoint (`/api/placement/eligibility`)**:
  - **ID Normalization:** Converts the frontend login ID (e.g., `CP005`) to the backend CSV format (e.g., `S005`) using `normalize_student_id()`.
  - **Data Aggregation:** It pulls the student's actual marks from `marks.csv` and attendance from `Attendance.csv`.
  - **Eligibility Logic:** Iterates over a hardcoded `_COMPANIES` list in `api.py`. For each company, it checks if the student's calculated `avg_marks` meets the `min_avg_marks` and if their computed `risk` level violates the company's `allow_high_risk` policy.
  - **Reason Generation:** If ineligible, it calculates the exact percentage gap and identifies the top 3 weakest subjects dragging down the average.
- **Frontend Display (`PlacementEligibility.jsx`)**:
  - Receives the JSON payload and renders a clean data sheet.
  - **RAG Integration ("Explain Why"):** If a student is ineligible, they click a button that triggers `sendChatMessage()`. The prompt explicitly injects their real `avg_marks`, `risk` level, and exact subject-wise scores, asking the LLM to explain why they were rejected based on the company's strict criteria.

---

## 3. Data Processing & The "Smart Campus" Chat

### How it works
The backend acts as an orchestrator combining tabular data (CSV) with Natural Language Processing (LLMs).

### Implementation Details:
- **Data Ingestion (`ingestion/load_data.py`)**:
  - Uses `pandas` to read and parse static `.csv` files located in the `data/` directory.
  - Cleans up column names and handles basic type conversions (e.g., strings to numeric percentages).
- **RAG Engine (`chat_agent.py`)**:
  - Uses **ChromaDB** as a vector database to store document embeddings.
  - When a student asks a question via the frontend "Smart Campus" tab, the query hits `/api/chat`.
  - The backend retrieves relevant contextual data from the CSVs (like the student's specific marks and attendance).
  - An **OpenRouter LLM** (via LangChain or direct API) generates a conversational response grounded in the student's actual data.

---

## 4. Academic Performance Agent & Risk Engine

### How it works
This component acts as the analytical and automated notification engine of the system.

### Implementation Details:
- **Risk Engine (`utils/risk_engine.py`)**:
  - Computes a student's risk category.
  - **Logic:** If `avg_marks < 40`, they are `High Risk`. If `< 60`, they are `Medium Risk`. Otherwise, `Low Risk`.
- **Scheduled Alerts (`academic_performance_agent`)**:
  - Uses the `apscheduler` Python library to run background cron jobs.
  - **Checks performed:** 
    - Scans `Attendance.csv` for students falling below the 75% attendance threshold.
    - Scans deadline datasets to trigger alerts for upcoming submissions.
  - **Notifications:** Generates alerts that can be routed to the respective HOD or Mentor dashboards for intervention.

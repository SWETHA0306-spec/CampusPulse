<div align="center">

# 🎓 CampusPulse

**An AI-powered campus intelligence platform that monitors academic performance,
personalises student learning, and automates timely interventions — all in one place.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![LangChain](https://img.shields.io/badge/LangChain-0.2+-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Features](#-features)
  - [Role-Based Dashboards](#1-role-based-dashboards)
  - [Academic Performance Agent](#2-academic-performance-agent)
  - [Personalised Learning Agent](#3-personalised-learning-agent)
  - [Placement Eligibility Engine](#4-placement-eligibility-engine)
  - [Smart Campus Chat](#5-smart-campus-chat)
  - [Risk Engine](#6-risk-engine)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Running the Application](#running-the-application)
- [API Reference](#-api-reference)
- [Configuration](#-configuration)
- [Contributors](#-contributors)

---

## 🌟 Overview

CampusPulse is a full-stack, AI-driven academic management system built for colleges and universities. It bridges the gap between raw academic data and actionable intelligence by combining:

- **LLM-powered agents** (via OpenRouter / Anthropic Claude) for natural-language reasoning
- **RAG (Retrieval-Augmented Generation)** with ChromaDB for context-aware responses
- **Rule-based deterministic logic** for critical thresholds (attendance, marks, risk)
- **Automated email notifications** to students, mentors, and HODs
- **Real-time Google Sheets integration** for live attendance tracking
- **A modern React dashboard** with role-aware views for Students, Mentors, and HODs

> CampusPulse doesn't just show data — it understands it and acts on it.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React / Vite Frontend                │
│   Login → Student | Mentor | HOD Role-Based Dashboard   │
│   (TailwindCSS + React Router + Recharts + Lucide)      │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP / REST (port 5173 ↔ 8000)
┌────────────────────────▼────────────────────────────────┐
│              FastAPI Backend  (port 8000)                │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │  Personalised       │  │  Academic Performance    │  │
│  │  Learning Agent     │  │  Agent                   │  │
│  │  (6-agent pipeline) │  │  (1 agent + 7 tools)     │  │
│  └──────────┬──────────┘  └──────────────┬───────────┘  │
│             │                             │              │
│  ┌──────────▼──────────────────────────▼───────────┐    │
│  │            Shared Data Layer                     │    │
│  │  pandas CSVs │ ChromaDB │ Google Sheets API     │    │
│  │  Risk Engine │ RAG (sentence-transformers)       │    │
│  └───────────────────────────────────────────────── ┘   │
│                         │                               │
│              OpenRouter LLM  /  Anthropic Claude        │
│              SMTP (Gmail App Password)                   │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 1. Role-Based Dashboards

CampusPulse serves three distinct user roles, each with a tailored interface:

| Role | Login ID | Access |
|------|----------|--------|
| **Student** | `CP005` | Academic Performance, Personalised Learning, Placement, Smart Campus Chat |
| **Mentor** | `swetha_mentor` | Mentor Dashboard (subject-filtered charts, top/bottom performers) |
| **HOD** | `nitin_hod` | HOD Dashboard (department-wide analytics, risk aggregation) |

**How it works:**
- Authentication is managed via React's `AuthContext` with role-aware routing.
- Navigation tabs are conditionally rendered based on `user.role`.
- The Mentor Dashboard dynamically fetches data filtered by `?subject=` query params and renders Recharts visualisations for score distributions and risk levels.

---

### 2. Academic Performance Agent

A single LangChain `AgentExecutor` with **7 tools**, triggered by APScheduler cron jobs — the automated brain of campus monitoring.

#### Scheduled Jobs

| Time | Job |
|------|-----|
| 8:00 AM daily | Attendance reminders to students below 75% |
| 8:30 AM daily | Deadline reminders (hackathons, assignments, tasks) |
| 9:00 AM daily | Pre-exam alerts to faculty about at-risk students |
| 9:00 AM Mondays | HOD alerts for low subject averages + improvement suggestions |
| 10:00 AM Mondays | Hackathon discovery & student matching |

#### 7 Core Functionalities

1. **🏆 Hackathon Discovery & Matching** — Searches local seed data + live DuckDuckGo results; matches hackathons to students by skill/interest and emails them.
2. **📊 Attendance Reminders** — Reads live Google Sheets; flags students below the 75% threshold and sends personalised email warnings.
3. **📄 Base Paper Delivery** — On-demand; a team leader submits a problem statement and the agent uses local RAG (curated PDFs) + Arxiv live fallback to find and email the best-matching research papers.
4. **⚠️ Pre-Exam Faculty Alerts** — Identifies poor performers per subject and notifies the respective subject faculty before exams.
5. **📈 Student Performance Reports** — Generates comprehensive subject-wise performance summaries aggregated from `marks.csv`.
6. **📢 HOD Subject Alerts** — Weekly digest for HODs on subjects with low class averages; includes LLM-generated improvement suggestions.
7. **📅 Deadline Reminders** — Scans hackathon and assignment deadline datasets and triggers timely reminders.

#### Architecture Design Decisions

> [!NOTE]
> **Why one agent, not seven?** A single `AgentExecutor` with all tools reduces overhead and allows the LLM to reason across multiple tools in one call. Each scheduled job just passes a different plain-language task string.

> [!IMPORTANT]
> **No LLM in `decision/checks.py`** — All threshold logic (attendance %, mark cutoffs) is deterministic pandas. The LLM is only invoked *after* a decision is made, to draft and send the message. This keeps decisions auditable, fast, and consistent.

> [!TIP]
> **Embeddings are local** (sentence-transformers) so there's no second API dependency. OpenRouter is used only as the conversational "brain."

---

### 3. Personalised Learning Agent

A **6-agent pipeline** that generates a fully personalised, subject-wise catch-up learning plan for each student and emails it automatically.

#### Pipeline

```
risk_engine (rule-based, deterministic)
    ↓
Recovery Plan Agent       [LLM]  → what topics, in what order
    ↓
Difficulty Adaptation Agent [rule-based] → intensity multiplier per risk level
    ↓
Timetable Agent           [LLM]  → weekly study grid from plan + intensity
    ↓
Resource Recommendation Agent [RAG] → semantic match of topics to notes/videos/practice sets
    ↓
Revision Planner Agent    [rule-based + LLM phrasing] → prioritises backlog before exams
    ↓
Learning Coach Agent      [LLM]  → compiles everything and emails the student
```

Each agent is a **pure function** (`input_dict → output_dict`) wired by `orchestrator.py`, making it trivial to swap or reorder agents.

#### Agents in Detail

| Agent | Type | Responsibility |
|-------|------|----------------|
| **Risk Engine** | Rule-based | Combines marks % + attendance % → `low / medium / high` risk per subject |
| **Recovery Plan Agent** | LLM | Identifies weak topics and orders them for catch-up |
| **Difficulty Adaptation Agent** | Rule-based | Maps risk level to study-hours/days-per-week multipliers |
| **Timetable Agent** | LLM | Converts the plan + intensity into a human-readable weekly grid |
| **Resource Recommendation Agent** | RAG | Semantic search over resource library (notes, videos, practice sets) |
| **Revision Planner Agent** | Rule-based + LLM | Surfaces backlog items due before upcoming exams |
| **Learning Coach Agent** | LLM | Final step — compiles all outputs into a cohesive email to the student |

> [!TIP]
> Run a single agent in isolation for testing:
> ```bash
> python -c "from agents import recovery_plan_agent as a; print(a.build('21CS003'))"
> ```

---

### 4. Placement Eligibility Engine

Students can check their eligibility for multiple companies in real time, with LLM-powered explanations for rejections.

#### How It Works

1. **ID Normalisation** — Frontend login ID (`CP005`) is mapped to backend CSV format (`S005`).
2. **Data Aggregation** — The backend pulls `avg_marks` from `marks.csv` and `attendance_pct` from `Attendance.csv`.
3. **Eligibility Check** — Each company has configurable `min_avg_marks` and `allow_high_risk` criteria. The engine checks every company for the student.
4. **Rejection Reason** — If ineligible, the system calculates the exact percentage gap and identifies the top 3 weakest subjects.
5. **RAG-Backed "Explain Why"** — The student can click a button that injects their real data into a prompt sent to the LLM, which explains the rejection in plain English.

---

### 5. Smart Campus Chat

An AI chatbot accessible from the **Smart Campus** tab that answers student questions grounded in their actual academic data.

- Uses **ChromaDB** as a vector store for semantic search over documents and CSV-derived context.
- When a student asks a question, the backend retrieves relevant context (marks, attendance, deadlines) and passes it to an **OpenRouter LLM** via LangChain.
- Responses are conversational but factually grounded — the LLM cannot hallucinate data it wasn't given.

---

### 6. Risk Engine

The shared risk computation layer used by both backend agents.

```
avg_marks < 40  →  🔴 High Risk
avg_marks < 60  →  🟡 Medium Risk
avg_marks ≥ 60  →  🟢 Low Risk
```

For the Personalised Learning Agent, risk is computed **per subject** (combining marks % and attendance %) rather than as a global average, enabling fine-grained intervention.

---

## 📁 Project Structure

```
CampusPulse-master/
│
├── frontend/                          # React + Vite frontend
│   ├── src/
│   │   ├── api/                       # API client wrappers
│   │   │   ├── chatService.js         # Smart Campus chat API
│   │   │   ├── client.js              # Axios/fetch base client
│   │   │   └── placementClient.js     # Placement eligibility API
│   │   ├── components/                # Reusable UI components
│   │   │   ├── EligibilityRow.jsx
│   │   │   ├── IntensityGrid.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── RecoveryPlanCard.jsx
│   │   │   ├── ResourceList.jsx
│   │   │   ├── RevisionList.jsx
│   │   │   ├── RiskBadge.jsx
│   │   │   └── Loader.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Role-based auth state
│   │   ├── pages/
│   │   │   ├── Login.jsx / UnifiedLogin.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── AcademicPerformance.jsx
│   │   │   ├── PersonalisedLearning.jsx
│   │   │   ├── PlacementEligibility.jsx
│   │   │   ├── SmartCampus.jsx
│   │   │   ├── MentorDashboard.jsx
│   │   │   └── HODDashboard.jsx
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── academic_performance_agent/        # Backend Agent 1
│   ├── agent/agent_setup.py           # Single LangChain AgentExecutor
│   ├── decision/checks.py             # Deterministic threshold logic (no LLM)
│   ├── scheduler/jobs.py              # APScheduler cron job definitions
│   ├── sheets/google_sheets_client.py # Live Google Sheets attendance connector
│   ├── rag/                           # Base paper RAG (ingest + vectorstore)
│   ├── tools/                         # LangChain tools (email, hackathon, report…)
│   ├── data/csv/                      # Structured data (marks, faculty, deadlines…)
│   ├── data/documents/                # Base paper PDFs + metadata.csv
│   ├── config.py                      # All settings (loaded from .env)
│   ├── main.py                        # Entry point (runs scheduler)
│   ├── requirements.txt
│   └── .env.example
│
├── personalised_learning_agent/       # Backend Agent 2 + API
│   ├── agents/                        # 6 pipeline agents
│   │   ├── recovery_plan_agent.py
│   │   ├── difficulty_adaptation_agent.py
│   │   ├── timetable_agent.py
│   │   ├── resource_recommendation_agent.py
│   │   ├── revision_planner_agent.py
│   │   └── learning_coach_agent.py
│   ├── ingestion/                     # Build ChromaDB vector store
│   ├── rag/retriever.py               # Semantic retrieval wrapper
│   ├── utils/
│   │   ├── risk_engine.py             # Shared risk computation
│   │   ├── llm_client.py              # LLM abstraction layer
│   │   └── email_sender.py            # SMTP email utility
│   ├── data/                          # CSV datasets + resource .txt files
│   ├── chroma_db/                     # Persisted vector store (gitignored)
│   ├── orchestrator.py                # Wires the 6-agent pipeline
│   ├── api.py                         # FastAPI app (port 8000)
│   ├── config.py
│   ├── main.py
│   └── requirements.txt
│
├── IMPLEMENTED_FEATURES.md            # Deep-dive technical walkthrough
├── STARTUP.md                         # Quick-start guide
├── .gitignore
└── README.md                          ← You are here
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, TailwindCSS 3, React Router 6, Recharts, Lucide Icons |
| **Backend API** | FastAPI, Uvicorn |
| **AI / LLM** | LangChain, OpenRouter (Academic Agent), Anthropic Claude (Learning Agent) |
| **Vector DB** | ChromaDB |
| **Embeddings** | sentence-transformers (local, free) |
| **Data** | pandas, CSV files |
| **Live Data** | Google Sheets API (gspread + google-auth) |
| **Scheduling** | APScheduler |
| **Email** | SMTP (Gmail App Password) |
| **Web Search** | DuckDuckGo (langchain-community, no API key needed) |
| **Research** | Arxiv API (live paper fallback) |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm / pnpm
- An [OpenRouter](https://openrouter.ai/) API key (Academic Performance Agent)
- An [Anthropic](https://console.anthropic.com/) API key (Personalised Learning Agent)
- A Gmail account with an **App Password** enabled (for SMTP emails)
- A Google Cloud service account with Sheets + Drive API enabled (for live attendance)

---

### Backend Setup

#### Academic Performance Agent

```bash
cd academic_performance_agent

# 1. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env and fill in:
#   OPENROUTER_API_KEY, OPENROUTER_MODEL
#   GOOGLE_SERVICE_ACCOUNT_JSON, ATTENDANCE_SHEET_ID
#   SMTP_USERNAME, SMTP_PASSWORD

# 4. Add real data (optional — sample CSVs already included)
# Replace data/csv/*.csv with your institution's exports

# 5. Build the RAG index for base papers
python -m rag.ingest

# 6. Start the scheduler
python main.py
```

> [!NOTE]
> **Google Sheets Setup:** Create a GCP project → enable Sheets + Drive APIs → create a Service Account → download the JSON key to `credentials/service_account.json` → share your attendance sheet with the service account's `client_email`.

---

#### Personalised Learning Agent + API

```bash
cd personalised_learning_agent

# 1. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env and fill in:
#   ANTHROPIC_API_KEY
#   SMTP_USERNAME, SMTP_PASSWORD

# 4. Build the ChromaDB vector store
python -m ingestion.build_vectorstore

# 5. Start the FastAPI server (port 8000)
python api.py
```

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or: pnpm install

# Start the development server (port 5173)
npm run dev
```

---

### Running the Application

Open **two** terminal windows:

| Terminal | Command | URL |
|----------|---------|-----|
| Backend | `cd personalised_learning_agent && python api.py` | http://localhost:8000 |
| Frontend | `cd frontend && npm run dev` | http://localhost:5173 |

Then open **http://localhost:5173** in your browser.

#### Demo Login Credentials

| Role | Login ID |
|------|----------|
| Student | `CP005` |
| Mentor | `swetha_mentor` |
| HOD | `nitin_hod` |

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/students` | Fetch student list; supports `?subject=` filter |
| `POST` | `/api/placement/eligibility` | Check a student's placement eligibility |
| `POST` | `/api/chat` | Smart Campus RAG-powered chat |
| `POST` | `/api/learning-plan` | Trigger the 6-agent personalised learning pipeline |
| `GET` | `/api/performance/{student_id}` | Fetch academic performance summary |

---

## ⚙️ Configuration

All agent thresholds are centralised in each module's `config.py` and loaded from `.env`:

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API key (Academic Agent) |
| `OPENROUTER_MODEL` | Model name (e.g. `openai/gpt-4o`) |
| `ANTHROPIC_API_KEY` | Claude API key (Learning Agent) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Path to GCP service account JSON |
| `ATTENDANCE_SHEET_ID` | Google Sheets ID for live attendance |
| `SMTP_USERNAME` | Gmail address for sending emails |
| `SMTP_PASSWORD` | Gmail App Password (not your real password) |
| `ATTENDANCE_THRESHOLD` | Default `75` — below this triggers alerts |
| `HIGH_RISK_MARK_THRESHOLD` | Default `40` — below this is High Risk |
| `MEDIUM_RISK_MARK_THRESHOLD` | Default `60` — below this is Medium Risk |

> [!CAUTION]
> **Never commit your `.env` file.** It is listed in `.gitignore`. Always use `.env.example` as the template for collaborators.

---

## 👥 Contributors

<table>
  <tr>
    <td align="center" width="200">
      <b>A.K. Nitin</b><br/>
    </td>
    <td align="center" width="200">
      <b>Vishal MK</b><br/>
    </td>
    <td align="center" width="200">
      <b>P. Swetha</b><br/>
    </td>
  </tr>
</table>

---

<div align="center">

Made with ❤️ by the CampusPulse team

</div>

# CampusPulse Startup Guide

To start the CampusPulse application fully, you need to run both the backend (FastAPI) and the frontend (React/Vite) servers simultaneously. You can do this by opening two separate terminal windows.

---

### Step 1: Start the Backend Server

Open your terminal, navigate to the `personalised_learning_agent` directory, and run the Python API file:

```bash
cd personalised_learning_agent
python api.py
```
*The backend server will start running on `http://localhost:8000`.*

---

### Step 2: Start the Frontend Server

Open a **new** terminal window, navigate to the `frontend` directory, and run the development server:

```bash
cd frontend
npm run dev
```
*The frontend application will start running on `http://localhost:5173`.*

---

### Step 3: Access the Application

Once both servers are running without errors, open your web browser and go to:
**[http://localhost:5173](http://localhost:5173)**

*Note: You can log in using mock credentials like `CP005` (Student), `swetha_mentor` (Mentor), or `nitin_hod` (HOD).*

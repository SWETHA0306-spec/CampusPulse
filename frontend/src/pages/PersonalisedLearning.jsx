import { useState, useEffect } from "react";
import {
  Search,
  Sparkles,
  User,
  Users,
  ShieldCheck,
  GraduationCap,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Mail,
  Flag,
  BarChart3,
  Award,
  BookOpen,
  ArrowRight
} from "lucide-react";
import Loader from "../components/Loader.jsx";
import RecoveryPlanCard from "../components/RecoveryPlanCard.jsx";
import IntensityGrid from "../components/IntensityGrid.jsx";
import ResourceList from "../components/ResourceList.jsx";
import RevisionList from "../components/RevisionList.jsx";
import RiskBadge from "../components/RiskBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  fetchRiskProfile,
  fetchRecoveryPlan,
  fetchIntensity,
  fetchResources,
  fetchRevisionPlan,
} from "../api/client.js";

const STUDENT_OPTIONS = [
  {
    id: "CP038",
    name: "Rahul Verma",
    dept: "CSE",
    riskLevel: "High Risk",
    riskColor: "bg-red-50 text-red-700 border-red-200",
    attendance: "61.0%",
    criticalSubject: "Data Structures (42%)"
  },
  {
    id: "CP001",
    name: "Rudra Vala",
    dept: "IT",
    riskLevel: "Medium Risk",
    riskColor: "bg-amber-50 text-amber-700 border-amber-200",
    attendance: "85.5%",
    criticalSubject: "Machine Learning (49%)"
  },
  {
    id: "CP002",
    name: "Rachita Bandi",
    dept: "CIVIL",
    riskLevel: "Critical Risk",
    riskColor: "bg-red-50 text-red-700 border-red-200",
    attendance: "54.0%",
    criticalSubject: "Structural Analysis (38%)"
  }
];

export default function PersonalisedLearning() {
  const { user, role } = useAuth();

  const [rollNo, setRollNo] = useState(() => {
    if (user?.role === "Student" && user.id) return user.id;
    return "CP038";
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [mentorAlertMsg, setMentorAlertMsg] = useState(null);

  // Auto-sync rollNo when user changes
  useEffect(() => {
    if (user?.role === "Student" && user.id) {
      setRollNo(user.id);
    }
  }, [user]);

  async function loadStudentData(targetId) {
    setLoading(true);
    setError(null);
    try {
      const [risk, plan, intensity, resources, revision] = await Promise.all([
        fetchRiskProfile(targetId),
        fetchRecoveryPlan(targetId),
        fetchIntensity(targetId),
        fetchResources(targetId),
        fetchRevisionPlan(targetId),
      ]);
      setData({ risk, plan, intensity, resources, revision });
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudentData(rollNo);
  }, [rollNo]);

  function handleMentorAction(actionName) {
    setMentorAlertMsg(`✅ ${actionName} triggered successfully for Student ${rollNo}. Notice sent via email.`);
    setTimeout(() => setMentorAlertMsg(null), 5000);
  }

  // ==========================================
  // 1. MENTOR VIEW: SUPERVISORY & ROSTER MATRIX
  // ==========================================
  if (role === "Mentor") {
    return (
      <div className="space-y-8">
        {/* Mentor Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-700/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1.5">
              <Users size={13} /> Mentor Supervisory Dashboard
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
              Faculty Mentor: {user?.name || "Prof. Swetha"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Mentee Backlog & Remedial Intervention Portal
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Monitor assigned students, inspect subject-wise risk profiles, and schedule targeted remedial interventions.
          </p>
        </div>

        {mentorAlertMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            {mentorAlertMsg}
          </div>
        )}

        {/* MENTEE ROSTER MATRIX TABLE (Unique to Mentor) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                Assigned Mentee Roster (Select Student to Inspect)
              </h2>
              <p className="text-xs text-slate-500">
                Click any row below to switch the active recovery plan and chat assistant to that mentee.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Student ID / Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Critical Backlog Subject</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {STUDENT_OPTIONS.map((st) => {
                  const isSelected = st.id === rollNo;
                  return (
                    <tr
                      key={st.id}
                      onClick={() => setRollNo(st.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-indigo-50/70 hover:bg-indigo-50 font-medium"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                          {st.id.slice(-2)}
                        </span>
                        {st.id} — {st.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{st.dept}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${st.riskColor}`}
                        >
                          {st.riskLevel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{st.attendance}</td>
                      <td className="py-3.5 px-4 text-slate-700">{st.criticalSubject}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRollNo(st.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          {isSelected ? "Inspecting" : "Inspect"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mentor Action Toolbar for Active Mentee */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/80 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mentor Interventions for <strong className="text-indigo-700">{rollNo}</strong>:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleMentorAction("Remedial Lab Enrollment")}
                className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                <Flag size={13} /> Flag for Remedial Lab
              </button>
              <button
                type="button"
                onClick={() => handleMentorAction("Check-In Alert Email")}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                <Mail size={13} /> Send Check-In Email
              </button>
              <button
                type="button"
                onClick={() => handleMentorAction("1-on-1 Review Session")}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                <Calendar size={13} /> Schedule 1-on-1 Review
              </button>
            </div>
          </div>
        </div>

        {/* Selected Mentee Content */}
        {loading && <Loader label={`Loading recovery profile for ${rollNo}...`} />}
        {data && !loading && (
          <div className="grid grid-cols-1 gap-8 items-start">
            <div className="space-y-8">
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Subject Risk Profile ({rollNo})
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  {Object.entries(data.risk).map(([subject, v]) => (
                    <div
                      key={subject}
                      className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm shadow-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{subject}</p>
                        <p className="text-[11px] text-slate-500">
                          Marks: {v.marks_pct}% • Att: {v.attendance_pct}%
                        </p>
                      </div>
                      <RiskBadge level={v.risk} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Step-by-Step Catch-up Plan ({rollNo})
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {Object.entries(data.plan).map(([subject, d]) => (
                    <RecoveryPlanCard key={subject} subject={subject} data={d} />
                  ))}
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Adapted Study Intensity ({rollNo})
                </h2>
                <IntensityGrid intensity={data.intensity} />
              </section>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 2. HOD VIEW: DEPARTMENT STRATEGIC EXECUTIVE
  // ==========================================
  if (role === "HOD") {
    return (
      <div className="space-y-8">
        {/* HOD Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-700/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider border border-purple-500/30 flex items-center gap-1.5">
              <ShieldCheck size={13} /> HOD Strategic Oversight
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
              Department: {user?.department || "CSE & AI"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Department Academic Risk & Remedial Allocation Portal
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Executive oversight of department-wide backlog rates, remedial lab allocations, and high-risk cohort analysis.
          </p>
        </div>

        {/* DEPARTMENT EXECUTIVE KPI CARDS (Unique to HOD) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Total Students</span>
              <Users size={16} className="text-purple-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">152</p>
            <p className="text-xs text-slate-400 mt-1">CSE & AI Department</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span>High-Risk Cohort</span>
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <p className="text-2xl font-extrabold text-red-600">24 Students</p>
            <p className="text-xs text-red-500 mt-1 font-semibold">15.8% Department Alert Rate</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Critical Subject</span>
              <BarChart3 size={16} className="text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">Data Structures</p>
            <p className="text-xs text-slate-500 mt-1">48.2% Dept Avg Score</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Remedial Capacity</span>
              <Award size={16} className="text-purple-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">3 Sessions/Wk</p>
            <p className="text-xs text-emerald-600 mt-1 font-semibold">Active Lab Support</p>
          </div>
        </div>

        {/* DEPARTMENT SUBJECT RISK MATRIX (Unique to HOD) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
          <h2 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-purple-600" />
            Department Subject Risk Breakdown & Remedial Approvals
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">High Risk Count</th>
                  <th className="py-3 px-4">Medium Risk Count</th>
                  <th className="py-3 px-4">Dept Avg Score</th>
                  <th className="py-3 px-4 text-right">HOD Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Data Structures & Algorithms</td>
                  <td className="py-3 px-4 font-semibold text-red-600">24 Students</td>
                  <td className="py-3 px-4 text-amber-700 font-medium">18 Students</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">48.2%</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleMentorAction("Department Lab Allocation Approved")}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                      Approve Remedial Lab
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Operating Systems</td>
                  <td className="py-3 px-4 font-semibold text-red-600">11 Students</td>
                  <td className="py-3 px-4 text-amber-700 font-medium">30 Students</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">62.5%</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleMentorAction("Faculty Review Directive Issued")}
                      className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                      Issue Faculty Notice
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* HOD Student Inspector Dropdown */}
        <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base">Drill Down into Student Catch-Up Profile</h3>
            <p className="text-xs text-slate-400">Select any student in the department to review their personal recovery plan and chat with HOD assistant.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {STUDENT_OPTIONS.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.id} — {st.name} ({st.dept})
                </option>
              ))}
            </select>
            <button
              onClick={() => loadStudentData(rollNo)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Inspect Student
            </button>
          </div>
        </div>

        {/* HOD Drill Down Student Profile & Chat */}
        {loading && <Loader label={`Loading profile for ${rollNo}...`} />}
        {data && !loading && (
          <div className="grid grid-cols-1 gap-8 items-start">
            <div className="space-y-8">
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Subject Risk Profile ({rollNo})
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  {Object.entries(data.risk).map(([subject, v]) => (
                    <div
                      key={subject}
                      className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm shadow-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{subject}</p>
                        <p className="text-[11px] text-slate-500">
                          Marks: {v.marks_pct}% • Att: {v.attendance_pct}%
                        </p>
                      </div>
                      <RiskBadge level={v.risk} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Recovery Plan ({rollNo})
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {Object.entries(data.plan).map(([subject, d]) => (
                    <RecoveryPlanCard key={subject} subject={subject} data={d} />
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 3. STUDENT VIEW: PERSONALISED TUTOR & PLAN
  // ==========================================
  return (
    <div className="space-y-8">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-wider border border-brand-500/30 flex items-center gap-1.5">
              <GraduationCap size={14} /> Student Personalised Workspace
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
              Roll No: {rollNo}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Your Personalised Catch-Up Sequence & AI Study Tutor
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Custom prerequisite study order, adapted weekly intensity hours, and 24/7 AI tutor chat assistant.
          </p>
        </div>

        {/* Private Student Badge (No Dropdown Selector for Students) */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl px-5 py-4 shrink-0 text-right">
          <p className="text-xs text-slate-400">Logged in as:</p>
          <p className="text-lg font-extrabold text-white">{user?.name || "Rahul Verma"}</p>
          <p className="text-xs font-semibold text-brand-400">{user?.department || "CSE"} Department • {rollNo}</p>
        </div>
      </div>

      {loading && <Loader label={`Loading catch-up plan for ${rollNo}...`} />}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-1 gap-8 items-start">
          {/* MY STUDENT LEARNING PLAN */}
          <div className="space-y-8">
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                  My Subject Risk Profile ({rollNo})
                </h2>
                <span className="text-xs text-slate-500">
                  Computed via attendance & marks
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {Object.entries(data.risk).map(([subject, v]) => (
                  <div
                    key={subject}
                    className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm shadow-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{subject}</p>
                      <p className="text-[11px] text-slate-500">
                        Marks: {v.marks_pct}% • Att: {v.attendance_pct}%
                      </p>
                    </div>
                    <RiskBadge level={v.risk} />
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
              <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                My Step-by-Step Catch-up Plan
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(data.plan).map(([subject, d]) => (
                  <RecoveryPlanCard key={subject} subject={subject} data={d} />
                ))}
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
              <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                My Adapted Study Intensity
              </h2>
              <IntensityGrid intensity={data.intensity} />
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
              <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                My Recommended RAG Resources
              </h2>
              <ResourceList resources={data.resources} />
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
              <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                My Revision & Exam Priorities
              </h2>
              <RevisionList revision={data.revision} />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

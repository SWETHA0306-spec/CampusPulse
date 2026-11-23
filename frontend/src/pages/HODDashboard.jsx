import { useEffect, useState } from "react";
import {
  Building, TrendingUp, AlertCircle, Users,
  BookOpen, Activity, BarChart2, MessageSquare, Search
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function HODDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/hod/summary").then((r) => r.json()),
      fetch("/api/students").then((r) => r.json()),
    ])
      .then(([sum, studs]) => {
        setSummary(sum);
        setStudents(studs);
        if (studs.length > 0) setSelectedStudent(studs[0]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm gap-2">
        <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        Loading HOD dashboard...
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-4">
        ⚠️ Failed to load: {error}. Make sure the backend is running at <code>localhost:8000</code>.
      </div>
    );

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "all" || s.risk === riskFilter;
    return matchSearch && matchRisk;
  });

  const riskColor = { high: "text-red-600 bg-red-50 border-red-200", medium: "text-amber-600 bg-amber-50 border-amber-200", low: "text-green-600 bg-green-50 border-green-200" };
  const riskBadge = { high: "🔴 High Risk", medium: "🟡 Medium Risk", low: "🟢 Low Risk" };

  // Subject sorted by average (lowest first for strategic action)
  const weakSubjects = Object.entries(summary.subject_averages)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HOD Strategic Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome, <strong>{user?.name}</strong> — {user?.department} Department
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["overview", "students", "subjects"].map((tab) => {
            const labels = { overview: "📊 Overview", students: "👥 Students", subjects: "📚 Subjects" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-slate-900 text-white shadow"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={<Building size={18} />} label="Dept. Strength" value={summary.total_students} sub="Total enrolled students" accent="border-l-blue-500" />
            <KPICard icon={<TrendingUp size={18} />} label="Avg Academic Score" value={`${summary.avg_marks}%`} sub="Across all subjects" accent="border-l-purple-500" />
            <KPICard icon={<Activity size={18} />} label="Avg Attendance" value={`${summary.avg_attendance}%`} sub="Department-wide" accent="border-l-green-500" />
            <KPICard icon={<AlertCircle size={18} />} label="Attendance Risk" value={summary.at_risk_attendance_count} sub="Below 75% threshold" accent="border-l-red-500" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Risk Distribution */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <BarChart2 size={16} className="text-slate-500" /> Risk Distribution
              </h2>
              <div className="space-y-4">
                {[
                  { label: "High Risk", count: summary.risk_distribution.high, color: "bg-red-500", text: "text-red-600" },
                  { label: "Medium Risk", count: summary.risk_distribution.medium, color: "bg-amber-500", text: "text-amber-600" },
                  { label: "Low Risk", count: summary.risk_distribution.low, color: "bg-green-500", text: "text-green-600" },
                ].map(({ label, count, color, text }) => {
                  const pct = summary.total_students > 0 ? (count / summary.total_students) * 100 : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-600 font-medium">{label}</span>
                        <span className={`font-bold ${text}`}>{count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategic Action Plan */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-5">🎯 Strategic Action Plan</h2>
              <ul className="space-y-4 text-sm">
                <li className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <span className="text-slate-600">
                    Initiate <strong>remedial classes</strong> for the <strong className="text-red-600">{summary.risk_distribution.high} high-risk students</strong> scoring below 40%.
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <span className="text-slate-600">
                    Issue <strong>attendance warnings</strong> to the <strong className="text-amber-600">{summary.at_risk_attendance_count} students</strong> below the 75% threshold.
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                  <span className="text-slate-600">
                    Focus faculty resources on <strong className="text-purple-600">{weakSubjects[0]?.[0]}</strong> — lowest department average at <strong>{weakSubjects[0]?.[1]}%</strong>.
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
                  <span className="text-slate-600">
                    Verify placement eligibility — department average is <strong className="text-blue-600">{summary.avg_marks}%</strong>.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Top At-Risk Students */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">🚨 Top 5 At-Risk Students</h2>
            <div className="grid sm:grid-cols-5 gap-3">
              {summary.at_risk_students.map((s) => (
                <div
                  key={s.student_id}
                  onClick={() => { setSelectedStudent(students.find(x => x.student_id === s.student_id) || s); setActiveTab("students"); }}
                  className="border border-slate-200 rounded-xl p-4 hover:border-red-300 hover:bg-red-50/30 transition-all cursor-pointer"
                >
                  <p className="font-semibold text-slate-800 text-sm truncate">{s.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{s.student_id}</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">{s.avg_marks}%</p>
                  <p className="text-[10px] text-red-500 font-medium mt-1">Click to view →</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STUDENTS TAB ── */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {["all", "high", "medium", "low"].map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                  riskFilter === r ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {r === "all" ? "All Students" : riskBadge[r]}
              </button>
            ))}
            <span className="text-xs text-slate-400 self-center">{filtered.length} of {students.length}</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Student", "ID", "Dept", "Year", "Avg Marks", "Attendance", "Risk"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{s.student_id}</td>
                    <td className="px-4 py-3 text-slate-500">{s.department}</td>
                    <td className="px-4 py-3 text-slate-500">Y{s.year}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${s.avg_marks < 40 ? "text-red-600" : s.avg_marks < 60 ? "text-amber-600" : "text-green-600"}`}>
                        {s.avg_marks}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.avg_attendance}%</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskColor[s.risk]}`}>
                        {riskBadge[s.risk]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">No students match the current filter.</p>
            )}
          </div>
        </div>
      )}

      {/* ── SUBJECTS TAB ── */}
      {activeTab === "subjects" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-800">Subject-wise Department Performance</h2>
          <div className="space-y-3">
            {Object.entries(summary.subject_averages)
              .sort((a, b) => a[1] - b[1])
              .map(([subj, avg]) => (
                <div key={subj} className="flex items-center gap-4">
                  <span className="text-sm text-slate-700 w-64 truncate flex-shrink-0 font-medium">{subj}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${avg < 40 ? "bg-red-400" : avg < 60 ? "bg-amber-400" : "bg-green-400"}`}
                      style={{ width: `${avg}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-2 text-[10px] font-bold text-white drop-shadow">
                      {avg}%
                    </span>
                  </div>
                  <span className={`text-xs font-bold w-16 text-right ${avg < 40 ? "text-red-600" : avg < 60 ? "text-amber-600" : "text-green-600"}`}>
                    {avg < 40 ? "⚠ Weak" : avg < 60 ? "~ Fair" : "✓ Good"}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ icon, label, value, sub, accent }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-l-4 ${accent}`}>
      <div className="text-slate-500 mb-3">{icon}</div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

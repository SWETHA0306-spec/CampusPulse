import { useEffect, useState, useMemo } from "react";
import {
  Users, BookOpen, Activity, AlertTriangle,
  Search, BarChart3, TrendingUp, Award
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function MentorDashboard() {
  const { user } = useAuth();
  const mentorSubject = user?.subjects?.[0] || "Machine Learning";

  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/mentor/summary?subject=${encodeURIComponent(mentorSubject)}`).then((r) => r.json()),
      fetch(`/api/students?subject=${encodeURIComponent(mentorSubject)}`).then((r) => r.json()),
    ])
      .then(([sum, studs]) => {
        setSummary(sum);
        setStudents(studs);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [mentorSubject]);

  // ── Derived data for charts ──
  const scoreDistribution = useMemo(() => {
    if (!students.length) return [];
    const buckets = [
      { range: "0–40", min: 0, max: 40, count: 0, color: "#ef4444" },
      { range: "40–60", min: 40, max: 60, count: 0, color: "#f59e0b" },
      { range: "60–75", min: 60, max: 75, count: 0, color: "#3b82f6" },
      { range: "75–90", min: 75, max: 90, count: 0, color: "#22c55e" },
      { range: "90–100", min: 90, max: 101, count: 0, color: "#10b981" },
    ];
    students.forEach((s) => {
      const b = buckets.find((b) => s.avg_marks >= b.min && s.avg_marks < b.max);
      if (b) b.count++;
    });
    const maxCount = Math.max(...buckets.map((b) => b.count), 1);
    return buckets.map((b) => ({ ...b, pct: (b.count / maxCount) * 100 }));
  }, [students]);

  const topStudents = useMemo(() => {
    return [...students].sort((a, b) => b.avg_marks - a.avg_marks).slice(0, 5);
  }, [students]);

  const bottomStudents = useMemo(() => {
    return [...students].sort((a, b) => a.avg_marks - b.avg_marks).slice(0, 5);
  }, [students]);

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "all" || s.risk === riskFilter;
    return matchSearch && matchRisk;
  });

  const riskColor = { high: "text-red-600 bg-red-50", medium: "text-amber-600 bg-amber-50", low: "text-green-600 bg-green-50" };
  const riskBadge = { high: "🔴 High", medium: "🟡 Medium", low: "🟢 Low" };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm gap-2">
        <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        Loading mentor dashboard...
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-4">
        ⚠️ Failed to load: {error}. Make sure the backend is running at{" "}
        <code>localhost:8000</code>.
      </div>
    );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                📚 {mentorSubject}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-semibold">
                Mentor View
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              {mentorSubject} — Performance Dashboard
            </h1>
            <p className="text-indigo-200 text-sm mt-1">
              Welcome, <strong className="text-white">{user?.name}</strong> — viewing results & risk analysis scoped to your subject.
            </p>
          </div>
          <div className="flex gap-2">
            {["overview", "students"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  activeTab === tab
                    ? "bg-white text-indigo-700 shadow"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {tab === "students" ? "👥 Students" : "📊 Overview"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={<Users size={18} />} label="Students Enrolled" value={summary.total_students} color="blue" />
            <StatCard icon={<Activity size={18} />} label="Avg Attendance" value={`${summary.avg_attendance}%`} color="green" />
            <StatCard icon={<BookOpen size={18} />} label={`Avg Marks (${mentorSubject})`} value={`${summary.avg_marks}%`} color="purple" />
            <StatCard icon={<AlertTriangle size={18} />} label="High Risk" value={summary.risk_distribution.high} color="red" />
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Score Distribution Bar Chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-600" />
                Score Distribution — {mentorSubject}
              </h2>
              <p className="text-xs text-slate-400 mb-5">Number of students in each marks bracket</p>
              <div className="space-y-3">
                {scoreDistribution.map((b) => (
                  <div key={b.range} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 w-16 shrink-0">{b.range}%</span>
                    <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all duration-700 flex items-center pl-2.5"
                        style={{ width: `${Math.max(b.pct, 8)}%`, backgroundColor: b.color }}
                      >
                        <span className="text-[11px] font-bold text-white drop-shadow-sm">{b.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Distribution Donut-like Visual */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-5">Risk Distribution — {mentorSubject}</h2>
              <div className="space-y-3">
                {[
                  { label: "High Risk (< 40%)", count: summary.risk_distribution.high, color: "bg-red-500", textColor: "text-red-600" },
                  { label: "Medium Risk (40–60%)", count: summary.risk_distribution.medium, color: "bg-amber-500", textColor: "text-amber-600" },
                  { label: "Low Risk (≥ 60%)", count: summary.risk_distribution.low, color: "bg-green-500", textColor: "text-green-600" },
                ].map(({ label, count, color, textColor }) => {
                  const total = summary.risk_distribution.high + summary.risk_distribution.medium + summary.risk_distribution.low;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 font-medium">{label}</span>
                        <span className={`font-bold ${textColor}`}>{count} students ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Total students with marks data</span>
                <span className="text-sm font-bold text-slate-800">
                  {summary.risk_distribution.high + summary.risk_distribution.medium + summary.risk_distribution.low}
                </span>
              </div>
            </div>
          </div>

          {/* Top & Bottom Performers */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top 5 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Award size={18} className="text-emerald-600" />
                Top Performers — {mentorSubject}
              </h2>
              <div className="space-y-2">
                {topStudents.map((s, i) => (
                  <div key={s.student_id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 hover:bg-emerald-50/40 transition-colors">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold">
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{s.student_id}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{s.avg_marks}%</span>
                  </div>
                ))}
                {topStudents.length === 0 && <p className="text-sm text-slate-400">No data</p>}
              </div>
            </div>

            {/* Bottom 5 (At Risk) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-600" />
                Needs Attention — {mentorSubject}
              </h2>
              <div className="space-y-2">
                {bottomStudents.map((s, i) => (
                  <div key={s.student_id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 hover:bg-red-50/40 transition-colors">
                    <span className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center text-xs font-extrabold">
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{s.student_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-600">{s.avg_marks}%</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${riskColor[s.risk]}`}>
                        {riskBadge[s.risk]}
                      </span>
                    </div>
                  </div>
                ))}
                {bottomStudents.length === 0 && <p className="text-sm text-slate-400">No data</p>}
              </div>
            </div>
          </div>

          {/* Per-Student Horizontal Bar Graph */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              All Students — {mentorSubject} Marks
            </h2>
            <p className="text-xs text-slate-400 mb-4">Horizontal bar for each student's score in {mentorSubject}</p>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {[...students].sort((a, b) => b.avg_marks - a.avg_marks).map((s) => {
                const barColor = s.avg_marks < 40 ? "#ef4444" : s.avg_marks < 60 ? "#f59e0b" : s.avg_marks < 75 ? "#3b82f6" : "#22c55e";
                return (
                  <div key={s.student_id} className="flex items-center gap-2 group">
                    <span className="text-[11px] text-slate-500 w-28 truncate shrink-0 group-hover:text-slate-800 transition-colors" title={s.name}>
                      {s.name}
                    </span>
                    <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{ width: `${s.avg_marks}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <span className="text-[11px] font-bold w-10 text-right" style={{ color: barColor }}>
                      {s.avg_marks}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── STUDENTS TAB ── */}
      {activeTab === "students" && (
        <div className="space-y-4">
          {/* Search + Filter */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
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
                  riskFilter === r ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {r === "all" ? "All" : riskBadge[r]}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Student", "ID", "Dept", `Marks (${mentorSubject})`, "Attendance", "Risk"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{s.student_id}</td>
                    <td className="px-4 py-3 text-slate-500">{s.department}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${s.avg_marks < 40 ? "text-red-600" : s.avg_marks < 60 ? "text-amber-600" : "text-green-600"}`}>
                        {s.avg_marks}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.avg_attendance}%</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${riskColor[s.risk]}`}>
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
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className={`w-9 h-9 rounded-lg ${colors[color]} border flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

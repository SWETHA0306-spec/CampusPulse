import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { TrendingUp, Award, BookOpen, Activity, BarChart2, AlertTriangle } from "lucide-react";

export default function AcademicPerformance() {
  const { user } = useAuth();
  const studentId = user?.id || "CP038";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/academic/performance/${studentId}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [studentId]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm gap-2">
        <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        Loading academic performance data...
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl p-4">
        ⚠️ {error} — make sure the backend is running at <code>localhost:8000</code>.
      </div>
    );

  const { name, overall_avg, rank, total_students, subject_scores, dept_subject_avg, attendance, score_distribution } = data;
  const subjects = Object.keys(subject_scores);
  const maxScore = 100;

  const attPct = attendance?.percentage ?? 0;
  const attPresent = attendance?.present ?? 0;
  const attAbsent = attendance?.absent ?? 0;
  const attLate = attendance?.late ?? 0;
  const attTotal = attendance?.total_classes ?? 1;

  const riskColor = overall_avg < 40 ? "text-red-600" : overall_avg < 60 ? "text-amber-600" : "text-green-600";
  const riskBg = overall_avg < 40 ? "bg-red-50 border-red-200" : overall_avg < 60 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200";
  const attColor = attPct < 65 ? "text-red-600" : attPct < 75 ? "text-amber-600" : "text-green-600";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Academic Performance</h1>
        <p className="text-slate-500 text-sm mt-1">
          Real-time analysis for <strong>{name}</strong> ({studentId}) — sourced from your academic records.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<TrendingUp size={18} />}
          label="Overall Average"
          value={`${overall_avg}%`}
          sub="Across all subjects"
          valueClass={riskColor}
          accent="border-l-brand-500"
        />
        <KPICard
          icon={<Award size={18} />}
          label="Class Rank"
          value={rank ? `#${rank}` : "—"}
          sub={`Out of ${total_students} students`}
          valueClass="text-purple-600"
          accent="border-l-purple-500"
        />
        <KPICard
          icon={<Activity size={18} />}
          label="Attendance"
          value={`${attPct}%`}
          sub={attendance?.status || "—"}
          valueClass={attColor}
          accent="border-l-green-500"
        />
        <KPICard
          icon={<BookOpen size={18} />}
          label="Subjects"
          value={subjects.length}
          sub="Enrolled this semester"
          valueClass="text-blue-600"
          accent="border-l-blue-500"
        />
      </div>

      {/* Chart Row 1: Subject Scores + Dept Comparison */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Horizontal Bar — My Subject Scores */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <BarChart2 size={16} className="text-brand-500" />
            My Subject Scores
          </h2>
          <div className="space-y-3">
            {Object.entries(subject_scores)
              .sort((a, b) => a[1] - b[1])
              .map(([subj, score]) => {
                const color = score < 40 ? "bg-red-500" : score < 60 ? "bg-amber-400" : score < 75 ? "bg-blue-400" : "bg-green-500";
                const textColor = score < 40 ? "text-red-600" : score < 60 ? "text-amber-600" : score < 75 ? "text-blue-600" : "text-green-600";
                return (
                  <div key={subj}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium truncate max-w-[60%]">{subj}</span>
                      <span className={`font-bold ${textColor}`}>{score}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-700`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Grouped Bar — Me vs Department Average */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <TrendingUp size={16} className="text-purple-500" />
            Me vs Department Average
          </h2>
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-brand-500 inline-block" /> You</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-300 inline-block" /> Dept Avg</span>
          </div>
          <div className="space-y-3">
            {Object.entries(subject_scores).map(([subj, myScore]) => {
              const deptScore = dept_subject_avg[subj] ?? 0;
              const better = myScore >= deptScore;
              return (
                <div key={subj}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium truncate max-w-[55%]">{subj}</span>
                    <span className={`font-bold text-xs ${better ? "text-green-600" : "text-red-500"}`}>
                      {better ? "▲" : "▼"} You: {myScore}% | Dept: {deptScore}%
                    </span>
                  </div>
                  <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                    {/* Dept avg bar (background) */}
                    <div
                      className="absolute h-full bg-slate-300 rounded-full"
                      style={{ width: `${deptScore}%` }}
                    />
                    {/* My score bar (foreground) */}
                    <div
                      className={`absolute h-full ${myScore >= deptScore ? "bg-brand-500" : "bg-red-400"} rounded-full opacity-90 transition-all duration-700`}
                      style={{ width: `${myScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart Row 2: Attendance Donut + Score Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Attendance Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <Activity size={16} className="text-green-500" />
            Attendance Breakdown
          </h2>
          <div className="flex items-center gap-8">
            {/* SVG Donut */}
            <DonutChart
              present={attPresent}
              absent={attAbsent}
              late={attLate}
              total={attTotal}
              percentage={attPct}
            />
            <div className="space-y-3 flex-1">
              <AttLegend color="bg-green-500" label="Present" count={attPresent} total={attTotal} />
              <AttLegend color="bg-red-400" label="Absent" count={attAbsent} total={attTotal} />
              <AttLegend color="bg-amber-400" label="Late" count={attLate} total={attTotal} />
              <div className={`mt-4 text-xs font-bold px-3 py-1.5 rounded-lg border ${riskBg} ${attColor}`}>
                Status: {attendance?.status} — Risk: {attendance?.risk}
              </div>
            </div>
          </div>
          {attPct < 75 && (
            <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>Your attendance is below 75%. You need to attend <strong>{Math.ceil((0.75 * attTotal - attPresent))} more classes</strong> to reach the safe threshold.</span>
            </div>
          )}
        </div>

        {/* Score Distribution Histogram */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <BarChart2 size={16} className="text-blue-500" />
            Department Score Distribution
          </h2>
          <p className="text-xs text-slate-400 mb-4">How all students are spread across mark ranges — your position: <strong className={riskColor}>{overall_avg}%</strong></p>
          <div className="flex items-end gap-3 h-40">
            {Object.entries(score_distribution).map(([bucket, count]) => {
              const maxCount = Math.max(...Object.values(score_distribution), 1);
              const heightPct = (count / maxCount) * 100;
              const isMe = (
                (bucket === "0-40" && overall_avg < 40) ||
                (bucket === "40-60" && overall_avg >= 40 && overall_avg < 60) ||
                (bucket === "60-75" && overall_avg >= 60 && overall_avg < 75) ||
                (bucket === "75-90" && overall_avg >= 75 && overall_avg < 90) ||
                (bucket === "90-100" && overall_avg >= 90)
              );
              return (
                <div key={bucket} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-600">{count}</span>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-700 ${isMe ? "bg-brand-500 ring-2 ring-brand-400" : "bg-slate-200"}`}
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                    title={`${bucket}: ${count} students`}
                  />
                  <span className={`text-[9px] font-semibold text-center leading-tight ${isMe ? "text-brand-600" : "text-slate-400"}`}>
                    {bucket}
                    {isMe && " ★"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Radar-style subject table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">📋 Full Subject Report Card</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Your Score</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Dept Average</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">vs Dept</th>
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Object.entries(subject_scores)
                .sort((a, b) => a[1] - b[1])
                .map(([subj, score]) => {
                  const dept = dept_subject_avg[subj] ?? 0;
                  const diff = (score - dept).toFixed(1);
                  const status = score < 40 ? { label: "🔴 High Risk", cls: "text-red-600 bg-red-50" }
                    : score < 60 ? { label: "🟡 Medium Risk", cls: "text-amber-600 bg-amber-50" }
                    : { label: "🟢 On Track", cls: "text-green-600 bg-green-50" };
                  return (
                    <tr key={subj} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-medium text-slate-800">{subj}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${score < 40 ? "text-red-600" : score < 60 ? "text-amber-600" : "text-green-600"}`}>{score}%</span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${score < 40 ? "bg-red-500" : score < 60 ? "bg-amber-400" : "bg-green-500"}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{dept}%</td>
                      <td className="py-3 px-3">
                        <span className={`text-xs font-bold ${parseFloat(diff) >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {parseFloat(diff) >= 0 ? `+${diff}` : diff}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function KPICard({ icon, label, value, sub, valueClass, accent }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm border-l-4 ${accent}`}>
      <div className="text-slate-400 mb-3">{icon}</div>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{label}</p>
      <p className={`text-3xl font-extrabold mt-1 ${valueClass}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function DonutChart({ present, absent, late, total, percentage }) {
  const size = 100;
  const r = 38;
  const cx = 50;
  const cy = 50;
  const circ = 2 * Math.PI * r;

  const presentPct = total > 0 ? present / total : 0;
  const absentPct = total > 0 ? absent / total : 0;
  const latePct = total > 0 ? late / total : 0;

  const presentLen = presentPct * circ;
  const absentLen = absentPct * circ;
  const lateLen = latePct * circ;

  const startPresent = 0;
  const startAbsent = presentLen;
  const startLate = presentLen + absentLen;

  const color = percentage < 65 ? "#ef4444" : percentage < 75 ? "#f59e0b" : "#22c55e";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
      <DonutArc cx={cx} cy={cy} r={r} circ={circ} len={presentLen} offset={startPresent} color="#22c55e" />
      <DonutArc cx={cx} cy={cy} r={r} circ={circ} len={absentLen} offset={startAbsent} color="#f87171" />
      <DonutArc cx={cx} cy={cy} r={r} circ={circ} len={lateLen} offset={startLate} color="#fbbf24" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="800" fill={color}>
        {percentage}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="#94a3b8">
        Attendance
      </text>
    </svg>
  );
}

function DonutArc({ cx, cy, r, circ, len, offset, color }) {
  if (len <= 0) return null;
  return (
    <circle
      cx={cx} cy={cy} r={r}
      fill="none"
      stroke={color}
      strokeWidth="10"
      strokeDasharray={`${len} ${circ - len}`}
      strokeDashoffset={-offset}
      transform={`rotate(-90 ${cx} ${cy})`}
      strokeLinecap="butt"
    />
  );
}

function AttLegend({ color, label, count, total }) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-sm ${color} inline-block shrink-0`} />
        <span className="text-slate-600">{label}</span>
      </div>
      <span className="text-slate-800 font-bold">{count} <span className="text-slate-400 font-normal text-xs">({pct}%)</span></span>
    </div>
  );
}

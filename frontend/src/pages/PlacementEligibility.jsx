import React, { useEffect, useState } from "react";
import { Send, Users, Building2, CheckCircle2, XCircle, MessageSquareText, TrendingUp, BarChart3 } from "lucide-react";
import Loader from "../components/Loader.jsx";
import EligibilityRow from "../components/EligibilityRow.jsx";
import { fetchCompanies as fetchHodCompanies, fetchShortlist, sendNotifications } from "../api/placementClient.js";
import { useAuth } from "../context/AuthContext.jsx";
import { sendChatMessage } from "../api/chatService.js";

export default function PlacementEligibility() {
  const { user } = useAuth();
  if (user?.role === "Student") return <StudentPlacementView user={user} />;
  return <HodPlacementView />;
}

// ──────────────────────────────────────────────────────────────────────────────
// STUDENT VIEW — RAG-backed eligibility
// ──────────────────────────────────────────────────────────────────────────────
function StudentPlacementView({ user }) {
  const [profile, setProfile] = useState(null);   // full response from /api/placement/eligibility
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [ragMap, setRagMap]   = useState({});      // { companyId: { loading, text } }

  useEffect(() => {
    fetch(`/api/placement/eligibility?student_id=${encodeURIComponent(user.id)}`)
      .then(r => {
        if (!r.ok) throw new Error(`Backend returned ${r.status}`);
        return r.json();
      })
      .then(data => { setProfile(data); setLoading(false); })
      .catch(err  => { setError(err.message); setLoading(false); });
  }, [user.id]);

  // Send company-specific ineligibility context to the RAG model
  const handleExplain = async (company) => {
    if (ragMap[company.id]) return;
    setRagMap(prev => ({ ...prev, [company.id]: { loading: true, text: null } }));

    // Build a rich, context-heavy prompt so the RAG gives a precise explanation
    const subjectList = profile.subject_scores
      .map(s => `${s.subject_name}: ${s.avg}%`)
      .join(", ");

    const prompt =
      `Context: My student ID is ${profile.student_id}. My current academic profile is — ` +
      `overall average: ${profile.avg_marks}%, overall risk level: ${profile.risk}, ` +
      `subject-wise scores: ${subjectList}. ` +
      `The company "${company.name}" (${company.role}) requires a minimum average of ${company.min_avg_marks}%` +
      `${!company.allow_high_risk ? " and zero high-risk subjects" : ""}. ` +
      `Reasons I did not qualify: ${company.reasons.join(" | ")}. ` +
      `Based on this data, explain specifically what I need to improve to become eligible for this company, ` +
      `which subjects to focus on first, and give a realistic timeline.`;

    try {
      const answer = await sendChatMessage(user.id, prompt, "Student");
      setRagMap(prev => ({ ...prev, [company.id]: { loading: false, text: answer } }));
    } catch {
      setRagMap(prev => ({ ...prev, [company.id]: { loading: false, text: "Could not generate explanation — please check if the backend is running." } }));
    }
  };

  if (loading) return <Loader label="Fetching placement eligibility…" />;
  if (error)   return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
      ⚠️ Could not load placement data: <code>{error}</code>
      <p className="mt-1 text-xs text-red-500">Make sure the backend is running at <code>localhost:8000</code>.</p>
    </div>
  );

  const eligible   = profile.companies.filter(c => c.eligible);
  const ineligible = profile.companies.filter(c => !c.eligible);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                🎯 Campus Placements
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Your Placement Dashboard</h1>
            <p className="text-indigo-200 text-sm mt-1">
              Welcome, <strong className="text-white">{user?.name}</strong> — eligibility computed from your live academic records.
            </p>
          </div>
          {/* Stats cluster */}
          {profile.found && (
            <div className="flex gap-3 flex-wrap">
              <StatPill label="Avg Marks" value={`${profile.avg_marks}%`} />
              <StatPill label="Attendance" value={`${profile.avg_attendance}%`} />
              <StatPill
                label="Risk"
                value={profile.risk.toUpperCase()}
                color={profile.risk === "high" ? "red" : profile.risk === "medium" ? "amber" : "green"}
              />
              <StatPill label="Eligible For" value={`${eligible.length} / ${profile.companies.length}`} color="green" />
            </div>
          )}
        </div>
      </div>

      {/* ── Subject score mini-bar chart ── */}
      {profile.found && profile.subject_scores.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-600" /> Subject-wise Scores
          </h2>
          <div className="space-y-2">
            {profile.subject_scores
              .sort((a, b) => b.avg - a.avg)
              .map(s => {
                const color = s.avg < 40 ? "#ef4444" : s.avg < 60 ? "#f59e0b" : s.avg < 75 ? "#3b82f6" : "#22c55e";
                return (
                  <div key={s.subject_name} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-52 truncate shrink-0">{s.subject_name}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                      <div className="h-full rounded transition-all duration-500" style={{ width: `${s.avg}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-xs font-bold w-10 text-right" style={{ color }}>{s.avg}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Company data sheet ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Building2 size={16} className="text-indigo-600" /> Upcoming Placement Drives
          </h2>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={13}/> {eligible.length} Eligible</span>
            <span className="flex items-center gap-1 text-red-500"><XCircle size={13}/> {ineligible.length} Not Eligible</span>
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase font-bold">
            <tr>
              <th className="px-5 py-3">Company</th>
              <th className="px-5 py-3">Role & CTC</th>
              <th className="px-5 py-3">Criteria</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {profile.companies.map(c => {
              const rag = ragMap[c.id];
              return (
                <React.Fragment key={c.id}>
                  <tr className={`transition-colors ${c.eligible ? "hover:bg-green-50/30" : "hover:bg-red-50/20"}`}>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">{c.role}</p>
                      <p className="text-xs font-bold text-indigo-600 mt-0.5">{c.ctc}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 space-y-0.5">
                      <p>Avg ≥ <strong>{c.min_avg_marks}%</strong></p>
                      {!c.allow_high_risk && <p className="text-red-500 font-medium">No high-risk subjects</p>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {c.eligible ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-200">
                          <CheckCircle2 size={13}/> Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold border border-red-200">
                          <XCircle size={13}/> Not Eligible
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!c.eligible && !rag && (
                        <button
                          onClick={() => handleExplain(c)}
                          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-900 font-medium text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <MessageSquareText size={13}/> Explain Why
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* RAG Explanation row */}
                  {rag && (
                    <tr className="bg-indigo-50/40 border-b border-indigo-100">
                      <td colSpan="5" className="px-6 py-4">
                        <div className="flex gap-3">
                          <div className="w-1 bg-indigo-400 rounded-full flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-widest mb-2">
                              🤖 AI Advisor — {c.name}
                            </p>
                            {rag.loading ? (
                              <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                Analyzing your academic profile…
                              </div>
                            ) : (
                              <div
                                className="text-sm text-slate-700 leading-relaxed whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: rag.text.replace(/\*{1,3}([^*]+)\*{1,3}/g, "<strong>$1</strong>") }}
                              />
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Ineligibility reasons (compact) */}
                  {!c.eligible && c.reasons.length > 0 && !rag && (
                    <tr className="bg-red-50/30">
                      <td colSpan="5" className="px-6 py-2">
                        <ul className="text-xs text-red-600 space-y-0.5 list-disc list-inside">
                          {c.reasons.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatPill({ label, value, color = "default" }) {
  const colors = {
    default: "bg-white/15 text-white",
    green:   "bg-green-500/20 text-green-100",
    red:     "bg-red-500/20 text-red-100",
    amber:   "bg-amber-500/20 text-amber-100",
  };
  return (
    <div className={`${colors[color]} px-3 py-2 rounded-xl backdrop-blur-sm text-center min-w-[80px]`}>
      <p className="text-[10px] uppercase font-bold opacity-70">{label}</p>
      <p className="text-base font-extrabold">{value}</p>
    </div>
  );
}


// ──────────────────────────────────────────────────────────────────────────────
// HOD VIEW — Original admin functionality, unchanged
// ──────────────────────────────────────────────────────────────────────────────
function HodPlacementView() {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected]   = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => {
    fetchHodCompanies()
      .then(list => { setCompanies(list); if (list.length) setSelected(list[0]); })
      .catch(e => setError(e.message));
  }, []);

  async function handlePreview() {
    if (!selected) return;
    setLoading(true); setError(null); setResult(null);
    try { setResult(await fetchShortlist(selected)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleNotify() {
    if (!result) return;
    const ok = window.confirm(`Send eligibility emails to all ${result.total_students} students for ${result.company}?`);
    if (!ok) return;
    setNotifying(true); setError(null);
    try { const s = await sendNotifications(result.company); alert(s.message || "Notifications sent!"); }
    catch (e) { setError(e.message); }
    finally { setNotifying(false); }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Placement Eligibility (Admin)</h1>
        <p className="text-slate-500 text-sm mt-1">Shortlist students for a drive and preview the emails before sending.</p>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={handlePreview} className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2">
          <Users size={16}/> Preview shortlist
        </button>
        {result && (
          <button onClick={handleNotify} disabled={notifying}
            className="border border-brand-600 text-brand-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-50 transition-colors flex items-center gap-2 disabled:opacity-50">
            <Send size={16}/> {notifying ? "Sending…" : "Send emails to all"}
          </button>
        )}
      </div>
      {loading && <Loader label="Running eligibility checks…" />}
      {error   && <p className="text-red-600 text-sm">{error}</p>}
      {result  && (
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <span className="bg-white border border-slate-200 rounded-lg px-4 py-2">Total: <strong>{result.total_students}</strong></span>
            <span className="bg-green-50 text-green-700 rounded-lg px-4 py-2">Eligible: <strong>{result.eligible_count}</strong></span>
            <span className="bg-red-50 text-red-700 rounded-lg px-4 py-2">Not eligible: <strong>{result.ineligible_count}</strong></span>
          </div>
          <div className="space-y-2">{result.students.map(s => <EligibilityRow key={s.roll_no} student={s}/>)}</div>
        </div>
      )}
    </div>
  );
}

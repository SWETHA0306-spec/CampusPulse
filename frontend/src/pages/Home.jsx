import { Link } from "react-router-dom";
import {
  GraduationCap, LineChart, Briefcase, LayoutDashboard,
  Building2, ShieldCheck, ArrowRight, Bot, Zap,
  Users, PieChart, BookOpen, Activity
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user } = useAuth();
  const role = user?.role || "Guest";

  return (
    <div className="space-y-16">

      {/* ── Hero ── */}
      <section className="relative text-center py-16 px-4 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6 shadow-sm">
          <Zap size={12} className="fill-brand-500 text-brand-500" />
          AI-Powered Campus Intelligence Platform
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Campus<span className="text-brand-600">Pulse</span>
        </h1>
        <p className="mt-5 text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
          {role === "Student" && (
            <>Your personalised academic companion — track progress, beat backlogs, and stay ahead.</>
          )}
          {role === "Mentor" && (
            <>Monitor your students, spot risks early, and take action before it's too late.</>
          )}
          {role === "HOD" && (
            <>Strategic department intelligence — real-time performance, risk, and subject analytics.</>
          )}
          {role === "Guest" && (
            <>Two agent systems, one campus. Personalised learning for every student. Automated oversight for every teacher.</>
          )}
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          {role === "Student" && (
            <>
              <Link to="/personalised-learning" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg">
                Open My Learning <ArrowRight size={16} />
              </Link>
              <Link to="/academic-performance" className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm">
                View My Performance
              </Link>
            </>
          )}
          {role === "Mentor" && (
            <>
              <Link to="/mentor" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg">
                Open My Dashboard <ArrowRight size={16} />
              </Link>
              <Link to="/personalised-learning" className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm">
                Student Insights
              </Link>
            </>
          )}
          {role === "HOD" && (
            <>
              <Link to="/hod" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg">
                Open HOD Portal <ArrowRight size={16} />
              </Link>
              <Link to="/personalised-learning" className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm">
                Department View
              </Link>
            </>
          )}
          {role === "Guest" && (
            <Link to="/login" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg">
              Sign In to Get Started <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </section>

      {/* ── Role-aware Feature Cards ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 text-center">
          {role === "Guest" ? "Explore the Platform" : `What's available for you, ${user?.name?.split(" ")[0]}`}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {getCards(role).map((card) => (
            <FeatureCard key={card.to} {...card} />
          ))}
        </div>
      </section>



    </div>
  );
}

// ─── Card data by role ────────────────────────────────────────────────────────

function getCards(role) {
  const allCards = {
    learning_student: {
      to: "/personalised-learning",
      icon: <GraduationCap size={22} />,
      color: "bg-brand-50 text-brand-600 border-brand-100",
      accent: "group-hover:border-brand-300",
      title: "My Learning",
      desc: "Chat with your AI learning assistant. Get your risk profile, recovery plan, study schedule, and revision priorities.",
      cta: "Open My Learning",
    },
    learning_mentor: {
      to: "/personalised-learning",
      icon: <Users size={22} />,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      accent: "group-hover:border-blue-300",
      title: "Student Insights",
      desc: "Look up any student's risk profile, recovery plan, and study schedule using the AI assistant.",
      cta: "Open Insights",
    },
    learning_hod: {
      to: "/personalised-learning",
      icon: <PieChart size={22} />,
      color: "bg-purple-50 text-purple-600 border-purple-100",
      accent: "group-hover:border-purple-300",
      title: "Department View",
      desc: "AI-powered department analytics — ask questions about performance trends, risk distribution, and subject averages.",
      cta: "Open View",
    },
    academic: {
      to: "/academic-performance",
      icon: <LineChart size={22} />,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      accent: "group-hover:border-indigo-300",
      title: "Academic Performance",
      desc: "Visual charts: subject scores, me vs dept average, attendance breakdown, and class rank.",
      cta: "View Performance",
    },
    placement: {
      to: "/placement",
      icon: <Briefcase size={22} />,
      color: "bg-green-50 text-green-600 border-green-100",
      accent: "group-hover:border-green-300",
      title: "Placement Eligibility",
      desc: "Check your placement readiness based on CGPA, skills, 10th, and 12th marks.",
      cta: "Check Eligibility",
    },
    mentor: {
      to: "/mentor",
      icon: <LayoutDashboard size={22} />,
      color: "bg-amber-50 text-amber-600 border-amber-100",
      accent: "group-hover:border-amber-300",
      title: "My Dashboard",
      desc: "Overview of student risk distribution, subject averages, and students needing immediate intervention.",
      cta: "Open Dashboard",
    },
    hod: {
      to: "/hod",
      icon: <ShieldCheck size={22} />,
      color: "bg-rose-50 text-rose-600 border-rose-100",
      accent: "group-hover:border-rose-300",
      title: "HOD Portal",
      desc: "Strategic department oversight: KPIs, risk charts, subject performance, and auto-generated action plans.",
      cta: "Open Portal",
    },
    smart: {
      to: "/smart-campus",
      icon: <Building2 size={22} />,
      color: "bg-slate-100 text-slate-600 border-slate-200",
      accent: "group-hover:border-slate-400",
      title: "Smart Campus",
      desc: "Lab bookings, seminar halls, campus events, and canteen orders — all managed by specialised agents.",
      cta: "Explore",
    },
  };

  if (role === "Student") return [allCards.learning_student, allCards.academic, allCards.placement, allCards.smart];
  if (role === "Mentor") return [allCards.mentor, allCards.learning_mentor, allCards.smart];
  if (role === "HOD") return [allCards.hod, allCards.learning_hod, allCards.smart];
  // Guest — show all
  return [allCards.learning_student, allCards.academic, allCards.placement, allCards.mentor, allCards.hod, allCards.smart];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureCard({ to, icon, color, accent, title, desc, cta }) {
  return (
    <Link
      to={to}
      className={`group block p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 ${accent}`}
    >
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${color}`}>
        {icon}
      </div>
      <h2 className="font-bold text-base text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{desc}</p>
      <span className="inline-flex items-center gap-1 text-brand-600 text-sm font-semibold mt-4 group-hover:gap-2 transition-all">
        {cta} <ArrowRight size={14} />
      </span>
    </Link>
  );
}

function Step({ num, title, desc }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center mb-4 shadow-lg">
        {num}
      </div>
      <h3 className="font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

import { NavLink, Link } from "react-router-dom";
import {
  Activity,
  GraduationCap,
  LineChart,
  Briefcase,
  LayoutDashboard,
  Building2,
  ShieldCheck,
  LogOut,
  LogIn,
  Users,
  PieChart
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const linkClass = ({ isActive }) =>
  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "bg-brand-600 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-extrabold text-lg text-slate-900">
          <span className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
            <Activity size={20} />
          </span>
          <span>
            Campus<span className="text-brand-600">Pulse</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          {/* Personalised Learning — label changes by role */}
          {(!user || user.role === "Student") && (
            <NavLink to="/personalised-learning" className={linkClass}>
              <GraduationCap size={16} /> My Learning
            </NavLink>
          )}
          {user?.role === "Mentor" && (
            <NavLink to="/personalised-learning" className={linkClass}>
              <Users size={16} /> Student Insights
            </NavLink>
          )}
          {user?.role === "HOD" && (
            <NavLink to="/personalised-learning" className={linkClass}>
              <PieChart size={16} /> Department View
            </NavLink>
          )}

          {/* Academic Performance — Students only */}
          {(!user || user.role === "Student") && (
            <NavLink to="/academic-performance" className={linkClass}>
              <LineChart size={16} /> Academic Performance
            </NavLink>
          )}

          {/* Placement — Students only */}
          {(!user || user.role === "Student") && (
            <NavLink to="/placement" className={linkClass}>
              <Briefcase size={16} /> Placement
            </NavLink>
          )}

          {/* Mentor tab — Mentor only */}
          {user?.role === "Mentor" && (
            <NavLink to="/mentor" className={linkClass}>
              <LayoutDashboard size={16} /> My Dashboard
            </NavLink>
          )}

          {/* HOD tab — HOD only */}
          {user?.role === "HOD" && (
            <NavLink to="/hod" className={linkClass}>
              <ShieldCheck size={16} /> HOD Portal
            </NavLink>
          )}

          <NavLink to="/smart-campus" className={linkClass}>
            <Building2 size={16} /> Smart Campus
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-full pl-3 pr-1.5 py-1 shadow-sm">
              <span className="text-sm">{user.avatar}</span>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-brand-600 font-semibold leading-tight">
                  {user.role} ({user.id})
                </p>
              </div>
              <Link
                to="/login"
                title="Switch Role or Account"
                className="ml-2 px-2 py-1 rounded-full bg-white hover:bg-brand-50 border border-slate-200 text-slate-600 hover:text-brand-700 text-[10px] font-bold transition-all"
              >
                Switch
              </Link>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <LogIn size={14} /> Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

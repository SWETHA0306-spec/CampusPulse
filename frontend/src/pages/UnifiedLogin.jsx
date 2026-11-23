import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Sparkles, GraduationCap, Users, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth, DEMO_ACCOUNTS } from "../context/AuthContext.jsx";

export default function UnifiedLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login, selectDemoAccount, user } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError(null);
    const result = login(username, password);
    if (result.success) {
      navigate("/personalised-learning");
    } else {
      setError(result.message);
    }
  };

  const handleDemoClick = (key) => {
    const acc = selectDemoAccount(key);
    if (acc) {
      navigate("/personalised-learning");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white border border-slate-200 rounded-3xl p-8 shadow-card">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles size={14} /> Unified Campus Access
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900">Sign in to CampusPulse</h1>
        <p className="text-slate-500 text-sm mt-2">
          One portal for Students, Mentors, and Department Heads. Views automatically adapt to your role.
        </p>
      </div>


      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            User ID / Roll No (CP###)
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. CP038, swetha_mentor, nitin_hod"
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Password (any for demo)
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-md hover:shadow-lg mt-2"
        >
          Sign In
        </button>
      </form>

      {user && (
        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Currently active as: <strong className="text-slate-700">{user.avatar} {user.name} ({user.role})</strong>
          </p>
        </div>
      )}
    </div>
  );
}

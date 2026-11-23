import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";

export default function Login({ type }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (type === "Mentor") {
      if (username === "swetha_mentor" && password === "campus@agent") {
        navigate("/mentor");
      } else {
        alert("Invalid Mentor Credentials");
      }
    } else if (type === "HOD") {
      if (username === "nitin_hod" && password === "campus@agent") {
        navigate("/hod");
      } else {
        alert("Invalid HOD Credentials");
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white border border-slate-200 rounded-2xl p-8 shadow-card">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{type} Login</h1>
        <p className="text-slate-500 text-sm mt-1">Access the campus {type.toLowerCase()} dashboard</p>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Username</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={`${type.toLowerCase()}_user`}
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700 transition-all shadow-md"
        >
          Login to {type} Dashboard
        </button>
      </form>
    </div>
  );
}

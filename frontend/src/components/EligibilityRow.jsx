import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import RiskBadge from "./RiskBadge.jsx";

export default function EligibilityRow({ student }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg bg-white shadow-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-left"
      >
        <span className="flex items-center gap-3">
          <span
            className={`w-2 h-2 rounded-full ${student.eligible ? "bg-green-500" : "bg-red-400"}`}
          />
          <span className="font-medium text-slate-800">{student.name}</span>
          <span className="text-slate-400">{student.roll_no}</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="text-slate-400 hidden sm:inline">{student.email}</span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 text-sm border-t border-slate-100 pt-3">
          {student.gaps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Gaps</p>
              <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                {student.gaps.map((g) => <li key={g}>{g}</li>)}
              </ul>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Tips sent</p>
            <ul className="list-disc list-inside text-slate-600 space-y-0.5">
              {student.tips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

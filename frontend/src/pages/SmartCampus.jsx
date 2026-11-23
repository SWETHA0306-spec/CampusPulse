import { useState, useRef, useEffect } from "react";
import {
  Building2, Calendar, Utensils, Send, Bot, User,
  Sparkles, BookOpen, Clock
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { sendChatMessage } from "../api/chatService.js";

// ── Quick-prompt chips ──────────────────────────────────────────────────────
const CHIPS = [
  { icon: <Building2 size={13} />, label: "Book a lab", query: "I want to book a computer lab. What options are available?" },
  { icon: <Calendar size={13} />, label: "Upcoming events", query: "What hackathons or campus events are coming up for me?" },
  { icon: <Utensils size={13} />, label: "My deadlines", query: "What are my upcoming task deadlines?" },
  { icon: <BookOpen size={13} />, label: "My tasks", query: "Show me all my pending tasks." },
  { icon: <Clock size={13} />, label: "Hackathon status", query: "What is the status of my hackathon registrations?" },
];

// ── Markdown + table renderer ──────────────────────────────────────────────
function inlineFormat(text) {
  // Strip all asterisks and wrap the content in strong tag, preserving inline code blocks.
  // Using a dangerouslySetInnerHTML approach to keep it simple and robust against *** vs **
  const htmlSafe = text.replace(/\*{1,3}([^*]+)\*{1,3}/g, '<strong class="font-semibold text-slate-900">$1</strong>')
                       .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-brand-700 px-1 rounded text-xs font-mono">$1</code>');
  return <span dangerouslySetInnerHTML={{ __html: htmlSafe }} />;
}

function renderMarkdown(text) {
  const lines = text.split("\n");
  const result = [];
  let tableBuffer = [];
  let inTable = false;

  const flushTable = (key) => {
    if (tableBuffer.length === 0) return;
    result.push(
      <div key={`tbl-${key}`} className="overflow-x-auto my-2">
        <table className="text-xs border-collapse w-full">
          <tbody>
            {tableBuffer.map((row, ri) => {
              const cells = row.split("|").filter(Boolean).map((c) => c.trim());
              return (
                <tr key={ri} className="border-b border-slate-100">
                  {cells.map((c, ci) => (
                    <td key={ci} className="px-3 py-1.5 text-xs text-slate-700">{inlineFormat(c)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
    tableBuffer = [];
    inTable = false;
  };

  lines.forEach((line, i) => {
    if (/^\|---/.test(line)) return; // skip separator
    if (/^\|/.test(line)) {
      inTable = true;
      tableBuffer.push(line);
      return;
    }
    if (inTable) flushTable(i);

    if (line.startsWith("## ")) {
      result.push(<h2 key={i} className="text-sm font-bold text-slate-800 mt-3 mb-1">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      result.push(<h1 key={i} className="text-base font-bold text-slate-900 mt-2 mb-1">{line.slice(2)}</h1>);
    } else if (line.startsWith("### ")) {
      result.push(<h3 key={i} className="text-xs font-bold text-slate-700 mt-2 mb-0.5">{line.slice(4)}</h3>);
    } else if (line.startsWith("- ")) {
      result.push(<li key={i} className="ml-4 text-slate-700 list-disc text-sm leading-relaxed">{inlineFormat(line.slice(2))}</li>);
    } else if (line.startsWith("> ")) {
      result.push(<blockquote key={i} className="border-l-4 border-brand-300 bg-brand-50 pl-3 py-1 my-1.5 text-xs text-brand-700 rounded-r-lg italic">{line.slice(2)}</blockquote>);
    } else if (line.trim() === "") {
      result.push(<div key={i} className="h-1" />);
    } else {
      result.push(<p key={i} className="text-sm text-slate-700 leading-relaxed">{inlineFormat(line)}</p>);
    }
  });

  if (inTable) flushTable("end");
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SmartCampus() {
  const { user } = useAuth();
  const studentId = user?.id || "CP038";
  const role = user?.role || "Student";
  const firstName = user?.name?.split(" ")[0] || "there";

  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: `**Welcome to Smart Campus!** 👋\n\nHi ${firstName}! I'm powered by the CampusPulse RAG system — I have access to your real campus data including tasks, hackathon registrations, deadlines, and academic records.\n\nAsk me anything about your campus life.`,
      time: new Date(),
      loading: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    const q = (text ?? input).trim();
    if (!q || isTyping) return;
    setInput("");

    setMessages((m) => [...m, { role: "user", text: q, time: new Date() }]);
    setIsTyping(true);

    try {
      // Use real RAG backend — same endpoint as Personalised Learning chat
      const answer = await sendChatMessage(studentId, q, role, null);
      setMessages((m) => [...m, { role: "bot", text: answer, time: new Date() }]);
    } catch {
      setMessages((m) => [...m, {
        role: "bot",
        text: "⚠️ Could not reach the campus assistant. Make sure the backend is running.",
        time: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const fmt = (d) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 9rem)" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Smart Campus</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
              RAG-powered · Real data · Tasks · Events · Hackathons
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {["Tasks", "Events", "Hackathons", "Deadlines"].map((label) => (
            <span key={label} className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2.5 py-1 rounded-full">
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Quick chips ── */}
      <div className="flex gap-2 flex-wrap mb-3 shrink-0">
        {CHIPS.map(({ icon, label, query }) => (
          <button
            key={label}
            onClick={() => sendMessage(query)}
            disabled={isTyping}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-brand-400 hover:bg-brand-50 text-slate-600 hover:text-brand-700 disabled:opacity-50 text-xs font-medium px-3 py-1.5 rounded-full transition-all shadow-sm"
          >
            {icon} {label} <span className="text-slate-300 text-[10px]">→</span>
          </button>
        ))}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm self-end ${
              msg.role === "bot"
                ? "bg-gradient-to-br from-brand-500 to-purple-600 text-white"
                : "bg-slate-200 text-slate-600"
            }`}>
              {msg.role === "bot" ? <Bot size={14} /> : <User size={14} />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[78%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`rounded-2xl px-4 py-3 shadow-sm text-sm ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-tr-sm"
                  : "bg-white border border-slate-200 rounded-tl-sm"
              }`}>
                {msg.role === "user"
                  ? <p>{msg.text}</p>
                  : <div className="space-y-0.5">{renderMarkdown(msg.text)}</div>
                }
              </div>
              <span className="text-[10px] text-slate-400 px-1">{fmt(msg.time)}</span>
            </div>
          </div>
        ))}

        {/* Typing dots */}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 150, 300].map((delay) => (
                  <span key={delay} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="mt-3 border-t border-slate-200 pt-4 shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your tasks, hackathons, deadlines, events…"
              disabled={isTyping}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 shadow-sm transition-all disabled:opacity-60"
            />
            <Sparkles size={13} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-md transition-all hover:shadow-lg active:scale-95"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Powered by CampusPulse RAG · Answers grounded in real campus data
        </p>
      </div>
    </div>
  );
}

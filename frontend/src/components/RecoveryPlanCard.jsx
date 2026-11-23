import RiskBadge from "./RiskBadge.jsx";

export default function RecoveryPlanCard({ subject, data }) {
  const cleaned = (data.plan_text || "")
    .replace(/^#{1,6}\s*/gm, "")           // strip ## ### headings
    .replace(/\*{1,3}([^*\n]+)\*{1,3}/g, "$1"); // strip * ** *** markers

  const formattedText = cleaned;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-cardHover transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-slate-900">{subject}</h3>
        <RiskBadge level={data.risk} />
      </div>
      <pre 
        className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
      <div className="flex flex-wrap gap-1.5 pt-3">
        {data.topics.map((t) => (
          <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{t}</span>
        ))}
      </div>
    </div>
  );
}

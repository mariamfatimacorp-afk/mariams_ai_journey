"use client";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const SOURCE_LABEL: Record<string, string> = {
  canada_job_bank: "🍁 Job Bank",
  indeed: "🔍 Indeed",
  greenhouse: "🌱 Greenhouse",
  lever: "⚡ Lever",
  linkedin: "💼 LinkedIn",
};

interface App {
  id: string;
  status: string;
  matchScore: number | null;
  matchReasons: string[];
  tailoredResume: string | null;
  coverLetter: string | null;
  createdAt: string;
  job: {
    title: string;
    company: string;
    location: string;
    remote: boolean;
    source: string;
    url: string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryText: string | null;
    postedAt: string | null;
  };
}

export default function JobCard({
  app,
  onApprove,
  onReject,
}: {
  app: App;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [expanded, setExpanded] = useState<"cover_letter" | "resume" | null>(null);
  const [approving, setApproving] = useState(false);

  const score = app.matchScore ?? 0;
  const scoreColor =
    score >= 75 ? "text-green-600 bg-green-50" :
    score >= 55 ? "text-yellow-600 bg-yellow-50" :
    "text-red-500 bg-red-50";

  async function approve() {
    setApproving(true);
    await onApprove();
  }

  function formatSalary(job: App["job"]): string {
    if (job.salaryText) return job.salaryText;
    if (job.salaryMin && job.salaryMax) return `$${job.salaryMin}–$${job.salaryMax}`;
    if (job.salaryMin) return `$${job.salaryMin}+`;
    return "Salary not listed";
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs text-slate-400">{SOURCE_LABEL[app.job.source] ?? app.job.source}</span>
              {app.job.remote && (
                <span className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">Remote</span>
              )}
              {app.job.postedAt && (
                <span className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(app.job.postedAt), { addSuffix: true })}
                </span>
              )}
            </div>
            <a
              href={app.job.url}
              target="_blank"
              rel="noreferrer"
              className="text-lg font-semibold text-slate-900 hover:text-indigo-600 transition block truncate"
            >
              {app.job.title}
            </a>
            <p className="text-sm text-slate-500 mt-0.5">
              {app.job.company} · {app.job.location}
            </p>
            <p className="text-sm text-slate-400 mt-0.5">{formatSalary(app.job)}</p>
          </div>

          {/* Match score */}
          <div className={`flex-shrink-0 rounded-xl px-3 py-2 text-center ${scoreColor}`}>
            <div className="text-2xl font-bold leading-none">{Math.round(score)}</div>
            <div className="text-xs font-medium mt-0.5">match</div>
          </div>
        </div>

        {/* Match reasons */}
        {app.matchReasons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {app.matchReasons.map((r, i) => (
              <span key={i} className="text-xs bg-slate-50 border border-slate-100 text-slate-600 rounded-full px-2.5 py-1">
                {r}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* AI materials preview */}
      {(app.tailoredResume || app.coverLetter) && (
        <div className="border-t border-slate-100 px-5 py-3 flex gap-3">
          {app.coverLetter && (
            <button
              onClick={() => setExpanded(expanded === "cover_letter" ? null : "cover_letter")}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {expanded === "cover_letter" ? "Hide" : "Preview"} Cover Letter
            </button>
          )}
          {app.tailoredResume && (
            <button
              onClick={() => setExpanded(expanded === "resume" ? null : "resume")}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {expanded === "resume" ? "Hide" : "Preview"} Tailored Resume
            </button>
          )}
        </div>
      )}

      {/* Expanded preview */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
          <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">
            {expanded === "cover_letter" ? app.coverLetter : app.tailoredResume}
          </pre>
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-end gap-3">
        <button
          onClick={onReject}
          className="text-sm text-slate-500 hover:text-red-600 font-medium transition"
        >
          Skip
        </button>
        <button
          onClick={approve}
          disabled={approving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-5 py-2 transition"
        >
          {approving ? "Adding…" : "✓ Approve"}
        </button>
      </div>
    </div>
  );
}

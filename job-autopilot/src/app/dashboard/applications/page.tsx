"use client";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLOR: Record<string, string> = {
  pending_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-slate-100 text-slate-500",
  submitting: "bg-purple-100 text-purple-800",
  submitted: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Skipped",
  submitting: "Submitting…",
  submitted: "Submitted ✅",
  failed: "Failed ❌",
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => { setApps(data); setLoading(false); });
  }, []);

  const filtered = filter ? apps.filter((a) => a.status === filter) : apps;

  const counts = apps.reduce((acc: Record<string, number>, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">All Applications</h1>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {Object.entries(STATUS_LABEL).map(([status, label]) => (
          <button
            key={status}
            onClick={() => setFilter(filter === status ? "" : status)}
            className={`rounded-xl p-4 text-left border transition ${
              filter === status ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-200 hover:border-slate-300"
            } bg-white`}
          >
            <div className="text-2xl font-bold text-slate-900">{counts[status] ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-20">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Job</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Company</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Source</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Match</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <a href={app.job.url} target="_blank" rel="noreferrer"
                       className="text-indigo-600 hover:underline font-medium">
                      {app.job.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{app.job.company}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5">
                      {app.job.source.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {app.matchScore != null ? (
                      <span className={`font-semibold ${app.matchScore >= 70 ? "text-green-600" : app.matchScore >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                        {Math.round(app.matchScore)}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs rounded-full px-2 py-1 font-medium ${STATUS_COLOR[app.status] ?? "bg-slate-100"}`}>
                      {STATUS_LABEL[app.status] ?? app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No applications yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

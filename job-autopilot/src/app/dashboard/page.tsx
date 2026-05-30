"use client";
import { useEffect, useState } from "react";
import JobCard from "@/components/JobCard";

interface Application {
  id: string;
  status: string;
  matchScore: number | null;
  matchReasons: string[];
  tailoredResume: string | null;
  coverLetter: string | null;
  submittedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  job: {
    id: string;
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

export default function Dashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/applications?status=pending_review");
    if (res.ok) setApps(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDiscover() {
    setDiscovering(true);
    setMessage("");
    const res = await fetch("/api/jobs/discover", { method: "POST" });
    const data = await res.json();
    setDiscovering(false);
    if (data.ok) {
      setMessage(`✅ Found ${data.discovered} new jobs, tailored ${data.tailored} with AI.`);
      await load();
    } else {
      setMessage(`❌ Error: ${data.error}`);
    }
  }

  async function handleApprove(id: string) {
    await fetch(`/api/applications/${id}/approve`, { method: "POST" });
    setApps((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleReject(id: string) {
    await fetch(`/api/applications/${id}/reject`, { method: "POST" });
    setApps((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleSubmitAll() {
    setSubmitting(true);
    setMessage("");
    const res = await fetch("/api/applications/submit-approved", { method: "POST" });
    const data = await res.json();
    setSubmitting(false);
    setMessage(`✅ Submitted ${data.submitted ?? 0} applications.`);
    await load();
  }

  const approvedCount = apps.filter((a) => a.status === "approved").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Queue</h1>
          <p className="text-slate-500 text-sm mt-1">
            Approve or reject jobs — then click Submit to apply automatically.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 text-sm font-medium rounded-lg px-4 py-2 transition flex items-center gap-2"
          >
            {discovering ? (
              <span className="animate-spin inline-block">⏳</span>
            ) : (
              "🔍"
            )}
            {discovering ? "Searching jobs…" : "Find New Jobs"}
          </button>

          {approvedCount > 0 && (
            <button
              onClick={handleSubmitAll}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
            >
              {submitting ? "Submitting…" : `🚀 Submit ${approvedCount} Approved`}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="mb-6 bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-center py-20">Loading…</div>
      ) : apps.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-slate-500">No jobs in your review queue.</p>
          <p className="text-slate-400 text-sm mt-2">
            Click <strong>Find New Jobs</strong> to start — or come back tomorrow morning after the overnight run.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <JobCard
              key={app.id}
              app={app}
              onApprove={() => handleApprove(app.id)}
              onReject={() => handleReject(app.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

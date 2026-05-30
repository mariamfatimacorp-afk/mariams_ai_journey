"use client";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [prefs, setPrefs] = useState({
    roles: [] as string[],
    keywords: [] as string[],
    locations: [] as string[],
    salaryMin: 0,
    salaryUnit: "hourly" as "hourly" | "annual",
    remote: false,
    jobType: "any" as "full_time" | "contract" | "any",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((p) => {
      if (p.preferences && Object.keys(p.preferences).length > 0) setPrefs(p.preferences);
    });
  }, []);

  function setList(field: "roles" | "keywords" | "locations", value: string) {
    setPrefs((p) => ({ ...p, [field]: value.split(",").map((s) => s.trim()).filter(Boolean) }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: prefs }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Job Preferences</h1>
      <p className="text-slate-500 text-sm mb-8">These preferences drive what jobs are discovered for you each night.</p>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Job Titles</label>
          <input
            value={prefs.roles.join(", ")}
            onChange={(e) => setList("roles", e.target.value)}
            placeholder="AI Engineer, D365 Consultant, Machine Learning Engineer"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <p className="text-xs text-slate-400 mt-1">Comma-separated list of job titles to search for</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Search Keywords</label>
          <input
            value={prefs.keywords.join(", ")}
            onChange={(e) => setList("keywords", e.target.value)}
            placeholder="AI, Dynamics 365, Azure, pharmacy assistant"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Locations</label>
          <input
            value={prefs.locations.join(", ")}
            onChange={(e) => setList("locations", e.target.value)}
            placeholder="Toronto, Remote, Canada, Alberta"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Min Salary</label>
            <input
              type="number"
              value={prefs.salaryMin}
              onChange={(e) => setPrefs((p) => ({ ...p, salaryMin: Number(e.target.value) }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
            <select
              value={prefs.salaryUnit}
              onChange={(e) => setPrefs((p) => ({ ...p, salaryUnit: e.target.value as any }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="hourly">Per Hour ($/hr)</option>
              <option value="annual">Annual ($/yr)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Type</label>
            <select
              value={prefs.jobType}
              onChange={(e) => setPrefs((p) => ({ ...p, jobType: e.target.value as any }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="any">Any</option>
              <option value="full_time">Full-time</option>
              <option value="contract">Contract / Freelance</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="remote"
            type="checkbox"
            checked={prefs.remote}
            onChange={(e) => setPrefs((p) => ({ ...p, remote: e.target.checked }))}
            className="w-4 h-4 text-indigo-600 rounded"
          />
          <label htmlFor="remote" className="text-sm text-slate-700">Prefer remote positions</label>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-5 py-2 transition">
            {saving ? "Saving…" : "Save Preferences"}
          </button>
          {saved && <span className="text-green-600 text-sm">✅ Saved!</span>}
        </div>
      </form>

      <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
        <strong>⏰ Overnight Schedule:</strong> The job crawler runs automatically every night at 2:00 AM.
        You'll have a fresh batch of applications ready to review each morning.
        You can also trigger a manual run from the Dashboard.
      </div>
    </div>
  );
}

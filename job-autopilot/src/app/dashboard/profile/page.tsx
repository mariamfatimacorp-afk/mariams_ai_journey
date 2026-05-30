"use client";
import { useEffect, useRef, useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [liEmail, setLiEmail] = useState("");
  const [liPassword, setLiPassword] = useState("");
  const [indeedEmail, setIndeedEmail] = useState("");
  const [indeedPassword, setIndeedPassword] = useState("");

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((p) => {
      setProfile(p);
      setPhone(p.phone ?? "");
      setCity(p.city ?? "");
      setLinkedinUrl(p.linkedinUrl ?? "");
      setPortfolioUrl(p.portfolioUrl ?? "");
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body: any = { phone, city, linkedinUrl, portfolioUrl };
    if (liEmail) { body.linkedinEmail = liEmail; body.linkedinPassword = liPassword; }
    if (indeedEmail) { body.indeedEmail = indeedEmail; body.indeedPassword = indeedPassword; }
    await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploadMsg("Uploading…");
    const fd = new FormData();
    fd.append("resume", file);
    const res = await fetch("/api/profile/resume", { method: "POST", body: fd });
    const data = await res.json();
    if (data.ok) {
      setUploadMsg(`✅ Uploaded ${data.fileName} (${data.characters.toLocaleString()} characters extracted)`);
      setProfile((p: any) => ({ ...p, hasResume: true, resumeFileName: data.fileName }));
    } else {
      setUploadMsg(`❌ ${data.error}`);
    }
  }

  if (!profile) return <div className="text-slate-400 text-center py-20">Loading…</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Profile</h1>

      {/* Resume */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">📄 Resume</h2>
        {profile.hasResume ? (
          <div className="flex items-center gap-3 mb-4">
            <span className="text-green-600">✅</span>
            <span className="text-sm text-slate-700">{profile.resumeFileName}</span>
          </div>
        ) : (
          <p className="text-sm text-amber-600 mb-4">⚠️ No resume uploaded yet. Upload one to enable AI tailoring.</p>
        )}
        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm file:font-medium hover:file:bg-indigo-100" />
          <button onClick={handleUpload} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition">
            Upload
          </button>
        </div>
        {uploadMsg && <p className="text-sm mt-3 text-slate-600">{uploadMsg}</p>}
      </section>

      {/* Personal info */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">👤 Personal Info</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 416 555 0100" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Toronto" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">LinkedIn URL</label>
            <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Portfolio / GitHub URL</label>
            <input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://github.com/yourname" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-5 py-2 transition">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </section>

      {/* Platform credentials */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-1">🔐 Job Board Credentials</h2>
        <p className="text-xs text-slate-500 mb-4">Used for automatic application submission. Stored locally in your database — never sent to third parties.</p>

        <div className="space-y-6">
          {/* LinkedIn */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-slate-700">LinkedIn</span>
              {profile.hasLinkedinCreds && <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">Configured ✓</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={liEmail} onChange={(e) => setLiEmail(e.target.value)} type="email" placeholder="LinkedIn email" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input value={liPassword} onChange={(e) => setLiPassword(e.target.value)} type="password" placeholder="LinkedIn password" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          {/* Indeed */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-slate-700">Indeed</span>
              {profile.hasIndeedCreds && <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">Configured ✓</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={indeedEmail} onChange={(e) => setIndeedEmail(e.target.value)} type="email" placeholder="Indeed email" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input value={indeedPassword} onChange={(e) => setIndeedPassword(e.target.value)} type="password" placeholder="Indeed password" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          <button onClick={(e) => { e.preventDefault(); handleSave(e as any); }} className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg px-5 py-2 transition">
            Save Credentials
          </button>
        </div>
      </section>
    </div>
  );
}

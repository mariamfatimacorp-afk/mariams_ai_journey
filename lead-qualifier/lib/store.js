import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(here, "..", "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, "[]");
}

export function getLeads() {
  ensureFile();
  return JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
}

export function saveLead(lead) {
  ensureFile();
  const leads = getLeads();
  // One lead per chat session — a later save_lead call updates the same record
  const existing = leads.findIndex((l) => l.session_id === lead.session_id);
  const record = {
    id: existing >= 0 ? leads[existing].id : crypto.randomUUID(),
    created_at: existing >= 0 ? leads[existing].created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...lead,
  };
  if (existing >= 0) leads[existing] = record;
  else leads.push(record);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  return record;
}

export function leadsToCsv(leads) {
  const cols = [
    "created_at", "name", "email", "phone", "company", "score", "tier",
    "budget_range", "timeline", "is_decision_maker", "need_summary", "notes",
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = leads.map((l) => cols.map((c) => esc(l[c])).join(","));
  return [cols.join(","), ...rows].join("\n");
}

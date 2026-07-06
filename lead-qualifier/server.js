import "dotenv/config";
import express from "express";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { runTurn, getOpeningMessage } from "./lib/agent.js";
import { getLeads, leadsToCsv } from "./lib/store.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(here, "public")));

// In-memory session store: sessionId -> { history, lastActive }
const sessions = new Map();
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.lastActive > SESSION_TTL_MS) sessions.delete(id);
  }
}, 10 * 60 * 1000).unref();

// Start a chat session
app.post("/api/session", (req, res) => {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { history: [], lastActive: Date.now() });
  res.json({ sessionId, message: getOpeningMessage() });
});

// Send a message
app.post("/api/chat", async (req, res) => {
  const { sessionId, message } = req.body || {};
  if (!sessionId || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "sessionId and message are required" });
  }
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: "Session expired — start a new one" });
  if (message.length > 4000) return res.status(400).json({ error: "Message too long" });

  session.lastActive = Date.now();
  try {
    const reply = await runTurn(sessionId, session.history, message.trim());
    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "The assistant is temporarily unavailable. Please try again." });
  }
});

// Dashboard data — protect with DASHBOARD_KEY if set
function checkDashboardAuth(req, res, next) {
  const key = process.env.DASHBOARD_KEY;
  if (key && req.query.key !== key && req.get("x-dashboard-key") !== key) {
    return res.status(401).json({ error: "Unauthorized — add ?key=YOUR_DASHBOARD_KEY" });
  }
  next();
}

app.get("/api/leads", checkDashboardAuth, (req, res) => {
  const leads = getLeads().sort((a, b) => b.created_at.localeCompare(a.created_at));
  res.json({ leads });
});

app.get("/api/leads.csv", checkDashboardAuth, (req, res) => {
  res.set("Content-Type", "text/csv");
  res.set("Content-Disposition", "attachment; filename=leads.csv");
  res.send(leadsToCsv(getLeads()));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(here, "public", "dashboard.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Lead qualification agent running:`);
  console.log(`  Chat demo:  http://localhost:${PORT}`);
  console.log(`  Dashboard:  http://localhost:${PORT}/dashboard`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("  ⚠ ANTHROPIC_API_KEY is not set — chat will fail until you add it to .env");
  }
});

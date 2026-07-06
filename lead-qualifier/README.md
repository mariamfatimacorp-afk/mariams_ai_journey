# 🤖 AI Lead Qualification Agent

A production-ready lead qualification chatbot powered by Claude. It chats with website visitors, answers questions about the business, naturally qualifies them (need, budget, timeline, decision authority), captures their contact details, scores every lead 0–100, and shows everything on a live dashboard.

This is the exact "build clients a lead qualification agent" offer — configure it per client, deploy it, embed one script tag on their site.

## What it does

- **Conversational qualification** — the agent works BANT questions (Budget, Authority, Need, Timeline) into a natural conversation, one at a time. Never feels like a form.
- **Automatic lead capture** — Claude calls a `save_lead` tool the moment it has a name + email, and keeps updating the lead as it learns more.
- **Deterministic scoring** — scoring happens in code (not in the model), fully configurable per client in `config.json`. Leads are tiered 🔥 hot / 🌤 warm / ❄️ cold.
- **Dashboard** — live table of leads with stats and one-click CSV export at `/dashboard`.
- **Embeddable widget** — clients add one `<script>` tag and get a floating chat bubble on their site.
- **Webhook notifications** — optionally POST every captured lead to a webhook (Zapier, Make, Slack, a CRM).

## Quick start

```bash
cd lead-qualifier
npm install
cp .env.example .env    # add your ANTHROPIC_API_KEY
npm start
```

- Chat demo: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard

## Configure for a client (this is the whole deployment playbook)

Everything client-specific lives in **`config.json`**:

| Section | What to change |
|---|---|
| `business` | Client's name, description, services, price range, booking link |
| `agent` | Assistant name, tone, opening message |
| `qualification` | Scoring weights per budget/timeline band, hot/warm thresholds |
| `notifications.webhook_url` | Where to POST new leads (Zapier/Make/Slack/CRM) |

Then deploy anywhere Node runs (Railway, Render, Fly.io, a $5 VPS) and give the client this embed snippet:

```html
<script src="https://YOUR-DEPLOYED-URL/widget.js" async></script>
```

Set `DASHBOARD_KEY` in `.env` on production so the dashboard is private
(`/dashboard?key=...`).

## How the scoring works

Claude extracts structured data through the `save_lead` tool (strict JSON schema), and the server scores it deterministically:

| Signal | Max points |
|---|---|
| Budget band | 30 |
| Timeline | 30 |
| Is the decision maker | 20 |
| Has a clear, concrete need | 20 |

≥ 70 = **hot**, 40–69 = **warm**, otherwise **cold**. All weights and thresholds are editable in `config.json`.

## Architecture

```
Visitor ↔ widget.js / index.html
            ↓ POST /api/chat
        server.js (Express, sessions in memory)
            ↓
        lib/agent.js — Claude (claude-opus-4-8, adaptive thinking)
            ↳ save_lead tool → lib/store.js (data/leads.json) + webhook
            ↓
        /dashboard ← /api/leads + /api/leads.csv
```

Notes for production hardening (worth doing before charging $8k 😄):
- Swap `data/leads.json` for SQLite/Postgres if you expect volume.
- Sessions are in-memory — a server restart drops active conversations (saved leads persist). Use Redis if you need durability.
- Put it behind HTTPS and set `DASHBOARD_KEY`.

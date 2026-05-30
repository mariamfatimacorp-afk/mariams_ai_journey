# Job Autopilot — Setup Guide

## What this app does

1. **Finds jobs overnight** from Canada Job Bank, Indeed, Greenhouse, and Lever
2. **AI tailors your resume + cover letter** for each job using Claude
3. **Shows you a review queue** each morning — approve or skip in ~10 minutes
4. **Submits approved applications** via browser automation (Playwright)

Two users are pre-configured: **Mariam** (AI/D365 roles) and **Adam** (Pharmacy Assistant, all Canada).

---

## Quick Start (Local)

### 1. Install dependencies

```bash
cd job-autopilot
npm install
npx playwright install chromium
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-your-key-here"
CRON_SECRET="any-random-string"
```

Get your Anthropic API key at: https://console.anthropic.com

### 3. Set up database

```bash
npm run db:push    # Create SQLite database
npm run db:seed    # Create Mariam + Adam accounts
```

### 4. Start the app

```bash
npm run dev
```

Open http://localhost:3000

### 5. Log in

- **Mariam**: `mariam@autopilot.local` / `mariam123`
- **Adam**: `brother@autopilot.local` / `adam123`

---

## First-time setup (each user)

1. **Profile → Upload Resume** — Upload your PDF resume
2. **Profile → Add credentials** — Add LinkedIn and/or Indeed login (for auto-submit)
3. **Job Preferences** — Review and adjust keywords, locations, salary target
4. **Dashboard → Find New Jobs** — Run your first job discovery manually

---

## Overnight automation

### Option A: System cron (recommended for VPS/server)

Add to crontab (`crontab -e`):
```
0 2 * * * curl -s -X POST http://localhost:3000/api/cron/run \
  -H "x-cron-secret: YOUR_CRON_SECRET" > /var/log/job-autopilot-cron.log 2>&1
```

### Option B: Vercel Cron Jobs (if deployed on Vercel)

Add to `vercel.json`:
```json
{
  "crons": [{ "path": "/api/cron/run", "schedule": "0 2 * * *" }]
}
```
Then set `CRON_SECRET` in Vercel environment variables.

---

## Deploy to a $5/month VPS (Railway, Render, Fly.io)

### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli
railway login
railway init
railway up
```
Set env vars in Railway dashboard.

### Docker (any VPS)
```bash
docker-compose up -d
```

---

## Changing passwords

After first login, go to the terminal and run:
```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('NewPassword123', 10))"
# Then update the database:
npx prisma studio
# Find your user and update the password field
```

---

## How the automation works

When you click **Submit Approved** on the dashboard:

1. For **Canada Job Bank** jobs: Playwright opens the job URL and fills the application
2. For **Indeed** jobs: Logs into your Indeed account and completes Easy Apply
3. For **LinkedIn** jobs: Logs into your LinkedIn account and completes Easy Apply
4. For **Greenhouse/Lever** jobs: Fills the standard ATS form fields

> ⚠️ LinkedIn and Indeed prohibit automated applications in their ToS.
> This app uses your own account for your own applications (personal use only).
> If you get a security challenge, log in manually once to clear it.

---

## Customizing job search

Edit job preferences in **Settings**:

| Field | Mariam example | Adam example |
|---|---|---|
| Job titles | `AI Engineer, D365 Consultant` | `Pharmacy Assistant, Pharmacy Technician` |
| Keywords | `AI, Dynamics 365, Azure` | `pharmacy, dispensing` |
| Locations | `Toronto, Remote, Canada` | `Alberta, BC, Ontario, Canada` |
| Min salary | `100` ($/hr) | `18` ($/hr) |
| Job type | Contract | Full-time |

---

## Tech stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Database**: SQLite + Prisma ORM
- **Auth**: NextAuth.js (email/password)
- **AI**: Anthropic Claude API (resume tailoring + cover letters)
- **Job sources**: Canada Job Bank API, Indeed (Playwright), Greenhouse API, Lever API
- **Automation**: Playwright (Chromium)
- **Scheduling**: External cron → `/api/cron/run`

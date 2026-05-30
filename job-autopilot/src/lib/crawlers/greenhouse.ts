// Greenhouse Harvest API — public job board endpoints (no auth required)
// Used by thousands of tech companies; no ToS restrictions on reading public postings

import type { RawJob } from "./canada-job-bank";

// Well-known companies that use Greenhouse and are relevant for AI/D365 roles
const AI_COMPANIES = [
  "microsoft",
  "accenture",
  "deloitte",
  "kpmg",
  "thoughtworks",
  "publicissapient",
  "cognizant",
  "infosys",
];

// Companies relevant for pharmacy / healthcare roles
const HEALTHCARE_COMPANIES = [
  "shoppers",
  "rexall",
  "loblaws",
  "superstore",
  "longsdrugs",
];

export async function discoverGreenhouse(
  keywords: string[],
  targetCompanies: string[] = []
): Promise<RawJob[]> {
  const companies = targetCompanies.length ? targetCompanies : AI_COMPANIES;
  const jobs: RawJob[] = [];
  const kw = keywords.map((k) => k.toLowerCase());

  await Promise.allSettled(
    companies.map(async (boardToken) => {
      try {
        const res = await fetch(
          `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`,
          { signal: AbortSignal.timeout(10_000) }
        );
        if (!res.ok) return;
        const data = await res.json();
        for (const job of data.jobs ?? []) {
          const text = `${job.title} ${job.content ?? ""}`.toLowerCase();
          if (!kw.some((k) => text.includes(k))) continue;

          jobs.push({
            source: "greenhouse",
            externalId: String(job.id),
            url: job.absolute_url ?? `https://boards.greenhouse.io/${boardToken}/jobs/${job.id}`,
            title: job.title,
            company: boardToken,
            location: job.location?.name ?? "Remote",
            remote: /remote/i.test(job.location?.name ?? ""),
            salaryMin: null,
            salaryMax: null,
            salaryText: null,
            description: (job.content ?? "").replace(/<[^>]*>/g, " ").slice(0, 5000),
            postedAt: job.updated_at ? new Date(job.updated_at) : null,
          });
        }
      } catch {
        // Skip failed companies silently
      }
    })
  );

  return jobs;
}

export async function discoverLever(
  keywords: string[],
  targetCompanies: string[] = []
): Promise<RawJob[]> {
  const companies = targetCompanies.length ? targetCompanies : AI_COMPANIES;
  const jobs: RawJob[] = [];
  const kw = keywords.map((k) => k.toLowerCase());

  await Promise.allSettled(
    companies.map(async (company) => {
      try {
        const res = await fetch(
          `https://api.lever.co/v0/postings/${company}?mode=json`,
          { signal: AbortSignal.timeout(10_000) }
        );
        if (!res.ok) return;
        const data: any[] = await res.json();
        for (const job of data) {
          const text = `${job.text} ${job.descriptionPlain ?? ""}`.toLowerCase();
          if (!kw.some((k) => text.includes(k))) continue;

          jobs.push({
            source: "lever",
            externalId: job.id,
            url: job.hostedUrl ?? `https://jobs.lever.co/${company}/${job.id}`,
            title: job.text,
            company,
            location: job.categories?.location ?? job.workplaceType ?? "Remote",
            remote: /remote/i.test(job.workplaceType ?? job.categories?.location ?? ""),
            salaryMin: null,
            salaryMax: null,
            salaryText: null,
            description: (job.descriptionPlain ?? job.description ?? "").slice(0, 5000),
            postedAt: job.createdAt ? new Date(job.createdAt) : null,
          });
        }
      } catch {
        // Skip
      }
    })
  );

  return jobs;
}

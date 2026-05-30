// Canada Job Bank — public API, no authentication required
// Docs: https://api.canada.ca/en/jobs

export interface RawJob {
  source: string;
  externalId: string;
  url: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryText: string | null;
  description: string;
  postedAt: Date | null;
}

export async function discoverCanadaJobBank(
  keywords: string[],
  locations: string[]
): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seen = new Set<string>();

  for (const keyword of keywords.slice(0, 4)) {
    for (const location of locations.slice(0, 3)) {
      try {
        const url = buildSearchUrl(keyword, location);
        const response = await fetch(url, {
          headers: { Accept: "application/json", "User-Agent": "JobAutopilot/1.0" },
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) continue;

        const data = await response.json();
        const postings: any[] = data?.jobPostings ?? data?.results ?? data?.jobs ?? [];

        for (const p of postings) {
          const id = String(p.jobId ?? p.id ?? p.referenceNumber ?? "");
          if (!id || seen.has(id)) continue;
          seen.add(id);

          jobs.push(normalizePosting(p, id));
        }
      } catch {
        // Network errors shouldn't crash the whole crawl
      }
    }
  }

  return jobs;
}

function buildSearchUrl(keyword: string, location: string): string {
  const params = new URLSearchParams({
    searchterm: keyword,
    locationstring: location,
    "distance-km": "50",
    lang: "en",
    pageSize: "50",
  });
  return `https://api.canada.ca/en/jobs/jobposting?${params}`;
}

function normalizePosting(p: any, id: string): RawJob {
  const salaryMin = parseFloat(p.salaryMin ?? p.minSalary ?? "0") || null;
  const salaryMax = parseFloat(p.salaryMax ?? p.maxSalary ?? "0") || null;

  return {
    source: "canada_job_bank",
    externalId: id,
    url:
      p.applicationUri ??
      p.jobUrl ??
      `https://www.jobbank.gc.ca/jobsearch/jobposting/${id}`,
    title: p.title ?? p.jobTitle ?? "Unknown Title",
    company: p.businessName ?? p.employer ?? p.company ?? "Unknown Company",
    location: [p.city, p.province].filter(Boolean).join(", ") || p.location ?? "Canada",
    remote: /remote|virtual|work from home/i.test(p.title ?? p.workLocation ?? ""),
    salaryMin,
    salaryMax,
    salaryText: p.salary ?? p.salaryDescription ?? null,
    description: p.description ?? p.jobDescription ?? p.jobDetails ?? "",
    postedAt: p.datePosted ? new Date(p.datePosted) : null,
  };
}

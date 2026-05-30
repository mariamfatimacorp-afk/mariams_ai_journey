// Indeed Canada scraper using Playwright
// Note: Indeed's ToS restricts scraping. This implementation is for personal use only.
// Each user runs this against their own search — not bulk/commercial scraping.

import type { RawJob } from "./canada-job-bank";

export async function discoverIndeed(
  keywords: string[],
  locations: string[]
): Promise<RawJob[]> {
  // Playwright is only available in a Node.js runtime (not edge runtime)
  // We dynamically import to avoid bundle issues
  let chromium: any;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch {
    console.warn("Playwright not available — skipping Indeed crawler");
    return [];
  }

  const jobs: RawJob[] = [];
  const seen = new Set<string>();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });

  for (const keyword of keywords.slice(0, 2)) {
    for (const location of locations.slice(0, 2)) {
      const page = await context.newPage();
      try {
        const url = `https://ca.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}&sort=date&limit=25`;
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
        await page.waitForTimeout(2000);

        const cards = await page.$$('[data-jk]');
        for (const card of cards.slice(0, 15)) {
          const jk = await card.getAttribute("data-jk");
          if (!jk || seen.has(jk)) continue;
          seen.add(jk);

          const title = await card.$eval('[data-testid="job-title"] span', (el) => el.textContent?.trim() ?? "").catch(() => "");
          const company = await card.$eval('[data-testid="company-name"]', (el) => el.textContent?.trim() ?? "").catch(() => "");
          const locationText = await card.$eval('[data-testid="text-location"]', (el) => el.textContent?.trim() ?? "").catch(() => "");
          const salaryText = await card.$eval('[data-testid="attribute_snippet_testid"]', (el) => el.textContent?.trim() ?? "").catch(() => null);
          const snippet = await card.$eval('.job-snippet', (el) => el.textContent?.trim() ?? "").catch(() => "");

          if (!title) continue;

          jobs.push({
            source: "indeed",
            externalId: jk,
            url: `https://ca.indeed.com/viewjob?jk=${jk}`,
            title,
            company,
            location: locationText || location,
            remote: /remote|virtual/i.test(locationText),
            salaryMin: parseSalaryMin(salaryText ?? ""),
            salaryMax: parseSalaryMax(salaryText ?? ""),
            salaryText,
            description: snippet,
            postedAt: null,
          });
        }
      } catch (err) {
        console.warn(`Indeed scrape failed for "${keyword}" in "${location}":`, err);
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();
  return jobs;
}

function parseSalaryMin(text: string): number | null {
  const m = text.match(/\$([0-9,]+)/);
  return m ? parseFloat(m[1].replace(/,/g, "")) : null;
}

function parseSalaryMax(text: string): number | null {
  const m = text.match(/\$[0-9,]+\s*[-–]\s*\$([0-9,]+)/);
  return m ? parseFloat(m[1].replace(/,/g, "")) : null;
}

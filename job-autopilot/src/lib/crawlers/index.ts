import { db } from "../db";
import { tailorApplicationForJob } from "../ai/tailor";
import { discoverCanadaJobBank } from "./canada-job-bank";
import { discoverGreenhouse, discoverLever } from "./greenhouse";
import { discoverIndeed } from "./indeed";
import type { RawJob } from "./canada-job-bank";

interface Preferences {
  roles: string[];
  keywords: string[];
  locations: string[];
  salaryMin: number;
  salaryUnit: "hourly" | "annual";
  remote: boolean;
  jobType: "full_time" | "contract" | "any";
}

export async function runDiscoveryForUser(userId: string): Promise<{
  discovered: number;
  tailored: number;
  errors: number;
}> {
  const profile = await db.profile.findUnique({ where: { userId } });
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!profile || !user) return { discovered: 0, tailored: 0, errors: 0 };

  const prefs: Preferences = JSON.parse(profile.preferences || "{}");
  if (!prefs.keywords?.length) return { discovered: 0, tailored: 0, errors: 0 };

  // Run all crawlers in parallel
  const [cjbJobs, ghJobs, lvJobs, indeedJobs] = await Promise.allSettled([
    discoverCanadaJobBank(prefs.keywords, prefs.locations ?? []),
    discoverGreenhouse(prefs.keywords),
    discoverLever(prefs.keywords),
    discoverIndeed(prefs.keywords, prefs.locations ?? []),
  ]);

  const allJobs: RawJob[] = [
    ...(cjbJobs.status === "fulfilled" ? cjbJobs.value : []),
    ...(ghJobs.status === "fulfilled" ? ghJobs.value : []),
    ...(lvJobs.status === "fulfilled" ? lvJobs.value : []),
    ...(indeedJobs.status === "fulfilled" ? indeedJobs.value : []),
  ];

  // Filter by salary and remote preference
  const filtered = allJobs.filter((j) => {
    if (prefs.remote && !j.remote && prefs.jobType === "contract") {
      // For remote-preferred users, still include onsite roles but remote ones get priority
    }
    if (prefs.salaryMin && j.salaryMin && j.salaryMin < prefs.salaryMin * 0.7) return false;
    return true;
  });

  let discovered = 0;
  let tailored = 0;
  let errors = 0;

  for (const raw of filtered.slice(0, 40)) {
    try {
      // Upsert job record
      const job = await db.job.upsert({
        where: { source_externalId: { source: raw.source, externalId: raw.externalId } },
        update: {},
        create: {
          source: raw.source,
          externalId: raw.externalId,
          url: raw.url,
          title: raw.title,
          company: raw.company,
          location: raw.location,
          remote: raw.remote,
          salaryMin: raw.salaryMin,
          salaryMax: raw.salaryMax,
          salaryText: raw.salaryText,
          description: raw.description,
          postedAt: raw.postedAt,
        },
      });

      // Skip if user already has an application for this job
      const existing = await db.application.findUnique({
        where: { userId_jobId: { userId, jobId: job.id } },
      });
      if (existing) continue;

      discovered++;

      // AI tailoring
      if (!profile.resumeText) {
        await db.application.create({
          data: {
            userId,
            jobId: job.id,
            status: "pending_review",
            matchScore: 50,
          },
        });
        continue;
      }

      const aiResult = await tailorApplicationForJob(
        profile.resumeText,
        raw.title,
        raw.company,
        raw.description,
        user.name,
        profile.city ?? "",
        profile.phone ?? undefined
      );

      await db.application.create({
        data: {
          userId,
          jobId: job.id,
          status: "pending_review",
          tailoredResume: aiResult.tailoredResume,
          coverLetter: aiResult.coverLetter,
          matchScore: aiResult.matchScore,
          matchReasons: JSON.stringify(aiResult.matchReasons),
        },
      });

      tailored++;
    } catch (err) {
      console.error(`Error processing job ${raw.externalId}:`, err);
      errors++;
    }
  }

  return { discovered, tailored, errors };
}

export async function runDiscoveryForAllUsers() {
  const users = await db.user.findMany({ select: { id: true, name: true } });
  const results: Record<string, any> = {};

  for (const user of users) {
    console.log(`🔍 Running discovery for ${user.name}...`);
    results[user.id] = await runDiscoveryForUser(user.id);
    console.log(`   ✅ ${user.name}: ${JSON.stringify(results[user.id])}`);
  }

  return results;
}

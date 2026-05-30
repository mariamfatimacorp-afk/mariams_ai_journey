import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const applications = await db.application.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status } : {}),
    },
    include: { job: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(
    applications.map((a) => ({
      id: a.id,
      status: a.status,
      matchScore: a.matchScore,
      matchReasons: a.matchReasons ? JSON.parse(a.matchReasons) : [],
      tailoredResume: a.tailoredResume,
      coverLetter: a.coverLetter,
      submittedAt: a.submittedAt,
      errorMessage: a.errorMessage,
      createdAt: a.createdAt,
      job: {
        id: a.job.id,
        title: a.job.title,
        company: a.job.company,
        location: a.job.location,
        remote: a.job.remote,
        source: a.job.source,
        url: a.job.url,
        salaryMin: a.job.salaryMin,
        salaryMax: a.job.salaryMax,
        salaryText: a.job.salaryText,
        postedAt: a.job.postedAt,
      },
    }))
  );
}

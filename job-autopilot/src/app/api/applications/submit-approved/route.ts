import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { submitApplication } from "@/lib/automation/apply";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  const profile = await db.profile.findUnique({ where: { userId: session.user.id } });
  if (!user || !profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const approved = await db.application.findMany({
    where: { userId: session.user.id, status: "approved" },
    include: { job: true },
    take: 20,
  });

  if (!approved.length) return NextResponse.json({ message: "No approved applications to submit." });

  const credentials = JSON.parse(profile.credentials || "{}");
  const results: { id: string; title: string; success: boolean; message: string }[] = [];

  for (const app of approved) {
    // Mark as submitting
    await db.application.update({ where: { id: app.id }, data: { status: "submitting" } });

    const result = await submitApplication(
      app.job.url,
      app.job.source,
      app.coverLetter ?? "",
      app.tailoredResume ?? "",
      credentials,
      {
        name: user.name,
        email: user.email,
        phone: profile.phone ?? undefined,
        city: profile.city ?? undefined,
        linkedinUrl: profile.linkedinUrl ?? undefined,
      }
    );

    await db.application.update({
      where: { id: app.id },
      data: {
        status: result.success ? "submitted" : "failed",
        submittedAt: result.success ? new Date() : null,
        errorMessage: result.success ? null : result.message,
      },
    });

    results.push({ id: app.id, title: app.job.title, success: result.success, message: result.message });
  }

  return NextResponse.json({ submitted: results.filter((r) => r.success).length, results });
}

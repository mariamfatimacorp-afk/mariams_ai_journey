import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const UpdateSchema = z.object({
  phone: z.string().optional(),
  linkedinUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  city: z.string().optional(),
  yearsExp: z.number().optional(),
  preferences: z
    .object({
      roles: z.array(z.string()),
      keywords: z.array(z.string()),
      locations: z.array(z.string()),
      salaryMin: z.number(),
      salaryUnit: z.enum(["hourly", "annual"]),
      remote: z.boolean(),
      jobType: z.enum(["full_time", "contract", "any"]),
    })
    .optional(),
  // Credentials stored as JSON — values are base64-encoded
  linkedinEmail: z.string().optional(),
  linkedinPassword: z.string().optional(),
  indeedEmail: z.string().optional(),
  indeedPassword: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const creds = JSON.parse(profile.credentials || "{}");
  return NextResponse.json({
    phone: profile.phone,
    linkedinUrl: profile.linkedinUrl,
    portfolioUrl: profile.portfolioUrl,
    city: profile.city,
    yearsExp: profile.yearsExp,
    resumeFileName: profile.resumeFileName,
    hasResume: !!profile.resumeText,
    preferences: JSON.parse(profile.preferences || "{}"),
    hasLinkedinCreds: !!creds.linkedin?.email,
    hasIndeedCreds: !!creds.indeed?.email,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = UpdateSchema.parse(body);

  const profile = await db.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existingCreds = JSON.parse(profile.credentials || "{}");
  if (data.linkedinEmail) existingCreds.linkedin = { email: data.linkedinEmail, password: data.linkedinPassword };
  if (data.indeedEmail) existingCreds.indeed = { email: data.indeedEmail, password: data.indeedPassword };

  await db.profile.update({
    where: { userId: session.user.id },
    data: {
      phone: data.phone ?? profile.phone,
      linkedinUrl: data.linkedinUrl ?? profile.linkedinUrl,
      portfolioUrl: data.portfolioUrl ?? profile.portfolioUrl,
      city: data.city ?? profile.city,
      yearsExp: data.yearsExp ?? profile.yearsExp,
      preferences: data.preferences ? JSON.stringify(data.preferences) : profile.preferences,
      credentials: JSON.stringify(existingCreds),
    },
  });

  return NextResponse.json({ ok: true });
}

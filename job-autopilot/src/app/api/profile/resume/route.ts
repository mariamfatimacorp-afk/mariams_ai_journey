import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractTextFromPdf } from "@/lib/pdf-parser";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("resume") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractTextFromPdf(buffer);

  if (!text || text.length < 50) {
    return NextResponse.json({ error: "Could not extract text from file. Please upload a readable PDF." }, { status: 400 });
  }

  await db.profile.update({
    where: { userId: session.user.id },
    data: { resumeText: text, resumeFileName: file.name },
  });

  return NextResponse.json({ ok: true, characters: text.length, fileName: file.name });
}

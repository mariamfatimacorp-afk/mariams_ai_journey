import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app || app.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.application.update({
    where: { id: params.id },
    data: { status: "approved", updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

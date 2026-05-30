import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runDiscoveryForUser } from "@/lib/crawlers";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await runDiscoveryForUser(session.user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("Discovery error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

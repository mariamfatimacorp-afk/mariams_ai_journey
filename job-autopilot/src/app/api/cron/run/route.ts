// Cron endpoint — called by an external scheduler or the built-in cron
// Secure with a CRON_SECRET to prevent unauthorized triggers
import { NextRequest, NextResponse } from "next/server";
import { runDiscoveryForAllUsers } from "@/lib/crawlers";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await runDiscoveryForAllUsers();
    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

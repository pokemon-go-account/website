import { NextResponse } from "next/server";

export async function POST() {
  // Analytics tracking disabled to conserve Firebase & Vercel quotas
  return NextResponse.json({ success: true });
}

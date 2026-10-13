import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const userId = searchParams.get("userId") || undefined;

  const results = serverStore.searchAll(q, userId);
  return NextResponse.json({ success: true, data: results });
}

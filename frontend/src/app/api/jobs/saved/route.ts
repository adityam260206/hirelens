import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
  }
  const saved = serverStore.getSavedJobs(userId);
  return NextResponse.json({ success: true, data: saved });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, jobId } = body;
    if (!userId || !jobId) {
      return NextResponse.json({ success: false, error: "userId and jobId are required" }, { status: 400 });
    }
    const result = serverStore.toggleSaveJob(userId, jobId);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

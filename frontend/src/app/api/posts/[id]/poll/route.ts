import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { optionId, userId } = body;

    if (!optionId || !userId) {
      return NextResponse.json({ success: false, error: "optionId and userId are required" }, { status: 400 });
    }

    const updatedPoll = serverStore.votePoll(id, optionId, userId);
    return NextResponse.json({ success: true, data: updatedPoll });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

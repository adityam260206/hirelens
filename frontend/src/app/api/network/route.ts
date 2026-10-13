import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "dada95c8-3767-4578-83ef-99a8f12fa7f4";

  const network = serverStore.getNetwork(userId);
  return NextResponse.json({ success: true, data: network });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, targetUserId, requestId, accept, author } = body;

    if (!action || !userId) {
      return NextResponse.json({ success: false, error: "Action and userId are required" }, { status: 400 });
    }

    if (action === "request") {
      if (!targetUserId) {
        return NextResponse.json({ success: false, error: "targetUserId is required" }, { status: 400 });
      }
      const result = serverStore.sendConnectionRequest(userId, targetUserId, author);
      return NextResponse.json({ success: true, data: result });
    }

    if (action === "respond") {
      if (!requestId) {
        return NextResponse.json({ success: false, error: "requestId is required" }, { status: 400 });
      }
      const result = serverStore.respondConnectionRequest(requestId, userId, accept === true);
      return NextResponse.json({ success: true, data: { ok: result } });
    }

    if (action === "remove") {
      if (!targetUserId) {
        return NextResponse.json({ success: false, error: "targetUserId is required" }, { status: 400 });
      }
      const result = serverStore.removeConnection(userId, targetUserId);
      return NextResponse.json({ success: true, data: { ok: result } });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

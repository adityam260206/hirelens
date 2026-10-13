import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const conversationId = searchParams.get("conversationId");

  if (!userId) {
    return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
  }

  if (conversationId) {
    const messages = serverStore.getMessages(conversationId, userId);
    return NextResponse.json({ success: true, data: messages });
  }

  const conversations = serverStore.getConversations(userId);
  return NextResponse.json({ success: true, data: conversations });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderId, recipientId, text, senderAuthor } = body;

    if (!senderId || !recipientId || !text || !text.trim()) {
      return NextResponse.json({ success: false, error: "senderId, recipientId, and text are required" }, { status: 400 });
    }

    const message = serverStore.sendMessage(senderId, recipientId, text.trim(), senderAuthor);
    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

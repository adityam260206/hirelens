import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
  }

  const notifications = serverStore.getNotifications(userId);
  return NextResponse.json({ success: true, data: notifications });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, notificationId } = body;

    if (!action || !userId) {
      return NextResponse.json({ success: false, error: "action and userId are required" }, { status: 400 });
    }

    if (action === "read") {
      if (!notificationId) {
        return NextResponse.json({ success: false, error: "notificationId is required" }, { status: 400 });
      }
      serverStore.markNotificationRead(notificationId, userId);
      return NextResponse.json({ success: true });
    }

    if (action === "read_all") {
      serverStore.markAllNotificationsRead(userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

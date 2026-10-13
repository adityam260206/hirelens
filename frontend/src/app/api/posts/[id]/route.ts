import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    const deleted = serverStore.deletePost(id, userId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Post not found or unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

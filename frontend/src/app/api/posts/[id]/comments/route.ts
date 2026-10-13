import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { content, author } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: "Comment content is required" }, { status: 400 });
    }
    if (!author || !author.id) {
      return NextResponse.json({ success: false, error: "Author is required" }, { status: 400 });
    }

    const comment = serverStore.addComment(id, content.trim(), author);
    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

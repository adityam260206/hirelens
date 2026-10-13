import { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const tag = searchParams.get("tag") || undefined;
  const userId = searchParams.get("userId") || undefined;

  const posts = serverStore.getPosts(category, tag, userId);
  return NextResponse.json({ success: true, data: posts });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, category, tags, projectUrl, demoUrl, poll, author } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
    }

    if (!author || !author.id || !author.name) {
      return NextResponse.json({ success: false, error: "Author details are required" }, { status: 400 });
    }

    const post = serverStore.createPost(
      {
        content,
        category,
        tags,
        projectUrl,
        demoUrl,
        poll,
      },
      author
    );

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

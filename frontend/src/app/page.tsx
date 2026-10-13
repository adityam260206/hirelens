"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { LeftSidebar } from "@/components/feed/LeftSidebar";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { RightSidebar } from "@/components/feed/RightSidebar";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { useAuth } from "@/hooks/useAuth";
import { socialService } from "@/services/social.service";
import type { Post, PostCategory } from "@/types/social";

const feedFilters = [
  { label: "For You", category: "For You" },
  { label: "Projects", category: "Project" },
  { label: "Career Advice", category: "Career Advice" },
  { label: "Jobs & Hiring", category: "Internship & Job" },
  { label: "Tech & AI", category: "Tech & AI" },
  { label: "Achievements", category: "Achievement" },
];

export default function HomeFeedPage() {
  const { user, status } = useAuth();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("For You");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    socialService
      .getPosts({
        category: selectedFilter === "For You" ? undefined : selectedFilter,
        tag: selectedTag || undefined,
        userId: user?.id,
      })
      .then((data) => setPosts(data))
      .catch((err) => console.error("Failed to load feed:", err))
      .finally(() => setIsLoading(false));
  }, [selectedFilter, selectedTag, user?.id]);

  function handlePostCreated(newPost: Post) {
    setPosts((prev) => (prev ? [newPost, ...prev] : [newPost]));
  }

  function handlePostDeleted(deletedPostId: string) {
    setPosts((prev) => (prev ? prev.filter((p) => p.id !== deletedPostId) : []));
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppNavbar />

      {/* Main 3-Column LinkedIn Layout */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 sm:px-6 py-5">
        {/* Unauthenticated Welcome Banner */}
        {status === "unauthenticated" && (
          <div className="mb-5 rounded-2xl border border-brand/20 bg-gradient-to-r from-brand/10 via-indigo-50/40 to-surface p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                Welcome to HireLens
              </span>
              <h2 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-foreground">
                The AI-Powered Career Network with Explainable Candidate Intelligence
              </h2>
              <p className="mt-1 text-xs text-muted max-w-2xl">
                Explore verified student & engineering projects, discover jobs with evidence-backed match scoring, and build your professional presence.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-background transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground hover:opacity-90 transition-opacity shadow-xs"
              >
                Join HireLens
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left Column (3 cols) */}
          <div className="lg:col-span-3">
            <LeftSidebar
              selectedTag={selectedTag}
              onSelectTag={(tag) => setSelectedTag(tag)}
            />
          </div>

          {/* Center Column (6 cols): Composer & Feed */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Post Composer */}
            <PostComposer onPostCreated={handlePostCreated} />

            {/* Feed Filters Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border bg-surface p-1.5 shadow-xs scrollbar-none">
              {feedFilters.map((tab) => {
                const isActive = selectedFilter === tab.category && !selectedTag;
                return (
                  <button
                    key={tab.label}
                    onClick={() => {
                      setSelectedTag("");
                      setSelectedFilter(tab.category);
                    }}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-brand text-brand-foreground font-semibold shadow-xs"
                        : "text-muted hover:bg-background hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}

              {selectedTag && (
                <div className="ml-auto flex items-center gap-1 pl-2 text-xs text-brand font-semibold">
                  <span>Tag: #{selectedTag}</span>
                  <button
                    onClick={() => setSelectedTag("")}
                    className="hover:text-danger cursor-pointer px-1"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Posts Stream */}
            {isLoading && !posts && (
              <div className="py-12">
                <FullScreenLoading />
              </div>
            )}

            {!isLoading && posts && posts.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted bg-surface">
                <p className="font-semibold text-foreground">No posts found in this feed</p>
                <p className="mt-1 text-xs">Be the first to share an update, project milestone, or career question!</p>
              </div>
            )}

            {posts && posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostDeleted={handlePostDeleted}
              />
            ))}
          </div>

          {/* Right Column (3 cols) */}
          <div className="lg:col-span-3">
            <RightSidebar />
          </div>
        </div>
      </main>
    </div>
  );
}

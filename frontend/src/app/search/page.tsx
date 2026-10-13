"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { useAuth } from "@/hooks/useAuth";
import { jobsService } from "@/services/jobs.service";
import { socialService } from "@/services/social.service";
import type { JobCard } from "@/types/job";
import type { UserProfile, Post } from "@/types/social";

export function SearchPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const { user } = useAuth();
  const [query, setQuery] = useState(initialQ);
  const [activeTab, setActiveTab] = useState<"all" | "people" | "jobs" | "posts">("all");

  const [people, setPeople] = useState<UserProfile[]>([]);
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setPeople([]);
      setJobs([]);
      setPosts([]);
      return;
    }

    setIsLoading(true);
    Promise.all([
      socialService.searchAll(query, user?.id),
      jobsService.list({ search: query, pageSize: 10 }).catch(() => ({ items: [] })),
    ])
      .then(([socialRes, jobsRes]) => {
        setPeople(socialRes.people);
        setPosts(socialRes.posts);
        setJobs(jobsRes.items || []);
      })
      .finally(() => setIsLoading(false));
  }, [query, user?.id]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppNavbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* Search Header */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-3">
            Search Across HireLens
          </h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, skills, title, or post topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden"
            />
            <svg
              className="absolute left-3.5 top-3 h-4 w-4 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Tabs */}
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
            {(["all", "people", "jobs", "posts"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-brand text-brand-foreground shadow-xs"
                    : "border border-border bg-background text-muted hover:text-foreground"
                }`}
              >
                {tab} (
                {tab === "all"
                  ? people.length + jobs.length + posts.length
                  : tab === "people"
                  ? people.length
                  : tab === "jobs"
                  ? jobs.length
                  : posts.length}
                )
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="py-12">
            <FullScreenLoading />
          </div>
        )}

        {/* Results Stream */}
        {!isLoading && (
          <div className="flex flex-col gap-5">
            {/* People Results */}
            {(activeTab === "all" || activeTab === "people") && (
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
                <h2 className="text-sm font-bold text-foreground mb-3">People ({people.length})</h2>
                {people.length === 0 ? (
                  <p className="text-xs text-muted">No people match this search.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {people.map((p) => (
                      <Link
                        key={p.userId}
                        href={`/profile/${p.userId}`}
                        className="rounded-xl border border-border bg-background p-3.5 flex items-center gap-3 hover:border-brand transition-colors"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand font-bold text-xs">
                          {p.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                          <p className="text-[11px] text-muted truncate">{p.headline}</p>
                          <span className="text-[10px] text-brand">{p.location || "Remote"}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Jobs Results */}
            {(activeTab === "all" || activeTab === "jobs") && (
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
                <h2 className="text-sm font-bold text-foreground mb-3">Jobs & Roles ({jobs.length})</h2>
                {jobs.length === 0 ? (
                  <p className="text-xs text-muted">No jobs match this search.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {jobs.map((job) => (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="rounded-xl border border-border bg-background p-3.5 flex flex-col justify-between hover:border-brand transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-foreground">{job.title}</p>
                          <p className="text-[11px] text-brand font-semibold">{job.company.name}</p>
                          <p className="text-[10px] text-muted mt-1">{job.workMode} · {job.location || "Remote"}</p>
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-[11px] font-bold text-brand">View Role →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Posts Results */}
            {(activeTab === "all" || activeTab === "posts") && (
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
                <h2 className="text-sm font-bold text-foreground mb-3">Posts & Discussions ({posts.length})</h2>
                {posts.length === 0 ? (
                  <p className="text-xs text-muted">No posts match this search.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {posts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/#${post.id}`}
                        className="rounded-xl border border-border bg-background p-3.5 hover:border-brand transition-colors block"
                      >
                        <div className="flex items-center justify-between text-[11px] text-muted mb-1">
                          <span className="font-semibold text-foreground">{post.author.name}</span>
                          <span className="text-brand">#{post.category}</span>
                        </div>
                        <p className="text-xs text-foreground line-clamp-2">{post.content}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SearchPage />
    </Suspense>
  );
}

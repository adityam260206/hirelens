"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface LeftSidebarProps {
  selectedTag?: string;
  onSelectTag?: (tag: string) => void;
  connectionsCount?: number;
}

const topics = [
  { name: "ArtificialIntelligence", count: 48 },
  { name: "FullStack", count: 35 },
  { name: "SystemDesign", count: 29 },
  { name: "MachineLearning", count: 26 },
  { name: "CareerAdvice", count: 22 },
  { name: "TechHiring", count: 18 },
  { name: "Internships2026", count: 15 },
];

export function LeftSidebar({ selectedTag, onSelectTag, connectionsCount = 142 }: LeftSidebarProps) {
  const { user } = useAuth();

  return (
    <aside className="w-full flex flex-col gap-4">
      {/* Profile Card */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        {/* Banner */}
        <div className="h-16 bg-gradient-to-r from-brand/80 to-indigo-600" />

        {/* Profile info */}
        <div className="relative px-4 pb-4 pt-0">
          {/* Avatar */}
          <div className="-mt-8 mb-2 flex justify-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-surface bg-brand text-xl font-bold text-brand-foreground shadow-sm">
              {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "HL"}
            </div>
          </div>

          <h2 className="text-base font-bold text-foreground">
            {user ? `${user.firstName} ${user.lastName}` : "Welcome to HireLens"}
          </h2>
          <p className="mt-0.5 text-xs text-muted line-clamp-2">
            {user
              ? user.role === "RECRUITER"
                ? `Head of Talent · ${user.company?.name || "Nimbus Technologies"}`
                : user.role === "INTERVIEWER"
                ? `Technical Interviewer · ${user.company?.name || "Nimbus Technologies"}`
                : "Full-Stack & AI Candidate · Actively Discovering Roles"
              : "AI-Powered Professional Networking & Recruitment"}
          </p>

          {/* Profile completion bar */}
          {user && (
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted">Profile strength</span>
                <span className="font-semibold text-brand">85%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-border overflow-hidden">
                <div className="h-full rounded-full bg-brand w-[85%]" />
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className="mt-3 border-t border-border pt-3 flex flex-col gap-1.5 text-xs">
            <Link
              href="/network"
              className="flex items-center justify-between text-muted hover:text-brand transition-colors"
            >
              <span>Connections</span>
              <span className="font-semibold text-foreground">{connectionsCount}</span>
            </Link>
            <div className="flex items-center justify-between text-muted">
              <span>Profile views</span>
              <span className="font-semibold text-foreground">64</span>
            </div>
          </div>

          {/* Profile link */}
          {user && (
            <Link
              href={`/profile/${user.id}`}
              className="mt-3 block text-center rounded-lg border border-border py-1.5 text-xs font-semibold text-foreground hover:bg-background transition-colors"
            >
              View Full Profile
            </Link>
          )}
        </div>
      </div>

      {/* Shortcuts Card */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Career Shortcuts
        </h3>
        <ul className="flex flex-col gap-2 text-xs">
          <li>
            <Link
              href="/jobs"
              className="flex items-center gap-2 text-foreground hover:text-brand transition-colors py-1"
            >
              <span className="text-base">💼</span> Browse Open Roles
            </Link>
          </li>
          <li>
            <Link
              href="/ai-assistant"
              className="flex items-center gap-2 text-foreground hover:text-brand transition-colors py-1 font-medium"
            >
              <span className="text-base">⚡</span> AI Career Copilot
            </Link>
          </li>
          {user?.role === "CANDIDATE" && (
            <>
              <li>
                <Link
                  href="/candidate/resume"
                  className="flex items-center gap-2 text-foreground hover:text-brand transition-colors py-1"
                >
                  <span className="text-base">📄</span> Resume AI Parsing
                </Link>
              </li>
              <li>
                <Link
                  href="/candidate/applications"
                  className="flex items-center gap-2 text-foreground hover:text-brand transition-colors py-1"
                >
                  <span className="text-base">📬</span> My Applications
                </Link>
              </li>
            </>
          )}
          {user?.role === "RECRUITER" && (
            <>
              <li>
                <Link
                  href="/recruiter/jobs"
                  className="flex items-center gap-2 text-foreground hover:text-brand transition-colors py-1"
                >
                  <span className="text-base">🎯</span> Active Pipeline
                </Link>
              </li>
              <li>
                <Link
                  href="/recruiter/candidates"
                  className="flex items-center gap-2 text-foreground hover:text-brand transition-colors py-1"
                >
                  <span className="text-base">🔍</span> Candidate Search
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Followed Topics */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
            Communities & Topics
          </h3>
          {selectedTag && onSelectTag && (
            <button
              onClick={() => onSelectTag("")}
              className="text-[10px] text-brand hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {topics.map((t) => {
            const isSelected = selectedTag?.toLowerCase() === t.name.toLowerCase();
            return (
              <button
                key={t.name}
                onClick={() => onSelectTag && onSelectTag(isSelected ? "" : t.name)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-brand text-brand-foreground"
                    : "bg-background text-muted hover:text-foreground hover:bg-border/60"
                }`}
              >
                #{t.name}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

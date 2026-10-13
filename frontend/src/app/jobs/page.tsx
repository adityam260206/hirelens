"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { useAuth } from "@/hooks/useAuth";
import { jobsService } from "@/services/jobs.service";
import { socialService } from "@/services/social.service";
import type { JobCard as JobCardType, WorkMode, EmploymentType } from "@/types/job";

export default function JobsBrowsePage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobCardType[] | null>(null);
  const [search, setSearch] = useState("");
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<JobCardType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      jobsService
        .list({ search: search || undefined, pageSize: 30 })
        .then((result) => {
          setJobs(result.items);
          if (result.items.length > 0 && !selectedJob) {
            setSelectedJob(result.items[0]);
          }
        })
        .catch(() => setError("Could not load jobs right now."));
    }, 250);

    return () => clearTimeout(timeout);
  }, [search]);

  // Load saved jobs
  useEffect(() => {
    if (user) {
      socialService.getSavedJobs(user.id).then((ids) => setSavedJobIds(new Set(ids)));
    }
  }, [user]);

  async function handleToggleSaveJob(jobId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) return;
    const res = await socialService.toggleSaveJob(user.id, jobId);
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (res.saved) next.add(jobId);
      else next.delete(jobId);
      return next;
    });
  }

  const filteredJobs = (jobs || []).filter((j) => {
    if (selectedWorkMode !== "ALL" && j.workMode !== selectedWorkMode) return false;
    if (selectedType !== "ALL" && j.employmentType !== selectedType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppNavbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6 flex flex-col">
        {/* Header & Search Bar */}
        <div className="mb-6 rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Find Your Next Career Opportunity
              </h1>
              <p className="mt-1 text-xs text-muted">
                Explore verified roles at Nimbus Technologies & partner organizations with explainable AI match scoring.
              </p>
            </div>

            {user?.role === "RECRUITER" && (
              <Link
                href="/recruiter/jobs/new"
                className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground shadow-xs hover:opacity-90 shrink-0"
              >
                + Post a New Role
              </Link>
            )}
          </div>

          {/* Search Inputs */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search job title, skills, keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden"
              />
              <svg
                className="absolute left-3 top-2.5 h-4 w-4 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {(["ALL", "REMOTE", "HYBRID", "ONSITE"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSelectedWorkMode(mode)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    selectedWorkMode === mode
                      ? "bg-brand text-brand-foreground font-semibold"
                      : "border border-border bg-background text-muted hover:text-foreground"
                  }`}
                >
                  {mode === "ALL" ? "All Modes" : mode}
                </button>
              ))}

              {(["ALL", "FULL_TIME", "INTERNSHIP"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    selectedType === type
                      ? "bg-brand text-brand-foreground font-semibold"
                      : "border border-border bg-background text-muted hover:text-foreground"
                  }`}
                >
                  {type === "ALL" ? "All Types" : type === "FULL_TIME" ? "Full-Time" : "Internship"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Split-Pane Jobs Interface */}
        {error && <p className="text-sm text-danger">{error}</p>}
        {!error && jobs === null && <FullScreenLoading />}

        {jobs !== null && filteredJobs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted">
            No open roles match your current search or filters.
          </div>
        )}

        {jobs !== null && filteredJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-[500px]">
            {/* Left Column: Job Cards List (5 cols) */}
            <div className="md:col-span-5 flex flex-col gap-3 max-h-[750px] overflow-y-auto pr-1">
              {filteredJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                const isSaved = savedJobIds.has(job.id);

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`rounded-2xl border p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                      isSelected
                        ? "border-brand bg-brand/5 ring-1 ring-brand"
                        : "border-border bg-surface hover:border-brand/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-foreground">{job.title}</h2>
                        <p className="text-xs text-muted font-medium mt-0.5">{job.company.name}</p>
                      </div>
                      <button
                        onClick={(e) => handleToggleSaveJob(job.id, e)}
                        className="text-muted hover:text-brand p-1 cursor-pointer"
                        title={isSaved ? "Unsave job" : "Save job"}
                      >
                        {isSaved ? "🔖" : "🏷️"}
                      </button>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="rounded-md bg-brand/10 px-2 py-0.5 font-semibold text-brand">
                        {job.workMode}
                      </span>
                      <span className="rounded-md bg-border/60 px-2 py-0.5 font-medium text-muted">
                        {job.employmentType.replace("_", " ")}
                      </span>
                      {job.location && (
                        <span className="text-muted">📍 {job.location}</span>
                      )}
                      {job.salaryMin && (
                        <span className="font-semibold text-foreground">
                          ${job.salaryMin.toLocaleString()}/yr
                        </span>
                      )}
                    </div>

                    {/* Skill tags */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {job.requiredSkills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted border border-border"
                        >
                          {s}
                        </span>
                      ))}
                      {job.requiredSkills.length > 3 && (
                        <span className="text-[10px] text-muted self-center">
                          +{job.requiredSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Detailed Job View (7 cols) */}
            <div className="md:col-span-7 rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
              {selectedJob ? (
                <div className="flex flex-col gap-4">
                  {/* Job Header */}
                  <div className="border-b border-border pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold text-brand uppercase tracking-wider">
                          {selectedJob.company.name}
                        </span>
                        <h2 className="mt-1 text-2xl font-bold text-foreground">
                          {selectedJob.title}
                        </h2>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                          <span>📍 {selectedJob.location || "Remote"}</span>
                          <span>💼 {selectedJob.employmentType.replace("_", " ")}</span>
                          <span>🏢 {selectedJob.workMode}</span>
                          {selectedJob.salaryMin && (
                            <span className="font-bold text-foreground">
                              ${selectedJob.salaryMin.toLocaleString()}/yr
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/jobs/${selectedJob.id}`}
                          className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-brand-foreground shadow-xs hover:opacity-90"
                        >
                          Apply Now & View Match
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Skills Requirements */}
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                      Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.requiredSkills.map((s) => (
                        <span
                          key={s}
                          className="rounded-lg bg-brand/10 border border-brand/20 px-2.5 py-1 text-xs font-semibold text-brand"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedJob.preferredSkills.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                        Preferred Skills
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.preferredSkills.map((s) => (
                          <span
                            key={s}
                            className="rounded-lg bg-background border border-border px-2.5 py-1 text-xs font-medium text-muted"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explainable AI Match Callout */}
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-brand">
                      <span>⚡</span> HireLens Explainable Intelligence
                    </div>
                    <p className="mt-1 text-xs text-foreground/80 leading-relaxed">
                      HireLens computes deterministic match scores across your structured resume and provides transparent evidence for each required skill before you apply.
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <Link
                        href={`/jobs/${selectedJob.id}`}
                        className="text-xs font-bold text-brand hover:underline"
                      >
                        Run instant resume match for this role →
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center text-xs text-muted">
                  Select a job on the left to view full role details and requirements.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

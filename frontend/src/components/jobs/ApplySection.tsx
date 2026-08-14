"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { ApiClientError } from "@/lib/api-client";
import { applicationsService } from "@/services/applications.service";
import { resumesService } from "@/services/resumes.service";
import type { Resume } from "@/types/resume";

export function ApplySection({ jobId }: { jobId: string }) {
  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    Promise.all([resumesService.list(), applicationsService.listMine()])
      .then(([resumeList, applications]) => {
        setResumes(resumeList);
        if (resumeList.length > 0) setSelectedResumeId(resumeList[0].id);
        setAlreadyApplied(applications.items.some((a) => a.jobId === jobId));
      })
      .catch(() => setResumes([]));
  }, [jobId]);

  async function handleApply() {
    if (!selectedResumeId) return;
    setError(null);
    setSubmitting(true);
    try {
      await applicationsService.apply(jobId, selectedResumeId);
      setApplied(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not submit your application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (resumes === null) return <p className="text-sm text-muted">Loading…</p>;

  if (applied || alreadyApplied) {
    return <p className="text-sm font-medium text-success">You&apos;ve applied to this role.</p>;
  }

  if (resumes.length === 0) {
    return (
      <div>
        <p className="text-sm text-muted">Upload a resume before applying.</p>
        <Link href="/candidate/resume">
          <Button className="mt-3">Upload resume</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {error && (
        <div className="sm:hidden">
          <Alert>{error}</Alert>
        </div>
      )}
      {resumes.length > 1 && (
        <div className="sm:w-64">
          <Select
            label="Resume"
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            options={resumes.map((r) => ({ value: r.id, label: r.originalFilename }))}
          />
        </div>
      )}
      <Button onClick={handleApply} loading={submitting} className="w-full sm:w-auto">
        Apply
      </Button>
      {error && (
        <div className="hidden sm:block">
          <Alert>{error}</Alert>
        </div>
      )}
    </div>
  );
}

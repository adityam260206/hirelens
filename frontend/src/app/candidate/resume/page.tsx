"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ApiClientError } from "@/lib/api-client";
import { candidatesService } from "@/services/candidates.service";
import { resumesService } from "@/services/resumes.service";
import type { Resume } from "@/types/resume";

const STATUS_VARIANT: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  PENDING: "neutral",
  PROCESSING: "warning",
  COMPLETED: "success",
  FAILED: "danger",
};

export default function ResumePage() {
  return (
    <RequireRole roles={["CANDIDATE"]}>
      <DashboardShell>
        <ResumeManager />
      </DashboardShell>
    </RequireRole>
  );
}

function ResumeManager() {
  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addedSkillsFor, setAddedSkillsFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    resumesService
      .list()
      .then(setResumes)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load your resumes."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      await resumesService.upload(file);
      load();
    } catch (err) {
      setUploadError(err instanceof ApiClientError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function retry(id: string) {
    setBusyId(id);
    try {
      await resumesService.retryAnalysis(id);
      load();
    } catch (err) {
      setUploadError(err instanceof ApiClientError ? err.message : "Retry failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function addSkillsToProfile(resume: Resume) {
    if (!resume.parsedData?.skills?.length) return;
    setBusyId(resume.id);
    try {
      const profile = await candidatesService.getMyProfile();
      const merged = Array.from(new Set([...profile.skills, ...resume.parsedData.skills]));
      await candidatesService.updateMyProfile({ skills: merged });
      setAddedSkillsFor(resume.id);
    } catch (err) {
      setUploadError(err instanceof ApiClientError ? err.message : "Could not update your profile.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">Resume</h1>
      <p className="mt-1 text-sm text-muted">
        Upload a PDF or DOCX resume. We&apos;ll extract skills and contact details automatically —
        review them before adding anything to your profile.
      </p>

      <div className="mt-6 rounded-lg border border-dashed border-border p-6 text-center">
        {uploadError && (
          <div className="mb-4">
            <Alert>{uploadError}</Alert>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          className="hidden"
          id="resume-file-input"
        />
        <label htmlFor="resume-file-input">
          <Button type="button" loading={uploading} onClick={() => fileInputRef.current?.click()}>
            Upload resume
          </Button>
        </label>
        <p className="mt-2 text-xs text-muted">PDF or DOCX, up to 5MB.</p>
      </div>

      <div className="mt-8">
        {error && <Alert>{error}</Alert>}
        {!error && resumes === null && <p className="text-sm text-muted">Loading…</p>}
        {resumes !== null && resumes.length === 0 && (
          <p className="text-sm text-muted">No resumes uploaded yet.</p>
        )}
        {resumes !== null && resumes.length > 0 && (
          <div className="flex flex-col gap-4">
            {resumes.map((resume) => (
              <div key={resume.id} className="rounded-lg border border-border bg-surface p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{resume.originalFilename}</p>
                    <p className="text-xs text-muted">{(resume.fileSize / 1024).toFixed(0)} KB</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[resume.parseStatus]}>{resume.parseStatus}</Badge>
                </div>

                {resume.parseStatus === "FAILED" && (
                  <div className="mt-3">
                    <Alert>{resume.parseError ?? "Analysis failed."}</Alert>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2"
                      loading={busyId === resume.id}
                      onClick={() => retry(resume.id)}
                    >
                      Retry analysis
                    </Button>
                  </div>
                )}

                {resume.parseStatus === "COMPLETED" && resume.parsedData && (
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2 text-muted">
                      <p>
                        <span className="text-foreground">Email:</span>{" "}
                        {resume.parsedData.email ?? "Not found"}
                      </p>
                      <p>
                        <span className="text-foreground">Phone:</span>{" "}
                        {resume.parsedData.phone ?? "Not found"}
                      </p>
                    </div>
                    {resume.parsedData.skills.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-foreground">Skills found</p>
                        <div className="flex flex-wrap gap-1.5">
                          {resume.parsedData.skills.map((skill) => (
                            <Badge key={skill} variant="brand">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-3"
                          loading={busyId === resume.id}
                          disabled={addedSkillsFor === resume.id}
                          onClick={() => addSkillsToProfile(resume)}
                        >
                          {addedSkillsFor === resume.id ? "Added to profile" : "Add these skills to my profile"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {resume.parseStatus === "PROCESSING" && (
                  <p className="mt-3 text-sm text-muted">Analyzing…</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

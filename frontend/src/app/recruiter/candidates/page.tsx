"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { TextInput } from "@/components/ui/Field";
import { ApiClientError } from "@/lib/api-client";
import { candidatesService } from "@/services/candidates.service";
import type { CandidateSummary } from "@/types/candidate";

export default function RecruiterCandidatesPage() {
  return (
    <RequireRole roles={["RECRUITER"]}>
      <DashboardShell>
        <CandidatesList />
      </DashboardShell>
    </RequireRole>
  );
}

function CandidatesList() {
  const [candidates, setCandidates] = useState<CandidateSummary[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      candidatesService
        .list({ search: search || undefined })
        .then((result) => setCandidates(result.items))
        .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load candidates."));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Candidates</h1>
      <p className="mt-1 text-sm text-muted">Everyone who has applied to one of your jobs.</p>

      <div className="mt-6 max-w-sm">
        <TextInput label="Search" placeholder="Name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="mt-8">
        {error && <Alert>{error}</Alert>}
        {!error && candidates === null && <FullScreenLoading />}
        {candidates !== null && candidates.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
            No candidates have applied yet.
          </div>
        )}
        {candidates !== null && candidates.length > 0 && (
          <div className="flex flex-col gap-3">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {candidate.user.firstName} {candidate.user.lastName}
                    </p>
                    <p className="text-xs text-muted">{candidate.user.email}</p>
                  </div>
                  <span className="text-xs text-muted">{candidate.profileCompletion}% complete</span>
                </div>
                {candidate.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {candidate.skills.slice(0, 6).map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

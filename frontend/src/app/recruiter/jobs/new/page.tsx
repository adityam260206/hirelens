"use client";

import { useRouter } from "next/navigation";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { JobForm } from "@/components/jobs/JobForm";
import { jobsService } from "@/services/jobs.service";

export default function NewJobPage() {
  return (
    <RequireRole roles={["RECRUITER"]}>
      <DashboardShell>
        <NewJobForm />
      </DashboardShell>
    </RequireRole>
  );
}

function NewJobForm() {
  const router = useRouter();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">New job</h1>
      <p className="mt-1 text-sm text-muted">
        Jobs start as drafts. You can review and publish once you&apos;re ready.
      </p>

      <div className="mt-8">
        <JobForm
          submitLabel="Create draft"
          onSubmit={async (payload) => {
            const job = await jobsService.create(payload);
            router.push(`/recruiter/jobs/${job.id}`);
          }}
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { ApiClientError } from "@/lib/api-client";
import { teamService } from "@/services/interviews.service";
import type { Interviewer } from "@/types/interview";

export default function TeamPage() {
  return (
    <RequireRole roles={["RECRUITER"]}>
      <DashboardShell>
        <TeamManager />
      </DashboardShell>
    </RequireRole>
  );
}

function TeamManager() {
  const [interviewers, setInterviewers] = useState<Interviewer[] | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    teamService.listInterviewers().then(setInterviewers).catch(() => setInterviewers([]));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await teamService.createInterviewer({ email, password, firstName, lastName });
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not create this interviewer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">Interviewers</h1>
      <p className="mt-1 text-sm text-muted">
        Add interviewer accounts for your team — they&apos;ll log in with the credentials you set here.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
        {error && <Alert>{error}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <TextInput label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextInput
          label="Temporary password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters, with a letter and a number. Share this with them directly."
          required
        />
        <Button type="submit" loading={submitting} className="w-full sm:w-auto">
          Add interviewer
        </Button>
      </form>

      <div className="mt-8">
        {interviewers === null && <p className="text-sm text-muted">Loading…</p>}
        {interviewers !== null && interviewers.length === 0 && (
          <p className="text-sm text-muted">No interviewers yet.</p>
        )}
        {interviewers !== null && interviewers.length > 0 && (
          <div className="flex flex-col gap-2">
            {interviewers.map((interviewer) => (
              <div key={interviewer.id} className="rounded-lg border border-border bg-surface p-3">
                <p className="text-sm font-medium text-foreground">
                  {interviewer.firstName} {interviewer.lastName}
                </p>
                <p className="text-xs text-muted">{interviewer.email}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

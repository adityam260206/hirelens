"use client";

import { useEffect, useState, type FormEvent } from "react";
import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextArea, TextInput } from "@/components/ui/Field";
import { TagInput } from "@/components/ui/TagInput";
import { ApiClientError } from "@/lib/api-client";
import { candidatesService } from "@/services/candidates.service";
import type { CandidateProfile } from "@/types/candidate";

export default function CandidateProfilePage() {
  return (
    <RequireRole roles={["CANDIDATE"]}>
      <DashboardShell>
        <ProfileEditor />
      </DashboardShell>
    </RequireRole>
  );
}

function ProfileEditor() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    candidatesService
      .getMyProfile()
      .then((data) => {
        setProfile(data);
        setPhone(data.phone ?? "");
        setLocation(data.location ?? "");
        setSummary(data.summary ?? "");
        setSkills(data.skills);
        setLanguages(data.languages);
      })
      .catch((err) => setLoadError(err instanceof ApiClientError ? err.message : "Could not load your profile."));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaveError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      const updated = await candidatesService.updateMyProfile({
        phone: phone || undefined,
        location: location || undefined,
        summary: summary || undefined,
        skills,
        languages,
      });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) return <Alert>{loadError}</Alert>;
  if (!profile) return <FullScreenLoading />;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Your profile</h1>
          <p className="mt-1 text-sm text-muted">
            {profile.user.firstName} {profile.user.lastName} · {profile.user.email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Profile completion</p>
          <p className="text-lg font-semibold text-foreground">{profile.profileCompletion}%</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        {saveError && <Alert>{saveError}</Alert>}
        {saved && <Alert variant="success">Profile updated.</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextInput label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <TextArea
          label="Summary"
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          hint="A short pitch recruiters will see first."
        />

        <TagInput label="Skills" values={skills} onChange={setSkills} placeholder="Type a skill and press Enter" />
        <TagInput label="Languages" values={languages} onChange={setLanguages} placeholder="Type a language and press Enter" />

        <p className="text-xs text-muted">
          Education, experience, projects, and certifications are filled in from your resume once
          you upload one, and you&apos;ll be able to review and correct them there.
        </p>

        <Button type="submit" loading={submitting} className="w-full sm:w-auto">
          Save changes
        </Button>
      </form>
    </div>
  );
}

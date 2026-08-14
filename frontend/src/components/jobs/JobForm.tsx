"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Select, TextArea, TextInput } from "@/components/ui/Field";
import { TagInput } from "@/components/ui/TagInput";
import { ApiClientError } from "@/lib/api-client";
import type { CreateJobPayload, EmploymentType, WorkMode } from "@/types/job";

const workModeOptions = [
  { value: "REMOTE", label: "Remote" },
  { value: "ONSITE", label: "On-site" },
  { value: "HYBRID", label: "Hybrid" },
];

const employmentTypeOptions = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
];

export type JobFormValues = {
  title: string;
  department: string;
  description: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  minExperience: string;
  maxExperience: string;
  salaryMin: string;
  salaryMax: string;
  requiredSkills: string[];
  preferredSkills: string[];
  education: string[];
};

export const emptyJobFormValues: JobFormValues = {
  title: "",
  department: "",
  description: "",
  location: "",
  workMode: "REMOTE",
  employmentType: "FULL_TIME",
  minExperience: "0",
  maxExperience: "",
  salaryMin: "",
  salaryMax: "",
  requiredSkills: [],
  preferredSkills: [],
  education: [],
};

function toPayload(values: JobFormValues): CreateJobPayload {
  return {
    title: values.title,
    department: values.department || undefined,
    description: values.description,
    location: values.location || undefined,
    workMode: values.workMode,
    employmentType: values.employmentType,
    minExperience: Number(values.minExperience || 0),
    maxExperience: values.maxExperience ? Number(values.maxExperience) : undefined,
    salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
    salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
    requiredSkills: values.requiredSkills,
    preferredSkills: values.preferredSkills,
    education: values.education,
  };
}

export function JobForm({
  initialValues = emptyJobFormValues,
  onSubmit,
  submitLabel,
}: {
  initialValues?: JobFormValues;
  onSubmit: (payload: CreateJobPayload) => Promise<void>;
  submitLabel: string;
}) {
  const [values, setValues] = useState<JobFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(toPayload(values));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {error && <Alert>{error}</Alert>}

      <TextInput label="Job title" required value={values.title} onChange={(e) => set("title", e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Department" value={values.department} onChange={(e) => set("department", e.target.value)} />
        <TextInput label="Location" value={values.location} onChange={(e) => set("location", e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Work mode"
          options={workModeOptions}
          value={values.workMode}
          onChange={(e) => set("workMode", e.target.value as WorkMode)}
        />
        <Select
          label="Employment type"
          options={employmentTypeOptions}
          value={values.employmentType}
          onChange={(e) => set("employmentType", e.target.value as EmploymentType)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Minimum experience (years)"
          type="number"
          min={0}
          value={values.minExperience}
          onChange={(e) => set("minExperience", e.target.value)}
        />
        <TextInput
          label="Maximum experience (years)"
          type="number"
          min={0}
          value={values.maxExperience}
          onChange={(e) => set("maxExperience", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Salary min (USD)"
          type="number"
          min={0}
          value={values.salaryMin}
          onChange={(e) => set("salaryMin", e.target.value)}
        />
        <TextInput
          label="Salary max (USD)"
          type="number"
          min={0}
          value={values.salaryMax}
          onChange={(e) => set("salaryMax", e.target.value)}
        />
      </div>

      <TextArea
        label="Description"
        required
        rows={6}
        value={values.description}
        onChange={(e) => set("description", e.target.value)}
      />

      <TagInput
        label="Required skills"
        values={values.requiredSkills}
        onChange={(v) => set("requiredSkills", v)}
        placeholder="Type a skill and press Enter"
        hint="At least one required skill is needed to publish this job."
      />
      <TagInput
        label="Preferred skills"
        values={values.preferredSkills}
        onChange={(v) => set("preferredSkills", v)}
        placeholder="Type a skill and press Enter"
      />
      <TagInput
        label="Education"
        values={values.education}
        onChange={(v) => set("education", v)}
        placeholder="e.g. Bachelor's in Computer Science"
      />

      <Button type="submit" loading={submitting} className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/layout/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { ApiClientError } from "@/lib/api-client";
import { roleHomePath } from "@/lib/routes";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";

type RegisterRole = "CANDIDATE" | "RECRUITER";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [role, setRole] = useState<RegisterRole>("CANDIDATE");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await authService.register({
        email,
        password,
        firstName,
        lastName,
        role,
        companyName: role === "RECRUITER" ? companyName : undefined,
      });
      await refresh();
      router.push(roleHomePath(user.role));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Hiring or applying — HireLens works for both.">
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-md bg-background p-1">
        {(["CANDIDATE", "RECRUITER"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRole(option)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              role === option ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
            )}
            aria-pressed={role === option}
          >
            {option === "CANDIDATE" ? "I'm a candidate" : "I'm hiring"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="First name"
            name="firstName"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextInput
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        {role === "RECRUITER" && (
          <TextInput
            label="Company name"
            name="companyName"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        )}
        <TextInput
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextInput
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters, with a letter and a number."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

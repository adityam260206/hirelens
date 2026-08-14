"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextArea, TextInput } from "@/components/ui/Field";
import { TagInput } from "@/components/ui/TagInput";
import { ApiClientError } from "@/lib/api-client";
import { offersService } from "@/services/offers.service";
import type { Offer, OfferStatus } from "@/types/offer";

const STATUS_VARIANT: Record<OfferStatus, "neutral" | "brand" | "success" | "danger" | "warning"> = {
  DRAFT: "neutral",
  SENT: "brand",
  ACCEPTED: "success",
  REJECTED: "danger",
  EXPIRED: "warning",
  WITHDRAWN: "danger",
};

export function OfferSection({
  applicationId,
  offer,
  jobTitle,
  onChange,
}: {
  applicationId: string;
  offer: Offer | null;
  jobTitle: string;
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Offer</h2>
        {!offer && (
          <Button size="sm" variant="secondary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Create offer"}
          </Button>
        )}
      </div>

      {!offer && showForm && (
        <CreateOfferForm
          applicationId={applicationId}
          defaultPosition={jobTitle}
          onCreated={() => {
            setShowForm(false);
            onChange();
          }}
        />
      )}

      {!offer && !showForm && <p className="mt-2 text-sm text-muted">No offer created yet.</p>}

      {offer && (
        <div className="mt-3 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{offer.position}</p>
            <Badge variant={STATUS_VARIANT[offer.status]}>{offer.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {offer.currency} {offer.salary.toLocaleString()} · Starts{" "}
            {new Date(offer.joiningDate).toLocaleDateString()}
            {offer.location ? ` · ${offer.location}` : ""}
          </p>
          {offer.benefits.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {offer.benefits.map((b) => (
                <Badge key={b}>{b}</Badge>
              ))}
            </div>
          )}
          <OfferActions offer={offer} onChange={onChange} />
        </div>
      )}
    </section>
  );
}

function OfferActions({ offer, onChange }: { offer: Offer; onChange: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      onChange();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not update this offer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      {error && (
        <div className="mb-2">
          <Alert>{error}</Alert>
        </div>
      )}
      <div className="flex gap-2">
        {offer.status === "DRAFT" && (
          <Button size="sm" loading={busy} onClick={() => run(() => offersService.send(offer.id))}>
            Send to candidate
          </Button>
        )}
        {offer.status === "SENT" && (
          <Button
            size="sm"
            variant="danger"
            loading={busy}
            onClick={() => run(() => offersService.withdraw(offer.id))}
          >
            Withdraw offer
          </Button>
        )}
      </div>
    </div>
  );
}

function CreateOfferForm({
  applicationId,
  defaultPosition,
  onCreated,
}: {
  applicationId: string;
  defaultPosition: string;
  onCreated: () => void;
}) {
  const [position, setPosition] = useState(defaultPosition);
  const [salary, setSalary] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [location, setLocation] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [terms, setTerms] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await offersService.create(applicationId, {
        position,
        salary: Number(salary) || 0,
        joiningDate: new Date(joiningDate).toISOString(),
        location: location || undefined,
        benefits,
        terms: terms || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not create this offer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      {error && <Alert>{error}</Alert>}
      <TextInput label="Position" value={position} onChange={(e) => setPosition(e.target.value)} required />
      <div className="grid grid-cols-2 gap-3">
        <TextInput label="Salary (USD)" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} required />
        <TextInput label="Joining date" type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} required />
      </div>
      <TextInput label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
      <TagInput label="Benefits" values={benefits} onChange={setBenefits} placeholder="Type a benefit and press Enter" />
      <TextArea label="Terms" rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} />
      <Button type="submit" loading={submitting} className="w-full sm:w-auto">
        Create draft offer
      </Button>
    </form>
  );
}

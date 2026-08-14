"use client";

import { useCallback, useEffect, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { Alert } from "@/components/ui/Alert";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { ApiClientError } from "@/lib/api-client";
import { applicationsService } from "@/services/applications.service";
import type { ApplicationDetail, ApplicationStatus } from "@/types/application";
import { KanbanColumn } from "./KanbanColumn";

const COLUMNS: { status: ApplicationStatus; label: string }[] = [
  { status: "APPLIED", label: "Applied" },
  { status: "SCREENING", label: "Screening" },
  { status: "SHORTLISTED", label: "Shortlisted" },
  { status: "TECHNICAL_INTERVIEW", label: "Technical interview" },
  { status: "HR_INTERVIEW", label: "HR interview" },
  { status: "OFFER", label: "Offer" },
  { status: "HIRED", label: "Hired" },
  { status: "REJECTED", label: "Rejected" },
];

export function KanbanBoard({ jobId }: { jobId: string }) {
  const [applications, setApplications] = useState<ApplicationDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = useCallback(() => {
    applicationsService
      .listForJob(jobId)
      .then((result) => setApplications(result.items))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load the pipeline."));
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !applications) return;

    const applicationId = String(active.id);
    const targetStatus = over.id as ApplicationStatus;
    const application = applications.find((a) => a.id === applicationId);
    if (!application || application.status === targetStatus) return;

    const previousStatus = application.status;
    setActionError(null);
    setApplications((prev) =>
      prev ? prev.map((a) => (a.id === applicationId ? { ...a, status: targetStatus } : a)) : prev
    );

    try {
      await applicationsService.updateStatus(applicationId, targetStatus);
    } catch (err) {
      setApplications((prev) =>
        prev ? prev.map((a) => (a.id === applicationId ? { ...a, status: previousStatus } : a)) : prev
      );
      setActionError(
        err instanceof ApiClientError
          ? err.message
          : "Could not move this application — the pipeline only allows moving forward one stage at a time, or rejecting."
      );
    }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!applications) return <FullScreenLoading />;

  return (
    <div>
      {actionError && (
        <div className="mb-4">
          <Alert>{actionError}</Alert>
        </div>
      )}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.status}
              status={column.status}
              label={column.label}
              applications={applications.filter((a) => a.status === column.status)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

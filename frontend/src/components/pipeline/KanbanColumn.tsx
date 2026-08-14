"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/cn";
import { ApplicationCard } from "./ApplicationCard";
import type { ApplicationDetail, ApplicationStatus } from "@/types/application";

export function KanbanColumn({
  status,
  label,
  applications,
}: {
  status: ApplicationStatus;
  label: string;
  applications: ApplicationDetail[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-64 shrink-0 flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</h3>
        <span className="text-xs text-muted">{applications.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2 rounded-lg border border-dashed border-border bg-background p-2 transition-colors",
          isOver && "border-brand bg-brand-muted"
        )}
      >
        {applications.map((application) => (
          <ApplicationCard key={application.id} application={application} />
        ))}
        {applications.length === 0 && (
          <p className="p-2 text-center text-xs text-muted">Empty</p>
        )}
      </div>
    </div>
  );
}

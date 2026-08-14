"use client";

import { useDraggable } from "@dnd-kit/core";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import type { ApplicationDetail } from "@/types/application";

export function ApplicationCard({ application }: { application: ApplicationDetail }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab rounded-md border border-border bg-surface p-3 shadow-sm active:cursor-grabbing",
        isDragging && "z-10 opacity-60"
      )}
    >
      <p className="text-sm font-medium text-foreground">
        {application.candidate.user.firstName} {application.candidate.user.lastName}
      </p>
      <p className="mt-0.5 truncate text-xs text-muted">{application.candidate.user.email}</p>
      <div className="mt-2 flex items-center justify-between">
        {application.match ? (
          <Badge variant={application.match.overallScore >= 70 ? "success" : "warning"}>
            {application.match.overallScore}% match
          </Badge>
        ) : (
          <span />
        )}
        <Link
          href={`/recruiter/applications/${application.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-xs font-medium text-brand hover:underline"
        >
          View
        </Link>
      </div>
    </div>
  );
}

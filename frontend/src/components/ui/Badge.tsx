import { cn } from "@/lib/cn";

type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "danger";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-background text-muted border-border",
  brand: "bg-brand-muted text-brand border-brand/20",
  success: "bg-success-muted text-success border-success/20",
  warning: "bg-warning-muted text-warning border-warning/20",
  danger: "bg-danger-muted text-danger border-danger/20",
};

export function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

const JOB_STATUS_VARIANT: Record<string, BadgeVariant> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  CLOSED: "danger",
};

export function JobStatusBadge({ status }: { status: string }) {
  return <Badge variant={JOB_STATUS_VARIANT[status] ?? "neutral"}>{status}</Badge>;
}

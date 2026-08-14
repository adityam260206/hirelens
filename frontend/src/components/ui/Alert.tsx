import { cn } from "@/lib/cn";

type AlertVariant = "danger" | "success" | "warning";

const variantClasses: Record<AlertVariant, string> = {
  danger: "bg-danger-muted text-danger border-danger/20",
  success: "bg-success-muted text-success border-success/20",
  warning: "bg-warning-muted text-warning border-warning/20",
};

export function Alert({ variant = "danger", children }: { variant?: AlertVariant; children: React.ReactNode }) {
  return (
    <div role="alert" className={cn("rounded-md border px-3 py-2 text-sm", variantClasses[variant])}>
      {children}
    </div>
  );
}

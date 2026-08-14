"use client";

import { cn } from "@/lib/cn";

export function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-1.5 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? undefined : n)}
            className={cn(
              "h-8 w-8 rounded-md border text-sm font-medium transition-colors",
              value === n
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border bg-surface text-muted hover:border-brand/40"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

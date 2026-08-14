"use client";

import { useEffect, useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/cn";

type HealthData = {
  status: "ok" | "degraded";
  database: "up" | "down";
  timestamp: string;
};

type State =
  | { phase: "loading" }
  | { phase: "ready"; health: HealthData }
  | { phase: "error"; message: string };

export function BackendStatus() {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiClient
      .get<HealthData>("/health")
      .then((health) => {
        if (!cancelled) setState({ phase: "ready", health });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof ApiClientError ? err.message : "Could not reach the API";
        setState({ phase: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isUp = state.phase === "ready" && state.health.status === "ok";
  const dotColor = isUp ? "bg-success" : state.phase === "loading" ? "bg-muted" : "bg-danger";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted">
      <span className={cn("h-2 w-2 rounded-full", dotColor)} />
      {state.phase === "loading" && "Checking API…"}
      {state.phase === "ready" && (
        <span>
          API {state.health.status} · DB {state.health.database}
        </span>
      )}
      {state.phase === "error" && <span>API unreachable — {state.message}</span>}
    </div>
  );
}

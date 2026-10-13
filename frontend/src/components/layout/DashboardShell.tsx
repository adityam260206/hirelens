"use client";

import type { ReactNode } from "react";
import { AppNavbar } from "@/components/layout/AppNavbar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <AppNavbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}

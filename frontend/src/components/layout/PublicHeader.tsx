"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { roleHomePath } from "@/lib/routes";

export function PublicHeader() {
  const { user, status } = useAuth();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
          HireLens
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/jobs" className="px-3 py-2 font-medium text-foreground hover:text-brand">
            Browse jobs
          </Link>
          {status === "authenticated" && user ? (
            <Link
              href={roleHomePath(user.role)}
              className="rounded-md bg-brand px-3 py-2 font-medium text-brand-foreground hover:opacity-90"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 font-medium text-foreground hover:bg-surface rounded-md">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-brand px-3 py-2 font-medium text-brand-foreground hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

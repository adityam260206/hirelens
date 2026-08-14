"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import type { UserRole } from "@/types/user";

// Client-side route guard. This is a UX convenience, not the security boundary —
// every protected API call is independently authorized server-side via RBAC
// middleware, since the browser could always be tampered with.
export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && user && !roles.includes(user.role)) {
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user]);

  if (status === "loading") return <FullScreenLoading />;
  if (status !== "authenticated" || !user || !roles.includes(user.role)) return null;

  return <>{children}</>;
}

"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "@/services/auth.service";
import type { CurrentUser } from "@/types/user";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  user: CurrentUser | null;
  status: AuthStatus;
};

type AuthContextValue = AuthState & {
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, status: "loading" });

  const refresh = useCallback(async () => {
    try {
      const user = await authService.me();
      setState({ user, status: "authenticated" });
    } catch {
      setState({ user: null, status: "unauthenticated" });
    }
  }, []);

  useEffect(() => {
    // Fetching the current session on mount is an external-system sync, not a
    // derived-state update — the setState calls happen after an async gap.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await authService.logout();
    setState({ user: null, status: "unauthenticated" });
  }, []);

  return <AuthContext.Provider value={{ ...state, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

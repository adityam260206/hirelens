"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { useAuth } from "@/hooks/useAuth";
import { socialService } from "@/services/social.service";
import type { NotificationItem } from "@/types/social";

export default function NotificationsPage() {
  const { user } = useAuth();
  const currentUserId = user?.id || "dada95c8-3767-4578-83ef-99a8f12fa7f4";

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    socialService
      .getNotifications(currentUserId)
      .then(setNotifications)
      .finally(() => setIsLoading(false));
  }, [currentUserId]);

  async function handleMarkRead(id: string) {
    await socialService.markNotificationRead(id, currentUserId);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  async function handleMarkAllRead() {
    await socialService.markAllNotificationsRead(currentUserId);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const filtered = notifications.filter((n) => (filter === "unread" ? !n.isRead : true));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppNavbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 py-6 flex flex-col gap-5">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Notifications Center</h1>
            <p className="mt-1 text-xs text-muted">Stay informed on connection requests, post reactions, comments, and application updates.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                filter === "all" ? "bg-brand text-brand-foreground" : "border border-border bg-background text-muted"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                filter === "unread" ? "bg-brand text-brand-foreground" : "border border-border bg-background text-muted"
              }`}
            >
              Unread ({notifications.filter((n) => !n.isRead).length})
            </button>
            <button
              onClick={handleMarkAllRead}
              className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-muted hover:text-foreground cursor-pointer"
            >
              Mark all read
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">
              No {filter === "unread" ? "unread " : ""}notifications right now.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {filtered.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                  className={`py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 transition-colors ${
                    !notif.isRead ? "bg-brand/5 -mx-5 px-5 rounded-lg" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand text-sm font-bold">
                      {notif.type === "CONNECTION_REQUEST" || notif.type === "CONNECTION_ACCEPTED"
                        ? "🤝"
                        : notif.type === "MESSAGE"
                        ? "💬"
                        : "❤️"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{notif.title}</p>
                      <p className="text-xs text-muted mt-0.5">{notif.message}</p>
                      <span className="text-[10px] text-muted/70 mt-1 block">
                        {new Date(notif.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {notif.link && (
                    <Link
                      href={notif.link}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/10 shrink-0"
                    >
                      View →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

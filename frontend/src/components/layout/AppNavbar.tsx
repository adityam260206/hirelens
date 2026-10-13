"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { socialService } from "@/services/social.service";
import type { NotificationItem, UserProfile, Post } from "@/types/social";

export function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, status, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ people: UserProfile[]; posts: Post[] } | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Poll notifications & conversations periodically
  useEffect(() => {
    if (status !== "authenticated" || !user) return;

    function fetchActivity() {
      socialService.getNotifications(user!.id).then(setNotifications).catch(() => {});
      socialService
        .getConversations(user!.id)
        .then((convs) => {
          const totalUnread = convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
          setUnreadMsgCount(totalUnread);
        })
        .catch(() => {});
    }

    fetchActivity();
    const interval = setInterval(fetchActivity, 15000);
    return () => clearInterval(interval);
  }, [user, status]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    const timeout = setTimeout(() => {
      socialService
        .searchAll(searchQuery, user?.id)
        .then((res) => {
          setSearchResults(res);
          setShowSearchDropdown(true);
        })
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery, user?.id]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
        setShowWorkspaceDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  async function handleMarkAllRead() {
    if (!user) return;
    await socialService.markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function handleNotificationClick(notif: NotificationItem) {
    if (!user) return;
    await socialService.markNotificationRead(notif.id, user.id);
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
    setShowNotifDropdown(false);
    if (notif.link) {
      router.push(notif.link);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const navLinks = [
    {
      label: "Home",
      href: "/",
      active: pathname === "/" || pathname === "/feed",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      label: "Network",
      href: "/network",
      active: pathname.startsWith("/network"),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      label: "Jobs",
      href: "/jobs",
      active: pathname.startsWith("/jobs"),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      label: "AI Career Hub",
      href: "/ai-assistant",
      active: pathname.startsWith("/ai-assistant"),
      badge: "AI",
      icon: (
        <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      label: "Messages",
      href: "/messages",
      active: pathname.startsWith("/messages"),
      badgeCount: unreadMsgCount,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface shadow-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Search */}
        <div className="flex items-center gap-3 md:gap-5">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground font-bold shadow-xs transition-transform group-hover:scale-105">
              HL
            </div>
            <span className="hidden font-bold tracking-tight text-foreground sm:inline-block text-lg">
              Hire<span className="text-brand">Lens</span>
            </span>
          </Link>

          {/* Search bar with dropdown */}
          <div ref={searchRef} className="relative w-40 sm:w-64 md:w-72">
            <div className="relative">
              <input
                type="text"
                placeholder="Search people, jobs, posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults) setShowSearchDropdown(true);
                }}
                className="w-full rounded-full border border-border bg-background py-1.5 pl-8 pr-4 text-xs text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden"
              />
              <svg
                className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Instant Search Dropdown */}
            {showSearchDropdown && searchResults && (
              <div className="absolute left-0 top-10 z-50 w-80 rounded-xl border border-border bg-surface p-3 shadow-xl">
                {isSearching ? (
                  <p className="p-2 text-xs text-muted">Searching...</p>
                ) : (
                  <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                    {/* People results */}
                    <div>
                      <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">People</p>
                      {searchResults.people.length === 0 ? (
                        <p className="text-xs text-muted px-2 py-1">No people found</p>
                      ) : (
                        searchResults.people.map((p) => (
                          <Link
                            key={p.userId}
                            href={`/profile/${p.userId}`}
                            onClick={() => setShowSearchDropdown(false)}
                            className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-background transition-colors"
                          >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-semibold">
                              {p.name.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <p className="truncate text-xs font-medium text-foreground">{p.name}</p>
                              <p className="truncate text-[10px] text-muted">{p.headline}</p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>

                    {/* Posts results */}
                    <div className="border-t border-border pt-2">
                      <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">Posts</p>
                      {searchResults.posts.length === 0 ? (
                        <p className="text-xs text-muted px-2 py-1">No posts found</p>
                      ) : (
                        searchResults.posts.slice(0, 3).map((post) => (
                          <Link
                            key={post.id}
                            href={`/#${post.id}`}
                            onClick={() => setShowSearchDropdown(false)}
                            className="block rounded-lg p-2 hover:bg-background transition-colors"
                          >
                            <p className="truncate text-xs font-medium text-foreground">
                              {post.author.name}: {post.content.slice(0, 50)}...
                            </p>
                            <span className="text-[10px] text-brand">#{post.category}</span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Nav Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                item.active
                  ? "text-brand font-semibold"
                  : "text-muted hover:text-foreground hover:bg-background"
              }`}
            >
              <div className="relative">
                {item.icon}
                {typeof item.badgeCount === "number" && item.badgeCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                    {item.badgeCount}
                  </span>
                )}
                {item.badge && (
                  <span className="absolute -right-3 -top-1.5 rounded-full bg-brand px-1 text-[9px] font-bold text-brand-foreground">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="hidden md:inline-block mt-0.5">{item.label}</span>
              {item.active && (
                <div className="absolute bottom-0 h-0.5 w-6 bg-brand rounded-full md:w-8" />
              )}
            </Link>
          ))}

          {/* Notifications Button & Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative flex flex-col items-center justify-center px-2 sm:px-3 py-1 rounded-md text-xs font-medium text-muted hover:text-foreground hover:bg-background transition-colors cursor-pointer"
            >
              <div className="relative">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadNotifCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                    {unreadNotifCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline-block mt-0.5">Notifications</span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-xl border border-border bg-surface p-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-border pb-2 px-1">
                  <span className="text-xs font-semibold text-foreground">Notifications</span>
                  {unreadNotifCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-brand hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="mt-2 max-h-72 overflow-y-auto flex flex-col gap-1.5">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-xs text-muted">No notifications right now.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`flex items-start gap-2.5 rounded-lg p-2.5 transition-colors cursor-pointer ${
                          notif.isRead ? "hover:bg-background" : "bg-brand/5 hover:bg-brand/10"
                        }`}
                      >
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-semibold">
                          {notif.type === "CONNECTION_REQUEST" || notif.type === "CONNECTION_ACCEPTED" ? "🤝" : notif.type === "MESSAGE" ? "💬" : "❤️"}
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-semibold text-foreground">{notif.title}</p>
                          <p className="text-muted mt-0.5 text-[11px] leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-muted/70 mt-1 inline-block">
                            {new Date(notif.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-brand shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right: Workspace & Profile */}
        <div ref={profileRef} className="flex items-center gap-2 pl-2 border-l border-border">
          {status === "authenticated" && user ? (
            <>
              {/* Role Workspace Link / Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-surface text-foreground transition-colors cursor-pointer"
                >
                  <span className="h-2 w-2 rounded-full bg-success"></span>
                  <span className="font-semibold">
                    {user.role === "RECRUITER" ? "Recruiter Hub" : user.role === "INTERVIEWER" ? "Interviews" : "Candidate Portal"}
                  </span>
                  <svg className="h-3 w-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showWorkspaceDropdown && (
                  <div className="absolute right-0 top-9 z-50 w-48 rounded-xl border border-border bg-surface p-1.5 shadow-xl">
                    {user.role === "RECRUITER" && (
                      <>
                        <Link
                          href="/recruiter"
                          onClick={() => setShowWorkspaceDropdown(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-background"
                        >
                          📊 Dashboard & Stats
                        </Link>
                        <Link
                          href="/recruiter/jobs"
                          onClick={() => setShowWorkspaceDropdown(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-background"
                        >
                          💼 Job Postings & Pipeline
                        </Link>
                        <Link
                          href="/recruiter/candidates"
                          onClick={() => setShowWorkspaceDropdown(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-background"
                        >
                          👥 Candidates & Resumes
                        </Link>
                        <Link
                          href="/recruiter/team"
                          onClick={() => setShowWorkspaceDropdown(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-background"
                        >
                          🤝 Hiring Team
                        </Link>
                        <Link
                          href="/recruiter/analytics"
                          onClick={() => setShowWorkspaceDropdown(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-background"
                        >
                          📈 Analytics
                        </Link>
                      </>
                    )}
                    {user.role === "CANDIDATE" && (
                      <>
                        <Link
                          href="/candidate"
                          onClick={() => setShowWorkspaceDropdown(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-background"
                        >
                          📄 Candidate Dashboard
                        </Link>
                        <Link
                          href="/candidate/resume"
                          onClick={() => setShowWorkspaceDropdown(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-background"
                        >
                          📤 My Resumes & Parsing
                        </Link>
                        <Link
                          href="/candidate/profile"
                          onClick={() => setShowWorkspaceDropdown(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-background"
                        >
                          👤 Profile Details
                        </Link>
                      </>
                    )}
                    {user.role === "INTERVIEWER" && (
                      <Link
                        href="/interviewer"
                        onClick={() => setShowWorkspaceDropdown(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-background"
                      >
                        📋 My Scheduled Interviews
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* User Avatar & Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-brand-foreground font-semibold text-xs border border-white/20 shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                  title={`${user.firstName} ${user.lastName}`}
                >
                  {user.firstName.charAt(0)}
                  {user.lastName.charAt(0)}
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-border bg-surface p-2 shadow-xl">
                    <div className="border-b border-border p-2">
                      <p className="text-xs font-semibold text-foreground">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[11px] text-muted truncate">{user.email}</p>
                      <span className="mt-1 inline-block rounded-sm bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                        {user.role} {user.company ? `· ${user.company.name}` : ""}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href={`/profile/${user.id}`}
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-background"
                      >
                        👤 View Full Profile
                      </Link>
                      <Link
                        href="/ai-assistant"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-background"
                      >
                        ⚡ AI Career Copilot
                      </Link>
                    </div>

                    <div className="border-t border-border pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-danger hover:bg-danger/10 text-left cursor-pointer"
                      >
                        🚪 Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:opacity-90 shadow-xs transition-opacity"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

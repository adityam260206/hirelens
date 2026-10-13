"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { useAuth } from "@/hooks/useAuth";
import { socialService } from "@/services/social.service";
import type { NetworkUser, PostAuthor } from "@/types/social";

export default function NetworkPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<NetworkUser[]>([]);
  const [pendingReceived, setPendingReceived] = useState<NetworkUser[]>([]);
  const [pendingSent, setPendingSent] = useState<NetworkUser[]>([]);
  const [suggested, setSuggested] = useState<NetworkUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"grow" | "connections">("grow");

  const currentUserId = user?.id || "dada95c8-3767-4578-83ef-99a8f12fa7f4";

  useEffect(() => {
    setIsLoading(true);
    socialService
      .getNetwork(currentUserId)
      .then((net) => {
        setConnections(net.connections);
        setPendingReceived(net.pendingReceived);
        setPendingSent(net.pendingSent);
        setSuggested(net.suggested);
      })
      .finally(() => setIsLoading(false));
  }, [currentUserId]);

  async function handleAccept(requestId: string) {
    await socialService.respondConnectionRequest(requestId, currentUserId, true);
    // Refresh
    const net = await socialService.getNetwork(currentUserId);
    setConnections(net.connections);
    setPendingReceived(net.pendingReceived);
  }

  async function handleIgnore(requestId: string) {
    await socialService.respondConnectionRequest(requestId, currentUserId, false);
    setPendingReceived((prev) => prev.filter((p) => p.requestId !== requestId));
  }

  async function handleWithdraw(requestId: string) {
    await socialService.respondConnectionRequest(requestId, currentUserId, false);
    setPendingSent((prev) => prev.filter((p) => p.requestId !== requestId));
  }

  async function handleConnect(targetUserId: string) {
    if (!user) return;
    const author: PostAuthor = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      headline: user.role === "RECRUITER" ? "Recruiter" : "Candidate",
      role: user.role,
    };

    await socialService.sendConnectionRequest(user.id, targetUserId, author);
    const net = await socialService.getNetwork(currentUserId);
    setSuggested(net.suggested);
    setPendingSent(net.pendingSent);
  }

  async function handleRemove(targetUserId: string) {
    const ok = confirm("Are you sure you want to remove this connection?");
    if (!ok) return;
    await socialService.removeConnection(currentUserId, targetUserId);
    setConnections((prev) => prev.filter((c) => c.id !== targetUserId));
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppNavbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-6">
        {/* Top Header Card */}
        <div className="mb-6 rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              My Professional Network
            </h1>
            <p className="mt-1 text-xs text-muted">
              Connect with engineers, recruiters, and technical peers. Discover opportunities through shared networks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("grow")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "grow"
                  ? "bg-brand text-brand-foreground shadow-xs"
                  : "border border-border bg-background text-muted hover:text-foreground"
              }`}
            >
              Grow Network ({suggested.length + pendingReceived.length})
            </button>
            <button
              onClick={() => setActiveTab("connections")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === "connections"
                  ? "bg-brand text-brand-foreground shadow-xs"
                  : "border border-border bg-background text-muted hover:text-foreground"
              }`}
            >
              My Connections ({connections.length})
            </button>
          </div>
        </div>

        {activeTab === "grow" ? (
          <div className="flex flex-col gap-6">
            {/* Pending Invitations Received */}
            {pendingReceived.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-foreground">
                    Invitations Received ({pendingReceived.length})
                  </h2>
                </div>

                <div className="flex flex-col divide-y divide-border">
                  {pendingReceived.map((person) => (
                    <div key={person.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <Link href={`/profile/${person.id}`} className="flex items-center gap-3 group">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand text-sm font-bold group-hover:ring-2 group-hover:ring-brand/40">
                          {person.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-brand">
                            {person.name}
                          </p>
                          <p className="text-xs text-muted">{person.headline}</p>
                          <span className="text-[11px] text-muted/70">{person.mutualConnections} mutual connections</span>
                        </div>
                      </Link>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => person.requestId && handleIgnore(person.requestId)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-background cursor-pointer"
                        >
                          Ignore
                        </button>
                        <button
                          onClick={() => person.requestId && handleAccept(person.requestId)}
                          className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-brand-foreground hover:opacity-90 shadow-xs cursor-pointer"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Requests Sent */}
            {pendingSent.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
                <h2 className="text-sm font-bold text-foreground mb-3">
                  Sent Invitations ({pendingSent.length})
                </h2>
                <div className="flex flex-col divide-y divide-border">
                  {pendingSent.map((person) => (
                    <div key={person.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-border text-foreground text-xs font-bold">
                          {person.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{person.name}</p>
                          <p className="text-[11px] text-muted">{person.headline}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => person.requestId && handleWithdraw(person.requestId)}
                        className="rounded-lg border border-border px-3 py-1 text-xs text-muted hover:text-danger hover:border-danger cursor-pointer"
                      >
                        Withdraw
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Professionals Grid */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <h2 className="text-sm font-bold text-foreground mb-4">
                People You May Know Based on Your Profile & Skills
              </h2>

              {suggested.length === 0 ? (
                <p className="text-xs text-muted py-6 text-center">
                  You are connected with everyone in the directory!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggested.map((person) => (
                    <div
                      key={person.id}
                      className="rounded-xl border border-border bg-background p-4 flex flex-col items-center text-center shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand text-lg font-bold mb-2">
                        {person.name.charAt(0)}
                      </div>
                      <Link
                        href={`/profile/${person.id}`}
                        className="text-sm font-bold text-foreground hover:text-brand"
                      >
                        {person.name}
                      </Link>
                      <span className="mt-0.5 rounded-sm bg-brand/10 px-1.5 py-0.2 text-[10px] font-semibold text-brand">
                        {person.role}
                      </span>
                      <p className="mt-1 text-xs text-muted line-clamp-2 h-8">
                        {person.headline}
                      </p>

                      {/* Skills pills */}
                      <div className="mt-3 flex flex-wrap justify-center gap-1">
                        {person.skills.slice(0, 3).map((s) => (
                          <span key={s} className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted border border-border">
                            {s}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => handleConnect(person.id)}
                        className="mt-4 w-full rounded-lg bg-brand py-1.5 text-xs font-semibold text-brand-foreground shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        + Connect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* My Connections Tab */
          <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
            <h2 className="text-sm font-bold text-foreground mb-4">
              Your Connections ({connections.length})
            </h2>

            {connections.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted">
                <p className="font-semibold text-foreground text-sm">No connections yet</p>
                <p className="mt-1">Grow your network by sending invitations above!</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {connections.map((person) => (
                  <div key={person.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <Link href={`/profile/${person.id}`} className="flex items-center gap-3 group">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand text-sm font-bold">
                        {person.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-brand">
                          {person.name}
                        </p>
                        <p className="text-xs text-muted">{person.headline}</p>
                        <span className="text-[11px] text-muted/70">{person.location || "Remote"}</span>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/messages?c=${[currentUserId, person.id].sort().join("-")}`}
                        className="rounded-lg border border-brand bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-brand-foreground transition-colors"
                      >
                        Message
                      </Link>
                      <button
                        onClick={() => handleRemove(person.id)}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:text-danger hover:border-danger transition-colors cursor-pointer"
                        title="Remove connection"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

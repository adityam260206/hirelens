"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { useAuth } from "@/hooks/useAuth";
import { socialService } from "@/services/social.service";
import type { Conversation, Message, PostAuthor } from "@/types/social";

export function MessagesPage() {
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("c");

  const { user } = useAuth();
  const currentUserId = user?.id || "dada95c8-3767-4578-83ef-99a8f12fa7f4";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    socialService
      .getConversations(currentUserId)
      .then((data) => {
        setConversations(data);
        if (!selectedConvId && data.length > 0) {
          setSelectedConvId(data[0].id);
        }
      })
      .finally(() => setIsLoading(false));
  }, [currentUserId, selectedConvId]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConvId) return;
    socialService.getMessages(selectedConvId, currentUserId).then(setMessages);

    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      socialService.getMessages(selectedConvId, currentUserId).then(setMessages);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConvId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConversation = conversations.find((c) => c.id === selectedConvId);
  const otherParticipant = activeConversation?.participants[0];

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvId) return;

    const [idA, idB] = selectedConvId.split("-");
    const recipientId = idA === currentUserId ? idB : idA;

    const senderAuthor: PostAuthor = {
      id: currentUserId,
      name: user ? `${user.firstName} ${user.lastName}` : "HireLens Member",
      headline: user?.role === "RECRUITER" ? "Recruiter" : "Candidate",
      role: user?.role || "CANDIDATE",
    };

    const text = inputText.trim();
    setInputText("");

    try {
      const newMsg = await socialService.sendMessage(
        currentUserId,
        recipientId,
        text,
        senderAuthor
      );
      setMessages((prev) => [...prev, newMsg]);

      // Refresh conversations list to update snippet
      const updatedConvs = await socialService.getConversations(currentUserId);
      setConversations(updatedConvs);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }

  const filteredConversations = conversations.filter((c) => {
    const name = c.participants[0]?.name.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppNavbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-6 flex flex-col">
        <div className="flex-1 rounded-2xl border border-border bg-surface shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[550px]">
          {/* Left Pane: Conversations List */}
          <div className="w-full md:w-80 border-r border-border flex flex-col bg-background/50">
            {/* Header & Search */}
            <div className="p-4 border-b border-border">
              <h1 className="text-base font-bold text-foreground mb-2">Messaging</h1>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden"
              />
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted">
                  No conversations yet. Connect with members and start a message!
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const participant = conv.participants[0];
                  const isSelected = conv.id === selectedConvId;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                        isSelected ? "bg-surface border-l-4 border-brand" : "hover:bg-surface/60"
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-bold">
                        {participant?.name.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {participant?.name || "HireLens Member"}
                          </span>
                          <span className="text-[10px] text-muted shrink-0">
                            {conv.lastMessage
                              ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted truncate mt-0.5">
                          {participant?.headline || ""}
                        </p>
                        <p className="text-xs text-foreground/80 truncate mt-1">
                          {conv.lastMessage?.text || "Started conversation"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane: Active Chat Window */}
          <div className="flex-1 flex flex-col bg-surface">
            {selectedConvId && otherParticipant ? (
              <>
                {/* Active Chat Header */}
                <div className="p-3.5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-bold">
                      {otherParticipant.name.charAt(0)}
                    </div>
                    <div>
                      <Link
                        href={`/profile/${otherParticipant.id}`}
                        className="text-xs font-bold text-foreground hover:text-brand"
                      >
                        {otherParticipant.name}
                      </Link>
                      <p className="text-[11px] text-muted">{otherParticipant.headline}</p>
                    </div>
                  </div>

                  <Link
                    href={`/profile/${otherParticipant.id}`}
                    className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-background"
                  >
                    View Profile
                  </Link>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted">
                      No messages yet. Send a greeting to start the conversation!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 text-xs leading-relaxed ${
                              isMe
                                ? "bg-brand text-brand-foreground rounded-br-none"
                                : "bg-background border border-border text-foreground rounded-bl-none"
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-muted mt-0.5 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Composer */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground shadow-xs hover:opacity-90 disabled:opacity-40 cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted">
                <span className="text-3xl mb-2">💬</span>
                <p className="text-sm font-semibold text-foreground">Select a conversation</p>
                <p className="text-xs mt-1">Choose from your active messages on the left or start a new thread from a profile.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MessagesPage />
    </Suspense>
  );
}

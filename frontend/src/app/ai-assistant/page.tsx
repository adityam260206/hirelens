"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { useAuth } from "@/hooks/useAuth";

type AssistantMode = "copilot" | "resume" | "interview" | "outreach";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const modeInfo: Record<
  AssistantMode,
  { title: string; subtitle: string; icon: string; promptPlaceholder: string; starterQuestions: string[] }
> = {
  copilot: {
    title: "AI Career Intelligence Copilot",
    subtitle: "Strategic guidance on career progression, tech stack evaluation, and high-impact skills",
    icon: "⚡",
    promptPlaceholder: "Ask about career roadmaps, portfolio advice, or salary negotiation...",
    starterQuestions: [
      "What distributed systems topics should I master for senior backend roles?",
      "How do I transition from Full-Stack developer to AI Systems Engineer in 2026?",
      "Review my tech stack choices for a high-concurrency microservice.",
    ],
  },
  resume: {
    title: "ATS Resume & Impact Optimizer",
    subtitle: "Evidence-backed resume analysis: ATS keyword density, quantifiable impact metrics, and clarity",
    icon: "📄",
    promptPlaceholder: "Paste your resume bullet point or ask for ATS keyword suggestions...",
    starterQuestions: [
      "How can I rewrite this bullet point to show quantifiable business impact?",
      "What are the top 5 ATS keyword gaps for a Machine Learning engineer resume?",
      "Give me a bulletproof 1-page resume structure for tech companies.",
    ],
  },
  interview: {
    title: "Technical & Behavioral Interview Coach",
    subtitle: "Realistic, rigorous mock interview simulations with instant grading and trade-off feedback",
    icon: "🎯",
    promptPlaceholder: "Answer the mock interview question or request a new topic...",
    starterQuestions: [
      "Give me a challenging System Design scenario for an order processing pipeline.",
      "Conduct a Behavioral interview question on resolving architectural disagreements.",
      "Ask me a technical question on PostgreSQL concurrency and isolation levels.",
    ],
  },
  outreach: {
    title: "Professional Outreach & Recruiter DM Writer",
    subtitle: "High-converting, non-spammy messages for LinkedIn connections and hiring managers",
    icon: "✉️",
    promptPlaceholder: "Describe the role or recruiter you want to reach out to...",
    starterQuestions: [
      "Write a compelling 250-character connection note to a Technical Recruiter at Nimbus Technologies.",
      "Draft a warm follow-up message after completing a technical interview.",
      "Generate an intro message requesting an informational chat with a Principal Architect.",
    ],
  },
};

export function AIAssistantPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as AssistantMode) || "copilot";

  const { user } = useAuth();
  const [mode, setMode] = useState<AssistantMode>(initialTab);
  const [targetRole, setTargetRole] = useState(
    user?.role === "RECRUITER" ? "Senior Software Engineer" : "Backend / ML Engineer"
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Welcome to HireLens AI Career Intelligence! I'm your dedicated career strategist powered by Groq. Choose a mode above (Career Copilot, Resume Optimizer, Interview Coach, or Outreach Generator) or ask a question below.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  async function handleSendMessage(promptText?: string) {
    const textToSend = promptText || input;
    if (!textToSend.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!promptText) setInput("");
    setIsStreaming(true);

    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, initialAssistantMessage]);

    try {
      const history = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/career-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          mode,
          history,
          targetRole,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to generate AI response");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulated } : m))
          );
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `⚠️ Error: ${err.message || "Failed to communicate with AI provider."} Please try again.`,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppNavbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 py-6 flex flex-col">
        {/* Header with Mode Tabs */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-brand-foreground text-xl shadow-xs">
                {modeInfo[mode].icon}
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {modeInfo[mode].title}
                </h1>
                <p className="text-xs text-muted">{modeInfo[mode].subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-muted">Target Role:</span>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Backend Engineer"
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden"
              />
            </div>
          </div>

          {/* Mode Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-border pt-3">
            {(["copilot", "resume", "interview", "outreach"] as AssistantMode[]).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-brand text-brand-foreground shadow-xs"
                      : "border border-border bg-background text-muted hover:text-foreground hover:bg-border/40"
                  }`}
                >
                  <span>{modeInfo[m].icon}</span>
                  <span className="capitalize">{m}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat History Container */}
        <div className="flex-1 rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs flex flex-col justify-between min-h-[460px]">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-2xs ${
                      isUser ? "bg-brand text-brand-foreground" : "bg-indigo-100 text-brand"
                    }`}
                  >
                    {isUser ? (user ? user.firstName.charAt(0) : "U") : "AI"}
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                      isUser
                        ? "bg-brand text-brand-foreground rounded-tr-none"
                        : "bg-background border border-border text-foreground rounded-tl-none whitespace-pre-line"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className={`text-[10px] font-semibold ${isUser ? "text-white/80" : "text-brand"}`}>
                        {isUser ? "You" : "HireLens AI Copilot"}
                      </span>
                      <span className={`text-[10px] ${isUser ? "text-white/60" : "text-muted"}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                    {msg.content || (
                      <span className="inline-flex gap-1 items-center text-muted">
                        <span className="animate-pulse">Thinking</span>...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick starter suggestions */}
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-[11px] font-semibold text-muted mb-2">Recommended questions:</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {modeInfo[mode].starterQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendMessage(q)}
                  disabled={isStreaming}
                  className="rounded-full border border-border bg-background px-3 py-1 text-[11px] text-muted hover:text-foreground hover:border-brand transition-colors cursor-pointer disabled:opacity-50 text-left"
                >
                  💬 {q}
                </button>
              ))}
            </div>

            {/* Input Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder={modeInfo[mode].promptPlaceholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isStreaming}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="rounded-xl bg-brand px-5 py-2.5 text-xs font-semibold text-brand-foreground shadow-xs hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
              >
                {isStreaming ? "Thinking..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AIAssistantPage />
    </Suspense>
  );
}

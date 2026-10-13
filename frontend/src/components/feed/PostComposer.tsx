"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { socialService } from "@/services/social.service";
import type { Post, PostCategory, PostAuthor } from "@/types/social";

interface PostComposerProps {
  onPostCreated: (post: Post) => void;
}

const categories: PostCategory[] = [
  "General",
  "Project",
  "Career Advice",
  "Achievement",
  "Internship & Job",
  "Tech & AI",
];

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("General");
  const [tagInput, setTagInput] = useState("");

  // Project attachments
  const [showProjectInputs, setShowProjectInputs] = useState(false);
  const [projectUrl, setProjectUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");

  // Poll attachment
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAddPollOption() {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, ""]);
    }
  }

  function handlePollOptionChange(index: number, val: string) {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    if (!user) {
      setError("Please log in to share a post.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const author: PostAuthor = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        headline:
          user.role === "RECRUITER"
            ? `Head of Talent · ${user.company?.name || "Nimbus Technologies"}`
            : user.role === "INTERVIEWER"
            ? `Technical Interviewer · ${user.company?.name || "Nimbus Technologies"}`
            : "Full-Stack & AI Candidate",
        role: user.role,
        company: user.company?.name,
      };

      const tags = tagInput
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      const pollData =
        showPollCreator && pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2
          ? {
              question: pollQuestion.trim(),
              options: pollOptions.filter((o) => o.trim()),
            }
          : undefined;

      const newPost = await socialService.createPost({
        content: content.trim(),
        category,
        tags,
        projectUrl: showProjectInputs && projectUrl.trim() ? projectUrl.trim() : undefined,
        demoUrl: showProjectInputs && demoUrl.trim() ? demoUrl.trim() : undefined,
        poll: pollData,
        author,
      });

      // Reset form
      setContent("");
      setTagInput("");
      setProjectUrl("");
      setDemoUrl("");
      setShowProjectInputs(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setShowPollCreator(false);
      setIsExpanded(false);

      onPostCreated(newPost);
    } catch (err: any) {
      setError(err.message || "Failed to publish post.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <form onSubmit={handleSubmit}>
        {/* Top bar with avatar & trigger input */}
        <div className="flex gap-3 items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground font-semibold text-sm shadow-xs">
            {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "HL"}
          </div>

          <div className="flex-1">
            <textarea
              rows={isExpanded ? 3 : 2}
              placeholder={
                user
                  ? `Start a post, share a project, or ask a question, ${user.firstName}...`
                  : "Start a post or share an achievement on HireLens..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className="w-full resize-none rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {error && <p className="mt-2 text-xs text-danger">{error}</p>}

        {/* Expanded options */}
        {isExpanded && (
          <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
            {/* Category selection */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-muted mr-1">Category:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                    category === cat
                      ? "bg-brand text-brand-foreground"
                      : "bg-background text-muted hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tag input */}
            <div>
              <input
                type="text"
                placeholder="Topics/Tags (comma separated, e.g. TypeScript, SystemDesign, AI)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden"
              />
            </div>

            {/* Toggle Project Inputs */}
            {showProjectInputs && (
              <div className="rounded-lg border border-border bg-background p-3 flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-foreground">Attach Project Details</span>
                <input
                  type="url"
                  placeholder="GitHub Repository URL (e.g. https://github.com/...)"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden"
                />
                <input
                  type="url"
                  placeholder="Live Demo URL (e.g. https://demo...)"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden"
                />
              </div>
            )}

            {/* Toggle Poll Inputs */}
            {showPollCreator && (
              <div className="rounded-lg border border-border bg-background p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">Create a Poll</span>
                  <button
                    type="button"
                    onClick={() => setShowPollCreator(false)}
                    className="text-[10px] text-muted hover:text-danger cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden"
                />
                {pollOptions.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                    className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden"
                  />
                ))}
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-[11px] font-medium text-brand hover:underline self-start cursor-pointer"
                  >
                    + Add option
                  </button>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowProjectInputs(!showProjectInputs)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    showProjectInputs
                      ? "bg-brand/10 text-brand"
                      : "text-muted hover:bg-background hover:text-foreground"
                  }`}
                >
                  <span>🔗</span> Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowPollCreator(!showPollCreator)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    showPollCreator
                      ? "bg-brand/10 text-brand"
                      : "text-muted hover:bg-background hover:text-foreground"
                  }`}
                >
                  <span>📊</span> Poll
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="rounded-lg px-3 py-1 text-xs font-medium text-muted hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-brand-foreground shadow-xs hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  {isSubmitting ? "Posting..." : "Publish"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { socialService } from "@/services/social.service";
import type { Post, Comment, PollData, PostAuthor } from "@/types/social";

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

export function PostCard({ post: initialPost, onPostDeleted }: PostCardProps) {
  const { user } = useAuth();
  const [post, setPost] = useState<Post>(initialPost);
  const [isLiked, setIsLiked] = useState<boolean>(
    Boolean(user && post.likedBy?.includes(user.id))
  );
  const [likesCount, setLikesCount] = useState<number>(post.likes);
  const [isSaved, setIsSaved] = useState<boolean>(
    Boolean(user && post.savedBy?.includes(user.id))
  );

  // Poll state
  const [poll, setPoll] = useState<PollData | undefined>(post.poll);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(
    post.poll?.userVotedOptionId || null
  );

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Share feedback
  const [showShareToast, setShowShareToast] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Like interaction
  async function handleToggleLike() {
    if (!user) return;
    const author: PostAuthor = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      headline: user.role === "RECRUITER" ? "Recruiter" : "Candidate",
      role: user.role,
    };

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await socialService.toggleLike(post.id, user.id, author);
      setLikesCount(res.likes);
    } catch {
      // Revert on error
      setIsLiked(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  }

  // Poll vote interaction
  async function handleVote(optionId: string) {
    if (!user || votedOptionId || !poll) return;
    setVotedOptionId(optionId);

    try {
      const updatedPoll = await socialService.votePoll(post.id, optionId, user.id);
      setPoll(updatedPoll);
    } catch (err) {
      console.error(err);
    }
  }

  // Comment submission
  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    setIsSubmittingComment(true);
    try {
      const author: PostAuthor = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        headline:
          user.role === "RECRUITER"
            ? `Recruiter · ${user.company?.name || "Nimbus Technologies"}`
            : "HireLens Member",
        role: user.role,
      };

      const newComment = await socialService.addComment(post.id, commentText.trim(), author);
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  }

  // Save interaction
  async function handleToggleSave() {
    if (!user) return;
    setIsSaved(!isSaved);
    await socialService.toggleSavePost(post.id, user.id);
  }

  // Share interaction
  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/#${post.id}`);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    }
  }

  // Delete own post
  async function handleDeletePost() {
    if (!user || user.id !== post.author.id) return;
    const ok = confirm("Are you sure you want to delete this post?");
    if (!ok) return;

    const success = await socialService.deletePost(post.id, user.id);
    if (success && onPostDeleted) {
      onPostDeleted(post.id);
    }
  }

  function formatTimeAgo(isoString: string) {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  return (
    <article
      id={post.id}
      className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm"
    >
      {/* Header: Author Info */}
      <div className="flex items-start justify-between">
        <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand font-bold text-sm group-hover:ring-2 group-hover:ring-brand/40 transition-all">
            {post.author.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors">
                {post.author.name}
              </span>
              <span className="rounded-sm bg-border/60 px-1.5 py-0.2 text-[10px] font-medium text-muted">
                {post.author.role}
              </span>
            </div>
            <p className="text-xs text-muted line-clamp-1">{post.author.headline}</p>
            <span className="text-[11px] text-muted/70">{formatTimeAgo(post.createdAt)}</span>
          </div>
        </Link>

        {/* Options Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-muted hover:text-foreground p-1 rounded-md hover:bg-background cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-border bg-surface p-1 shadow-lg text-xs">
              <button
                onClick={() => {
                  handleToggleSave();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-foreground hover:bg-background text-left cursor-pointer"
              >
                <span>{isSaved ? "🔖" : "🏷️"}</span> {isSaved ? "Unsave post" : "Save post"}
              </button>
              {user?.id === post.author.id && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDeletePost();
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-danger hover:bg-danger/10 text-left cursor-pointer"
                >
                  <span>🗑️</span> Delete post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category badge */}
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
          {post.category}
        </span>
        {post.tags.map((t) => (
          <span key={t} className="text-[11px] text-muted hover:text-brand cursor-pointer">
            #{t}
          </span>
        ))}
      </div>

      {/* Post Content */}
      <div className="mt-3 text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed">
        {post.content}
      </div>

      {/* Project links attachment */}
      {(post.projectUrl || post.demoUrl) && (
        <div className="mt-3 rounded-xl border border-border bg-background p-3.5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <span>🚀</span> Attached Project
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {post.projectUrl && (
              <a
                href={post.projectUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-medium text-foreground hover:border-brand hover:text-brand transition-colors"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                GitHub Repository
              </a>
            )}
            {post.demoUrl && (
              <a
                href={post.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-medium text-brand hover:bg-brand/5 transition-colors"
              >
                <span>🌐</span> Live Demo
              </a>
            )}
          </div>
        </div>
      )}

      {/* Poll attachment */}
      {poll && (
        <div className="mt-3 rounded-xl border border-border bg-background p-3.5 flex flex-col gap-2.5">
          <p className="text-xs font-bold text-foreground">📊 {poll.question}</p>
          <div className="flex flex-col gap-2">
            {poll.options.map((opt) => {
              const percent = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
              const isSelected = votedOptionId === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => handleVote(opt.id)}
                  className={`relative overflow-hidden rounded-lg border p-2 text-xs transition-all ${
                    votedOptionId ? "cursor-default" : "cursor-pointer hover:border-brand"
                  } ${
                    isSelected ? "border-brand bg-brand/5 font-semibold text-brand" : "border-border bg-surface text-foreground"
                  }`}
                >
                  {/* Progress background bar */}
                  {votedOptionId && (
                    <div
                      className="absolute inset-y-0 left-0 bg-brand/15 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  )}
                  <div className="relative flex items-center justify-between">
                    <span>
                      {isSelected ? "✓ " : ""}
                      {opt.text}
                    </span>
                    {votedOptionId && <span className="text-[11px] font-bold text-muted">{percent}%</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <span className="text-[10px] text-muted">{poll.totalVotes} total votes</span>
        </div>
      )}

      {/* Engagement Counters */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted">
        <div className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] text-white">
            👍
          </span>
          <span>{likesCount} likes</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComments(!showComments)}
            className="hover:underline cursor-pointer"
          >
            {comments.length} comments
          </button>
          <span>{post.shares} reposts</span>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
        <button
          onClick={handleToggleLike}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${
            isLiked ? "text-brand bg-brand/5" : "text-muted hover:bg-background hover:text-foreground"
          }`}
        >
          <svg className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
          Like
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          Comment
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-muted hover:bg-background hover:text-foreground transition-colors cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share
        </button>

        <button
          onClick={handleToggleSave}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${
            isSaved ? "text-brand" : "text-muted hover:bg-background hover:text-foreground"
          }`}
        >
          <span>{isSaved ? "🔖" : "🏷️"}</span>
          Save
        </button>
      </div>

      {showShareToast && (
        <div className="mt-2 text-center text-xs text-brand font-medium animate-pulse">
          ✓ Link copied to clipboard!
        </div>
      )}

      {/* Expanded Comments Section */}
      {showComments && (
        <div className="mt-3 border-t border-border pt-3 flex flex-col gap-3">
          {/* Add comment input */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
              {user ? user.firstName.charAt(0) : "HL"}
            </div>
            <input
              type="text"
              placeholder={user ? "Add a comment..." : "Log in to comment"}
              disabled={!user || isSubmittingComment}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmittingComment || !user}
              className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-40 cursor-pointer"
            >
              Post
            </button>
          </form>

          {/* Comments list */}
          <div className="flex flex-col gap-2 mt-1">
            {comments.length === 0 ? (
              <p className="text-center text-xs text-muted py-2">No comments yet. Start the conversation!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2.5 rounded-lg bg-background p-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-bold">
                    {comment.author.name.charAt(0)}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{comment.author.name}</span>
                      <span className="text-[10px] text-muted">{formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-[10px] text-muted">{comment.author.headline}</p>
                    <p className="mt-1 text-foreground">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
}

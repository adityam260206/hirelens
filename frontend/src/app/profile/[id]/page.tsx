"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";
import { useAuth } from "@/hooks/useAuth";
import { socialService } from "@/services/social.service";
import type { UserProfile, Post, PostAuthor } from "@/types/social";

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const profileUserId = params.id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectSent, setConnectSent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Edit form state
  const [editHeadline, setEditHeadline] = useState("");
  const [editAbout, setEditAbout] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editSkills, setEditSkills] = useState("");

  const isOwnProfile = user?.id === profileUserId;

  useEffect(() => {
    setIsLoading(true);
    socialService
      .getProfile(profileUserId)
      .then((p) => {
        setProfile(p);
        setEditHeadline(p.headline);
        setEditAbout(p.about || "");
        setEditLocation(p.location || "");
        setEditSkills(p.skills.join(", "));
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));

    socialService
      .getPosts()
      .then((posts) => {
        setUserPosts(posts.filter((p) => p.author.id === profileUserId));
      })
      .catch(() => {});
  }, [profileUserId]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    const skillsArray = editSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const updated = await socialService.updateProfile(profileUserId, {
      headline: editHeadline,
      about: editAbout,
      location: editLocation,
      skills: skillsArray,
    });

    setProfile(updated);
    setIsEditing(false);
  }

  async function handleConnect() {
    if (!user || isOwnProfile) return;
    setIsConnecting(true);

    const author: PostAuthor = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      headline: user.role === "RECRUITER" ? "Recruiter" : "Candidate",
      role: user.role,
    };

    try {
      await socialService.sendConnectionRequest(user.id, profileUserId, author);
      setConnectSent(true);
    } catch {
      // ignore
    } finally {
      setIsConnecting(false);
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppNavbar />
        <div className="flex-1 flex items-center justify-center">
          <FullScreenLoading />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppNavbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* Profile Card Header */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          {/* Cover Banner */}
          <div className="h-32 sm:h-44 bg-gradient-to-r from-brand via-indigo-600 to-purple-600" />

          {/* Profile Details */}
          <div className="relative px-6 pb-6 pt-0">
            {/* Avatar */}
            <div className="-mt-16 sm:-mt-20 flex justify-between items-end">
              <div className="flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full border-4 border-surface bg-brand text-3xl sm:text-4xl font-bold text-brand-foreground shadow-md">
                {profile.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {isOwnProfile ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface transition-colors cursor-pointer"
                  >
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleConnect}
                      disabled={connectSent || isConnecting}
                      className={`rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                        connectSent
                          ? "border border-border bg-background text-muted"
                          : "bg-brand text-brand-foreground hover:opacity-90"
                      }`}
                    >
                      {connectSent ? "Invitation Sent" : "+ Connect"}
                    </button>
                    {user && (
                      <Link
                        href={`/messages?c=${[user.id, profileUserId].sort().join("-")}`}
                        className="rounded-xl border border-brand bg-brand/5 px-4 py-2 text-xs font-semibold text-brand hover:bg-brand hover:text-brand-foreground transition-colors"
                      >
                        💬 Message
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Name, Headline, Location */}
            <div className="mt-4">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{profile.name}</h1>
                <span className="rounded-sm bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                  {profile.role}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground/90 font-medium leading-relaxed">
                {profile.headline}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                {profile.company && <span>🏢 {profile.company}</span>}
                {profile.location && <span>📍 {profile.location}</span>}
                <span className="font-semibold text-brand">
                  🤝 {profile.connectionsCount} connections
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
              <h2 className="text-base font-bold text-foreground mb-4">Edit Profile Details</h2>
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="font-semibold text-foreground">Headline</label>
                  <input
                    type="text"
                    value={editHeadline}
                    onChange={(e) => setEditHeadline(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground focus:border-brand focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground focus:border-brand focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground focus:border-brand focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">About / Bio</label>
                  <textarea
                    rows={4}
                    value={editAbout}
                    onChange={(e) => setEditAbout(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground focus:border-brand focus:outline-hidden"
                  />
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-lg px-4 py-2 font-medium text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-brand px-5 py-2 font-semibold text-brand-foreground shadow-xs hover:opacity-90"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* About Section */}
        {profile.about && (
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">About</h2>
            <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
              {profile.about}
            </p>
          </div>
        )}

        {/* Skills Section */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
              Skills & Technical Expertise
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-brand transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience Section */}
        {profile.experience && profile.experience.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Work Experience
            </h2>
            <div className="space-y-4 divide-y divide-border">
              {profile.experience.map((exp) => (
                <div key={exp.id} className="pt-3 first:pt-0">
                  <h3 className="text-sm font-bold text-foreground">{exp.title}</h3>
                  <p className="text-xs font-semibold text-brand">{exp.company}</p>
                  <span className="text-[11px] text-muted">
                    {exp.startDate} - {exp.current ? "Present" : exp.endDate} · {exp.location || "Remote"}
                  </span>
                  {exp.description && (
                    <p className="mt-1.5 text-xs text-foreground/80">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Section */}
        {profile.projects && profile.projects.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Projects & Portfolios
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.projects.map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-xl border border-border bg-background p-4 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">{proj.title}</h3>
                    <p className="mt-1 text-xs text-muted leading-relaxed">{proj.description}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {proj.technologies.map((t) => (
                        <span key={t} className="rounded-sm bg-surface px-1.5 py-0.5 text-[10px] text-muted border border-border">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 pt-2 border-t border-border/60">
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground hover:text-brand"
                      >
                        GitHub Repo
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand hover:bg-brand hover:text-brand-foreground"
                      >
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity & Posts Section */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
            Recent Activity & Posts ({userPosts.length})
          </h2>
          {userPosts.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center">No recent posts published yet.</p>
          ) : (
            <div className="space-y-3">
              {userPosts.map((post) => (
                <div key={post.id} className="rounded-xl border border-border bg-background p-3.5 text-xs">
                  <div className="flex items-center justify-between text-muted mb-1 text-[11px]">
                    <span className="font-semibold text-brand">#{post.category}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-foreground leading-relaxed line-clamp-3">{post.content}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
                    <span>👍 {post.likes} likes</span>
                    <span>💬 {post.comments.length} comments</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import type {
  Post,
  Comment,
  PollData,
  NetworkUser,
  Conversation,
  Message,
  NotificationItem,
  UserProfile,
  PostCategory,
  PostAuthor,
} from "@/types/social";

export const socialService = {
  // Feed
  getPosts: async (params?: { category?: string; tag?: string; userId?: string }): Promise<Post[]> => {
    const sp = new URLSearchParams();
    if (params?.category) sp.set("category", params.category);
    if (params?.tag) sp.set("tag", params.tag);
    if (params?.userId) sp.set("userId", params.userId);

    const res = await fetch(`/api/feed?${sp.toString()}`);
    const json = await res.json();
    return json.data || [];
  },

  createPost: async (payload: {
    content: string;
    category?: PostCategory;
    tags?: string[];
    projectUrl?: string;
    demoUrl?: string;
    poll?: { question: string; options: string[] };
    author: PostAuthor;
  }): Promise<Post> => {
    const res = await fetch("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to create post");
    return json.data;
  },

  toggleLike: async (postId: string, userId: string, author?: PostAuthor): Promise<{ liked: boolean; likes: number }> => {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, author }),
    });
    const json = await res.json();
    return json.data;
  },

  addComment: async (postId: string, content: string, author: PostAuthor): Promise<Comment> => {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, author }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to add comment");
    return json.data;
  },

  votePoll: async (postId: string, optionId: string, userId: string): Promise<PollData> => {
    const res = await fetch(`/api/posts/${postId}/poll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId, userId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to vote in poll");
    return json.data;
  },

  toggleSavePost: async (postId: string, userId: string): Promise<{ saved: boolean }> => {
    const res = await fetch(`/api/posts/${postId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const json = await res.json();
    return json.data;
  },

  deletePost: async (postId: string, userId: string): Promise<boolean> => {
    const res = await fetch(`/api/posts/${postId}?userId=${userId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    return json.success === true;
  },

  // Network
  getNetwork: async (
    userId: string
  ): Promise<{
    connections: NetworkUser[];
    pendingReceived: NetworkUser[];
    pendingSent: NetworkUser[];
    suggested: NetworkUser[];
  }> => {
    const res = await fetch(`/api/network?userId=${userId}`);
    const json = await res.json();
    return json.data || { connections: [], pendingReceived: [], pendingSent: [], suggested: [] };
  },

  sendConnectionRequest: async (
    userId: string,
    targetUserId: string,
    author?: PostAuthor
  ): Promise<{ requestId: string }> => {
    const res = await fetch("/api/network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", userId, targetUserId, author }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to send request");
    return json.data;
  },

  respondConnectionRequest: async (requestId: string, userId: string, accept: boolean): Promise<boolean> => {
    const res = await fetch("/api/network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "respond", requestId, userId, accept }),
    });
    const json = await res.json();
    return json.data?.ok === true;
  },

  removeConnection: async (userId: string, targetUserId: string): Promise<boolean> => {
    const res = await fetch("/api/network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", userId, targetUserId }),
    });
    const json = await res.json();
    return json.data?.ok === true;
  },

  // Messages
  getConversations: async (userId: string): Promise<Conversation[]> => {
    const res = await fetch(`/api/messages?userId=${userId}`);
    const json = await res.json();
    return json.data || [];
  },

  getMessages: async (conversationId: string, userId: string): Promise<Message[]> => {
    const res = await fetch(`/api/messages?userId=${userId}&conversationId=${conversationId}`);
    const json = await res.json();
    return json.data || [];
  },

  sendMessage: async (
    senderId: string,
    recipientId: string,
    text: string,
    senderAuthor?: PostAuthor
  ): Promise<Message> => {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId, recipientId, text, senderAuthor }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to send message");
    return json.data;
  },

  // Notifications
  getNotifications: async (userId: string): Promise<NotificationItem[]> => {
    const res = await fetch(`/api/notifications?userId=${userId}`);
    const json = await res.json();
    return json.data || [];
  },

  markNotificationRead: async (notificationId: string, userId: string): Promise<boolean> => {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", notificationId, userId }),
    });
    const json = await res.json();
    return json.success === true;
  },

  markAllNotificationsRead: async (userId: string): Promise<boolean> => {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read_all", userId }),
    });
    const json = await res.json();
    return json.success === true;
  },

  // Profiles
  getProfile: async (userId: string): Promise<UserProfile> => {
    const res = await fetch(`/api/profile/${userId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Profile not found");
    return json.data;
  },

  updateProfile: async (userId: string, data: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await fetch(`/api/profile/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to update profile");
    return json.data;
  },

  // Saved Jobs
  getSavedJobs: async (userId: string): Promise<string[]> => {
    const res = await fetch(`/api/jobs/saved?userId=${userId}`);
    const json = await res.json();
    return json.data || [];
  },

  toggleSaveJob: async (userId: string, jobId: string): Promise<{ saved: boolean }> => {
    const res = await fetch("/api/jobs/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, jobId }),
    });
    const json = await res.json();
    return json.data;
  },

  // Search
  searchAll: async (q: string, userId?: string): Promise<{ people: UserProfile[]; posts: Post[] }> => {
    const sp = new URLSearchParams({ q });
    if (userId) sp.set("userId", userId);
    const res = await fetch(`/api/search?${sp.toString()}`);
    const json = await res.json();
    return json.data || { people: [], posts: [] };
  },
};

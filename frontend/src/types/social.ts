export type PostCategory =
  | "General"
  | "Project"
  | "Career Advice"
  | "Achievement"
  | "Internship & Job"
  | "Tech & AI";

export type PollOption = {
  id: string;
  text: string;
  votes: number;
};

export type PollData = {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: string | null;
};

export type PostAuthor = {
  id: string;
  name: string;
  headline: string;
  role: "RECRUITER" | "CANDIDATE" | "INTERVIEWER";
  company?: string;
  avatarUrl?: string;
};

export type Comment = {
  id: string;
  postId: string;
  author: PostAuthor;
  content: string;
  createdAt: string;
  likes: number;
};

export type Post = {
  id: string;
  author: PostAuthor;
  content: string;
  category: PostCategory;
  tags: string[];
  projectUrl?: string;
  demoUrl?: string;
  poll?: PollData;
  likes: number;
  likedBy: string[]; // user IDs
  comments: Comment[];
  shares: number;
  savedBy: string[]; // user IDs
  createdAt: string;
  updatedAt?: string;
};

export type ConnectionStatus = "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "CONNECTED";

export type NetworkUser = {
  id: string;
  name: string;
  headline: string;
  role: "RECRUITER" | "CANDIDATE" | "INTERVIEWER";
  company?: string;
  location?: string;
  skills: string[];
  avatarUrl?: string;
  mutualConnections: number;
  connectionStatus: ConnectionStatus;
  requestId?: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
  isRead: boolean;
};

export type Conversation = {
  id: string;
  participants: PostAuthor[];
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
  updatedAt: string;
};

export type NotificationItem = {
  id: string;
  userId: string;
  type: "CONNECTION_REQUEST" | "CONNECTION_ACCEPTED" | "POST_LIKE" | "POST_COMMENT" | "JOB_UPDATE" | "MESSAGE";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  actor?: PostAuthor;
};

export type UserProfile = {
  id: string;
  userId: string;
  name: string;
  headline: string;
  role: "RECRUITER" | "CANDIDATE" | "INTERVIEWER";
  email: string;
  phone?: string;
  location?: string;
  company?: string;
  about?: string;
  skills: string[];
  experience: Array<{
    id: string;
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    description?: string;
  }>;
  education: Array<{
    id: string;
    school: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    githubUrl?: string;
    liveUrl?: string;
    technologies: string[];
  }>;
  certifications?: Array<{
    id: string;
    name: string;
    issuer: string;
    year: string;
  }>;
  profileCompletion: number;
  connectionsCount: number;
  savedJobIds: string[];
  savedPostIds: string[];
};

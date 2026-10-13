import fs from "fs";
import path from "path";
import type {
  Post,
  Comment,
  PollData,
  UserProfile,
  NetworkUser,
  Message,
  Conversation,
  NotificationItem,
  PostCategory,
  PostAuthor,
} from "@/types/social";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "hirelens-social.json");

type StoreData = {
  posts: Post[];
  profiles: Record<string, UserProfile>;
  connections: Array<{
    id: string;
    requesterId: string;
    receiverId: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    createdAt: string;
  }>;
  messages: Message[];
  notifications: NotificationItem[];
  savedJobs: Record<string, string[]>; // userId -> jobId[]
};

const initialUsers: Record<string, UserProfile> = {
  "dada95c8-3767-4578-83ef-99a8f12fa7f4": {
    id: "profile-riya",
    userId: "dada95c8-3767-4578-83ef-99a8f12fa7f4",
    name: "Riya Sharma",
    headline: "Head of Talent & Technical Recruiting at Nimbus Technologies | Hiring AI & Backend Engineers",
    role: "RECRUITER",
    email: "demo.recruiter@hirelens.dev",
    location: "Bengaluru, India / San Francisco, CA",
    company: "Nimbus Technologies",
    about:
      "Passionate about hiring high-impact engineers and AI researchers with explainable skills evaluation. Leading talent operations at Nimbus Technologies. Feel free to connect for open backend, ML, and systems engineering roles!",
    skills: ["Technical Recruiting", "Talent Acquisition", "Engineering Management", "AI Sourcing", "Interview Operations", "Compensation Design"],
    experience: [
      {
        id: "exp-1",
        title: "Head of Technical Recruiting",
        company: "Nimbus Technologies",
        location: "Bengaluru, India",
        startDate: "2023-01",
        current: true,
        description: "Leading tech hiring across AI, Cloud Infrastructure, and Core Backend teams.",
      },
      {
        id: "exp-2",
        title: "Senior Talent Partner",
        company: "HyperScale Cloud",
        location: "Remote",
        startDate: "2020-04",
        endDate: "2022-12",
        description: "Scaled distributed backend teams from 20 to 120 engineers.",
      },
    ],
    education: [
      {
        id: "edu-1",
        school: "Delhi University",
        degree: "Bachelor of Business Administration",
        field: "Human Resources & Organizational Behavior",
        startYear: "2016",
        endYear: "2019",
      },
    ],
    projects: [
      {
        id: "proj-1",
        title: "Explainable Hiring Playbook",
        description: "Framework for objective skill matching and mitigating bias in technical screening.",
        technologies: ["Recruitment Intelligence", "Candidate Experience"],
      },
    ],
    profileCompletion: 95,
    connectionsCount: 384,
    savedJobIds: [],
    savedPostIds: [],
  },
  "candidate-alex-morgan": {
    id: "profile-alex",
    userId: "candidate-alex-morgan",
    name: "Alex Morgan",
    headline: "Full-Stack & Machine Learning Engineer | Ex-Stripe Intern | Building LLM Eval Frameworks",
    role: "CANDIDATE",
    email: "demo.candidate@hirelens.dev",
    location: "Seattle, WA / Remote",
    company: "University of Washington",
    about:
      "Computer Science student & incoming engineer focused on distributed systems, TypeScript, Python, and explainable AI pipelines. Built multiple production web apps and open-source evaluation tools.",
    skills: ["TypeScript", "Next.js", "Python", "PostgreSQL", "FastAPI", "PyTorch", "Docker", "Tailwind CSS", "GraphQL"],
    experience: [
      {
        id: "exp-alex-1",
        title: "Software Engineering Intern",
        company: "Stripe",
        location: "Seattle, WA",
        startDate: "2025-06",
        endDate: "2025-09",
        description: "Optimized distributed settlement pipelines and reduced retry latency by 24%.",
      },
    ],
    education: [
      {
        id: "edu-alex-1",
        school: "University of Washington",
        degree: "B.S. Computer Science",
        field: "Systems & Artificial Intelligence",
        startYear: "2022",
        endYear: "2026",
      },
    ],
    projects: [
      {
        id: "proj-alex-1",
        title: "GenerateVerify — LLM Quiz Evaluation",
        description: "Achieved 100% strongly grounded questions and evaluated grounding, correctness, and cognitive demand across LLM strategies.",
        githubUrl: "https://github.com/adityam260206/Content-Generator-AI",
        technologies: ["Python", "Groq AI", "FastAPI", "Next.js"],
      },
      {
        id: "proj-alex-2",
        title: "HireLens Deterministic Matching Engine",
        description: "Deterministic scoring engine with skill gap analysis over structured resumes.",
        githubUrl: "https://github.com/adityam260206/hirelens",
        technologies: ["TypeScript", "Next.js", "Express", "Prisma"],
      },
    ],
    profileCompletion: 90,
    connectionsCount: 142,
    savedJobIds: [],
    savedPostIds: [],
  },
  "interviewer-elena": {
    id: "profile-elena",
    userId: "interviewer-elena",
    name: "Dr. Elena Rostova",
    headline: "Principal Systems Architect & Technical Interviewer at Nimbus Technologies | Distributed Systems & High-Throughput DBs",
    role: "INTERVIEWER",
    email: "demo.interviewer@hirelens.dev",
    location: "San Francisco, CA",
    company: "Nimbus Technologies",
    about:
      "Designing fault-tolerant storage architectures and mentoring technical talent. Dedicated to evidence-backed, transparent candidate evaluation and realistic systems design interviews.",
    skills: ["Distributed Systems", "PostgreSQL Internals", "Go", "C++", "System Design", "Technical Interviewing", "High Concurrency"],
    experience: [
      {
        id: "exp-elena-1",
        title: "Principal Systems Architect",
        company: "Nimbus Technologies",
        startDate: "2021-02",
        current: true,
        description: "Leading core platform architecture and interviewing senior backend candidates.",
      },
    ],
    education: [
      {
        id: "edu-elena-1",
        school: "Stanford University",
        degree: "Ph.D. Computer Science",
        field: "Distributed Data Management",
        startYear: "2014",
        endYear: "2019",
      },
    ],
    projects: [
      {
        id: "proj-elena-1",
        title: "Raft Consensus Visualizer",
        description: "Interactive visual simulator for multi-node leader election and log replication.",
        technologies: ["Go", "WebAssembly", "TypeScript"],
      },
    ],
    profileCompletion: 100,
    connectionsCount: 512,
    savedJobIds: [],
    savedPostIds: [],
  },
  "user-marcus": {
    id: "profile-marcus",
    userId: "user-marcus",
    name: "Marcus Vance",
    headline: "Staff Cloud Engineer & DevOps Lead | Kubernetes, Terraform, Platform Engineering",
    role: "CANDIDATE",
    email: "marcus.vance@techlead.dev",
    location: "Austin, TX",
    company: "CloudScale Systems",
    about: "Platform engineer passionate about CI/CD acceleration, infrastructure as code, and developer productivity.",
    skills: ["Kubernetes", "AWS", "Terraform", "Go", "GitHub Actions", "Docker", "Prometheus"],
    experience: [
      {
        id: "exp-mv-1",
        title: "Staff Cloud Engineer",
        company: "CloudScale Systems",
        startDate: "2022-03",
        current: true,
      },
    ],
    education: [
      {
        id: "edu-mv-1",
        school: "UT Austin",
        degree: "B.S. Electrical & Computer Engineering",
        field: "Computer Engineering",
        startYear: "2015",
        endYear: "2019",
      },
    ],
    projects: [],
    profileCompletion: 85,
    connectionsCount: 220,
    savedJobIds: [],
    savedPostIds: [],
  },
};

const initialPosts: Post[] = [
  {
    id: "post-1",
    author: {
      id: "dada95c8-3767-4578-83ef-99a8f12fa7f4",
      name: "Riya Sharma",
      headline: "Head of Talent & Technical Recruiting at Nimbus Technologies",
      role: "RECRUITER",
      company: "Nimbus Technologies",
    },
    content:
      "🚀 We are officially hiring for Backend Engineers and Machine Learning Engineers at Nimbus Technologies! \n\nAt Nimbus, we don't do black-box filtering or 6-round marathon puzzles. Every candidate who applies gets an explainable evaluation with concrete skill-by-skill evidence. \n\nKey skills we love: TypeScript, PostgreSQL, Distributed Systems, and Python for ML.\n\nCheck out the open roles on our Jobs tab or send a direct connection request if you'd like to chat!",
    category: "Internship & Job",
    tags: ["Hiring", "Backend", "AI", "TechCareers", "NimbusTechnologies"],
    likes: 38,
    likedBy: ["candidate-alex-morgan", "user-marcus"],
    comments: [
      {
        id: "comment-1-1",
        postId: "post-1",
        author: {
          id: "candidate-alex-morgan",
          name: "Alex Morgan",
          headline: "Full-Stack & Machine Learning Engineer",
          role: "CANDIDATE",
        },
        content: "Just submitted my application for the Backend Engineer role! The skill-gap breakdown on HireLens made it super clear what areas align best.",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        likes: 6,
      },
      {
        id: "comment-1-2",
        author: {
          id: "interviewer-elena",
          name: "Dr. Elena Rostova",
          headline: "Principal Systems Architect at Nimbus Technologies",
          role: "INTERVIEWER",
        },
        postId: "post-1",
        content: "Excited to meet the candidates! We have real-world engineering problems to solve in our data platform.",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        likes: 4,
      },
    ],
    shares: 12,
    savedBy: ["candidate-alex-morgan"],
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "post-2",
    author: {
      id: "candidate-alex-morgan",
      name: "Alex Morgan",
      headline: "Full-Stack & Machine Learning Engineer | Ex-Stripe Intern",
      role: "CANDIDATE",
    },
    content:
      "🎉 Proud to share our new project: 'GenerateVerify — LLM Quiz Evaluation & Grounding Engine'!\n\nWe benchmarked three AI generation strategies across grounding, correctness, clarity, and cognitive-demand scores. GenerateVerify achieved 100% strongly grounded questions with high consistency.\n\nKey takeaway: Deterministic verification on top of generative models drastically reduces hallucinations compared to raw prompt chains.\n\nRepo is open source, feedback is warmly welcomed!",
    category: "Project",
    tags: ["MachineLearning", "OpenSource", "LLM", "Python", "Evaluation"],
    projectUrl: "https://github.com/adityam260206/Content-Generator-AI",
    demoUrl: "http://localhost:3000",
    likes: 47,
    likedBy: ["dada95c8-3767-4578-83ef-99a8f12fa7f4", "interviewer-elena"],
    comments: [
      {
        id: "comment-2-1",
        postId: "post-2",
        author: {
          id: "interviewer-elena",
          name: "Dr. Elena Rostova",
          headline: "Principal Systems Architect",
          role: "INTERVIEWER",
        },
        content: "Impressive rigor on the cognitive-demand metrics, Alex. How did you handle confounding factors in question yield?",
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        likes: 5,
      },
    ],
    shares: 15,
    savedBy: [],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "post-3",
    author: {
      id: "interviewer-elena",
      name: "Dr. Elena Rostova",
      headline: "Principal Systems Architect at Nimbus Technologies",
      role: "INTERVIEWER",
      company: "Nimbus Technologies",
    },
    content:
      "💡 Technical Interview Tip for 2026:\n\nWhen a senior interviewer asks you to design a high-throughput system, resist the urge to immediately say 'I will add Redis and Kafka'.\n\nInstead:\n1. Ask for SLA requirements: read vs write ratio, latency target, and consistency needs (p99 vs p50).\n2. Calculate back-of-the-envelope storage and bandwidth.\n3. Identify the true bottleneck before choosing tools.\n\nWhat is your biggest hurdle in technical interviews right now?",
    category: "Career Advice",
    tags: ["CareerAdvice", "SystemDesign", "InterviewTips", "Engineering"],
    poll: {
      id: "poll-elena-1",
      question: "Which part of technical interviews do you find most challenging?",
      options: [
        { id: "opt-1", text: "System Design & Scaling Trade-offs", votes: 42 },
        { id: "opt-2", text: "Data Structures & Live Coding", votes: 29 },
        { id: "opt-3", text: "Behavioral & Conflict Stories", votes: 14 },
        { id: "opt-4", text: "Salary & Level Negotiation", votes: 19 },
      ],
      totalVotes: 104,
    },
    likes: 62,
    likedBy: ["candidate-alex-morgan", "user-marcus"],
    comments: [
      {
        id: "comment-3-1",
        postId: "post-3",
        author: {
          id: "user-marcus",
          name: "Marcus Vance",
          headline: "Staff Cloud Engineer",
          role: "CANDIDATE",
        },
        content: "Couldn't agree more Elena. Too many candidates default to naming buzzwords instead of analyzing failure modes.",
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        likes: 3,
      },
    ],
    shares: 21,
    savedBy: ["dada95c8-3767-4578-83ef-99a8f12fa7f4"],
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

function readStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial: StoreData = {
        posts: initialPosts,
        profiles: initialUsers,
        connections: [
          {
            id: "conn-1",
            requesterId: "candidate-alex-morgan",
            receiverId: "dada95c8-3767-4578-83ef-99a8f12fa7f4",
            status: "ACCEPTED",
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          },
          {
            id: "conn-2",
            requesterId: "interviewer-elena",
            receiverId: "dada95c8-3767-4578-83ef-99a8f12fa7f4",
            status: "ACCEPTED",
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          },
          {
            id: "conn-3",
            requesterId: "user-marcus",
            receiverId: "candidate-alex-morgan",
            status: "ACCEPTED",
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
        ],
        messages: [
          {
            id: "msg-1",
            conversationId: "conv-alex-riya",
            senderId: "dada95c8-3767-4578-83ef-99a8f12fa7f4",
            recipientId: "candidate-alex-morgan",
            text: "Hi Alex! Saw your application and the 88/100 match on our Backend Engineer role. The team was impressed by your distributed systems work.",
            createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
            isRead: true,
          },
          {
            id: "msg-2",
            conversationId: "conv-alex-riya",
            senderId: "candidate-alex-morgan",
            recipientId: "dada95c8-3767-4578-83ef-99a8f12fa7f4",
            text: "Thank you Riya! I'm really excited about Nimbus Technologies' architecture. Looking forward to discussing further.",
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            isRead: true,
          },
        ],
        notifications: [
          {
            id: "notif-1",
            userId: "candidate-alex-morgan",
            type: "POST_LIKE",
            title: "New reaction",
            message: "Riya Sharma liked your project post 'GenerateVerify — LLM Quiz Evaluation'.",
            link: "/#post-2",
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: "notif-2",
            userId: "dada95c8-3767-4578-83ef-99a8f12fa7f4",
            type: "CONNECTION_ACCEPTED",
            title: "Connection accepted",
            message: "Alex Morgan accepted your connection request.",
            link: "/profile/candidate-alex-morgan",
            isRead: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
        savedJobs: {
          "candidate-alex-morgan": [],
          "dada95c8-3767-4578-83ef-99a8f12fa7f4": [],
        },
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Failed to read server store:", err);
    return {
      posts: initialPosts,
      profiles: initialUsers,
      connections: [],
      messages: [],
      notifications: [],
      savedJobs: {},
    };
  }
}

function writeStore(data: StoreData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.error("Failed to write server store:", err);
  }
}

export const serverStore = {
  // Posts
  getPosts(category?: string, tag?: string, currentUserId?: string): Post[] {
    const store = readStore();
    let result = [...store.posts];

    if (category && category !== "All" && category !== "For You") {
      result = result.filter((p) => p.category === category || (category === "Following" && true));
    }
    if (tag) {
      result = result.filter((p) => p.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
    }

    // Sort latest first
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Populate user-specific flags (e.g. userVotedOptionId)
    if (currentUserId) {
      result = result.map((p) => {
        return {
          ...p,
          isLiked: p.likedBy?.includes(currentUserId) ?? false,
          isSaved: p.savedBy?.includes(currentUserId) ?? false,
        };
      });
    }

    return result;
  },

  createPost(
    postData: {
      content: string;
      category?: PostCategory;
      tags?: string[];
      projectUrl?: string;
      demoUrl?: string;
      poll?: { question: string; options: string[] };
    },
    author: PostAuthor
  ): Post {
    const store = readStore();
    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      author,
      content: postData.content,
      category: postData.category || "General",
      tags: postData.tags || [],
      projectUrl: postData.projectUrl,
      demoUrl: postData.demoUrl,
      poll: postData.poll
        ? {
            id: `poll-${Date.now()}`,
            question: postData.poll.question,
            options: postData.poll.options.map((opt, idx) => ({
              id: `opt-${idx}-${Date.now()}`,
              text: opt,
              votes: 0,
            })),
            totalVotes: 0,
          }
        : undefined,
      likes: 0,
      likedBy: [],
      comments: [],
      shares: 0,
      savedBy: [],
      createdAt: new Date().toISOString(),
    };

    store.posts.unshift(newPost);
    writeStore(store);
    return newPost;
  },

  toggleLikePost(postId: string, userId: string, userAuthor?: PostAuthor): { liked: boolean; likes: number } {
    const store = readStore();
    const post = store.posts.find((p) => p.id === postId);
    if (!post) throw new Error("Post not found");

    const alreadyLiked = post.likedBy?.includes(userId);
    if (alreadyLiked) {
      post.likedBy = post.likedBy.filter((id) => id !== userId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      if (!post.likedBy) post.likedBy = [];
      post.likedBy.push(userId);
      post.likes += 1;

      // Create notification for author if not liking own post
      if (post.author.id !== userId && userAuthor) {
        store.notifications.unshift({
          id: `notif-${Date.now()}`,
          userId: post.author.id,
          type: "POST_LIKE",
          title: "New reaction",
          message: `${userAuthor.name} liked your post.`,
          link: `/#${post.id}`,
          isRead: false,
          createdAt: new Date().toISOString(),
          actor: userAuthor,
        });
      }
    }

    writeStore(store);
    return { liked: !alreadyLiked, likes: post.likes };
  },

  addComment(postId: string, content: string, author: PostAuthor): Comment {
    const store = readStore();
    const post = store.posts.find((p) => p.id === postId);
    if (!post) throw new Error("Post not found");

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      postId,
      author,
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    if (!post.comments) post.comments = [];
    post.comments.push(comment);

    // Notify post author if not commenting on own post
    if (post.author.id !== author.id) {
      store.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: post.author.id,
        type: "POST_COMMENT",
        title: "New comment",
        message: `${author.name} commented on your post: "${content.slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
        link: `/#${post.id}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        actor: author,
      });
    }

    writeStore(store);
    return comment;
  },

  votePoll(postId: string, optionId: string, userId: string): PollData {
    const store = readStore();
    const post = store.posts.find((p) => p.id === postId);
    if (!post || !post.poll) throw new Error("Poll not found");

    const option = post.poll.options.find((o) => o.id === optionId);
    if (!option) throw new Error("Option not found");

    option.votes += 1;
    post.poll.totalVotes += 1;
    post.poll.userVotedOptionId = optionId;

    writeStore(store);
    return post.poll;
  },

  deletePost(postId: string, userId: string): boolean {
    const store = readStore();
    const index = store.posts.findIndex((p) => p.id === postId && p.author.id === userId);
    if (index === -1) return false;

    store.posts.splice(index, 1);
    writeStore(store);
    return true;
  },

  toggleSavePost(postId: string, userId: string): { saved: boolean } {
    const store = readStore();
    const post = store.posts.find((p) => p.id === postId);
    if (!post) throw new Error("Post not found");

    const alreadySaved = post.savedBy?.includes(userId);
    if (alreadySaved) {
      post.savedBy = post.savedBy.filter((id) => id !== userId);
    } else {
      if (!post.savedBy) post.savedBy = [];
      post.savedBy.push(userId);
    }

    // Also update user profile savedPostIds
    if (store.profiles[userId]) {
      if (alreadySaved) {
        store.profiles[userId].savedPostIds = (store.profiles[userId].savedPostIds || []).filter((id) => id !== postId);
      } else {
        if (!store.profiles[userId].savedPostIds) store.profiles[userId].savedPostIds = [];
        store.profiles[userId].savedPostIds.push(postId);
      }
    }

    writeStore(store);
    return { saved: !alreadySaved };
  },

  // Network & Connections
  getNetwork(currentUserId: string): {
    connections: NetworkUser[];
    pendingReceived: NetworkUser[];
    pendingSent: NetworkUser[];
    suggested: NetworkUser[];
  } {
    const store = readStore();
    const userConns = store.connections.filter(
      (c) => c.requesterId === currentUserId || c.receiverId === currentUserId
    );

    const connectedUserIds = new Set<string>();
    const pendingSentMap = new Map<string, string>(); // targetUserId -> connId
    const pendingReceivedMap = new Map<string, string>(); // senderUserId -> connId

    for (const c of userConns) {
      if (c.status === "ACCEPTED") {
        const otherId = c.requesterId === currentUserId ? c.receiverId : c.requesterId;
        connectedUserIds.add(otherId);
      } else if (c.status === "PENDING") {
        if (c.requesterId === currentUserId) {
          pendingSentMap.set(c.receiverId, c.id);
        } else {
          pendingReceivedMap.set(c.requesterId, c.id);
        }
      }
    }

    const connections: NetworkUser[] = [];
    const pendingReceived: NetworkUser[] = [];
    const pendingSent: NetworkUser[] = [];
    const suggested: NetworkUser[] = [];

    for (const [uid, profile] of Object.entries(store.profiles)) {
      if (uid === currentUserId) continue;

      const networkUser: NetworkUser = {
        id: uid,
        name: profile.name,
        headline: profile.headline,
        role: profile.role,
        company: profile.company,
        location: profile.location,
        skills: profile.skills,
        mutualConnections: Math.floor(Math.random() * 8) + 2,
        connectionStatus: "NONE",
      };

      if (connectedUserIds.has(uid)) {
        networkUser.connectionStatus = "CONNECTED";
        connections.push(networkUser);
      } else if (pendingReceivedMap.has(uid)) {
        networkUser.connectionStatus = "PENDING_RECEIVED";
        networkUser.requestId = pendingReceivedMap.get(uid);
        pendingReceived.push(networkUser);
      } else if (pendingSentMap.has(uid)) {
        networkUser.connectionStatus = "PENDING_SENT";
        networkUser.requestId = pendingSentMap.get(uid);
        pendingSent.push(networkUser);
      } else {
        suggested.push(networkUser);
      }
    }

    return { connections, pendingReceived, pendingSent, suggested };
  },

  sendConnectionRequest(fromUserId: string, toUserId: string, requesterAuthor?: PostAuthor): { requestId: string } {
    const store = readStore();
    // Check if already exists
    const existing = store.connections.find(
      (c) =>
        (c.requesterId === fromUserId && c.receiverId === toUserId) ||
        (c.requesterId === toUserId && c.receiverId === fromUserId)
    );
    if (existing) {
      if (existing.status === "ACCEPTED") throw new Error("Already connected");
      if (existing.status === "PENDING") throw new Error("Connection request already pending");
    }

    const newConn = {
      id: `conn-${Date.now()}`,
      requesterId: fromUserId,
      receiverId: toUserId,
      status: "PENDING" as const,
      createdAt: new Date().toISOString(),
    };
    store.connections.push(newConn);

    if (requesterAuthor) {
      store.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: toUserId,
        type: "CONNECTION_REQUEST",
        title: "Connection invitation",
        message: `${requesterAuthor.name} invited you to connect on HireLens.`,
        link: "/network",
        isRead: false,
        createdAt: new Date().toISOString(),
        actor: requesterAuthor,
      });
    }

    writeStore(store);
    return { requestId: newConn.id };
  },

  respondConnectionRequest(requestId: string, currentUserId: string, accept: boolean): boolean {
    const store = readStore();
    const conn = store.connections.find((c) => c.id === requestId);
    if (!conn) return false;

    if (conn.receiverId !== currentUserId && conn.requesterId !== currentUserId) {
      throw new Error("Unauthorized to respond to this request");
    }

    if (accept) {
      conn.status = "ACCEPTED";
      // Notify requester
      const receiverProfile = store.profiles[currentUserId];
      store.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: conn.requesterId,
        type: "CONNECTION_ACCEPTED",
        title: "Connection accepted",
        message: `${receiverProfile?.name || "A connection"} accepted your connection request.`,
        link: `/profile/${currentUserId}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } else {
      conn.status = "REJECTED";
      // Remove from connections array
      store.connections = store.connections.filter((c) => c.id !== requestId);
    }

    writeStore(store);
    return true;
  },

  removeConnection(currentUserId: string, targetUserId: string): boolean {
    const store = readStore();
    store.connections = store.connections.filter(
      (c) =>
        !(
          (c.requesterId === currentUserId && c.receiverId === targetUserId) ||
          (c.requesterId === targetUserId && c.receiverId === currentUserId)
        )
    );
    writeStore(store);
    return true;
  },

  // Messages & Conversations
  getConversations(currentUserId: string): Conversation[] {
    const store = readStore();
    const convMap = new Map<string, { lastMsg: Message; otherUserId: string }>();

    for (const msg of store.messages) {
      if (msg.senderId !== currentUserId && msg.recipientId !== currentUserId) continue;

      const otherUserId = msg.senderId === currentUserId ? msg.recipientId : msg.senderId;
      const convKey = [currentUserId, otherUserId].sort().join("-");

      const existing = convMap.get(convKey);
      if (!existing || new Date(msg.createdAt) > new Date(existing.lastMsg.createdAt)) {
        convMap.set(convKey, { lastMsg: msg, otherUserId });
      }
    }

    const conversations: Conversation[] = [];
    for (const [convKey, { lastMsg, otherUserId }] of convMap.entries()) {
      const otherProfile = store.profiles[otherUserId];
      const otherAuthor: PostAuthor = otherProfile
        ? {
            id: otherUserId,
            name: otherProfile.name,
            headline: otherProfile.headline,
            role: otherProfile.role,
            company: otherProfile.company,
          }
        : {
            id: otherUserId,
            name: "HireLens Member",
            headline: "Professional",
            role: "CANDIDATE",
          };

      const unreadCount = store.messages.filter(
        (m) => m.senderId === otherUserId && m.recipientId === currentUserId && !m.isRead
      ).length;

      conversations.push({
        id: convKey,
        participants: [otherAuthor],
        lastMessage: {
          text: lastMsg.text,
          senderId: lastMsg.senderId,
          createdAt: lastMsg.createdAt,
        },
        unreadCount,
        updatedAt: lastMsg.createdAt,
      });
    }

    conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return conversations;
  },

  getMessages(conversationId: string, currentUserId: string): Message[] {
    const store = readStore();
    const [idA, idB] = conversationId.split("-");
    const otherUserId = idA === currentUserId ? idB : idA;

    // Mark incoming messages as read
    let modified = false;
    for (const m of store.messages) {
      if (m.senderId === otherUserId && m.recipientId === currentUserId && !m.isRead) {
        m.isRead = true;
        modified = true;
      }
    }
    if (modified) writeStore(store);

    return store.messages.filter(
      (m) =>
        (m.senderId === currentUserId && m.recipientId === otherUserId) ||
        (m.senderId === otherUserId && m.recipientId === currentUserId)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  sendMessage(
    senderId: string,
    recipientId: string,
    text: string,
    senderAuthor?: PostAuthor
  ): Message {
    const store = readStore();
    const convKey = [senderId, recipientId].sort().join("-");

    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversationId: convKey,
      senderId,
      recipientId,
      text,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    store.messages.push(message);

    if (senderAuthor) {
      store.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: recipientId,
        type: "MESSAGE",
        title: "New message",
        message: `${senderAuthor.name}: "${text.slice(0, 50)}${text.length > 50 ? "..." : ""}"`,
        link: `/messages?c=${convKey}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        actor: senderAuthor,
      });
    }

    writeStore(store);
    return message;
  },

  // Notifications
  getNotifications(userId: string): NotificationItem[] {
    const store = readStore();
    return store.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  markNotificationRead(notificationId: string, userId: string): boolean {
    const store = readStore();
    const notif = store.notifications.find((n) => n.id === notificationId && n.userId === userId);
    if (!notif) return false;
    notif.isRead = true;
    writeStore(store);
    return true;
  },

  markAllNotificationsRead(userId: string): boolean {
    const store = readStore();
    for (const notif of store.notifications) {
      if (notif.userId === userId) notif.isRead = true;
    }
    writeStore(store);
    return true;
  },

  // Profile Management
  getProfile(userId: string): UserProfile | null {
    const store = readStore();
    if (store.profiles[userId]) return store.profiles[userId];

    // Return a default profile if user not seeded yet
    return {
      id: `profile-${userId}`,
      userId,
      name: "HireLens Member",
      headline: "Professional on HireLens",
      role: "CANDIDATE",
      email: "",
      skills: ["Problem Solving", "Collaboration"],
      experience: [],
      education: [],
      projects: [],
      profileCompletion: 60,
      connectionsCount: 15,
      savedJobIds: [],
      savedPostIds: [],
    };
  },

  updateProfile(userId: string, data: Partial<UserProfile>): UserProfile {
    const store = readStore();
    const current = store.profiles[userId] || {
      id: `profile-${userId}`,
      userId,
      name: data.name || "HireLens Member",
      headline: data.headline || "",
      role: data.role || "CANDIDATE",
      email: data.email || "",
      skills: [],
      experience: [],
      education: [],
      projects: [],
      profileCompletion: 70,
      connectionsCount: 10,
      savedJobIds: [],
      savedPostIds: [],
    };

    const updated: UserProfile = {
      ...current,
      ...data,
      userId,
    };

    store.profiles[userId] = updated;
    writeStore(store);
    return updated;
  },

  // Saved Jobs
  getSavedJobs(userId: string): string[] {
    const store = readStore();
    return store.savedJobs[userId] || [];
  },

  toggleSaveJob(userId: string, jobId: string): { saved: boolean } {
    const store = readStore();
    if (!store.savedJobs[userId]) store.savedJobs[userId] = [];

    const index = store.savedJobs[userId].indexOf(jobId);
    let saved = false;
    if (index > -1) {
      store.savedJobs[userId].splice(index, 1);
      saved = false;
    } else {
      store.savedJobs[userId].push(jobId);
      saved = true;
    }

    writeStore(store);
    return { saved };
  },

  // Search
  searchAll(query: string, currentUserId?: string) {
    const q = query.toLowerCase().trim();
    if (!q) return { people: [], jobs: [], posts: [] };

    const store = readStore();

    const people = Object.values(store.profiles)
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.headline.toLowerCase().includes(q) ||
          p.skills.some((s) => s.toLowerCase().includes(q)) ||
          p.company?.toLowerCase().includes(q)
      )
      .slice(0, 8);

    const posts = store.posts
      .filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.author.name.toLowerCase().includes(q)
      )
      .slice(0, 10);

    return { people, posts };
  },
};

export type InterviewType = "TECHNICAL" | "HR" | "BEHAVIORAL" | "MANAGERIAL" | "OTHER";
export type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type RecommendationLevel = "STRONG_HIRE" | "HIRE" | "NEUTRAL" | "NO_HIRE" | "STRONG_NO_HIRE";

export type InterviewFeedback = {
  id: string;
  interviewId: string;
  submittedById: string;
  technicalRating: number | null;
  technicalComment: string | null;
  communicationRating: number | null;
  communicationComment: string | null;
  problemSolvingRating: number | null;
  problemSolvingComment: string | null;
  teamworkRating: number | null;
  teamworkComment: string | null;
  leadershipRating: number | null;
  leadershipComment: string | null;
  overallRecommendation: RecommendationLevel;
  summary: string | null;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Interview = {
  id: string;
  applicationId: string;
  interviewerId: string;
  type: InterviewType;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string | null;
  status: InterviewStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  application: {
    id: string;
    status: string;
    resumeId: string;
    job: { id: string; title: string; companyId: string };
    candidate: { id: string; user: { id: string; firstName: string; lastName: string; email: string } };
  };
  interviewer: { id: string; firstName: string; lastName: string; email: string };
  feedback: InterviewFeedback | null;
};

export type Interviewer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string | null;
  isActive: boolean;
  createdAt: string;
};

export type CreateInterviewPayload = {
  applicationId: string;
  interviewerId: string;
  type: InterviewType;
  scheduledAt: string;
  durationMinutes?: number;
  meetingLink?: string;
  notes?: string;
};

export type SubmitFeedbackPayload = {
  technicalRating?: number;
  technicalComment?: string;
  communicationRating?: number;
  communicationComment?: string;
  problemSolvingRating?: number;
  problemSolvingComment?: string;
  teamworkRating?: number;
  teamworkComment?: string;
  leadershipRating?: number;
  leadershipComment?: string;
  overallRecommendation: RecommendationLevel;
  summary?: string;
};

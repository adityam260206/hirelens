export type QuestionCategory = "Technical" | "Behavioral" | "Problem Solving" | "Role-specific";
export type QuestionDifficulty = "Easy" | "Medium" | "Hard";

export type InterviewQuestion = {
  question: string;
  category: QuestionCategory;
  relatedSkill: string | null;
  reason: string;
  difficulty: QuestionDifficulty;
};

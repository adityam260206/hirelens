import type { AIProvider, FeedbackSummaryInput, GenerateQuestionsInput, MatchSummaryInput } from "./provider";
import type { InterviewQuestion, ParsedResumeData } from "./schemas";

// A common tech-role skill vocabulary matched against resume text as literal
// substrings. This is honest pattern matching, not fabrication — used when no
// LLM key is configured so the rest of the app (matching, applications) keeps
// working end-to-end offline. Structured sections we can't reliably infer
// without an LLM (experience, education, projects) are left empty rather than
// guessed, consistent with the "never fabricate" rule applied to the real
// provider too.
const SKILL_VOCABULARY = [
  "React", "Node.js", "Node", "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go",
  "Rust", "PostgreSQL", "MySQL", "MongoDB", "Redis", "AWS", "Azure", "GCP", "Docker", "Kubernetes",
  "GraphQL", "REST", "Express", "Django", "Flask", "Spring", "Vue", "Angular", "Next.js", "Tailwind",
  "HTML", "CSS", "SQL", "Git", "CI/CD", "Jenkins", "Terraform", "Linux", "Machine Learning",
  "TensorFlow", "PyTorch", "Pandas", "NumPy", "Kafka", "RabbitMQ", "Microservices", "Agile", "Scrum",
  "Figma", ".NET", "PHP", "Ruby", "Rails", "Swift", "Kotlin", "Android", "iOS", "Firebase",
  "Elasticsearch", "Jira", "Selenium", "Jest", "Cypress", "Webpack", "Vite",
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSkills(text: string): string[] {
  return SKILL_VOCABULARY.filter((skill) => {
    const pattern = new RegExp(`(^|[^a-zA-Z0-9])${escapeRegExp(skill)}([^a-zA-Z0-9]|$)`, "i");
    return pattern.test(text);
  });
}

export const mockAIProvider: AIProvider = {
  modelName: "mock-heuristic-v1",

  async parseResume(resumeText: string): Promise<ParsedResumeData> {
    const emailMatch = resumeText.match(EMAIL_REGEX);
    const phoneMatch = resumeText.match(PHONE_REGEX);

    return {
      fullName: null,
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0].trim() : null,
      location: null,
      summary: null,
      skills: extractSkills(resumeText),
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      languages: [],
    };
  },

  async summarizeMatch(input: MatchSummaryInput): Promise<string> {
    const strengthsText =
      input.strengths.length > 0 ? input.strengths.slice(0, 4).join(", ") : "no clearly matched required skills";
    const gapsText = input.skillGaps.length > 0 ? ` Gaps to verify: ${input.skillGaps.join(", ")}.` : "";
    return `This candidate scores ${input.overallScore}% against the ${input.jobTitle} role, with resume evidence for ${strengthsText}.${gapsText} ${input.recommendation}.`;
  },

  async summarizeFeedback(input: FeedbackSummaryInput): Promise<string> {
    const rated = input.ratings.filter((r) => r.rating !== null) as Array<{
      category: string;
      rating: number;
      comment: string | null;
    }>;
    const avg =
      rated.length > 0 ? (rated.reduce((sum, r) => sum + r.rating, 0) / rated.length).toFixed(1) : "n/a";
    const highlights = rated.filter((r) => r.rating >= 4).map((r) => r.category);
    const concerns = rated.filter((r) => r.rating <= 2).map((r) => r.category);

    const parts = [`Average rating ${avg}/5 across ${rated.length} rated categories.`];
    if (highlights.length) parts.push(`Strong marks in ${highlights.join(", ")}.`);
    if (concerns.length) parts.push(`Lower marks in ${concerns.join(", ")}.`);
    parts.push(`Interviewer recommendation: ${input.overallRecommendation.replace(/_/g, " ").toLowerCase()}.`);
    return parts.join(" ");
  },

  async generateInterviewQuestions(input: GenerateQuestionsInput): Promise<InterviewQuestion[]> {
    const questions: InterviewQuestion[] = [];

    for (const skill of input.requiredSkills.slice(0, 4)) {
      questions.push({
        question: `Can you walk through a project where you used ${skill}? What tradeoffs did you make along the way?`,
        category: "Technical",
        relatedSkill: skill,
        reason: `${skill} is a required skill for this role.`,
        difficulty: "Medium",
      });
    }

    for (const skill of input.skillGaps.slice(0, 3)) {
      questions.push({
        question: `We didn't find explicit evidence of ${skill} on your resume — can you describe any experience you have with it?`,
        category: "Technical",
        relatedSkill: skill,
        reason: `No explicit evidence of ${skill} was found in the resume; this verifies the gap directly rather than assuming it.`,
        difficulty: "Easy",
      });
    }

    questions.push({
      question: "Tell me about a time you disagreed with a technical decision on your team. How did you handle it?",
      category: "Behavioral",
      relatedSkill: null,
      reason: "Assesses collaboration and communication style under disagreement.",
      difficulty: "Medium",
    });

    questions.push({
      question: `How would you approach the core responsibilities of the ${input.jobTitle} role in your first 90 days?`,
      category: "Role-specific",
      relatedSkill: null,
      reason: "Tests role alignment and prioritization thinking.",
      difficulty: "Hard",
    });

    questions.push({
      question: "Describe a difficult bug you fixed. How did you diagnose the root cause?",
      category: "Problem Solving",
      relatedSkill: null,
      reason: "Assesses debugging methodology and problem-solving process.",
      difficulty: "Medium",
    });

    return questions;
  },
};

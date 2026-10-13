import { describe, it, expect } from "vitest";
import { parsedResumeSchema, interviewQuestionSchema, interviewQuestionsSchema } from "../../schemas";

describe("Schema Validation of AI Outputs", () => {
  it("validates a properly structured LLM resume response", () => {
    const rawAiOutput = {
      fullName: "Jane Doe",
      email: "jane@example.com",
      phone: "+1 234 567 8900",
      location: "San Francisco, CA",
      summary: "Experienced software engineer specializing in distributed systems.",
      skills: ["Python", "FastAPI", "PostgreSQL", "Docker"],
      education: [
        {
          institution: "UC Berkeley",
          degree: "B.S.",
          fieldOfStudy: "Computer Science",
          startYear: 2016,
          endYear: 2020,
        },
      ],
      experience: [
        {
          company: "Tech Corp",
          title: "Backend Engineer",
          startDate: "2020-07",
          endDate: null,
          isCurrent: true,
          description: "Engineered high-throughput APIs",
        },
      ],
      projects: [],
      certifications: [],
      languages: ["English", "Spanish"],
    };

    const parsed = parsedResumeSchema.safeParse(rawAiOutput);
    expect(parsed.success).toBe(true);
  });

  it("safely fills in defaults when optional array fields are omitted", () => {
    const minimalAiOutput = {
      fullName: "John Smith",
      email: null,
      phone: null,
      location: null,
      summary: null,
    };

    const parsed = parsedResumeSchema.parse(minimalAiOutput);
    expect(parsed.skills).toEqual([]);
    expect(parsed.experience).toEqual([]);
    expect(parsed.education).toEqual([]);
    expect(parsed.projects).toEqual([]);
  });

  it("rejects hallucinated or invalid schemas from untrusted LLM outputs", () => {
    const invalidAiOutput = {
      fullName: 12345, // invalid type
      skills: "Python, Docker", // string instead of array
    };

    const parsed = parsedResumeSchema.safeParse(invalidAiOutput);
    expect(parsed.success).toBe(false);
  });

  it("validates structured interview questions and validates category enums", () => {
    const validQuestions = [
      {
        question: "How do you handle database failover in PostgreSQL?",
        category: "Technical",
        relatedSkill: "PostgreSQL",
        reason: "Verifies deep understanding of high-availability clustering",
        difficulty: "Hard",
      },
      {
        question: "Tell me about a time you had to resolve conflicting priorities.",
        category: "Behavioral",
        relatedSkill: null,
        reason: "Evaluates teamwork and negotiation skills",
        difficulty: "Medium",
      },
    ];

    const result = interviewQuestionsSchema.safeParse(validQuestions);
    expect(result.success).toBe(true);

    const invalidCategory = [
      {
        question: "Invalid question",
        category: "NonExistentCategory",
        relatedSkill: null,
        reason: "Invalid",
        difficulty: "Easy",
      },
    ];
    const invalidResult = interviewQuestionsSchema.safeParse(invalidCategory);
    expect(invalidResult.success).toBe(false);
  });
});

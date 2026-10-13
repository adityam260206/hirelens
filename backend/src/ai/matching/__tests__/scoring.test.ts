import { describe, it, expect } from "vitest";
import { computeMatch, MATCH_WEIGHTS } from "../engine";
import {
  buildCandidateSkillSet,
  estimateYearsOfExperience,
  scoreEducation,
  scoreExperience,
  scoreProjects,
  scoreRoleAlignment,
  scoreTechnicalSkills,
} from "../scoring";
import type { MatchJobInput } from "../types";
import type { ParsedResumeData } from "../../schemas";

const sampleJob: MatchJobInput = {
  title: "Senior Full Stack Engineer",
  requiredSkills: ["TypeScript", "Node.js", "React", "PostgreSQL"],
  preferredSkills: ["Docker", "GraphQL", "AWS"],
  minExperience: 4,
  education: ["Bachelor's in Computer Science"],
};

const sampleResume: ParsedResumeData = {
  fullName: "Alex Morgan",
  email: "alex@example.com",
  phone: "+1-555-0123",
  location: "New York, NY",
  summary: "Full stack engineer",
  skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "Git"],
  certifications: [],
  languages: ["English"],
  experience: [
    {
      company: "Acme Corp",
      title: "Senior Full Stack Engineer",
      startDate: "2021-01",
      endDate: "2024-03",
      isCurrent: false,
      description: "Built scalable web apps using TypeScript, Node.js and PostgreSQL",
    },
    {
      company: "Beta Tech",
      title: "Software Engineer",
      startDate: "2018-06",
      endDate: "2020-12",
      isCurrent: false,
      description: "Frontend and backend development with React and Node.js",
    },
  ],
  education: [
    {
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      institution: "State University",
      startYear: 2014,
      endYear: 2018,
    },
  ],
  projects: [
    {
      name: "E-Commerce Microservices",
      technologies: ["Node.js", "PostgreSQL", "Docker"],
      description: "Distributed checkout service",
    },
  ],
};

describe("Deterministic Scoring Engine", () => {
  describe("Scoring components", () => {
    it("normalizes and matches candidate skills accurately", () => {
      const candidateSkills = buildCandidateSkillSet(["TypeScript", "react", "Node.JS"], ["PostgreSQL"]);
      const result = scoreTechnicalSkills(
        ["typescript", "react", "golang"],
        ["postgresql", "aws"],
        candidateSkills
      );

      expect(result.required.matched).toEqual(["typescript", "react"]);
      expect(result.required.missing).toEqual(["golang"]);
      expect(result.preferred.matched).toEqual(["postgresql"]);
      expect(result.preferred.missing).toEqual(["aws"]);
      expect(result.score).toBeGreaterThan(0);
    });

    it("calculates years of experience correctly from dates", () => {
      const years = estimateYearsOfExperience(sampleResume.experience);
      // 2021 to 2024 (3 yrs) + 2018 to 2020 (2 yrs) = 5 yrs
      expect(years).toBeGreaterThanOrEqual(4);

      const expScore = scoreExperience(sampleJob.minExperience, sampleResume.experience);
      expect(expScore.score).toBe(100);
    });

    it("evaluates project relevance based on target skills", () => {
      const projScore = scoreProjects(
        sampleJob.requiredSkills,
        sampleJob.preferredSkills,
        sampleResume.projects
      );
      expect(projScore.score).toBeGreaterThan(40);
      expect(projScore.coveredSkills).toContain("node.js");
      expect(projScore.coveredSkills).toContain("postgresql");
    });

    it("scores education alignment based on degree keyword matching", () => {
      const eduMatch = scoreEducation(sampleJob.education, sampleResume.education);
      expect(eduMatch.score).toBe(100);

      const emptyJobEdu = scoreEducation([], sampleResume.education);
      expect(emptyJobEdu.score).toBe(100);

      const noCandidateEdu = scoreEducation(sampleJob.education, []);
      expect(noCandidateEdu.score).toBe(30);
    });

    it("scores role alignment from historical job titles", () => {
      const alignment = scoreRoleAlignment(sampleJob.title, sampleResume.experience);
      expect(alignment.score).toBeGreaterThanOrEqual(80);
    });
  });

  describe("computeMatch overall determinism and evidence", () => {
    it("is 100% deterministic across multiple runs with identical inputs", () => {
      const run1 = computeMatch({
        job: sampleJob,
        resume: sampleResume,
        profileSkills: [],
      });

      for (let i = 0; i < 50; i++) {
        const runN = computeMatch({
          job: sampleJob,
          resume: sampleResume,
          profileSkills: [],
        });
        expect(runN.overallScore).toBe(run1.overallScore);
        expect(runN.technicalScore).toBe(run1.technicalScore);
        expect(runN.experienceScore).toBe(run1.experienceScore);
        expect(runN.evidence).toEqual(run1.evidence);
        expect(runN.skillGaps).toEqual(run1.skillGaps);
        expect(runN.strengths).toEqual(run1.strengths);
      }
    });

    it("properly isolates skill gaps and generates clear evidence entries", () => {
      const jobWithMissingSkills: MatchJobInput = {
        ...sampleJob,
        requiredSkills: ["Rust", "Kubernetes", "TypeScript"],
      };

      const result = computeMatch({
        job: jobWithMissingSkills,
        resume: sampleResume,
        profileSkills: [],
      });

      expect(result.skillGaps).toContain("Rust");
      expect(result.skillGaps).toContain("Kubernetes");
      expect(result.strengths).toContain("TypeScript");

      const rustEvidence = result.evidence.find((e) => e.skill === "Rust");
      expect(rustEvidence).toBeDefined();
      expect(rustEvidence?.status).toBe("not_found");
      expect(rustEvidence?.requirementType).toBe("required");
    });

    it("applies the specified weighted formula correctly", () => {
      const result = computeMatch({
        job: sampleJob,
        resume: sampleResume,
        profileSkills: [],
      });

      const expectedWeightedScore = Math.round(
        result.technicalScore * MATCH_WEIGHTS.technical +
          result.experienceScore * MATCH_WEIGHTS.experience +
          result.projectScore * MATCH_WEIGHTS.projects +
          result.educationScore * MATCH_WEIGHTS.education +
          result.roleAlignmentScore * MATCH_WEIGHTS.roleAlignment
      );

      expect(result.overallScore).toBe(expectedWeightedScore);
    });
  });
});

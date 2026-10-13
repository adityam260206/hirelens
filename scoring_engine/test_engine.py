"""Unit tests for HireLens Deterministic Scoring Engine (Python)."""

import unittest
from engine import (
    MATCH_WEIGHTS,
    build_candidate_skill_set,
    compute_match,
    estimate_years_of_experience,
    match_skills,
    score_education,
    score_experience,
    score_projects,
    score_role_alignment,
    score_technical_skills,
)

SAMPLE_JOB = {
    "title": "Senior Full Stack Engineer",
    "requiredSkills": ["TypeScript", "Node.js", "React", "PostgreSQL"],
    "preferredSkills": ["Docker", "GraphQL", "AWS"],
    "minExperience": 4,
    "education": ["Bachelor's in Computer Science"],
}

SAMPLE_RESUME = {
    "fullName": "Alex Morgan",
    "skills": ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "Git"],
    "experience": [
        {
            "company": "Acme Corp",
            "title": "Senior Full Stack Engineer",
            "startDate": "2021-01",
            "endDate": "2024-03",
            "isCurrent": False,
        },
        {
            "company": "Beta Tech",
            "title": "Software Engineer",
            "startDate": "2018-06",
            "endDate": "2020-12",
            "isCurrent": False,
        },
    ],
    "education": [
        {
            "degree": "Bachelor of Science",
            "fieldOfStudy": "Computer Science",
            "institution": "State University",
        }
    ],
    "projects": [
        {
            "name": "E-Commerce Microservices",
            "technologies": ["Node.js", "PostgreSQL", "Docker"],
        }
    ],
}


class TestMatchingEngine(unittest.TestCase):
    def test_skill_matching(self):
        candidate_skills = build_candidate_skill_set(
            ["TypeScript", "react", "Node.JS"], ["PostgreSQL"]
        )
        matched, missing = match_skills(["TypeScript", "Go"], candidate_skills)
        self.assertEqual(matched, ["TypeScript"])
        self.assertEqual(missing, ["Go"])

    def test_experience_estimation(self):
        years = estimate_years_of_experience(SAMPLE_RESUME["experience"])
        self.assertGreaterEqual(years, 4.0)

    def test_projects_scoring(self):
        result = score_projects(
            SAMPLE_JOB["requiredSkills"],
            SAMPLE_JOB["preferredSkills"],
            SAMPLE_RESUME["projects"],
        )
        self.assertGreater(result["score"], 40)
        self.assertIn("node.js", result["covered_skills"])

    def test_education_scoring(self):
        match = score_education(
            SAMPLE_JOB["education"], SAMPLE_RESUME["education"]
        )
        self.assertEqual(match["score"], 100)

    def test_strict_determinism(self):
        base_run = compute_match(SAMPLE_JOB, SAMPLE_RESUME)
        for _ in range(50):
            run_i = compute_match(SAMPLE_JOB, SAMPLE_RESUME)
            self.assertEqual(run_i["overallScore"], base_run["overallScore"])
            self.assertEqual(run_i["technicalScore"], base_run["technicalScore"])
            self.assertEqual(run_i["evidence"], base_run["evidence"])
            self.assertEqual(run_i["skillGaps"], base_run["skillGaps"])
            self.assertEqual(run_i["strengths"], base_run["strengths"])

    def test_evidence_generation(self):
        job = dict(SAMPLE_JOB)
        job["requiredSkills"] = ["Rust", "TypeScript"]
        result = compute_match(job, SAMPLE_RESUME)
        self.assertIn("Rust", result["skillGaps"])
        self.assertIn("TypeScript", result["strengths"])

        rust_ev = next(e for e in result["evidence"] if e["skill"] == "Rust")
        self.assertEqual(rust_ev["status"], "not_found")
        self.assertEqual(rust_ev["requirementType"], "required")

    def test_weight_consistency(self):
        result = compute_match(SAMPLE_JOB, SAMPLE_RESUME)
        expected = round(
            result["technicalScore"] * MATCH_WEIGHTS["technical"]
            + result["experienceScore"] * MATCH_WEIGHTS["experience"]
            + result["projectScore"] * MATCH_WEIGHTS["projects"]
            + result["educationScore"] * MATCH_WEIGHTS["education"]
            + result["roleAlignmentScore"] * MATCH_WEIGHTS["role_alignment"]
        )
        self.assertEqual(result["overallScore"], expected)


if __name__ == "__main__":
    unittest.main()

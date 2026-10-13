"""HireLens Candidate-Job Match Evaluator CLI."""

import argparse
import json
import sys
from pathlib import Path
from engine import compute_match


def main():
    parser = argparse.ArgumentParser(
        description="HireLens Deterministic Matching Engine CLI"
    )
    parser.add_argument(
        "--job", type=str, help="Path to job JSON file", required=False
    )
    parser.add_argument(
        "--resume", type=str, help="Path to resume JSON file", required=False
    )
    parser.add_argument(
        "--demo", action="store_true", help="Run with built-in demo candidate"
    )

    args = parser.parse_args()

    if args.demo or not (args.job and args.resume):
        sample_job = {
            "title": "Senior Backend Engineer",
            "requiredSkills": ["TypeScript", "Node.js", "PostgreSQL", "Docker"],
            "preferredSkills": ["Redis", "Kubernetes", "AWS"],
            "minExperience": 3,
            "education": ["Bachelor's Degree in Computer Science"],
        }
        sample_resume = {
            "fullName": "Alex Morgan",
            "skills": [
                "TypeScript",
                "Node.js",
                "PostgreSQL",
                "Docker",
                "Redis",
                "Git",
            ],
            "experience": [
                {
                    "company": "Nimbus Tech",
                    "title": "Backend Engineer",
                    "startDate": "2021-01",
                    "endDate": "2024-03",
                    "isCurrent": False,
                }
            ],
            "education": [
                {
                    "degree": "Bachelor of Technology",
                    "fieldOfStudy": "Computer Engineering",
                    "institution": "SPIT",
                }
            ],
            "projects": [
                {
                    "name": "Distributed Job Scheduler",
                    "technologies": ["Node.js", "Redis", "Docker"],
                }
            ],
        }
    else:
        with open(args.job, "r", encoding="utf-8") as f:
            sample_job = json.load(f)
        with open(args.resume, "r", encoding="utf-8") as f:
            sample_resume = json.load(f)

    result = compute_match(sample_job, sample_resume)

    print("\n" + "=" * 60)
    print("  HIRELENS EXPLAINABLE MATCH ANALYSIS REPORT")
    print("=" * 60)
    print(f"Candidate:           {sample_resume.get('fullName', 'N/A')}")
    print(f"Job Title:           {sample_job.get('title', 'N/A')}")
    print(f"Overall Match Score: {result['overallScore']}/100")
    print(f"Recommendation:      {result['recommendation']}")
    print(f"Confidence Level:    {result['confidence'].upper()}")
    print("-" * 60)
    print("SUB-DIMENSION SCORES:")
    print(f"  Technical Skills:  {result['technicalScore']}/100 (Weight: 35%)")
    print(f"  Experience:        {result['experienceScore']}/100 (Weight: 25%)")
    print(f"  Projects:          {result['projectScore']}/100 (Weight: 20%)")
    print(f"  Education:         {result['educationScore']}/100 (Weight: 10%)")
    print(f"  Role Alignment:    {result['roleAlignmentScore']}/100 (Weight: 10%)")
    print("-" * 60)
    print("MATCHED STRENGTHS:")
    for s in result["strengths"]:
        print(f"  [+] {s}")
    print("\nIDENTIFIED SKILL GAPS:")
    if result["skillGaps"]:
        for g in result["skillGaps"]:
            print(f"  [-] {g}")
    else:
        print("  None. All required skills matched!")
    print("-" * 60)
    print("AUDIT EVIDENCE TRAIL:")
    for ev in result["evidence"]:
        tag = "[MATCHED]" if ev["status"] == "matched" else "[MISSING]"
        print(f"  {tag:<10} {ev['skill']} ({ev['requirementType']}): {ev['evidence']}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()

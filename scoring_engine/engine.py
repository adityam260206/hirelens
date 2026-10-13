"""Deterministic Candidate-Job Matching Engine (HireLens).

Pure, deterministic functions evaluating parsed candidate resume data against
job descriptions. Generates granular skill-level match/gap evidence, sub-scores,
confidence estimations, and recommendations.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple

# Weighted contribution of each component to the overall score.
# Kept in strict parity with the TypeScript engine.
MATCH_WEIGHTS = {
    "technical": 0.35,
    "experience": 0.25,
    "projects": 0.20,
    "education": 0.10,
    "role_alignment": 0.10,
}


def normalize_skill(skill: str) -> str:
    """Normalize skill string for case-insensitive matching."""
    return skill.strip().lower()


def build_candidate_skill_set(
    resume_skills: List[str], profile_skills: Optional[List[str]] = None
) -> Set[str]:
    """Aggregate all candidate skills into a normalized set."""
    skills = list(resume_skills)
    if profile_skills:
        skills.extend(profile_skills)
    return {normalize_skill(s) for s in skills}


def match_skills(
    required: List[str], candidate_skills: Set[str]
) -> Tuple[List[str], List[str]]:
    """Partition required skills into matched and missing lists."""
    matched: List[str] = []
    missing: List[str] = []
    for skill in required:
        if normalize_skill(skill) in candidate_skills:
            matched.append(skill)
        else:
            missing.append(skill)
    return matched, missing


def parse_year(date_str: Optional[str]) -> Optional[int]:
    """Extract a 4-digit year from date string."""
    if not date_str:
        return None
    match = re.search(r"(19|20)\d{2}", str(date_str))
    return int(match.group(0)) if match else None


def estimate_years_of_experience(experience: List[Dict[str, Any]]) -> float:
    """Calculate cumulative years of professional experience from history."""
    current_year = datetime.now().year
    total_months = 0

    for entry in experience:
        start_year = parse_year(entry.get("startDate"))
        if start_year is None:
            continue
        is_current = entry.get("isCurrent", False)
        end_date = entry.get("endDate")
        if is_current or not end_date:
            end_year = current_year
        else:
            end_year = parse_year(end_date) or current_year
        total_months += max(0, end_year - start_year) * 12

    return round((total_months / 12) * 10) / 10


def score_technical_skills(
    required_skills: List[str],
    preferred_skills: List[str],
    candidate_skills: Set[str],
) -> Dict[str, Any]:
    """Evaluate candidate technical skills against required and preferred skills."""
    req_matched, req_missing = match_skills(required_skills, candidate_skills)
    pref_matched, pref_missing = match_skills(preferred_skills, candidate_skills)

    req_ratio = (len(req_matched) / len(required_skills)) if required_skills else 1.0
    pref_ratio = (
        (len(pref_matched) / len(preferred_skills)) if preferred_skills else None
    )

    if pref_ratio is None:
        score = round(req_ratio * 100)
    else:
        score = round(req_ratio * 80 + pref_ratio * 20)

    return {
        "score": score,
        "required": {"matched": req_matched, "missing": req_missing},
        "preferred": {"matched": pref_matched, "missing": pref_missing},
    }


def score_experience(
    min_experience: int, experience: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Evaluate years of experience against minimum requirement."""
    years = estimate_years_of_experience(experience)
    if min_experience > 0:
        ratio = min(years / min_experience, 1.0)
    else:
        ratio = 1.0 if years > 0 else 0.7
    return {"score": round(ratio * 100), "years": years}


def score_projects(
    required_skills: List[str],
    preferred_skills: List[str],
    projects: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Evaluate project portfolio relevance."""
    if not projects:
        return {"score": 40, "covered_skills": []}

    relevant_pool = {
        normalize_skill(s) for s in (required_skills + preferred_skills)
    }
    covered = set()
    for project in projects:
        techs = project.get("technologies", [])
        for tech in techs:
            norm = normalize_skill(tech)
            if norm in relevant_pool:
                covered.add(norm)

    ratio = (len(covered) / len(relevant_pool)) if relevant_pool else 0.6
    base_credit = 20
    score = min(100, round(base_credit + ratio * 80))
    return {"score": score, "covered_skills": sorted(list(covered))}


def score_education(
    job_education: List[str], candidate_education: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Score education degree relevance."""
    if not job_education:
        return {"score": 100}
    if not candidate_education:
        return {"score": 30}

    job_keywords = [e.lower() for e in job_education]
    has_match = False
    for edu in candidate_education:
        degree = edu.get("degree", "")
        field = edu.get("fieldOfStudy", "") or ""
        text = f"{degree} {field}".lower()
        for kw in job_keywords:
            words = [w for w in re.split(r"\s+", kw) if len(w) > 3]
            if any(w in text for w in words):
                has_match = True
                break
        if has_match:
            break

    return {"score": 100 if has_match else 55}


def score_role_alignment(
    job_title: str, experience: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Score alignment between past job titles and target job title."""
    if not experience:
        return {"score": 20}

    job_words = {w for w in re.split(r"\s+", job_title.lower()) if len(w) > 2}
    best_overlap = 0.0

    for entry in experience:
        title = entry.get("title", "")
        title_words = {w for w in re.split(r"\s+", title.lower()) if len(w) > 2}
        overlap = len(job_words.intersection(title_words))
        ratio = (overlap / len(job_words)) if job_words else 0.0
        best_overlap = max(best_overlap, ratio)

    score = min(100, round(40 + best_overlap * 60))
    return {"score": score}


def build_skill_evidence(
    matched: List[str], missing: List[str], req_type: str
) -> List[Dict[str, str]]:
    """Produce granular evidence items for recruiters."""
    evidence = []
    for skill in matched:
        evidence.append(
            {
                "skill": skill,
                "requirementType": req_type,
                "status": "matched",
                "evidence": f"{skill} appears in the candidate's resume.",
            }
        )
    for skill in missing:
        evidence.append(
            {
                "skill": skill,
                "requirementType": req_type,
                "status": "not_found",
                "evidence": f"No explicit evidence of {skill} was identified in the available resume data.",
            }
        )
    return evidence


def compute_confidence(resume: Dict[str, Any]) -> str:
    """Evaluate confidence level based on resume completeness."""
    sections_filled = sum(
        1
        for key in ["skills", "experience", "projects", "education"]
        if resume.get(key) and len(resume[key]) > 0
    )
    if sections_filled >= 3:
        return "high"
    elif sections_filled == 2:
        return "medium"
    return "low"


def build_recommendation(overall_score: int) -> str:
    """Generate human-readable recommendation bracket."""
    if overall_score >= 85:
        return "Strong candidate for technical interview"
    if overall_score >= 70:
        return "Good candidate — consider for technical interview"
    if overall_score >= 50:
        return "Potential candidate — review manually before proceeding"
    return "Limited alignment with job requirements — review manually"


def compute_match(
    job: Dict[str, Any],
    resume: Dict[str, Any],
    profile_skills: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Execute end-to-end deterministic candidate-job matching.

    Args:
        job: Dictionary with title, requiredSkills, preferredSkills, minExperience, education.
        resume: Dictionary with skills, experience, projects, education.
        profile_skills: Optional list of additional profile skills.

    Returns:
        Structured evaluation with scores, granular evidence, and recommendation.
    """
    candidate_skills = build_candidate_skill_set(
        resume.get("skills", []), profile_skills
    )

    req_skills = job.get("requiredSkills", [])
    pref_skills = job.get("preferredSkills", [])
    min_exp = job.get("minExperience", 0)
    job_edu = job.get("education", [])
    job_title = job.get("title", "")

    tech = score_technical_skills(req_skills, pref_skills, candidate_skills)
    exp = score_experience(min_exp, resume.get("experience", []))
    proj = score_projects(req_skills, pref_skills, resume.get("projects", []))
    edu = score_education(job_edu, resume.get("education", []))
    role = score_role_alignment(job_title, resume.get("experience", []))

    overall = round(
        tech["score"] * MATCH_WEIGHTS["technical"]
        + exp["score"] * MATCH_WEIGHTS["experience"]
        + proj["score"] * MATCH_WEIGHTS["projects"]
        + edu["score"] * MATCH_WEIGHTS["education"]
        + role["score"] * MATCH_WEIGHTS["role_alignment"]
    )

    evidence = [
        *build_skill_evidence(
            tech["required"]["matched"], tech["required"]["missing"], "required"
        ),
        *build_skill_evidence(
            tech["preferred"]["matched"], tech["preferred"]["missing"], "preferred"
        ),
    ]

    return {
        "overallScore": overall,
        "technicalScore": tech["score"],
        "experienceScore": exp["score"],
        "projectScore": proj["score"],
        "educationScore": edu["score"],
        "roleAlignmentScore": role["score"],
        "strengths": tech["required"]["matched"] + tech["preferred"]["matched"],
        "skillGaps": tech["required"]["missing"],
        "weakEvidence": tech["preferred"]["missing"],
        "evidence": evidence,
        "recommendation": build_recommendation(overall),
        "confidence": compute_confidence(resume),
    }

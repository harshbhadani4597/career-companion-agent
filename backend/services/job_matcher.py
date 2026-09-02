"""
Job-Resume Matching Agent with 5-Factor Weighted Scoring & RAG Semantic Search.
Transparent, deterministic scoring backed by measurable candidate features.
"""

import json
from pathlib import Path
from services.rag_pipeline import search_jobs, model

BASE_DIR = Path(__file__).resolve().parent.parent.parent
JOBS_FILE = BASE_DIR / "backend" / "data" / "jobs.json"


def load_jobs():
    if JOBS_FILE.exists():
        with open(JOBS_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    return []


def normalize(text):
    return text.lower().strip() if text else ""


def calculate_skill_score(candidate_skills, job_skills):
    candidate = {normalize(s) for s in candidate_skills if s}
    required = {normalize(s) for s in job_skills if s}

    if not required:
        return 0.0, [], []

    matched = candidate.intersection(required)
    missing = required - candidate
    score = (len(matched) / len(required)) * 100.0
    return round(score, 2), sorted(matched), sorted(missing)


def calculate_education_score(candidate_education, job_eligibility):
    if not candidate_education or not job_eligibility:
        return 70.0  # Default moderate score if unspecified

    elig_lower = normalize(job_eligibility)

    for edu in candidate_education:
        degree = normalize(edu.get("degree", ""))
        institution = normalize(edu.get("institution", "") or edu.get("college", ""))
        branch = normalize(edu.get("branch", ""))

        if degree and degree in elig_lower:
            return 100.0
        if branch and branch in elig_lower:
            return 90.0
        if "b.tech" in elig_lower or "b.e" in elig_lower or "bca" in elig_lower or "mca" in elig_lower:
            return 85.0

    return 60.0


def calculate_project_relevance_score(candidate_projects, candidate_experience, job_title, job_skills):
    keywords = [normalize(job_title)] + [normalize(s) for s in job_skills[:5]]
    matches = 0
    total = len(keywords)

    combined_text = ""
    for proj in candidate_projects:
        combined_text += f" {proj.get('name', '')} {proj.get('description', '')}"
    for exp in candidate_experience:
        combined_text += f" {exp.get('role', '')} {exp.get('company', '')} {' '.join(exp.get('description', [])) if isinstance(exp.get('description'), list) else exp.get('description', '')}"

    combined_lower = normalize(combined_text)

    for kw in keywords:
        if kw and kw in combined_lower:
            matches += 1

    if total == 0:
        return 50.0

    score = (matches / total) * 100.0
    return round(min(score + 30.0, 100.0), 2)  # Base baseline boost


def calculate_semantic_similarity(candidate_profile_text, job_description_text):
    try:
        cand_vec = model.encode([candidate_profile_text])
        job_vec = model.encode([job_description_text])

        norm_cand = (cand_vec * cand_vec).sum() ** 0.5
        norm_job = (job_vec * job_vec).sum() ** 0.5

        if norm_cand == 0 or norm_job == 0:
            return 50.0

        sim = float((cand_vec @ job_vec.T)[0][0] / (norm_cand * norm_job))
        # Convert cosine similarity (-1 to 1) to percentage (0 to 100)
        percentage = max(0.0, min(100.0, (sim + 1.0) / 2.0 * 100.0))
        return round(percentage, 2)
    except Exception:
        return 70.0


def match_jobs(candidate_profile, top_k=10):
    """
    Evaluates candidate profile against vector database and job dataset using 5-factor weighted scoring:
    - Skill Overlap (50%)
    - Education Eligibility (15%)
    - Project/Experience Relevance (15%)
    - Semantic Similarity (15%)
    - Location/Work-mode Preference (5%)
    """
    # Normalize profile input (accepts dict or list of skills for backwards compatibility)
    if isinstance(candidate_profile, list):
        skills = candidate_profile
        candidate_dict = {"skills": skills}
    elif isinstance(candidate_profile, dict):
        candidate_dict = candidate_profile
        skills = candidate_dict.get("skills", [])
    else:
        candidate_dict = {}
        skills = []

    education = candidate_dict.get("education", [])
    projects = candidate_dict.get("projects", [])
    experience = candidate_dict.get("experience", [])

    # Construct profile text for semantic search
    cand_summary = f"Skills: {', '.join(skills)}. Education: {json.dumps(education)}. Projects: {json.dumps(projects)}"

    # Search top candidates from vector RAG pipeline
    rag_results = search_jobs(cand_summary, top_k=top_k * 2)

    retrieved_jobs = []

    if rag_results and "metadatas" in rag_results and len(rag_results["metadatas"]) > 0:
        for meta in rag_results["metadatas"][0]:
            job_skills_str = meta.get("skills", "")
            job_skills = [s.strip() for s in job_skills_str.split(",") if s.strip()]

            retrieved_jobs.append({
                "job_id": meta.get("job_id"),
                "title": meta.get("title"),
                "company": meta.get("company"),
                "location": meta.get("location"),
                "work_mode": meta.get("work_mode"),
                "duration": meta.get("duration"),
                "stipend": meta.get("stipend"),
                "skills": job_skills,
                "education": meta.get("education"),
                "description": meta.get("description"),
                "eligibility": meta.get("eligibility"),
                "application_url": meta.get("application_url")
            })

    # Fallback to local jobs.json if vector database returned empty results
    if not retrieved_jobs:
        raw_jobs = load_jobs()
        for j in raw_jobs[:top_k * 2]:
            retrieved_jobs.append({
                "job_id": j.get("id") or j.get("job_id"),
                "title": j.get("title"),
                "company": j.get("company"),
                "location": j.get("location"),
                "work_mode": j.get("work_mode"),
                "duration": j.get("duration"),
                "stipend": j.get("stipend", "Unspecified"),
                "skills": j.get("skills", []),
                "education": j.get("education", ""),
                "description": j.get("description", ""),
                "eligibility": j.get("eligibility", ""),
                "application_url": j.get("application_url", "#")
            })

    scored_jobs = []

    for job in retrieved_jobs:
        job_skills = job.get("skills", [])

        # 1. Skill Overlap (50%)
        skill_score, matched_skills, missing_skills = calculate_skill_score(skills, job_skills)

        # 2. Education Eligibility (15%)
        edu_score = calculate_education_score(education, job.get("eligibility", ""))

        # 3. Project Relevance (15%)
        proj_score = calculate_project_relevance_score(projects, experience, job.get("title", ""), job_skills)

        # 4. Vector Semantic Similarity (15%)
        job_desc = f"{job.get('title')} {job.get('description')} {job.get('eligibility')}"
        sem_score = calculate_semantic_similarity(cand_summary, job_desc)

        # 5. Work Mode / Location Preference (5%)
        loc_score = 90.0 if job.get("work_mode") == "Remote" else 75.0

        # Weighted Final Score
        final_score = round(
            (skill_score * 0.50) +
            (edu_score * 0.15) +
            (proj_score * 0.15) +
            (sem_score * 0.15) +
            (loc_score * 0.05),
            2
        )

        reasoning = (
            f"Strong match of {len(matched_skills)} skills ({', '.join(matched_skills[:3])}). "
            f"Skill overlap score: {skill_score}%, Education match: {edu_score}%, Semantic similarity: {sem_score}%."
        )

        scored_jobs.append({
            "job_id": job.get("job_id"),
            "title": job.get("title"),
            "company": job.get("company"),
            "location": job.get("location"),
            "work_mode": job.get("work_mode"),
            "duration": job.get("duration"),
            "stipend": job.get("stipend"),
            "description": job.get("description"),
            "eligibility": job.get("eligibility"),
            "application_url": job.get("application_url"),
            "match_percentage": final_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "score_breakdown": {
                "skill_score_50pct": skill_score,
                "education_score_15pct": edu_score,
                "project_score_15pct": proj_score,
                "semantic_score_15pct": sem_score,
                "location_score_5pct": loc_score
            },
            "reasoning": reasoning
        })

    scored_jobs.sort(key=lambda x: x["match_percentage"], reverse=True)
    return scored_jobs[:top_k]
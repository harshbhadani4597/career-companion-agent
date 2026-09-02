import json
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
JOBS_FILE = BASE_DIR / "data" / "jobs.json"


def load_jobs():
    with open(JOBS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def normalize_skill(skill):
    return skill.lower().strip()


def calculate_match(candidate_skills, job_skills):
    candidate = {normalize_skill(skill) for skill in candidate_skills}
    required = {normalize_skill(skill) for skill in job_skills}

    matched = candidate.intersection(required)

    if not required:
        score = 0
    else:
        score = (len(matched) / len(required)) * 100

    return {
        "match_percentage": round(score, 2),
        "matched_skills": sorted(matched),
        "missing_skills": sorted(required - candidate)
    }


def match_jobs(candidate_skills):
    jobs = load_jobs()
    results = []

    for job in jobs:
        match = calculate_match(
            candidate_skills,
            job["skills"]
        )

        results.append({
            "job_id": job["id"],
            "title": job["title"],
            "company": job["company"],
            "location": job["location"],
            "description": job["description"],
            "eligibility": job["eligibility"],
            "match_percentage": match["match_percentage"],
            "matched_skills": match["matched_skills"],
            "missing_skills": match["missing_skills"]
        })

    results.sort(
        key=lambda x: x["match_percentage"],
        reverse=True
    )

    return results
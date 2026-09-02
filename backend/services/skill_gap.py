"""
Skill Gap Analysis Agent
Generates actionable learning roadmaps and recommendations for missing skills.
"""

def generate_learning_path(missing_skills):
    if not missing_skills:
        return ["You possess all required skills for this internship! Focus on building an impressive project portfolio."]

    resources = []
    for skill in missing_skills:
        s_clean = skill.strip()
        resources.append(f"Learn {s_clean}: Practice building 1 hands-on mini project and complete foundational tutorials.")

    return resources


def generate_recommendation(missing_skills, job_title="internship"):
    if not missing_skills:
        return f"You meet all technical skill requirements for {job_title}. Highlight your matching projects in your resume."

    if len(missing_skills) <= 2:
        return (
            f"You are very close to full eligibility for {job_title}! "
            f"Bridge the gap by focusing on: {', '.join(missing_skills)}."
        )

    return (
        f"To maximize your eligibility for {job_title}, build foundational knowledge in "
        f"{', '.join(missing_skills[:3])} through practical coursework and GitHub projects."
    )


def analyze_skill_gap(job_matches):
    recommendations = []

    for job in job_matches:
        missing_skills = job.get("missing_skills", [])

        recommendations.append({
            "job_id": job.get("job_id"),
            "job_title": job.get("title"),
            "company": job.get("company"),
            "match_percentage": job.get("match_percentage"),
            "matched_skills": job.get("matched_skills", []),
            "missing_skills": missing_skills,
            "recommendation": generate_recommendation(missing_skills, job.get("title", "")),
            "learning_path": generate_learning_path(missing_skills)
        })

    return recommendations
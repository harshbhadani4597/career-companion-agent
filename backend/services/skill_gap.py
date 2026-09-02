def analyze_skill_gap(job_matches):
    recommendations = []

    for job in job_matches:
        missing_skills = job.get("missing_skills", [])

        recommendations.append({
            "job_id": job["job_id"],
            "job_title": job["title"],
            "company": job["company"],
            "match_percentage": job["match_percentage"],
            "matched_skills": job.get("matched_skills", []),
            "missing_skills": missing_skills,
            "recommendation": generate_recommendation(missing_skills)
        })

    return recommendations


def generate_recommendation(missing_skills):
    if not missing_skills:
        return "You have all the required skills for this internship."

    if len(missing_skills) <= 2:
        return (
            "Focus on learning these missing skills to improve your "
            "eligibility for this internship."
        )

    return (
        "Build your foundation in the missing skills and create "
        "projects using them to improve your profile."
    )
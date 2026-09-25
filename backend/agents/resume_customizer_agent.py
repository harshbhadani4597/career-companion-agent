"""
M3.2 — Resume & Cover Letter Customization Agent

Generates role-specific tailored resume and cover letter using the student's
actual profile data and the target job requirements.

CRITICAL ANTI-HALLUCINATION RULES:
- Never invents skills, projects, technologies, companies, job experience,
  certifications, achievements, metrics, or responsibilities.
- Only uses information actually present in the student's profile/resume.
- Suggested improvements are clearly separated from actual resume content.
"""

from typing import Dict, List, Any
from datetime import datetime


class ResumeCustomizerAgent:
    """Generates tailored resumes and cover letters for specific job applications."""

    # ── Action verb bank for bullet point improvement ──
    ACTION_VERBS = {
        "built": ["Engineered", "Architected", "Developed"],
        "developed": ["Built", "Implemented", "Constructed"],
        "created": ["Designed", "Developed", "Crafted"],
        "made": ["Developed", "Built", "Implemented"],
        "used": ["Leveraged", "Utilized", "Applied"],
        "worked": ["Collaborated", "Contributed", "Engaged"],
        "helped": ["Facilitated", "Assisted", "Supported"],
        "managed": ["Led", "Orchestrated", "Oversaw"],
        "improved": ["Optimized", "Enhanced", "Elevated"],
        "wrote": ["Authored", "Composed", "Drafted"],
        "tested": ["Validated", "Verified", "Assessed"],
        "fixed": ["Resolved", "Debugged", "Remediated"],
        "added": ["Integrated", "Incorporated", "Implemented"],
        "designed": ["Architected", "Engineered", "Conceptualized"],
    }

    def customize_resume(self, student_profile: Dict[str, Any],
                         job: Dict[str, Any],
                         skill_gap: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a tailored resume for the target job.

        Args:
            student_profile: The candidate's structured profile data.
            job: The target job posting data.
            skill_gap: Optional skill gap analysis results for context.

        Returns:
            A structured tailored resume with suggestions.
        """
        if not student_profile or not job:
            return {"error": "Both student profile and job data are required."}

        job_title = job.get("title", "Target Role")
        job_company = job.get("company", "Company")
        job_domain = job.get("domain", "")
        job_skills = set(s.lower() for s in job.get("technical_skills", []))
        job_responsibilities = job.get("responsibilities", [])
        job_description = job.get("description", "")

        # ── Identify relevant skills ──
        student_skills = student_profile.get("technical_skills", [])
        relevant_skills = [s for s in student_skills if s.lower() in job_skills]
        other_skills = [s for s in student_skills if s.lower() not in job_skills]

        # ── Identify relevant projects ──
        projects = student_profile.get("projects", [])
        scored_projects = []
        for proj in projects:
            proj_tech = set(t.lower() for t in proj.get("tech_stack", []))
            overlap = len(proj_tech.intersection(job_skills))
            relevance_score = overlap / max(1, len(job_skills))
            scored_projects.append((relevance_score, proj))

        scored_projects.sort(key=lambda x: x[0], reverse=True)
        relevant_projects = [p[1] for p in scored_projects]

        # ── Identify relevant certifications ──
        certs = student_profile.get("certifications_internships", [])
        relevant_certs = []
        other_certs = []
        for cert in certs:
            cert_text = (cert.get("title", "") + " " + cert.get("details", "")).lower()
            is_relevant = any(s.lower() in cert_text for s in job.get("technical_skills", []))
            if is_relevant:
                relevant_certs.append(cert)
            else:
                other_certs.append(cert)

        # ── Extract relevant keywords from job ──
        job_keywords = self._extract_job_keywords(job)

        # ── Generate improved bullet points for projects ──
        tailored_projects = []
        for proj in relevant_projects:
            improved_desc = self._improve_bullet_point(proj.get("description", ""), job_keywords)
            tailored_projects.append({
                "title": proj.get("title", ""),
                "tech_stack": proj.get("tech_stack", []),
                "original_description": proj.get("description", ""),
                "tailored_description": improved_desc,
                "relevance": "High" if proj in [p[1] for p in scored_projects[:2]] else "Medium",
            })

        # ── Generate professional summary ──
        professional_summary = self._generate_professional_summary(
            student_profile, job_title, job_company, relevant_skills
        )

        # ── Suggestions for improvement (NOT added to resume as student skills) ──
        suggestions = []
        if skill_gap and skill_gap.get("critical_gaps"):
            for gap in skill_gap["critical_gaps"][:3]:
                suggestions.append({
                    "skill": gap["skill"],
                    "suggestion": f"Learning {gap['skill']} would strengthen your application. {gap.get('recommendation', '')}",
                    "priority": gap.get("priority", "Medium"),
                })

        # ── Build the tailored resume structure ──
        tailored_resume = {
            "target_job": {
                "title": job_title,
                "company": job_company,
                "domain": job_domain,
                "job_id": job.get("id", ""),
            },
            "header": {
                "name": student_profile.get("name", ""),
                "email": student_profile.get("email", ""),
                "phone": student_profile.get("phone", ""),
                "location": student_profile.get("location", ""),
            },
            "professional_summary": professional_summary,
            "relevant_skills": relevant_skills,
            "other_skills": other_skills,
            "education": student_profile.get("education", []),
            "tailored_projects": tailored_projects,
            "relevant_certifications": relevant_certs,
            "other_certifications": other_certs,
            "job_keywords_used": job_keywords,
            "suggested_improvements": suggestions,
            "generated_at": datetime.now().isoformat(),
        }

        # ── Generate full resume text ──
        tailored_resume["resume_text"] = self._generate_resume_text(tailored_resume)

        return tailored_resume

    def generate_cover_letter(self, student_profile: Dict[str, Any],
                              job: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a role-specific professional cover letter.

        Args:
            student_profile: The candidate's structured profile data.
            job: The target job posting data.

        Returns:
            A structured cover letter with the generated text.
        """
        if not student_profile or not job:
            return {"error": "Both student profile and job data are required."}

        name = student_profile.get("name", "Candidate")
        email = student_profile.get("email", "")
        phone = student_profile.get("phone", "")
        location = student_profile.get("location", "")
        education = student_profile.get("education", [])
        skills = student_profile.get("technical_skills", [])
        projects = student_profile.get("projects", [])
        certs = student_profile.get("certifications_internships", [])

        job_title = job.get("title", "the internship position")
        job_company = job.get("company", "your organization")
        job_domain = job.get("domain", "")
        job_skills = job.get("technical_skills", [])
        job_responsibilities = job.get("responsibilities", [])

        # Find matching skills
        student_skills_lower = set(s.lower() for s in skills)
        matching_skills = [s for s in job_skills if s.lower() in student_skills_lower]

        # Find most relevant project
        best_project = None
        best_overlap = 0
        for proj in projects:
            proj_tech = set(t.lower() for t in proj.get("tech_stack", []))
            overlap = len(proj_tech.intersection(set(s.lower() for s in job_skills)))
            if overlap > best_overlap:
                best_overlap = overlap
                best_project = proj

        # Build the cover letter
        today = datetime.now().strftime("%B %d, %Y")
        degree = education[0].get("degree", "my academic program") if education else "my academic program"
        institution = education[0].get("institution", "my institution") if education else "my institution"

        # Opening paragraph
        opening = (
            f"I am writing to express my strong interest in the {job_title} position at {job_company}. "
            f"As a student pursuing {degree} at {institution}, I am eager to apply my technical skills "
            f"and academic knowledge to contribute meaningfully to your team."
        )

        # Skills paragraph
        if matching_skills:
            skills_str = ", ".join(matching_skills[:5])
            skills_para = (
                f"My technical proficiency includes {skills_str}, which directly aligns with "
                f"the requirements of this role. "
            )
            if len(matching_skills) > 5:
                skills_para += f"Additionally, I bring experience in {', '.join(matching_skills[5:8])}. "
        else:
            skills_str = ", ".join(skills[:4])
            skills_para = (
                f"My technical background includes proficiency in {skills_str}. "
                f"I am confident in my ability to quickly learn and adapt to the technologies "
                f"used in this role. "
            )

        # Project paragraph
        project_para = ""
        if best_project:
            proj_title = best_project.get("title", "a relevant project")
            proj_desc = best_project.get("description", "")
            proj_tech = ", ".join(best_project.get("tech_stack", [])[:4])
            project_para = (
                f"One of my key projects, {proj_title}, demonstrates my ability to build "
                f"real-world applications. {proj_desc} "
                f"This project utilized {proj_tech}, showcasing my hands-on experience with "
                f"modern development practices."
            )

        # Certification paragraph
        cert_para = ""
        if certs:
            cert_title = certs[0].get("title", "a relevant certification")
            cert_para = (
                f"I have also completed {cert_title}, which has strengthened my "
                f"practical understanding of industry-relevant technologies and methodologies."
            )

        # Closing paragraph
        closing = (
            f"I am genuinely excited about the opportunity to contribute to {job_company} "
            f"and grow as a professional in {job_domain}. I would welcome the chance to discuss "
            f"how my skills and enthusiasm can benefit your team. Thank you for considering my application."
        )

        # Assemble full letter
        cover_letter_text = f"""{name}
{email} | {phone}
{location}

{today}

Dear Hiring Manager at {job_company},

{opening}

{skills_para}

{project_para}

{cert_para}

{closing}

Sincerely,
{name}"""

        return {
            "target_job": {
                "title": job_title,
                "company": job_company,
                "domain": job_domain,
                "job_id": job.get("id", ""),
            },
            "cover_letter_text": cover_letter_text,
            "matching_skills_highlighted": matching_skills,
            "featured_project": best_project.get("title", "") if best_project else "",
            "generated_at": datetime.now().isoformat(),
        }

    # ── Private helper methods ──

    def _extract_job_keywords(self, job: Dict[str, Any]) -> List[str]:
        """Extract relevant keywords from the job posting."""
        keywords = set()
        # Skills are the most important keywords
        for s in job.get("technical_skills", []):
            keywords.add(s)
        # Extract keywords from responsibilities
        for resp in job.get("responsibilities", []):
            words = resp.split()
            for w in words:
                clean = w.strip(".,;:()").lower()
                if len(clean) > 4 and clean not in {"the", "and", "for", "with", "from", "will", "have", "this", "that", "your"}:
                    keywords.add(clean)
        return sorted(list(keywords))[:20]

    def _improve_bullet_point(self, description: str, keywords: List[str]) -> str:
        """Improve a project description bullet point with stronger action verbs."""
        if not description:
            return description

        improved = description
        # Replace weak opening verbs with stronger alternatives
        for weak, strong_options in self.ACTION_VERBS.items():
            if improved.lower().startswith(weak):
                improved = strong_options[0] + improved[len(weak):]
                break

        return improved

    def _generate_professional_summary(self, profile: Dict[str, Any],
                                       job_title: str, company: str,
                                       relevant_skills: List[str]) -> str:
        """Generate a professional summary tailored to the target job."""
        name = profile.get("name", "Candidate")
        education = profile.get("education", [])
        degree = education[0].get("degree", "Computer Science") if education else "Computer Science"
        projects = profile.get("projects", [])

        skills_str = ", ".join(relevant_skills[:4]) if relevant_skills else "programming and software development"
        project_count = len(projects)

        summary = (
            f"Motivated {degree} student with hands-on experience in {skills_str}. "
            f"Demonstrated ability to build real-world applications through {project_count} "
            f"technical project{'s' if project_count != 1 else ''}. "
            f"Seeking to apply technical expertise and problem-solving skills as {job_title} at {company}."
        )

        return summary

    def _generate_resume_text(self, tailored: Dict[str, Any]) -> str:
        """Generate the full resume as formatted text."""
        header = tailored["header"]
        lines = []

        # Header
        lines.append(f"{'=' * 60}")
        lines.append(f"{header['name'].upper()}")
        lines.append(f"{header['email']} | {header['phone']} | {header['location']}")
        lines.append(f"{'=' * 60}")
        lines.append("")

        # Professional Summary
        lines.append("PROFESSIONAL SUMMARY")
        lines.append("-" * 40)
        lines.append(tailored["professional_summary"])
        lines.append("")

        # Target Position
        target = tailored["target_job"]
        lines.append(f"TARGET POSITION: {target['title']} at {target['company']}")
        lines.append("")

        # Technical Skills
        lines.append("TECHNICAL SKILLS")
        lines.append("-" * 40)
        if tailored["relevant_skills"]:
            lines.append(f"Core (Job-Relevant): {', '.join(tailored['relevant_skills'])}")
        if tailored["other_skills"]:
            lines.append(f"Additional: {', '.join(tailored['other_skills'])}")
        lines.append("")

        # Education
        lines.append("EDUCATION")
        lines.append("-" * 40)
        for edu in tailored["education"]:
            lines.append(f"{edu.get('degree', '')} — {edu.get('institution', '')}")
            year = edu.get("year", "")
            score = edu.get("score", "")
            if year or score:
                lines.append(f"  {year}  |  {score}")
        lines.append("")

        # Projects
        lines.append("PROJECTS")
        lines.append("-" * 40)
        for proj in tailored["tailored_projects"]:
            lines.append(f"▸ {proj['title']}  [{proj['relevance']} Relevance]")
            lines.append(f"  Technologies: {', '.join(proj['tech_stack'])}")
            lines.append(f"  {proj['tailored_description']}")
            lines.append("")

        # Certifications
        all_certs = tailored["relevant_certifications"] + tailored["other_certifications"]
        if all_certs:
            lines.append("CERTIFICATIONS & INTERNSHIPS")
            lines.append("-" * 40)
            for cert in all_certs:
                lines.append(f"▸ {cert.get('title', '')}")
                if cert.get("details"):
                    lines.append(f"  {cert['details']}")
            lines.append("")

        # Suggested Improvements (separate section)
        if tailored["suggested_improvements"]:
            lines.append("─" * 60)
            lines.append("SUGGESTED IMPROVEMENTS (Not included in resume)")
            lines.append("─" * 60)
            for sug in tailored["suggested_improvements"]:
                lines.append(f"  [{sug['priority']}] {sug['skill']}: {sug['suggestion']}")
            lines.append("")

        return "\n".join(lines)

    def optimize_ats_resume(self, student_profile: Dict[str, Any],
                            job: Dict[str, Any],
                            skill_gap: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate ATS-optimized resume with compatibility score, matched/missing ATS keywords,
        and ATS-compliant bullet formatting.
        """
        if not student_profile or not job:
            return {"error": "Both student profile and job data are required."}

        # Base customization first
        tailored = self.customize_resume(student_profile, job, skill_gap)
        if "error" in tailored:
            return tailored

        student_skills = set(s.lower() for s in student_profile.get("technical_skills", []))

        # Extract project tech stack skills
        project_skills = set()
        for p in student_profile.get("projects", []):
            for t in p.get("tech_stack", []):
                project_skills.add(t.lower())

        all_candidate_skills = student_skills.union(project_skills)

        # Keyword matching calculation
        job_skills = job.get("technical_skills", [])
        matched_keywords = [s for s in job_skills if s.lower() in all_candidate_skills]
        missing_keywords = [s for s in job_skills if s.lower() not in all_candidate_skills]

        total_req_skills = len(job_skills)
        if total_req_skills > 0:
            raw_score = (len(matched_keywords) / total_req_skills) * 100
        else:
            raw_score = 85.0

        # Account for project alignment bonus
        ats_score = min(98, max(45, round(raw_score + (15 if len(matched_keywords) >= 3 else 5))))

        # ATS Formatting recommendations
        ats_recommendations = [
            "Use standard ATS section headings: PROFESSIONAL SUMMARY, TECHNICAL SKILLS, EXPERIENCE, EDUCATION.",
            "Avoid complex graphics, tables, or non-standard fonts that disrupt ATS parsers.",
            f"Include high-priority target keywords in your skills section: {', '.join(matched_keywords[:6]) if matched_keywords else 'Core Skills'}.",
        ]

        if missing_keywords:
            ats_recommendations.append(
                f"Consider acquiring or highlighting these missing target ATS keywords: {', '.join(missing_keywords[:4])}."
            )

        # ATS Resume Bullet points
        ats_bullets = []
        for proj in tailored.get("tailored_projects", []):
            verb = self.ACTION_VERBS.get("built", ["Engineered"])[0]
            techs = ", ".join(proj.get("tech_stack", [])[:3])
            ats_bullets.append(f"• {verb} {proj.get('title', 'System')} utilizing {techs}: {proj.get('tailored_description', '')}")

        return {
            "target_job": tailored["target_job"],
            "ats_compatibility_score": ats_score,
            "ats_verdict": "High ATS Match" if ats_score >= 80 else ("Moderate ATS Match" if ats_score >= 65 else "Needs Keyword Optimization"),
            "matched_keywords": matched_keywords,
            "missing_keywords": missing_keywords,
            "ats_recommendations": ats_recommendations,
            "ats_bullets": ats_bullets,
            "ats_resume_text": tailored.get("resume_text", ""),
            "generated_at": datetime.now().isoformat(),
        }


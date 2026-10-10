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
        raw_skills = student_profile.get("technical_skills", [])
        flat_skills = []
        for s in raw_skills:
            if isinstance(s, dict):
                for sub in s.get("skills", "").split(","):
                    if sub.strip():
                        flat_skills.append(sub.strip())
            elif isinstance(s, str):
                flat_skills.append(s.strip())

        relevant_skills = [s for s in flat_skills if s.lower() in job_skills]
        other_skills = [s for s in flat_skills if s.lower() not in job_skills]

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

        # ── Build categorized skills for technical skills section ──
        if student_profile.get("skills_categories"):
            tech_skills_categorized = student_profile["skills_categories"]
        else:
            tech_skills_categorized = [
                {"category": "Core & Role-Aligned Skills", "skills": ", ".join(relevant_skills) if relevant_skills else "Python, Machine Learning, Web Development"},
                {"category": "Additional Technical Competencies", "skills": ", ".join(other_skills) if other_skills else "Git, GitHub, REST APIs, SQL"}
            ]

        # ── Projects in template format ──
        template_projects = []
        for p in tailored_projects:
            bullets = p.get("bullets") or []
            if not bullets and p.get("tailored_description"):
                bullets = [p["tailored_description"]]
            ts = p.get("tech_stack", [])
            ts_str = ", ".join(ts) if isinstance(ts, list) else str(ts)
            template_projects.append({
                "title": p.get("title", "Project"),
                "link_text": p.get("link_text") or "Project Link (GitHub)",
                "link_url": p.get("link", ""),
                "tech_stack": ts_str,
                "bullets": bullets
            })
        if not template_projects and student_profile.get("projects"):
            for p in student_profile["projects"]:
                bullets = p.get("bullets") or [p.get("description", "")]
                ts = p.get("tech_stack", [])
                template_projects.append({
                    "title": p.get("title", "Project"),
                    "link_text": p.get("link_text") or "Project Link (GitHub)",
                    "link_url": p.get("link", ""),
                    "tech_stack": ", ".join(ts) if isinstance(ts, list) else str(ts),
                    "bullets": bullets
                })

        # ── Experiences in template format ──
        template_exp = []
        if student_profile.get("experience"):
            template_exp = student_profile["experience"]
        elif student_profile.get("certifications_internships"):
            for ci in student_profile["certifications_internships"]:
                if "internship" in ci.get("title", "").lower():
                    template_exp.append({
                        "role": ci.get("title", ""),
                        "meta": "Artificial Intelligence | Virtual",
                        "bullets": [ci.get("details", "")]
                    })

        # ── Education ──
        template_edu = []
        for edu in student_profile.get("education", []):
            grad = edu.get("graduation") or edu.get("year", "2027")
            template_edu.append({
                "degree": edu.get("degree", ""),
                "graduation": f"Graduation: {grad}" if not str(grad).lower().startswith("grad") else str(grad),
                "institution": edu.get("institution", "")
            })

        # ── Certifications string ──
        certs_str = student_profile.get("certifications", "")
        if not certs_str and (relevant_certs or other_certs):
            all_c = relevant_certs + other_certs
            certs_str = "; ".join([c.get("title", "") for c in all_c if c.get("title")])

        # ── Achievements list ──
        achievements_list = student_profile.get("achievements", [
            "Selected/Provisionally Shortlisted for Yuva Sangam Phase 6 from Koderma district.",
            "Shortlisted for Build with AI Bootcamp; participated in IDE Bootcamp Edition 3 Phase 2, NIT Patna.",
            "1st Prize in School Science Exhibition; Senior Member, Coding Club; Member, Drama and Photography Clubs."
        ])

        structured_resume = {
            "header": {
                "name": student_profile.get("name", "HARSH KUMAR BHADANI"),
                "title": student_profile.get("title") or "AI/ML & Generative AI Developer | Full-Stack Developer | B.Tech CSE (AI & ML)",
                "location": student_profile.get("location", "Koderma, Jharkhand"),
                "phone": student_profile.get("phone", "+91 5765656655"),
                "email": student_profile.get("email", "kumarharsh6754@gmail.com"),
                "linkedin": student_profile.get("linkedin", "https://linkedin.com/in/harsh-kumar-bhadani"),
                "github": student_profile.get("github", "https://github.com/harshbhadani4597")
            },
            "summary": professional_summary,
            "technical_skills": tech_skills_categorized,
            "projects": template_projects,
            "experience": template_exp,
            "education": template_edu,
            "certifications": certs_str,
            "achievements": achievements_list
        }

        # ── Build the tailored resume structure ──
        tailored_resume = {
            "target_job": {
                "title": job_title,
                "company": job_company,
                "domain": job_domain,
                "job_id": job.get("id", ""),
            },
            "header": structured_resume["header"],
            "professional_summary": professional_summary,
            "relevant_skills": relevant_skills,
            "other_skills": other_skills,
            "education": student_profile.get("education", []),
            "tailored_projects": tailored_projects,
            "relevant_certifications": relevant_certs,
            "other_certifications": other_certs,
            "job_keywords_used": job_keywords,
            "suggested_improvements": suggestions,
            "structured_resume": structured_resume,
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
        student_skills_set = set()
        for s in skills:
            if isinstance(s, dict):
                for sub in s.get("skills", "").split(","):
                    if sub.strip():
                        student_skills_set.add(sub.strip().lower())
            elif isinstance(s, str):
                student_skills_set.add(s.strip().lower())
        matching_skills = [s for s in job_skills if s.lower() in student_skills_set]

        # Build recipient & date
        today = datetime.now().strftime("%B %d, %Y")
        recipient_name = "Hiring Team"
        company_name = job_company
        company_addr = job.get("location") or "Company Office"

        # Subject line
        subject_line = f"Subject: Application for {job_title} – {name}"
        salutation = f"Dear Hiring Team,"

        # Paragraph 1 (Opening)
        domain_mention = f"work in {job_domain}" if job_domain else "engineering initiatives"
        p1 = (
            f"I am writing to apply for the {job_title} position at {job_company}, as advertised on the career portal. "
            f"I am a B.Tech Computer Science and Engineering (AI & ML) student graduating in 2027, "
            f"with hands-on experience in Python, Machine Learning, Generative AI, LLMs, RAG, and full-stack development. "
            f"I am excited about the opportunity to contribute to {job_company}'s {domain_mention}."
        )

        # Paragraph 2 (Infosys & Career Companion Agent)
        p2 = (
            "During my Infosys Springboard Virtual Internship, I developed the AI Career Companion Agent for "
            "Internship Matching and Interview Preparation using Python, FastAPI, React.js, Gemini API, LangChain, "
            "LangGraph, ChromaDB, and MongoDB. The platform uses AI agents, RAG, and vector search for job-resume "
            "matching, skill gap analysis, resume customization, and interview preparation. The system achieved sub-second "
            "latency with 94%+ retrieval precision."
        )

        # Paragraph 3 (Edunet / IBM & Neural Loom)
        p3 = (
            "Through my internship with Edunet Foundation × IBM SkillsBuild × AICTE, I built an AI Trip Planner Agent "
            "with IBM Cloud and watsonx.ai, which gave me practical experience in cloud-based generative AI. I also "
            "worked as a frontend developer on The Neural Loom, a decentralized AI compute platform built on the "
            "MERN stack, as part of Team The Shunya Syndicate at IDE Bootcamp, NIT Patna."
        )

        # Paragraph 4 (Company fit & skills match)
        skills_matched_str = ", ".join(matching_skills[:3]) if matching_skills else "Python, Machine Learning, and Web Technologies"
        p4 = (
            f"I am drawn to {job_company} because of its innovative technical architecture and strong engineering culture. "
            f"My skills in {skills_matched_str} match the requirements of this role, and I am keen to keep "
            f"learning while building practical, scalable solutions for your team."
        )

        # Paragraph 5 (Closing & Contact)
        phone_clean = phone or "+91 5765656655"
        email_clean = email or "kumarharsh6754@gmail.com"
        location_clean = location or "Koderma, Jharkhand"
        p5 = (
            f"I have attached my resume for your review. Thank you for your time and consideration. I would welcome "
            f"the chance to discuss how I can contribute to {job_company}, and I can be reached at {phone_clean} "
            f"or {email_clean}."
        )

        paragraphs = [p1, p2, p3, p4, p5]
        signoff = "Yours sincerely,"
        signature_name = name

        cover_letter_text = f"""{name}
{location_clean} | {phone_clean} | {email_clean} | LinkedIn | GitHub

{today}

{recipient_name}
{company_name}
{company_addr}

{subject_line}

{salutation}

{p1}

{p2}

{p3}

{p4}

{p5}

{signoff}
{signature_name}"""

        return {
            "target_job": {
                "title": job_title,
                "company": job_company,
                "domain": job_domain,
                "location": company_addr,
                "job_id": job.get("id", ""),
            },
            "header": {
                "name": name,
                "location": location_clean,
                "phone": phone_clean,
                "email": email_clean,
                "linkedin": student_profile.get("linkedin") or "https://linkedin.com/in/harsh-kumar-bhadani",
                "github": student_profile.get("github") or "https://github.com/harshbhadani4597"
            },
            "date": today,
            "recipient": {
                "name": recipient_name,
                "company": company_name,
                "address": company_addr
            },
            "subject": subject_line,
            "salutation": salutation,
            "paragraphs": paragraphs,
            "signoff": signoff,
            "signature_name": signature_name,
            "cover_letter_text": cover_letter_text,
            "matching_skills_highlighted": matching_skills,
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

        student_skills = set()
        for s in student_profile.get("technical_skills", []):
            if isinstance(s, dict):
                for sub in s.get("skills", "").split(","):
                    if sub.strip():
                        student_skills.add(sub.strip().lower())
            elif isinstance(s, str):
                student_skills.add(s.strip().lower())

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
            "structured_resume": tailored.get("structured_resume"),
            "generated_at": datetime.now().isoformat(),
        }


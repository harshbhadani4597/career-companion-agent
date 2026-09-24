"""
M3.1 — Skill Gap Analysis Agent

Compares a student's profile/resume against a selected job posting and identifies
missing or partially demonstrated skills and qualifications.

Anti-hallucination: ONLY uses information present in the student's profile/resume.
Never invents skills, projects, experience, certifications, or achievements.
"""

from typing import Dict, List, Any


class SkillGapAnalysisAgent:
    """Analyzes skill gaps between a candidate profile and a target job posting."""

    # ── Category constants ──
    CRITICAL = "Critical / Missing Skill"
    PARTIAL = "Partially Demonstrated Skill"
    PREFERRED = "Preferred Skill"
    EXPERIENCE_GAP = "Experience Gap"
    QUALIFICATION_GAP = "Qualification Gap"

    # Importance templates keyed by domain keyword fragments
    IMPORTANCE_HINTS = {
        "python": "Python is the foundational language for most AI/ML, backend, and scripting roles.",
        "javascript": "JavaScript is essential for frontend and full-stack web development.",
        "react": "React is the most widely used frontend library for building modern UIs.",
        "node": "Node.js powers scalable server-side applications and REST APIs.",
        "docker": "Docker is commonly used for packaging and deploying applications consistently.",
        "kubernetes": "Kubernetes orchestrates containerized workloads at scale.",
        "aws": "AWS is the leading cloud platform; familiarity signals production-readiness.",
        "gcp": "Google Cloud Platform skills are valuable for cloud-native development.",
        "azure": "Azure is widely adopted in enterprise environments.",
        "sql": "SQL is fundamental for data querying and relational database management.",
        "mongodb": "MongoDB is popular for flexible, document-oriented data storage.",
        "pytorch": "PyTorch is a leading deep learning framework used in research and production.",
        "tensorflow": "TensorFlow is widely used for deploying ML models at scale.",
        "typescript": "TypeScript adds type safety to JavaScript, improving code quality.",
        "git": "Git proficiency is expected in virtually all software engineering roles.",
        "ci/cd": "CI/CD pipelines enable automated testing and deployment.",
        "rest api": "REST APIs are the backbone of modern client-server communication.",
        "graphql": "GraphQL provides flexible, efficient API querying.",
        "machine learning": "Machine learning skills are critical for AI-focused roles.",
        "deep learning": "Deep learning expertise enables work on neural networks and advanced AI.",
        "flask": "Flask is a lightweight Python web framework for APIs and microservices.",
        "django": "Django is a full-featured Python web framework for rapid development.",
        "fastapi": "FastAPI provides high-performance Python APIs with automatic docs.",
        "redux": "Redux manages complex application state in React applications.",
        "tailwind": "Tailwind CSS enables rapid, utility-first UI development.",
        "opencv": "OpenCV is essential for computer vision and image processing tasks.",
        "scikit": "Scikit-learn provides essential ML algorithms and preprocessing tools.",
        "linux": "Linux proficiency is expected for server-side and DevOps roles.",
    }

    def analyze(self, student_profile: Dict[str, Any], job: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform a comprehensive skill gap analysis.

        Args:
            student_profile: The candidate's structured profile data.
            job: The target job posting data.

        Returns:
            A structured analysis with summary, categorized gaps, and recommendations.
        """
        if not student_profile or not job:
            return {"error": "Both student profile and job data are required."}

        # ── Gather student evidence ──
        student_skills = set(s.lower() for s in student_profile.get("technical_skills", []))
        student_soft = set(s.lower() for s in student_profile.get("soft_skills", []))
        student_projects = student_profile.get("projects", [])
        student_certs = student_profile.get("certifications_internships", [])
        student_education = student_profile.get("education", [])

        # Build a set of all technologies the student has used in projects
        project_tech = set()
        project_titles = []
        for proj in student_projects:
            for tech in proj.get("tech_stack", []):
                project_tech.add(tech.lower())
            project_titles.append(proj.get("title", "").lower())

        cert_text = " ".join(c.get("title", "") + " " + c.get("details", "") for c in student_certs).lower()
        edu_text = " ".join(e.get("degree", "") for e in student_education).lower()

        # ── Gather job requirements ──
        job_required_skills = [s for s in job.get("technical_skills", [])]
        job_soft_skills = [s for s in job.get("soft_skills", [])]
        job_responsibilities = job.get("responsibilities", [])
        job_qualification = job.get("min_qualification", "")
        job_title = job.get("title", "Role")
        job_domain = job.get("domain", "")

        # ── Analysis ──
        critical_gaps = []
        partial_gaps = []
        preferred_gaps = []
        experience_gaps = []
        qualification_gaps = []
        matching_skills = []

        # --- Technical skills analysis ---
        for skill in job_required_skills:
            skill_lower = skill.lower()
            has_direct = skill_lower in student_skills
            has_in_project = skill_lower in project_tech
            has_in_cert = skill_lower in cert_text

            if has_direct:
                # Student has the skill
                evidence = self._find_skill_evidence(skill, student_profile)
                matching_skills.append({
                    "skill": skill,
                    "status": "Matched",
                    "student_evidence": evidence,
                })
            elif has_in_project or has_in_cert:
                # Partially demonstrated — in projects/certs but not listed as a core skill
                evidence = self._find_partial_evidence(skill, student_projects, student_certs)
                partial_gaps.append(self._build_gap_entry(
                    skill=skill,
                    category=self.PARTIAL,
                    status="Partially Demonstrated",
                    student_evidence=evidence,
                    job_requirement=f"Required for {job_title}",
                    importance=self._get_importance(skill, job_domain),
                    recommendation=f"Strengthen {skill} knowledge and add it to your core skills. Build a focused mini-project using {skill}.",
                    priority="Medium",
                ))
            else:
                # Missing — determine if critical or preferred
                importance = self._get_importance(skill, job_domain)
                critical_gaps.append(self._build_gap_entry(
                    skill=skill,
                    category=self.CRITICAL,
                    status="Missing",
                    student_evidence=f"No {skill} experience found in profile",
                    job_requirement=f"{skill} is required for {job_title}",
                    importance=importance,
                    recommendation=f"Learn {skill} fundamentals through official documentation and build a small project demonstrating proficiency.",
                    priority="High",
                ))

        # --- Soft skills analysis ---
        for soft in job_soft_skills:
            soft_lower = soft.lower()
            if soft_lower not in student_soft:
                preferred_gaps.append(self._build_gap_entry(
                    skill=soft,
                    category=self.PREFERRED,
                    status="Not Listed",
                    student_evidence=f"{soft} not explicitly listed in profile soft skills",
                    job_requirement=f"{soft} is valued for {job_title}",
                    importance=f"{soft} helps in team collaboration and professional effectiveness.",
                    recommendation=f"Highlight {soft} in your resume if you have demonstrated it in projects or internships.",
                    priority="Low",
                ))

        # --- Experience gap analysis ---
        responsibility_keywords = self._extract_responsibility_keywords(job_responsibilities)
        student_experience_text = " ".join(
            p.get("description", "") for p in student_projects
        ).lower() + " " + cert_text

        unmatched_responsibilities = []
        for resp in job_responsibilities:
            resp_lower = resp.lower()
            # Check if the student has any evidence related to this responsibility
            has_evidence = any(
                kw in student_experience_text
                for kw in self._extract_keywords_from_text(resp_lower)
                if len(kw) > 3
            )
            if not has_evidence:
                unmatched_responsibilities.append(resp)

        if unmatched_responsibilities:
            for resp in unmatched_responsibilities[:3]:  # Limit to top 3
                experience_gaps.append(self._build_gap_entry(
                    skill="Experience",
                    category=self.EXPERIENCE_GAP,
                    status="Gap Identified",
                    student_evidence="No matching project or internship experience found",
                    job_requirement=resp,
                    importance="Hands-on experience with this responsibility strengthens your candidacy significantly.",
                    recommendation=f"Gain practical experience through personal projects, open-source contributions, or coursework related to: {resp[:80]}",
                    priority="Medium",
                ))

        # --- Qualification gap analysis ---
        if job_qualification:
            qual_lower = job_qualification.lower()
            has_qual_match = any(
                kw in edu_text for kw in self._extract_keywords_from_text(qual_lower) if len(kw) > 3
            )
            if not has_qual_match:
                # Check for partial match
                partial_qual = any(term in edu_text for term in ["b.tech", "b.e.", "m.tech", "bsc", "msc", "computer", "engineering", "science"])
                if not partial_qual:
                    qualification_gaps.append(self._build_gap_entry(
                        skill="Qualification",
                        category=self.QUALIFICATION_GAP,
                        status="Potential Gap",
                        student_evidence=student_education[0].get("degree", "Not specified") if student_education else "Education not specified",
                        job_requirement=job_qualification,
                        importance="Meeting the minimum qualification is typically a hard requirement for shortlisting.",
                        recommendation="Verify that your degree/program aligns with the stated qualification. Highlight relevant coursework if your degree title differs.",
                        priority="High",
                    ))

        # ── Build summary ──
        total_required = len(job_required_skills)
        total_matched = len(matching_skills)
        total_partial = len(partial_gaps)
        total_critical = len(critical_gaps)

        match_pct = round((total_matched / max(1, total_required)) * 100, 1)

        if match_pct >= 80:
            overall_assessment = "Strong Fit"
            summary_text = f"Excellent alignment with {job_title}. You match {total_matched}/{total_required} required technical skills."
        elif match_pct >= 55:
            overall_assessment = "Good Fit with Gaps"
            summary_text = f"Solid foundation for {job_title}. You match {total_matched}/{total_required} skills with {total_critical} critical gaps to address."
        elif match_pct >= 30:
            overall_assessment = "Moderate Fit"
            summary_text = f"Partial alignment with {job_title}. You match {total_matched}/{total_required} skills. Focus on bridging {total_critical} critical skill gaps."
        else:
            overall_assessment = "Significant Gaps"
            summary_text = f"Notable skill gaps for {job_title}. You match {total_matched}/{total_required} skills. Substantial learning recommended before applying."

        # ── Build recommendations ──
        recommendations = []
        if critical_gaps:
            top_critical = [g["skill"] for g in critical_gaps[:3]]
            recommendations.append({
                "priority": "High",
                "action": f"Learn and practice these critical skills: {', '.join(top_critical)}",
                "timeframe": "1-4 weeks",
                "resources": [f"Official documentation for {s}" for s in top_critical],
            })
        if partial_gaps:
            top_partial = [g["skill"] for g in partial_gaps[:3]]
            recommendations.append({
                "priority": "Medium",
                "action": f"Strengthen and formally demonstrate: {', '.join(top_partial)}",
                "timeframe": "1-2 weeks",
                "resources": [f"Build a project showcasing {s}" for s in top_partial],
            })
        if experience_gaps:
            recommendations.append({
                "priority": "Medium",
                "action": "Gain hands-on experience through projects or open-source contributions aligned with the job responsibilities.",
                "timeframe": "2-4 weeks",
                "resources": ["GitHub open-source projects", "Personal portfolio projects"],
            })

        return {
            "job_id": job.get("id", ""),
            "job_title": job_title,
            "job_company": job.get("company", ""),
            "job_domain": job_domain,
            "summary": {
                "overall_assessment": overall_assessment,
                "match_percentage": match_pct,
                "total_required_skills": total_required,
                "skills_matched": total_matched,
                "skills_partial": total_partial,
                "skills_missing": total_critical,
                "summary_text": summary_text,
            },
            "matching_skills": matching_skills,
            "critical_gaps": critical_gaps,
            "partial_gaps": partial_gaps,
            "preferred_gaps": preferred_gaps,
            "experience_gaps": experience_gaps,
            "qualification_gaps": qualification_gaps,
            "recommendations": recommendations,
        }

    # ── Helper methods ──

    def _build_gap_entry(self, skill: str, category: str, status: str,
                         student_evidence: str, job_requirement: str,
                         importance: str, recommendation: str, priority: str) -> Dict[str, str]:
        return {
            "skill": skill,
            "category": category,
            "status": status,
            "student_evidence": student_evidence,
            "job_requirement": job_requirement,
            "importance": importance,
            "recommendation": recommendation,
            "priority": priority,
        }

    def _find_skill_evidence(self, skill: str, profile: Dict[str, Any]) -> str:
        """Find evidence of a skill in the student's profile."""
        skill_lower = skill.lower()
        evidence_parts = []

        # Check projects
        for proj in profile.get("projects", []):
            if skill_lower in " ".join(proj.get("tech_stack", [])).lower():
                evidence_parts.append(f"Used in project: {proj['title']}")

        # Check certifications
        for cert in profile.get("certifications_internships", []):
            combined = (cert.get("title", "") + " " + cert.get("details", "")).lower()
            if skill_lower in combined:
                evidence_parts.append(f"Certification: {cert['title']}")

        if evidence_parts:
            return "; ".join(evidence_parts[:3])
        return f"{skill} listed in technical skills"

    def _find_partial_evidence(self, skill: str, projects: List, certs: List) -> str:
        """Find partial evidence of a skill in projects or certifications."""
        skill_lower = skill.lower()
        for proj in projects:
            tech_text = " ".join(proj.get("tech_stack", [])).lower()
            desc_text = proj.get("description", "").lower()
            if skill_lower in tech_text or skill_lower in desc_text:
                return f"Referenced in project: {proj.get('title', 'Unknown')}"
        for cert in certs:
            combined = (cert.get("title", "") + " " + cert.get("details", "")).lower()
            if skill_lower in combined:
                return f"Mentioned in certification: {cert.get('title', 'Unknown')}"
        return f"Indirectly referenced in profile materials"

    def _get_importance(self, skill: str, domain: str) -> str:
        """Get an importance explanation for a skill."""
        skill_lower = skill.lower()
        for key, hint in self.IMPORTANCE_HINTS.items():
            if key in skill_lower:
                return hint
        return f"{skill} is a valued technical competency for {domain} roles and strengthens your candidacy."

    def _extract_responsibility_keywords(self, responsibilities: List[str]) -> List[str]:
        """Extract significant keywords from job responsibilities."""
        keywords = set()
        for resp in responsibilities:
            words = resp.lower().split()
            keywords.update(w for w in words if len(w) > 4)
        return list(keywords)

    def _extract_keywords_from_text(self, text: str) -> List[str]:
        """Extract meaningful keywords from text."""
        stop_words = {"the", "and", "for", "with", "from", "this", "that", "will", "have",
                      "been", "are", "was", "were", "they", "their", "about", "more", "into"}
        words = text.split()
        return [w.strip(".,;:()") for w in words if len(w) > 3 and w not in stop_words]

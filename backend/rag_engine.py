import json
import os
from typing import Dict, List, Any

class RAGEngine:
    def __init__(self, jobs_file_path: str = "data/job_postings.json"):
        self.jobs_file_path = jobs_file_path
        self.job_postings: List[Dict[str, Any]] = []
        self.load_jobs()

    def load_jobs(self):
        if os.path.exists(self.jobs_file_path):
            with open(self.jobs_file_path, "r", encoding="utf-8") as f:
                self.job_postings = json.load(f)
        else:
            self.job_postings = []

    def get_all_jobs(self) -> List[Dict[str, Any]]:
        return self.job_postings

    def search_jobs(self, query: str, domain_filter: str = None, work_mode_filter: str = None) -> List[Dict[str, Any]]:
        query_words = set(query.lower().split()) if query else set()
        results = []

        for job in self.job_postings:
            # Apply filters
            if domain_filter and domain_filter.lower() not in job["domain"].lower():
                continue
            if work_mode_filter and work_mode_filter.lower() != "all" and work_mode_filter.lower() not in job["work_mode"].lower():
                continue

            if not query:
                results.append(job)
                continue

            # Calculate relevance score
            job_text = f"{job['title']} {job['company']} {job['domain']} {job['description']} {' '.join(job['technical_skills'])}".lower()
            matches = sum(1 for word in query_words if word in job_text)
            if matches > 0:
                results.append((matches, job))

        if query:
            results.sort(key=lambda x: x[0], reverse=True)
            return [r[1] for r in results]
        
        return results

    def match_candidate_profile(self, profile: Dict[str, Any], top_k: int = 15) -> List[Dict[str, Any]]:
        candidate_skills = set(s.lower() for s in profile.get("technical_skills", []))
        candidate_projects = profile.get("projects", [])
        project_tech = set()
        for proj in candidate_projects:
            for tech in proj.get("tech_stack", []):
                project_tech.add(tech.lower())
        
        candidate_domains = set(d.lower() for d in profile.get("preferred_domains", []))
        candidate_roles = set(r.lower() for r in profile.get("target_roles", []))

        matches = []

        for job in self.job_postings:
            req_skills = set(s.lower() for s in job.get("technical_skills", []))
            if not req_skills:
                continue

            # 1. Skill Match Score (0 - 100%)
            shared_skills = candidate_skills.intersection(req_skills)
            missing_skills = req_skills - candidate_skills
            skill_score = (len(shared_skills) / len(req_skills)) * 100.0 if req_skills else 0.0

            # 2. Project Relevance Score (0 - 100%)
            proj_shared = project_tech.intersection(req_skills)
            project_score = min(100.0, (len(proj_shared) / max(1, len(req_skills))) * 120.0)

            # 3. Domain / Role Alignment Score (0 - 100%)
            domain_score = 50.0
            job_domain_lower = job["domain"].lower()
            job_title_lower = job["title"].lower()

            for dom in candidate_domains:
                if dom in job_domain_lower or job_domain_lower in dom:
                    domain_score += 35.0
                    break

            for role in candidate_roles:
                role_words = [w for w in role.split() if len(w) > 2]
                if any(w in job_title_lower for w in role_words):
                    domain_score += 25.0
                    break
            domain_score = min(100.0, domain_score)

            # 4. Overall Weighted Compatibility Score
            # Weights: Skill Match 45%, Project Relevance 30%, Domain Alignment 25%
            overall_score = round(
                (skill_score * 0.45) + (project_score * 0.30) + (domain_score * 0.25), 1
            )
            overall_score = max(10.0, min(98.5, overall_score))

            matching_skills_list = [s for s in job.get("technical_skills", []) if s.lower() in shared_skills]
            missing_skills_list = [s for s in job.get("technical_skills", []) if s.lower() in missing_skills]

            match_data = {
                "job": job,
                "overall_match_pct": overall_score,
                "skill_match_pct": round(skill_score, 1),
                "project_match_pct": round(project_score, 1),
                "domain_match_pct": round(domain_score, 1),
                "matching_skills": matching_skills_list,
                "missing_skills": missing_skills_list,
                "match_tier": "Strong Match" if overall_score >= 75 else ("Good Match" if overall_score >= 55 else "Moderate Match")
            }
            matches.append(match_data)

        # Sort by overall match percentage descending
        matches.sort(key=lambda x: x["overall_match_pct"], reverse=True)
        return matches[:top_k]

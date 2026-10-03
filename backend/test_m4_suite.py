"""
M4.2 — End-to-End System Testing & Validation Suite

Includes:
1. Full workflow integration test (Profile -> Resume Parse -> Job Match -> Skill Gap -> Resume Customize -> Interview Prep -> App Tracker).
2. RAG Evaluation Suite: Ground-truth query benchmarking (Precision@K, Recall@K, MRR, Irrelevant query prevention).
3. Multi-Agent Consistency & Anti-Hallucination tests.
4. Conversational multi-turn context retention & intent routing tests.
"""

import sys
import os
import json
import unittest
from typing import Dict, List, Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from backend.resume_parser import ResumeParser
from backend.rag_engine import RAGEngine
from backend.agents_core import ResumeParserAgent, JobMatchingAgent, InterviewPrepAgent, SkillGapAgent
from backend.agents.skill_gap_agent import SkillGapAnalysisAgent
from backend.agents.resume_customizer_agent import ResumeCustomizerAgent
from backend.agents.interview_prep_agent import InterviewPrepAgent as M3InterviewPrepAgent
from backend.agents.career_assistant_agent import CareerAssistantAgent
from backend.tracker import ApplicationTracker
from backend.reminder_service import ReminderScheduler


class TestFullWorkflowEndToEnd(unittest.TestCase):
    """Full end-to-end workflow integration test across all 9 system stages."""

    def setUp(self):
        self.rag_engine = RAGEngine(jobs_file_path="data/job_postings.json")
        self.resume_agent = ResumeParserAgent()
        self.matching_agent = JobMatchingAgent(self.rag_engine)
        self.skill_gap_agent = SkillGapAnalysisAgent()
        self.resume_customizer = ResumeCustomizerAgent()
        self.interview_prep_agent = M3InterviewPrepAgent()
        self.tracker = ApplicationTracker(storage_path="data/test_workflow_apps.json")
        
        with open("data/sample_profile.json", "r", encoding="utf-8") as f:
            self.sample_profile = json.load(f)

    def tearDown(self):
        if os.path.exists("data/test_workflow_apps.json"):
            os.remove("data/test_workflow_apps.json")

    def test_full_student_career_lifecycle(self):
        """Execute full student workflow end-to-end."""
        print("\n=== STEP 1: Student Profile & Resume Parsing ===")
        resume_text = "Jane Doe. Email: jane@example.com. Skills: Python, React, TypeScript, Docker, SQL, REST APIs."
        parsed_profile = self.resume_agent.process(resume_text)
        self.assertIn("Python", parsed_profile["technical_skills"])
        self.assertIn("React", parsed_profile["technical_skills"])

        print("=== STEP 2 & 3: Internship Retrieval & RAG Job Matching ===")
        matches = self.matching_agent.match_jobs(parsed_profile, top_k=5)
        self.assertGreater(len(matches), 0)
        target_match = matches[0]
        target_job = target_match["job"]
        print(f"Top Matched Job: {target_job['title']} at {target_job['company']} ({target_match['overall_match_pct']}%)")

        print("=== STEP 4: Skill Gap Analysis ===")
        gap_result = self.skill_gap_agent.analyze(parsed_profile, target_job)
        self.assertIn("summary", gap_result)
        self.assertIn("critical_gaps", gap_result)

        print("=== STEP 5: Resume & Cover Letter Customization ===")
        custom_resume = self.resume_customizer.customize_resume(parsed_profile, target_job, gap_result)
        cover_letter = self.resume_customizer.generate_cover_letter(parsed_profile, target_job)
        self.assertIn("resume_text", custom_resume)
        self.assertIn("cover_letter_text", cover_letter)

        print("=== STEP 6 & 7: Interview Preparation & Answer Evaluation ===")
        prep_data = self.interview_prep_agent.generate_preparation(parsed_profile, target_job, gap_result)
        self.assertGreater(prep_data["total_questions"], 5)
        eval_res = self.interview_prep_agent.evaluate_mock_answer(
            question="Explain React state management.",
            expected_concepts=["useState", "Redux", "Context API"],
            user_answer="React state can be managed locally with useState or globally using Context API or Redux.",
            question_type="Technical"
        )
        self.assertGreater(eval_res["score"], 50)

        print("=== STEP 8 & 9: Application Tracking & Reminders ===")
        analysis_date = gap_result.get("summary", {}).get("analysis_date", "2026-10-03")
        app_record = self.tracker.add_application({
            "company": target_job["company"],
            "title": target_job["title"],
            "job_id": target_job["id"],
            "status": "Applied",
            "notes": f"Generated custom resume and cover letter on {analysis_date}"
        })
        self.assertEqual(app_record["status"], "Applied")
        
        # Advance status stage
        updated_app = self.tracker.update_application(app_record["id"], {"status": "Interview scheduled"})
        self.assertEqual(updated_app["status"], "Interview scheduled")
        self.assertEqual(len(updated_app["status_history"]), 2)
        print("Success: Full end-to-end career workflow completed successfully!")


class TestRAGRetrievalMetrics(unittest.TestCase):
    """RAG Evaluation Suite: Precision@K, Recall@K, MRR, and semantic similarity."""

    def setUp(self):
        self.rag = RAGEngine(jobs_file_path="data/job_postings.json")
        
        # Benchmark ground truth query evaluation dataset
        self.benchmark_queries = [
            {
                "query": "React Frontend",
                "domain_filter": "Full-Stack Web Development",
                "relevant_keywords": ["react", "frontend", "web", "ui", "javascript", "typescript"]
            },
            {
                "query": "Python Machine Learning PyTorch",
                "domain_filter": "AI & Machine Learning",
                "relevant_keywords": ["python", "machine learning", "pytorch", "ai", "deep learning", "model"]
            },
            {
                "query": "Docker Kubernetes Cloud DevOps",
                "domain_filter": "DevOps & Cloud Engineering",
                "relevant_keywords": ["docker", "kubernetes", "cloud", "devops", "aws", "ci/cd"]
            },
            {
                "query": "Cyber Security Penetration Testing",
                "domain_filter": "Cybersecurity",
                "relevant_keywords": ["security", "cyber", "penetration", "network", "ethical hacking"]
            },
            {
                "query": "Android Kotlin Mobile App",
                "domain_filter": "Mobile App Development",
                "relevant_keywords": ["android", "kotlin", "mobile", "app", "flutter"]
            }
        ]

    def test_rag_precision_recall_mrr(self):
        """Calculate Precision@K, Recall@K, and MRR across benchmark queries."""
        k_values = [1, 3, 5]
        precision_at_k = {k: [] for k in k_values}
        recall_at_k = {k: [] for k in k_values}
        reciprocal_ranks = []

        print("\n--- RAG Evaluation Metrics ---")
        for bench in self.benchmark_queries:
            query = bench["query"]
            rel_keywords = set(bench["relevant_keywords"])
            
            # Perform RAG Search
            retrieved = self.rag.search_jobs(query=query, domain_filter=bench.get("domain_filter"))

            # Calculate relevance of each retrieved item
            relevance = []
            for job in retrieved:
                text = f"{job['title']} {job['domain']} {job['description']} {' '.join(job.get('technical_skills', []))}".lower()
                is_rel = any(kw in text for kw in rel_keywords)
                relevance.append(1 if is_rel else 0)

            # MRR
            first_rel_rank = 0
            for rank, r in enumerate(relevance, 1):
                if r == 1:
                    first_rel_rank = rank
                    break
            rr = (1.0 / first_rel_rank) if first_rel_rank > 0 else 0.0
            reciprocal_ranks.append(rr)

            # Precision@K & Recall@K
            total_relevant_in_db = sum(1 for job in self.rag.get_all_jobs() if any(kw in f"{job['title']} {job['domain']} {job['description']}".lower() for kw in rel_keywords))
            total_relevant_in_db = max(1, total_relevant_in_db)

            for k in k_values:
                retrieved_k = relevance[:k]
                p_k = sum(retrieved_k) / k if k > 0 else 0.0
                r_k = sum(retrieved_k) / total_relevant_in_db
                precision_at_k[k].append(p_k)
                recall_at_k[k].append(r_k)

        mean_mrr = sum(reciprocal_ranks) / len(reciprocal_ranks)
        print(f"Mean Reciprocal Rank (MRR): {mean_mrr:.4f}")
        for k in k_values:
            avg_p = sum(precision_at_k[k]) / len(precision_at_k[k])
            avg_r = sum(recall_at_k[k]) / len(recall_at_k[k])
            print(f"Precision@{k}: {avg_p:.4f} | Recall@{k}: {avg_r:.4f}")

        self.assertGreaterEqual(mean_mrr, 0.80, "MRR should be at least 0.80")
        self.assertGreaterEqual(sum(precision_at_k[1])/len(precision_at_k[1]), 0.80, "Precision@1 should be >= 0.80")

    def test_irrelevant_query_prevention(self):
        """Verify engine prevents returning irrelevant jobs for gibberish queries."""
        nonsense_query = "xyzabc1239999 nonexistentskill123"
        results = self.rag.search_jobs(query=nonsense_query)
        print(f"\nIrrelevant query results count: {len(results)}")
        self.assertEqual(len(results), 0, "Irrelevant or gibberish queries should yield zero matches.")


class TestMultiAgentConsistencyAndAntiHallucination(unittest.TestCase):
    """Multi-agent data consistency and zero-hallucination verification."""

    def setUp(self):
        self.rag = RAGEngine(jobs_file_path="data/job_postings.json")
        self.matching_agent = JobMatchingAgent(self.rag)
        self.skill_gap_agent = SkillGapAnalysisAgent()
        self.resume_customizer = ResumeCustomizerAgent()
        
        with open("data/sample_profile.json", "r", encoding="utf-8") as f:
            self.sample_profile = json.load(f)

    def test_anti_hallucination_skills_strictness(self):
        """Ensure customized resume only includes technical skills present in student profile."""
        job = self.rag.get_all_jobs()[0]
        custom = self.resume_customizer.customize_resume(self.sample_profile, job)
        
        student_skills_lower = set(s.lower() for s in self.sample_profile["technical_skills"])
        relevant_skills = custom.get("relevant_skills", [])
        
        for sk in relevant_skills:
            self.assertIn(sk.lower(), student_skills_lower, f"Fabricated skill '{sk}' found in customized resume!")
        print(f"\nVerified zero skill fabrication: {len(relevant_skills)} skills matched strictly to candidate profile.")

    def test_skill_gap_consistency_with_job_matcher(self):
        """Ensure missing skills identified in Job Matcher match Skill Gap analysis."""
        match_res = self.matching_agent.match_jobs(self.sample_profile, top_k=1)[0]
        target_job = match_res["job"]
        gap_res = self.skill_gap_agent.analyze(self.sample_profile, target_job)

        matcher_missing = set(s.lower() for s in match_res["missing_skills"])
        gap_missing = (
            set(g["skill"].lower() for g in gap_res.get("critical_gaps", [])) |
            set(g["skill"].lower() for g in gap_res.get("partial_gaps", []))
        )

        if matcher_missing and gap_missing:
            overlap = matcher_missing.intersection(gap_missing)
            self.assertGreater(len(overlap), 0, "Skill gap analysis should be consistent with matcher missing skills.")
        print(f"Verified consistency across agents: missing skills match between Matcher & Skill Gap Agent.")


class TestConversationalMultiTurnGuidance(unittest.TestCase):
    """Conversational Assistant multi-turn context retention & intent routing."""

    def setUp(self):
        self.rag = RAGEngine(jobs_file_path="data/job_postings.json")
        self.matching = JobMatchingAgent(self.rag)
        self.skill_gap = SkillGapAnalysisAgent()
        self.resume = ResumeCustomizerAgent()
        self.interview = M3InterviewPrepAgent()
        self.tracker = ApplicationTracker(storage_path="data/test_conv_apps.json")

        self.assistant = CareerAssistantAgent(
            rag_engine=self.rag,
            matching_agent=self.matching,
            skill_gap_agent=self.skill_gap,
            resume_agent=self.resume,
            interview_agent=self.interview,
            tracker_service=self.tracker
        )
        with open("data/sample_profile.json", "r", encoding="utf-8") as f:
            self.sample_profile = json.load(f)

    def tearDown(self):
        if os.path.exists("data/test_conv_apps.json"):
            os.remove("data/test_conv_apps.json")

    def test_multi_turn_context_flow(self):
        """Test 4-turn career guidance conversation."""
        session_id = "test_multi_turn_session"

        print("\n--- Turn 1: Job Matching ---")
        t1 = self.assistant.chat("Which internships match my profile?", self.sample_profile, session_id=session_id)
        self.assertEqual(t1["intent"], "job_matching")
        self.assertIn("matches", t1["data"])

        print("--- Turn 2: Skill Gap for Top Match (Implicit Context) ---")
        t2 = self.assistant.chat("What skills am I missing?", self.sample_profile, session_id=session_id)
        self.assertEqual(t2["intent"], "skill_gap")
        self.assertIn("skill_gap", t2["data"])

        print("--- Turn 3: Application Tracker Add ---")
        t3 = self.assistant.chat("Add this job to my tracker", self.sample_profile, session_id=session_id)
        self.assertEqual(t3["intent"], "tracker_add")
        self.assertIn("application", t3["data"])

        print("--- Turn 4: Interview Prep for Job ---")
        t4 = self.assistant.chat("Prepare me for the interview", self.sample_profile, session_id=session_id)
        self.assertEqual(t4["intent"], "interview_prep")
        self.assertIn("interview_prep", t4["data"])
        print("Success: Multi-turn conversational context flow test passed!")


if __name__ == "__main__":
    unittest.main()

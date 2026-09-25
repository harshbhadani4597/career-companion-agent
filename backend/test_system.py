import sys
import os
import json
import unittest

# Ensure workspace root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from backend.resume_parser import ResumeParser
from backend.rag_engine import RAGEngine
from backend.agents_core import ResumeParserAgent, JobMatchingAgent, InterviewPrepAgent, SkillGapAgent

# M3 Agent Imports
from backend.agents.skill_gap_agent import SkillGapAnalysisAgent
from backend.agents.resume_customizer_agent import ResumeCustomizerAgent
from backend.agents.interview_prep_agent import InterviewPrepAgent as M3InterviewPrepAgent
from backend.agents.career_assistant_agent import CareerAssistantAgent


class TestAICareerCompanionAgent(unittest.TestCase):
    """M1/M2 Tests — Existing functionality."""
    
    def setUp(self):
        self.rag_engine = RAGEngine(jobs_file_path="data/job_postings.json")
        self.resume_agent = ResumeParserAgent()
        self.matching_agent = JobMatchingAgent(self.rag_engine)
        self.interview_agent = InterviewPrepAgent()
        self.roadmap_agent = SkillGapAgent()
        
        with open("data/sample_profile.json", "r", encoding="utf-8") as f:
            self.sample_profile = json.load(f)

    def test_01_knowledge_base_count(self):
        jobs = self.rag_engine.get_all_jobs()
        print(f"\n[Test 1] Knowledge Base Job Count: {len(jobs)}")
        self.assertGreaterEqual(len(jobs), 150, "Job knowledge base should contain at least 150 postings.")

    def test_02_resume_parser(self):
        raw_text = "Candidate Name. Email: candidate@example.com. Skills: Python, React, TypeScript, Docker, OpenCV, Flask, Gemini AI."
        parsed = self.resume_agent.process(raw_text)
        print(f"[Test 2] Extracted Skills: {parsed.get('technical_skills')}")
        self.assertIn("Python", parsed.get("technical_skills"))
        self.assertIn("React", parsed.get("technical_skills"))

    def test_03_rag_matching_agent(self):
        matches = self.matching_agent.match_jobs(self.sample_profile, top_k=5)
        print(f"[Test 3] Top Match Role: {matches[0]['job']['title']} ({matches[0]['overall_match_pct']}%)")
        print(f"         AI Reasoning: {matches[0]['ai_reasoning']}")
        self.assertGreater(len(matches), 0)
        self.assertGreaterEqual(matches[0]['overall_match_pct'], 60.0)
        self.assertIn("ai_reasoning", matches[0])

    def test_04_interview_prep_agent(self):
        questions = self.interview_agent.generate_interview_questions(
            job_title="AI/ML Engineer Intern",
            domain="AI & Machine Learning",
            missing_skills=["PyTorch"]
        )
        print(f"[Test 4] Generated {len(questions)} Interview Questions for AI/ML")
        self.assertGreater(len(questions), 0)
        
        # Test evaluation
        user_answer = "Retrival-Augmented Generation combines dense vector embeddings with vector search to retrieve relevant context for an LLM."
        eval_result = self.interview_agent.evaluate_answer(questions[0]["question"], questions[0]["key_points"], user_answer)
        print(f"         Evaluation Verdict: {eval_result['verdict']} (Score: {eval_result['score']}/100)")
        self.assertIn("score", eval_result)

    def test_05_skill_gap_roadmap_agent(self):
        roadmap = self.roadmap_agent.generate_roadmap(missing_skills=["PyTorch", "Kubernetes"], target_role="AI & DevOps Engineer")
        print(f"[Test 5] Generated Roadmap Modules: {len(roadmap['roadmap_steps'])}")
        self.assertEqual(len(roadmap['roadmap_steps']), 3)


class TestM3SkillGapAnalysis(unittest.TestCase):
    """M3.1 Tests — Skill Gap Analysis Agent."""

    def setUp(self):
        self.rag_engine = RAGEngine(jobs_file_path="data/job_postings.json")
        self.agent = SkillGapAnalysisAgent()
        with open("data/sample_profile.json", "r", encoding="utf-8") as f:
            self.sample_profile = json.load(f)
        self.all_jobs = self.rag_engine.get_all_jobs()

    def test_06_skill_gap_strong_match(self):
        """Test skill gap for a job where student has many matching skills."""
        job = self.all_jobs[0]
        result = self.agent.analyze(self.sample_profile, job)
        print(f"\n[Test 6] Skill Gap for: {job['title']}")
        print(f"         Assessment: {result['summary']['overall_assessment']} ({result['summary']['match_percentage']}%)")
        print(f"         Matched: {result['summary']['skills_matched']}, Missing: {result['summary']['skills_missing']}")
        self.assertIn("summary", result)
        self.assertIn("critical_gaps", result)
        self.assertIn("matching_skills", result)
        self.assertIsInstance(result["matching_skills"], list)

    def test_07_skill_gap_multiple_missing(self):
        """Test with a job requiring skills student doesn't have."""
        # Find a DevOps job which the sample profile likely lacks
        devops_job = next((j for j in self.all_jobs if "DevOps" in j.get("domain", "")), self.all_jobs[-1])
        result = self.agent.analyze(self.sample_profile, devops_job)
        print(f"[Test 7] Skill Gap for DevOps: {devops_job['title']}")
        print(f"         Critical Gaps: {len(result['critical_gaps'])}")
        self.assertGreater(len(result["critical_gaps"]), 0)

    def test_08_skill_gap_empty_profile(self):
        """Test error handling with empty inputs."""
        result = self.agent.analyze({}, {})
        print(f"[Test 8] Empty input: {result}")
        self.assertIn("error", result)

    def test_09_skill_gap_recommendations(self):
        """Test that recommendations are generated."""
        job = self.all_jobs[0]
        result = self.agent.analyze(self.sample_profile, job)
        print(f"[Test 9] Recommendations count: {len(result.get('recommendations', []))}")
        # Recommendations should exist if there are gaps
        if result.get("critical_gaps") or result.get("partial_gaps"):
            self.assertGreater(len(result.get("recommendations", [])), 0)


class TestM3ResumeCustomization(unittest.TestCase):
    """M3.2 Tests — Resume & Cover Letter Customization Agent."""

    def setUp(self):
        self.rag_engine = RAGEngine(jobs_file_path="data/job_postings.json")
        self.agent = ResumeCustomizerAgent()
        with open("data/sample_profile.json", "r", encoding="utf-8") as f:
            self.sample_profile = json.load(f)
        self.job = self.rag_engine.get_all_jobs()[0]

    def test_10_resume_customization(self):
        """Test tailored resume generation."""
        result = self.agent.customize_resume(self.sample_profile, self.job)
        print(f"\n[Test 10] Resume for: {self.job['title']}")
        print(f"          Relevant skills: {result.get('relevant_skills', [])}")
        print(f"          Resume text length: {len(result.get('resume_text', ''))}")
        self.assertIn("resume_text", result)
        self.assertIn("relevant_skills", result)
        self.assertIn("tailored_projects", result)
        self.assertGreater(len(result["resume_text"]), 100)

    def test_11_cover_letter_generation(self):
        """Test cover letter generation."""
        result = self.agent.generate_cover_letter(self.sample_profile, self.job)
        print(f"[Test 11] Cover letter for: {self.job['title']}")
        print(f"          Text length: {len(result.get('cover_letter_text', ''))}")
        self.assertIn("cover_letter_text", result)
        self.assertGreater(len(result["cover_letter_text"]), 100)
        # Verify no hallucination — student name should appear
        self.assertIn(self.sample_profile["name"], result["cover_letter_text"])

    def test_12_resume_no_fabrication(self):
        """Test that resume doesn't add skills the student doesn't have."""
        result = self.agent.customize_resume(self.sample_profile, self.job)
        relevant = set(s.lower() for s in result.get("relevant_skills", []))
        student_skills = set(s.lower() for s in self.sample_profile.get("technical_skills", []))
        # All relevant skills must be in student's profile
        for skill in relevant:
            self.assertIn(skill, student_skills, f"Fabricated skill in resume: {skill}")
        print(f"[Test 12] Anti-hallucination check passed — no fabricated skills in resume")


class TestM3InterviewPrep(unittest.TestCase):
    """M3.3 Tests — Interview Preparation Agent."""

    def setUp(self):
        self.agent = M3InterviewPrepAgent()
        self.rag_engine = RAGEngine(jobs_file_path="data/job_postings.json")
        with open("data/sample_profile.json", "r", encoding="utf-8") as f:
            self.sample_profile = json.load(f)
        self.job = self.rag_engine.get_all_jobs()[0]

    def test_13_interview_five_categories(self):
        """Test all 5 question categories are generated."""
        result = self.agent.generate_preparation(self.sample_profile, self.job)
        print(f"\n[Test 13] Interview prep for: {self.job['title']}")
        print(f"          Total questions: {result['total_questions']}")
        self.assertIn("technical_questions", result)
        self.assertIn("resume_questions", result)
        self.assertIn("project_questions", result)
        self.assertIn("role_questions", result)
        self.assertIn("hr_questions", result)
        self.assertGreater(result["total_questions"], 10)

    def test_14_revision_plan(self):
        """Test revision plan generation."""
        result = self.agent.generate_preparation(self.sample_profile, self.job)
        revision = result.get("revision_plan", {})
        print(f"[Test 14] Priority 1 topics: {revision.get('priority_1', {}).get('topics', [])}")
        self.assertIn("priority_1", revision)
        self.assertIn("priority_2", revision)
        self.assertIn("priority_3", revision)

    def test_15_mock_evaluation(self):
        """Test mock interview answer evaluation."""
        result = self.agent.evaluate_mock_answer(
            question="Explain backpropagation in neural networks.",
            expected_concepts=["Chain Rule", "Gradient Descent", "Loss Function"],
            user_answer="Backpropagation uses the chain rule to compute gradients of the loss function with respect to each weight. These gradients are then used in gradient descent to update weights and minimize the loss.",
            question_type="Technical"
        )
        print(f"[Test 15] Mock eval: {result['verdict']} (Score: {result['score']}/100)")
        self.assertIn("score", result)
        self.assertIn("what_was_good", result)
        self.assertIn("what_could_improve", result)
        self.assertGreater(result["score"], 40)

    def test_16_project_questions_use_real_data(self):
        """Test that project questions reference actual student projects."""
        result = self.agent.generate_preparation(self.sample_profile, self.job)
        project_qs = result.get("project_questions", [])
        student_project_titles = [p["title"] for p in self.sample_profile.get("projects", [])]
        # At least one question should reference an actual project
        found_real = False
        for q in project_qs:
            for title in student_project_titles:
                if title.lower() in q["question"].lower():
                    found_real = True
                    break
        if project_qs:
            self.assertTrue(found_real, "Project questions should reference actual student projects")
        print(f"[Test 16] Project questions reference real projects: {found_real}")


class TestM3CareerAssistant(unittest.TestCase):
    """M3.4 Tests — Career Assistant Agent."""

    def setUp(self):
        self.rag_engine = RAGEngine(jobs_file_path="data/job_postings.json")
        self.matching_agent = JobMatchingAgent(self.rag_engine)
        self.skill_gap_agent = SkillGapAnalysisAgent()
        self.resume_agent = ResumeCustomizerAgent()
        self.interview_agent = M3InterviewPrepAgent()

        self.agent = CareerAssistantAgent(
            rag_engine=self.rag_engine,
            matching_agent=self.matching_agent,
            skill_gap_agent=self.skill_gap_agent,
            resume_agent=self.resume_agent,
            interview_agent=self.interview_agent,
        )
        with open("data/sample_profile.json", "r", encoding="utf-8") as f:
            self.sample_profile = json.load(f)

    def test_17_intent_matching(self):
        """Test job matching intent."""
        result = self.agent.chat("Which internships match my profile?", self.sample_profile)
        print(f"\n[Test 17] Matching intent response length: {len(result['response'])}")
        self.assertEqual(result["intent"], "job_matching")
        self.assertGreater(len(result["response"]), 50)

    def test_18_intent_skill_gap(self):
        """Test skill gap intent with context."""
        # First set a job context
        self.agent.chat("Which internships match my profile?", self.sample_profile)
        result = self.agent.chat("What skills am I missing?", self.sample_profile)
        print(f"[Test 18] Skill gap intent: {result['intent']}")
        self.assertEqual(result["intent"], "skill_gap")

    def test_19_intent_general(self):
        """Test greeting / general intent."""
        result = self.agent.chat("Hello!", self.sample_profile)
        print(f"[Test 19] General intent response preview: {result['response'][:80]}...")
        self.assertEqual(result["intent"], "general_career")

    def test_20_context_retention(self):
        """Test that assistant retains conversation context."""
        # First mention a job
        r1 = self.agent.chat("Find matching internships", self.sample_profile, session_id="test-ctx")
        # Then ask about skills without specifying which job
        r2 = self.agent.chat("What skills am I missing?", self.sample_profile, session_id="test-ctx")
        print(f"[Test 20] Context retained: intent={r2['intent']}")
        # Should use the same job context
        self.assertNotIn("select", r2["response"].lower()[:100])

    def test_21_empty_message(self):
        """Test empty message handling."""
        result = self.agent.chat("", self.sample_profile)
        print(f"[Test 21] Empty message handled gracefully")
        self.assertIn("response", result)

    def test_22_no_profile(self):
        """Test behavior without student profile."""
        result = self.agent.chat("Find matching internships", None)
        print(f"[Test 22] No profile: {result['response'][:80]}...")
        self.assertIn("profile", result["response"].lower())

    def test_23_history(self):
        """Test conversation history tracking."""
        self.agent.chat("Hello!", self.sample_profile, session_id="test-hist")
        history = self.agent.get_history(session_id="test-hist")
        context = self.agent._get_context("test-hist")
        self.assertIsNotNone(context)
        print(f"[Test 23] History/context tracking works")

    def test_24_ats_optimization(self):
        """Test ATS resume optimization calculation and keyword breakdown."""
        result = self.resume_agent.optimize_ats_resume(self.sample_profile, self.rag_engine.get_all_jobs()[0])
        print(f"[Test 24] ATS Optimization Score: {result.get('ats_compatibility_score')}% ({result.get('ats_verdict')})")
        self.assertIn("ats_compatibility_score", result)
        self.assertIn("matched_keywords", result)
        self.assertIn("missing_keywords", result)
        self.assertGreater(result["ats_compatibility_score"], 40)

    def test_25_mock_difficulty_level(self):
        """Test simulated interview turn with Easy vs Hard difficulty levels."""
        job = self.rag_engine.get_all_jobs()[0]
        easy_turn = self.interview_agent.conduct_simulated_turn(self.sample_profile, job, difficulty_level="Easy")
        hard_turn = self.interview_agent.conduct_simulated_turn(self.sample_profile, job, difficulty_level="Hard")
        print(f"[Test 25] Simulated interview difficulty levels: Easy tag present? {'Easy' in easy_turn.get('interviewer_message', '')}, Hard tag present? {'Hard' in hard_turn.get('interviewer_message', '')}")
        self.assertIn("Easy", easy_turn.get("interviewer_message", ""))
        self.assertIn("Hard", hard_turn.get("interviewer_message", ""))


if __name__ == "__main__":
    unittest.main()


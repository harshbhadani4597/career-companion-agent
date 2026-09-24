import random
from typing import Dict, List, Any
from backend.resume_parser import ResumeParser
from backend.rag_engine import RAGEngine

class ResumeParserAgent:
    def __init__(self):
        self.parser = ResumeParser()

    def process(self, raw_input: str) -> Dict[str, Any]:
        return self.parser.parse_resume_text(raw_input)

class JobMatchingAgent:
    def __init__(self, rag_engine: RAGEngine):
        self.rag_engine = rag_engine

    def match_jobs(self, profile: Dict[str, Any], top_k: int = 15) -> List[Dict[str, Any]]:
        matches = self.rag_engine.match_candidate_profile(profile, top_k=top_k)
        
        # Enrich matches with AI Reasoning & Actionable Recommendations
        for match in matches:
            job = match["job"]
            overall_score = match["overall_match_pct"]
            matching_skills = match["matching_skills"]
            missing_skills = match["missing_skills"]

            # Generate natural language AI reasoning
            reasoning = self._generate_reasoning(profile, job, overall_score, matching_skills, missing_skills)
            recommendation = self._generate_recommendation(missing_skills, job["title"])

            match["ai_reasoning"] = reasoning
            match["actionable_recommendation"] = recommendation

        return matches

    def _generate_reasoning(self, profile: Dict[str, Any], job: Dict[str, Any], score: float, matching: List[str], missing: List[str]) -> str:
        name = profile.get("name", "The candidate")
        job_title = job.get("title", "this role")
        company = job.get("company", "the hiring team")

        if score >= 80:
            return (
                f"{name} is an exceptional fit for {job_title} at {company} ({score}% match). "
                f"Demonstrates core competency in key required technologies including {', '.join(matching[:4])}. "
                f"Projects directly align with the responsibilities of this role."
            )
        elif score >= 60:
            return (
                f"{name} has a strong foundation for {job_title} at {company} ({score}% match). "
                f"Possesses essential technical skills: {', '.join(matching[:3])}. "
                f"Acquiring proficiency in {', '.join(missing[:2]) if missing else 'advanced concepts'} will make {name} a top-tier candidate."
            )
        else:
            return (
                f"{name} meets baseline prerequisites for {job_title} ({score}% match) with overlapping skills in {', '.join(matching[:2]) if matching else 'general programming'}. "
                f"Bridging key skill gaps in {', '.join(missing[:3]) if missing else 'domain tools'} is recommended before applying."
            )

    def _generate_recommendation(self, missing_skills: List[str], job_title: str) -> str:
        if not missing_skills:
            return f"Profile matches all target tech stack items! Focus on building a portfolio project demonstrating {job_title} practices."
        return f"To boost compatibility to 95%+, complete a weekend mini-project or course covering: {', '.join(missing_skills)}."

class InterviewPrepAgent:
    def __init__(self):
        self.question_bank = {
            "AI & Machine Learning": [
                {
                    "type": "Technical",
                    "question": "Explain the difference between overfitting and underfitting in ML models. How do you prevent overfitting when training a neural network or decision tree?",
                    "key_points": ["Validation loss vs training loss", "Regularization (L1/L2, Dropout)", "Cross-validation", "Data augmentation"]
                },
                {
                    "type": "Technical",
                    "question": "How does Retrieval-Augmented Generation (RAG) differ from standard LLM fine-tuning? What are the key components of a RAG pipeline?",
                    "key_points": ["Vector embeddings", "Chunking strategy", "Semantic search / Cosine similarity", "Contextual prompting"]
                },
                {
                    "type": "Behavioral",
                    "question": "Describe a machine learning or data project where your model initially performed poorly. How did you diagnose and resolve the issue?",
                    "key_points": ["Data cleaning & feature engineering", "Hyperparameter tuning", "Iterative evaluation", "Root cause analysis"]
                }
            ],
            "Full-Stack Web Development": [
                {
                    "type": "Technical",
                    "question": "How do WebSockets differ from standard REST API HTTP polling? When would you choose WebSockets for an application like IdleMesh?",
                    "key_points": ["Full-duplex persistent TCP connection", "Low latency real-time communication", "Reduced header overhead vs HTTP polling"]
                },
                {
                    "type": "Technical",
                    "question": "What is the Virtual DOM in React, and how does the reconciliation algorithm optimize rendering performance?",
                    "key_points": ["In-memory representation of real DOM", "Diffing algorithm", "Batch updates", "Keys for list rendering"]
                },
                {
                    "type": "System Design",
                    "question": "How would you design a distributed worker node system that monitors client CPU/GPU usage and dispatches background tasks?",
                    "key_points": ["Worker heartbeat API", "Message queues (RabbitMQ/Redis)", "State synchronization", "Fault tolerance & retries"]
                }
            ],
            "General Technical": [
                {
                    "type": "Technical",
                    "question": "What is the difference between process and thread in operating systems? How does Python handle multi-threading via the GIL?",
                    "key_points": ["Memory sharing vs isolated space", "Global Interpreter Lock (GIL)", "Multiprocessing vs AsyncIO"]
                },
                {
                    "type": "Behavioral",
                    "question": "Tell me about a time when you had to learn a new technology or framework quickly to build a project feature under a tight deadline.",
                    "key_points": ["Documentation reading", "Building rapid prototypes", "Prioritizing MVP features", "Problem solving"]
                }
            ]
        }

    def generate_interview_questions(self, job_title: str, domain: str, missing_skills: List[str] = None) -> List[Dict[str, Any]]:
        questions = []
        domain_questions = self.question_bank.get(domain, self.question_bank["General Technical"])
        questions.extend(domain_questions)
        
        # Add a custom question addressing missing skills if present
        if missing_skills:
            skill = missing_skills[0]
            questions.append({
                "type": "Technical Gap Focus",
                "question": f"The job description highlights {skill}. Can you explain how you would utilize {skill} in a production application and what best practices you follow?",
                "key_points": [f"Core concepts of {skill}", "Integration pattern", "Performance & error handling"]
            })
            
        return questions

    def evaluate_answer(self, question: str, key_points: List[str], user_answer: str) -> Dict[str, Any]:
        if not user_answer or len(user_answer.strip()) < 10:
            return {
                "score": 30,
                "verdict": "Needs Detail",
                "feedback": "Your response was too brief. Try elaborating using the STAR method (Situation, Task, Action, Result) and mention specific technical concepts.",
                "suggested_improvements": key_points
            }
            
        answer_lower = user_answer.lower()
        matched_points = [kp for kp in key_points if any(w.lower() in answer_lower for w in kp.split() if len(w) > 3)]
        
        match_ratio = len(matched_points) / max(1, len(key_points))
        score = min(98, max(55, int(match_ratio * 100) + random.randint(5, 15)))
        
        if score >= 80:
            verdict = "Excellent Answer!"
            feedback = "Strong technical explanation! You effectively covered core architectural principles and key concepts."
        elif score >= 65:
            verdict = "Good Response"
            feedback = "Good overview! To elevate your answer, explicitly highlight key concepts such as: " + ", ".join(key_points[:2])
        else:
            verdict = "Satisfactory - Add Specifics"
            feedback = "You touched on the basics. Incorporating key technical terms like " + ", ".join(key_points[:3]) + " will make your response much stronger."
            
        return {
            "score": score,
            "verdict": verdict,
            "feedback": feedback,
            "key_points_covered": matched_points if matched_points else key_points[:1],
            "key_points_missed": [kp for kp in key_points if kp not in matched_points]
        }

class SkillGapAgent:
    def generate_roadmap(self, missing_skills: List[str], target_role: str) -> Dict[str, Any]:
        if not missing_skills:
            return {
                "role": target_role,
                "status": "Ready for Interview",
                "roadmap_steps": [
                    {
                        "phase": "Phase 1: Portfolio Polish (Days 1-3)",
                        "actions": ["Refactor README files with high-quality screenshots & architecture diagrams", "Deploy live demos to Vercel/Render"]
                    },
                    {
                        "phase": "Phase 2: System Design & Mock Interviews (Days 4-7)",
                        "actions": ["Practice live coding algorithms", "Conduct 3 AI mock interview sessions"]
                    }
                ]
            }

        steps = []
        for idx, skill in enumerate(missing_skills[:3], 1):
            steps.append({
                "phase": f"Module {idx}: Master {skill} (Days { (idx-1)*3 + 1 } - { idx*3 })",
                "actions": [
                    f"Read official documentation and core architecture guide for {skill}",
                    f"Build a mini project integrating {skill} with your existing tech stack",
                    f"Add {skill} code snippet / repository link to your GitHub profile"
                ]
            })

        steps.append({
            "phase": f"Final Prep: Application & Mock Assessment (Days { len(missing_skills[:3])*3 + 1 } - { len(missing_skills[:3])*3 + 3 })",
            "actions": [
                f"Tailor candidate summary to emphasize new skills in {', '.join(missing_skills[:3])}",
                "Submit applications to high-compatibility matched roles"
            ]
        })

        return {
            "role": target_role,
            "missing_skills_count": len(missing_skills),
            "target_skills": missing_skills,
            "roadmap_steps": steps
        }

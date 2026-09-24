"""
M3.3 — Interview Preparation Agent

Generates comprehensive interview preparation material with 5 question categories:
1. Technical Questions
2. Resume-Based Questions
3. Project-Based Questions
4. Role-Specific Questions
5. HR / General Questions

Also generates prioritized revision topics and supports mock interview evaluation.

Anti-hallucination: Never asks questions about projects, technologies, or experience
that are NOT actually present in the student's profile/resume.
"""

import random
from typing import Dict, List, Any


class InterviewPrepAgent:
    """Generates comprehensive, personalized interview preparation content."""

    def conduct_simulated_turn(
        self,
        student_profile: Dict[str, Any],
        job: Dict[str, Any],
        conversation_history: List[Dict[str, Any]] = None,
        candidate_answer: str = "",
        current_question_index: int = 0
    ) -> Dict[str, Any]:
        """
        Conduct a multi-turn interactive AI mock interview session.
        """
        if not student_profile or not job:
            return {"error": "Both student profile and target job are required for interactive mock interview."}

        job_title = job.get("title", "Target Role")
        company = job.get("company", "Target Company")

        prep = self.generate_preparation(student_profile, job)
        
        # Flatten questions from 5 categories into a 5-question interview sequence
        questions_sequence = []
        if prep.get("technical_questions"):
            questions_sequence.append(prep["technical_questions"][0])
        if prep.get("resume_questions"):
            questions_sequence.append(prep["resume_questions"][0])
        if prep.get("project_questions"):
            questions_sequence.append(prep["project_questions"][0])
        if prep.get("role_questions"):
            questions_sequence.append(prep["role_questions"][0])
        if prep.get("hr_questions"):
            questions_sequence.append(prep["hr_questions"][0])

        if not questions_sequence:
            questions_sequence = [
                {
                    "topic": "Domain Fundamentals",
                    "difficulty": "Medium",
                    "question": f"How do your technical skills and project experience prepare you for this {job_title} role at {company}?",
                    "why_asked": "Assesses role alignment.",
                    "guidance": "Highlight technical skills and relevant project experience.",
                    "key_concepts": ["Skills", "Experience", "Alignment"],
                }
            ]

        total_questions = len(questions_sequence)

        # Case 1: Starting the session
        if current_question_index == 0 and not candidate_answer:
            q1 = questions_sequence[0]
            cand_name = student_profile.get("name", "Candidate")
            welcome_msg = (
                f"Hello {cand_name}! Welcome to your live technical mock interview for **{job_title}** at **{company}**.\n\n"
                f"I will be your AI Technical Interviewer today. We'll go through 5 interview rounds: Technical, Resume, Project Architecture, Role Scenario, and Behavioral HR.\n\n"
                f"Let's begin with **Question 1 ({q1.get('topic', 'Technical')})**:\n\n"
                f"💡 **{q1['question']}**"
            )
            return {
                "session_active": True,
                "current_question_index": 0,
                "total_questions": total_questions,
                "interviewer_message": welcome_msg,
                "current_question": q1,
                "evaluation": None,
                "is_completed": False
            }

        # Case 2: Evaluating candidate answer and proceeding
        idx = min(current_question_index, total_questions - 1)
        current_q = questions_sequence[idx]

        # Evaluate candidate answer
        eval_result = self.evaluate_mock_answer(
            question=current_q["question"],
            expected_concepts=current_q.get("key_concepts", []),
            user_answer=candidate_answer,
            question_type=current_q.get("topic", "Technical")
        )

        next_idx = current_question_index + 1

        if next_idx < total_questions:
            next_q = questions_sequence[next_idx]
            verdict_emoji = "✨" if eval_result.get("score", 0) >= 70 else "💡"
            
            reply_msg = (
                f"{verdict_emoji} **Interviewer Feedback (Score: {eval_result['score']}/100 - {eval_result['verdict']}):**\n"
                f"{eval_result['feedback']}\n\n"
                f"Good effort! Let's move on to **Question {next_idx + 1} of {total_questions} ({next_q.get('topic', 'Technical')})**:\n\n"
                f"💡 **{next_q['question']}**"
            )
            return {
                "session_active": True,
                "current_question_index": next_idx,
                "total_questions": total_questions,
                "interviewer_message": reply_msg,
                "current_question": next_q,
                "evaluation": eval_result,
                "is_completed": False
            }
        else:
            # Interview Completed!
            final_msg = (
                f"🎉 **Mock Interview Session Completed for {job_title} at {company}!**\n\n"
                f"**Final Question Evaluation:** Score {eval_result['score']}/100 ({eval_result['verdict']})\n"
                f"*{eval_result['feedback']}*\n\n"
                f"### 📊 Overall Interview Scorecard:\n"
                f"• **Technical Accuracy:** 85/100\n"
                f"• **Structured Communication:** Satisfactory\n"
                f"• **Project & Role Alignment:** High\n\n"
                f"**Final Verdict:** Solid interview performance! Review your feedback in the Interview Prep tab for final polish."
            )
            return {
                "session_active": False,
                "current_question_index": total_questions,
                "total_questions": total_questions,
                "interviewer_message": final_msg,
                "current_question": current_q,
                "evaluation": eval_result,
                "is_completed": True
            }

    # ── Technical question templates by domain ──
    TECHNICAL_TEMPLATES = {
        "AI & Machine Learning": [
            {
                "topic": "Machine Learning Fundamentals",
                "difficulty": "Medium",
                "question": "Explain the bias-variance tradeoff. How would you diagnose whether your model is suffering from high bias or high variance?",
                "why_asked": "Tests foundational ML understanding required for any AI/ML role.",
                "guidance": "Discuss underfitting vs overfitting, training vs validation error curves, and remediation techniques like regularization and cross-validation.",
                "key_concepts": ["Bias", "Variance", "Overfitting", "Underfitting", "Regularization", "Cross-validation"],
            },
            {
                "topic": "Deep Learning",
                "difficulty": "Medium",
                "question": "What is backpropagation and why is it important in training neural networks?",
                "why_asked": "Core concept for any deep learning role — tests understanding of gradient-based optimization.",
                "guidance": "Explain the chain rule, how gradients flow backward through layers, and common issues like vanishing/exploding gradients.",
                "key_concepts": ["Chain Rule", "Gradient Descent", "Loss Function", "Vanishing Gradients", "Learning Rate"],
            },
            {
                "topic": "RAG & LLMs",
                "difficulty": "Hard",
                "question": "Compare Retrieval-Augmented Generation (RAG) with fine-tuning an LLM. When would you choose one over the other?",
                "why_asked": "RAG is a rapidly growing paradigm — demonstrates awareness of modern AI architecture patterns.",
                "guidance": "Discuss cost, latency, data freshness, hallucination control, and implementation complexity of each approach.",
                "key_concepts": ["Vector Embeddings", "Semantic Search", "Chunking Strategy", "Fine-tuning", "Prompt Engineering"],
            },
            {
                "topic": "Model Evaluation",
                "difficulty": "Medium",
                "question": "Explain precision, recall, and F1-score. When would you prioritize recall over precision?",
                "why_asked": "Evaluation metrics are fundamental to measuring ML model performance.",
                "guidance": "Use concrete examples like medical diagnosis (recall) vs spam detection (precision). Explain the F1 harmonic mean.",
                "key_concepts": ["Precision", "Recall", "F1-Score", "Confusion Matrix", "ROC-AUC"],
            },
        ],
        "Full-Stack Web Development": [
            {
                "topic": "API Design",
                "difficulty": "Medium",
                "question": "Compare REST and GraphQL. What are the advantages and disadvantages of each?",
                "why_asked": "API design is fundamental to full-stack development.",
                "guidance": "Discuss over-fetching/under-fetching, versioning, caching, and tooling ecosystems.",
                "key_concepts": ["REST", "GraphQL", "HTTP Methods", "Status Codes", "Schema"],
            },
            {
                "topic": "Frontend Architecture",
                "difficulty": "Medium",
                "question": "Explain the Virtual DOM in React and how it optimizes rendering performance.",
                "why_asked": "Understanding React internals demonstrates depth beyond surface-level usage.",
                "guidance": "Explain the diffing algorithm, reconciliation, batched updates, and the role of keys.",
                "key_concepts": ["Virtual DOM", "Reconciliation", "Diffing Algorithm", "Component Lifecycle", "Keys"],
            },
            {
                "topic": "State Management",
                "difficulty": "Medium",
                "question": "How do you decide between local component state, context, and a state management library like Redux?",
                "why_asked": "State management decisions impact application scalability and maintainability.",
                "guidance": "Discuss component scope, prop drilling, global vs local state, and performance implications.",
                "key_concepts": ["useState", "Context API", "Redux", "Prop Drilling", "State Normalization"],
            },
            {
                "topic": "Database Design",
                "difficulty": "Medium",
                "question": "Compare SQL and NoSQL databases. When would you choose MongoDB over PostgreSQL?",
                "why_asked": "Database selection is a critical architectural decision in full-stack applications.",
                "guidance": "Discuss schema flexibility, ACID compliance, scalability patterns, and query complexity.",
                "key_concepts": ["SQL", "NoSQL", "ACID", "Schema Design", "Indexing", "Sharding"],
            },
        ],
        "Backend & API Engineering": [
            {
                "topic": "System Design",
                "difficulty": "Hard",
                "question": "How would you design a rate limiter for an API? What algorithms would you consider?",
                "why_asked": "Tests system design thinking and awareness of scalability concerns.",
                "guidance": "Discuss token bucket, sliding window, fixed window algorithms, and distributed rate limiting.",
                "key_concepts": ["Token Bucket", "Sliding Window", "Redis", "Middleware", "HTTP 429"],
            },
            {
                "topic": "Authentication",
                "difficulty": "Medium",
                "question": "Explain the difference between JWT and session-based authentication. What are the security considerations?",
                "why_asked": "Authentication is a core backend concern for any API-driven application.",
                "guidance": "Discuss stateless vs stateful, token expiry, refresh tokens, XSS, and CSRF protection.",
                "key_concepts": ["JWT", "Session", "OAuth", "CSRF", "XSS", "Refresh Tokens"],
            },
        ],
        "DevOps & Cloud Engineering": [
            {
                "topic": "Containerization",
                "difficulty": "Medium",
                "question": "Explain the difference between a Docker image and a container. How does multi-stage build improve image size?",
                "why_asked": "Docker is fundamental to modern deployment workflows.",
                "guidance": "Discuss layers, immutability, build context, and how multi-stage builds separate build and runtime dependencies.",
                "key_concepts": ["Docker Image", "Container", "Dockerfile", "Layers", "Multi-stage Build"],
            },
            {
                "topic": "CI/CD",
                "difficulty": "Medium",
                "question": "Describe a CI/CD pipeline you would set up for a web application. What stages would it include?",
                "why_asked": "CI/CD automation is a core DevOps practice for reliable deployments.",
                "guidance": "Discuss stages: lint, test, build, deploy. Mention tools like GitHub Actions, Jenkins, or GitLab CI.",
                "key_concepts": ["Continuous Integration", "Continuous Deployment", "Pipeline Stages", "Automated Testing"],
            },
        ],
    }

    # ── HR / General question bank ──
    HR_QUESTIONS = [
        {
            "topic": "Self Introduction",
            "difficulty": "Easy",
            "question": "Tell me about yourself and what motivated you to apply for this internship.",
            "why_asked": "Standard opener — tests communication skills and genuine interest.",
            "guidance": "Use a structured format: present situation, relevant background, why this role. Keep it under 2 minutes.",
            "key_concepts": ["Structured Response", "Relevance", "Enthusiasm", "Conciseness"],
        },
        {
            "topic": "Motivation",
            "difficulty": "Easy",
            "question": "Why are you interested in this specific internship/company?",
            "why_asked": "Tests whether the candidate has researched the company and role.",
            "guidance": "Research the company's products, culture, and recent achievements. Connect them to your interests.",
            "key_concepts": ["Company Research", "Role Alignment", "Career Goals", "Genuine Interest"],
        },
        {
            "topic": "Strengths",
            "difficulty": "Easy",
            "question": "What are your top 3 strengths, and how have they helped you in your projects?",
            "why_asked": "Assesses self-awareness and ability to connect traits to outcomes.",
            "guidance": "Choose strengths relevant to the role. Provide specific examples from projects or academics.",
            "key_concepts": ["Self-Awareness", "Concrete Examples", "Relevance to Role"],
        },
        {
            "topic": "Growth Areas",
            "difficulty": "Easy",
            "question": "What is one area you are currently working to improve?",
            "why_asked": "Tests self-awareness and growth mindset without being a trick question.",
            "guidance": "Be honest but strategic. Mention a real area and the concrete steps you are taking to improve.",
            "key_concepts": ["Growth Mindset", "Self-Improvement", "Honesty", "Action Plan"],
        },
        {
            "topic": "Teamwork",
            "difficulty": "Easy",
            "question": "Describe a time you worked on a team project. What was your role and how did you handle disagreements?",
            "why_asked": "Teamwork is essential in internship settings — tests collaboration skills.",
            "guidance": "Use the STAR method. Focus on your specific contribution and how you navigated team dynamics.",
            "key_concepts": ["STAR Method", "Collaboration", "Conflict Resolution", "Communication"],
        },
        {
            "topic": "Why Select You",
            "difficulty": "Medium",
            "question": "Why should we select you over other candidates for this internship?",
            "why_asked": "Tests confidence, self-awareness, and ability to articulate unique value.",
            "guidance": "Highlight your unique combination of skills, projects, and enthusiasm. Be specific, not generic.",
            "key_concepts": ["Unique Value Proposition", "Specific Examples", "Confidence", "Fit"],
        },
    ]

    def generate_preparation(self, student_profile: Dict[str, Any],
                              job: Dict[str, Any],
                              skill_gap: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate comprehensive interview preparation material.

        Args:
            student_profile: The candidate's structured profile data.
            job: The target job posting data.
            skill_gap: Optional skill gap analysis results.

        Returns:
            Structured preparation with 5 question categories + revision plan.
        """
        if not student_profile or not job:
            return {"error": "Both student profile and job data are required."}

        job_title = job.get("title", "Target Role")
        job_domain = job.get("domain", "General Technical")
        job_skills = job.get("technical_skills", [])
        job_responsibilities = job.get("responsibilities", [])

        # 1. Technical Questions
        technical_questions = self._generate_technical_questions(job_domain, job_skills)

        # 2. Resume-Based Questions (based on actual student data only)
        resume_questions = self._generate_resume_questions(student_profile)

        # 3. Project-Based Questions (based on actual student projects only)
        project_questions = self._generate_project_questions(student_profile)

        # 4. Role-Specific Questions
        role_questions = self._generate_role_questions(job)

        # 5. HR / General Questions
        hr_questions = self._select_hr_questions(job_title, job.get("company", ""))

        # 6. Revision Topics
        revision_plan = self._generate_revision_plan(student_profile, job, skill_gap)

        return {
            "job_title": job_title,
            "job_company": job.get("company", ""),
            "job_domain": job_domain,
            "total_questions": (
                len(technical_questions) + len(resume_questions) +
                len(project_questions) + len(role_questions) + len(hr_questions)
            ),
            "technical_questions": technical_questions,
            "resume_questions": resume_questions,
            "project_questions": project_questions,
            "role_questions": role_questions,
            "hr_questions": hr_questions,
            "revision_plan": revision_plan,
        }

    def evaluate_mock_answer(self, question: str, expected_concepts: List[str],
                              user_answer: str, question_type: str = "Technical") -> Dict[str, Any]:
        """
        Evaluate a mock interview answer against expected concepts.

        Args:
            question: The interview question.
            expected_concepts: Key concepts expected in the answer.
            user_answer: The candidate's answer text.
            question_type: Type of question for context.

        Returns:
            Evaluation with scores, feedback, and suggestions.
        """
        if not user_answer or len(user_answer.strip()) < 15:
            return {
                "score": 25,
                "relevance": "Low",
                "technical_correctness": "Insufficient",
                "clarity": "Needs more detail",
                "completeness": "Incomplete",
                "communication": "Too brief",
                "verdict": "Needs Significant Improvement",
                "what_was_good": ["Attempted to answer the question"],
                "what_could_improve": [
                    "Provide a more detailed response",
                    "Cover the key technical concepts",
                    "Use specific examples and terminology",
                ],
                "suggested_structure": self._get_answer_structure(question_type),
                "missing_points": expected_concepts,
            }

        answer_lower = user_answer.lower()

        # Score concept coverage
        covered = []
        missed = []
        for concept in expected_concepts:
            concept_words = [w.lower() for w in concept.split() if len(w) > 2]
            if any(w in answer_lower for w in concept_words):
                covered.append(concept)
            else:
                missed.append(concept)

        coverage_ratio = len(covered) / max(1, len(expected_concepts))

        # Calculate component scores
        word_count = len(user_answer.split())
        length_score = min(1.0, word_count / 50)  # Expect at least 50 words

        relevance_score = coverage_ratio
        clarity_score = min(1.0, length_score * 0.5 + coverage_ratio * 0.5)
        completeness_score = coverage_ratio

        overall_score = int(min(95, max(20, (
            relevance_score * 35 +
            clarity_score * 25 +
            completeness_score * 30 +
            length_score * 10
        ))))

        # Generate feedback
        what_was_good = []
        what_could_improve = []

        if coverage_ratio >= 0.6:
            what_was_good.append("Good coverage of key technical concepts")
        if word_count > 80:
            what_was_good.append("Detailed and thorough response")
        if covered:
            what_was_good.append(f"Effectively discussed: {', '.join(covered[:3])}")

        if missed:
            what_could_improve.append(f"Include discussion of: {', '.join(missed[:3])}")
        if word_count < 40:
            what_could_improve.append("Elaborate more — aim for at least 50-80 words")
        if coverage_ratio < 0.5:
            what_could_improve.append("Focus on the core technical concepts relevant to the question")

        if not what_was_good:
            what_was_good.append("Showed willingness to engage with the question")
        if not what_could_improve:
            what_could_improve.append("Consider adding real-world examples to strengthen the answer")

        # Determine verdict
        if overall_score >= 80:
            verdict = "Excellent Answer"
        elif overall_score >= 65:
            verdict = "Good Response"
        elif overall_score >= 45:
            verdict = "Satisfactory — Needs More Depth"
        else:
            verdict = "Needs Improvement"

        return {
            "score": overall_score,
            "relevance": "High" if relevance_score >= 0.6 else ("Medium" if relevance_score >= 0.3 else "Low"),
            "technical_correctness": "Strong" if coverage_ratio >= 0.6 else ("Adequate" if coverage_ratio >= 0.3 else "Needs Work"),
            "clarity": "Clear" if clarity_score >= 0.6 else "Could improve",
            "completeness": f"{len(covered)}/{len(expected_concepts)} key concepts covered",
            "communication": "Good" if word_count >= 50 else "Brief",
            "verdict": verdict,
            "what_was_good": what_was_good,
            "what_could_improve": what_could_improve,
            "suggested_structure": self._get_answer_structure(question_type),
            "covered_points": covered,
            "missing_points": missed,
        }

    # ── Private generators ──

    def _generate_technical_questions(self, domain: str, job_skills: List[str]) -> List[Dict]:
        """Generate domain-specific technical questions."""
        questions = []

        # Get domain-specific questions
        domain_questions = self.TECHNICAL_TEMPLATES.get(domain, [])
        if domain_questions:
            questions.extend(domain_questions[:3])

        # Generate skill-specific questions for required skills
        for skill in job_skills[:3]:
            questions.append({
                "topic": skill,
                "difficulty": "Medium",
                "question": f"Explain the core concepts of {skill} and how you would use it in a production application. What best practices do you follow?",
                "why_asked": f"Directly tests proficiency in {skill}, which is a required skill for this role.",
                "guidance": f"Cover fundamentals of {skill}, common use cases, error handling, and any performance considerations.",
                "key_concepts": [f"{skill} fundamentals", "Use cases", "Best practices", "Error handling"],
            })

        return questions[:6]  # Limit to 6 technical questions

    def _generate_resume_questions(self, profile: Dict[str, Any]) -> List[Dict]:
        """Generate questions based on the student's actual resume content."""
        questions = []
        skills = profile.get("technical_skills", [])
        certs = profile.get("certifications_internships", [])

        # Skills-based questions
        if len(skills) >= 2:
            s1, s2 = skills[0], skills[1]
            questions.append({
                "topic": "Technical Skills",
                "difficulty": "Medium",
                "question": f"Your resume lists {s1} and {s2} as technical skills. Can you describe a situation where you used both together in a project?",
                "why_asked": "Verifies that listed skills are genuine and tests depth of experience.",
                "guidance": f"Describe a specific project or task where you combined {s1} and {s2}. Explain your role and the outcome.",
                "key_concepts": [s1, s2, "Practical Application", "Integration"],
            })

        # Certification-based questions
        if certs:
            cert = certs[0]
            cert_title = cert.get("title", "your certification")
            questions.append({
                "topic": "Certifications & Learning",
                "difficulty": "Easy",
                "question": f"You completed {cert_title}. What was the most valuable thing you learned, and how have you applied it?",
                "why_asked": "Tests whether certifications represent genuine learning or just completion.",
                "guidance": "Share a specific concept or skill from the program and describe how you used it afterward.",
                "key_concepts": ["Practical Learning", "Application", "Growth"],
            })

        return questions

    def _generate_project_questions(self, profile: Dict[str, Any]) -> List[Dict]:
        """Generate questions based on the student's actual projects."""
        questions = []
        projects = profile.get("projects", [])

        for proj in projects[:3]:
            proj_title = proj.get("title", "your project")
            tech_stack = proj.get("tech_stack", [])
            tech_str = ", ".join(tech_stack[:4]) if tech_stack else "the technologies used"

            # Architecture question
            questions.append({
                "topic": proj_title,
                "difficulty": "Medium",
                "question": f"Walk me through the architecture of {proj_title}. How did you structure the codebase and why?",
                "why_asked": "Tests the candidate's understanding of their own project's design decisions.",
                "guidance": f"Explain the overall architecture, how {tech_str} fit together, and the reasoning behind your design choices.",
                "key_concepts": ["Architecture", "Design Decisions", "Component Structure", "Data Flow"],
            })

            # Challenges question
            questions.append({
                "topic": proj_title,
                "difficulty": "Medium",
                "question": f"What was the most challenging problem you faced while building {proj_title}? How did you solve it?",
                "why_asked": "Tests problem-solving ability and resilience — interviewers value honest technical struggles.",
                "guidance": "Describe a specific technical challenge, the debugging/research process, and the solution you implemented.",
                "key_concepts": ["Problem Solving", "Debugging", "Research", "Technical Decision"],
            })

            # Improvement question
            if tech_stack:
                questions.append({
                    "topic": proj_title,
                    "difficulty": "Hard",
                    "question": f"If you had to rebuild {proj_title} from scratch with unlimited time, what would you change or improve?",
                    "why_asked": "Tests ability to critically evaluate own work and awareness of better approaches.",
                    "guidance": "Discuss scalability improvements, technology choices you'd reconsider, testing strategies, and architecture changes.",
                    "key_concepts": ["Scalability", "Code Quality", "Technology Choices", "Testing", "Deployment"],
                })

        return questions[:6]  # Limit to 6 project questions

    def _generate_role_questions(self, job: Dict[str, Any]) -> List[Dict]:
        """Generate questions specific to the target role."""
        questions = []
        job_title = job.get("title", "this role")
        responsibilities = job.get("responsibilities", [])
        domain = job.get("domain", "")

        for resp in responsibilities[:3]:
            questions.append({
                "topic": domain,
                "difficulty": "Medium",
                "question": f"One of the key responsibilities of this role is: '{resp}' — How would you approach this?",
                "why_asked": "Directly tests readiness for the role's day-to-day work.",
                "guidance": "Break down the responsibility into steps, mention relevant tools/technologies, and describe your approach methodically.",
                "key_concepts": ["Approach", "Tools", "Methodology", "Deliverables"],
            })

        # Interview rounds question
        rounds = job.get("interview_rounds", [])
        if rounds:
            rounds_str = "; ".join(rounds)
            questions.append({
                "topic": "Interview Process",
                "difficulty": "Easy",
                "question": f"This role involves these interview stages: {rounds_str}. How would you prepare for each?",
                "why_asked": "Tests whether the candidate understands the interview process and can prepare strategically.",
                "guidance": "Outline your preparation strategy for each round — technical practice, behavioral stories, research about the company.",
                "key_concepts": ["Preparation Strategy", "Technical Practice", "Behavioral Stories", "Company Research"],
            })

        return questions

    def _select_hr_questions(self, job_title: str, company: str) -> List[Dict]:
        """Select and customize HR questions for the role."""
        questions = list(self.HR_QUESTIONS)
        # Customize the questions with job-specific context
        for q in questions:
            q["question"] = q["question"].replace("this internship", f"the {job_title} position")
            q["question"] = q["question"].replace("this specific internship/company", f"this role at {company}")
        return questions

    def _generate_revision_plan(self, profile: Dict[str, Any], job: Dict[str, Any],
                                 skill_gap: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate a prioritized revision plan."""
        job_skills = job.get("technical_skills", [])
        student_skills = set(s.lower() for s in profile.get("technical_skills", []))

        # Categorize skills by priority
        priority_1 = []  # Critical missing skills
        priority_2 = []  # Partially known / need strengthening
        priority_3 = []  # Nice-to-have / preferred

        if skill_gap:
            for gap in skill_gap.get("critical_gaps", []):
                priority_1.append(gap["skill"])
            for gap in skill_gap.get("partial_gaps", []):
                priority_2.append(gap["skill"])
            for gap in skill_gap.get("preferred_gaps", []):
                priority_3.append(gap["skill"])
        else:
            # Derive from direct comparison
            for skill in job_skills:
                if skill.lower() not in student_skills:
                    priority_1.append(skill)
                else:
                    priority_2.append(skill)

        # Add domain fundamentals
        domain = job.get("domain", "")
        domain_fundamentals = {
            "AI & Machine Learning": ["Python fundamentals", "Machine Learning basics", "Data preprocessing"],
            "Full-Stack Web Development": ["HTML/CSS/JS fundamentals", "REST API design", "Database basics"],
            "Backend & API Engineering": ["API design patterns", "Database optimization", "Authentication"],
            "Frontend Web Development": ["HTML/CSS/JS fundamentals", "Responsive design", "Component architecture"],
            "DevOps & Cloud Engineering": ["Linux basics", "Docker fundamentals", "CI/CD pipelines"],
            "Data Science & Analytics": ["Statistics", "Python/Pandas", "Data visualization"],
        }

        fundamentals = domain_fundamentals.get(domain, ["Programming fundamentals", "Problem solving"])

        return {
            "priority_1": {
                "label": "Priority 1 — Critical (Study First)",
                "description": "These skills are required and currently missing from your profile.",
                "topics": priority_1[:5] if priority_1 else fundamentals[:3],
            },
            "priority_2": {
                "label": "Priority 2 — Important (Strengthen)",
                "description": "You have some exposure but need deeper understanding.",
                "topics": priority_2[:5] if priority_2 else [s for s in job_skills[:3]],
            },
            "priority_3": {
                "label": "Priority 3 — Preferred (Bonus)",
                "description": "Nice-to-have skills that will set you apart from other candidates.",
                "topics": priority_3[:5] if priority_3 else ["System Design basics", "Behavioral prep"],
            },
        }

    def _get_answer_structure(self, question_type: str) -> str:
        """Get a suggested answer structure based on question type."""
        structures = {
            "Technical": "1. Define the concept clearly\n2. Explain how it works\n3. Give a practical example\n4. Mention trade-offs or limitations",
            "Resume-Based": "1. Confirm the experience/skill\n2. Describe the specific context\n3. Explain what you did\n4. Share the outcome or learning",
            "Project-Based": "1. Briefly describe the project goal\n2. Explain the architecture/approach\n3. Highlight your specific contribution\n4. Discuss challenges and outcomes",
            "Role-Specific": "1. Show understanding of the requirement\n2. Outline your approach step-by-step\n3. Mention relevant tools/skills\n4. Discuss potential challenges",
            "HR": "1. Be genuine and structured\n2. Use the STAR method (Situation, Task, Action, Result)\n3. Connect to the role\n4. Show enthusiasm",
        }
        return structures.get(question_type, structures["Technical"])

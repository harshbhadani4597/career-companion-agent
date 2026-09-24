"""
M3.4 — Conversational Career Assistant Agent

Integrates all agents (Job Matching, Skill Gap, Resume, Cover Letter, Interview)
with intent routing and conversation context management.

Routes user messages to the appropriate agent based on intent classification.
Maintains conversation context (selected job, recent analysis results).
Integrates with RAG knowledge base for internship queries.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime


class CareerAssistantAgent:
    """Conversational career assistant with intent routing and context management."""

    # Intent categories
    INTENT_MATCH = "job_matching"
    INTENT_SKILL_GAP = "skill_gap"
    INTENT_RESUME = "resume_customize"
    INTENT_COVER_LETTER = "cover_letter"
    INTENT_INTERVIEW = "interview_prep"
    INTENT_RAG_QUERY = "rag_query"
    INTENT_COMPARE = "compare_jobs"
    INTENT_GENERAL = "general_career"

    # Intent detection keyword patterns
    INTENT_PATTERNS = {
        INTENT_MATCH: [
            "match", "matches", "matching", "compatible", "compatibility",
            "which internship", "which job", "find internship", "find job",
            "best fit", "good fit", "top match", "recommend",
            "suitable", "fit my profile", "fit for me",
        ],
        INTENT_SKILL_GAP: [
            "skill gap", "missing skill", "skills am i missing", "what skills",
            "skill analysis", "gap analysis", "lack", "don't have", "need to learn",
            "improve", "improvement", "how can i improve", "what am i missing",
            "weak", "weakness", "strengthen",
        ],
        INTENT_RESUME: [
            "resume", "cv", "customize resume", "tailor resume", "tailored resume",
            "customize my resume", "resume for", "update resume", "optimize resume",
        ],
        INTENT_COVER_LETTER: [
            "cover letter", "write a cover letter", "generate cover letter",
            "application letter", "letter for",
        ],
        INTENT_INTERVIEW: [
            "interview", "prepare for interview", "interview question",
            "mock interview", "practice interview", "what questions",
            "what should i prepare", "interview prep", "prepare for",
            "revision", "revise", "study",
        ],
        INTENT_COMPARE: [
            "compare", "comparison", "versus", " vs ", "differ", "difference",
            "which is better", "better role", "choose between",
        ],
        INTENT_RAG_QUERY: [
            "requirement", "responsibilities", "what does the job", "job description",
            "tell me about the internship", "about this internship", "details",
            "stipend", "salary", "duration", "location", "work mode",
            "qualification", "eligibility", "company", "about the company",
        ],
    }

    def __init__(self, rag_engine=None, matching_agent=None,
                 skill_gap_agent=None, resume_agent=None, interview_agent=None):
        self.rag_engine = rag_engine
        self.matching_agent = matching_agent
        self.skill_gap_agent = skill_gap_agent
        self.resume_agent = resume_agent
        self.interview_agent = interview_agent

        # Conversation state (in-memory, per server session)
        self.conversations: Dict[str, Dict] = {}

    def chat(self, message: str, student_profile: Dict[str, Any] = None,
             session_id: str = "default") -> Dict[str, Any]:
        """
        Process a user message and route to the appropriate agent.

        Args:
            message: The user's natural language message.
            student_profile: The current student profile data.
            session_id: Session identifier for context tracking.

        Returns:
            Structured response with text, data, and context updates.
        """
        if not message or not message.strip():
            return self._build_response(
                "Please type a message or question. I can help with job matching, "
                "skill gap analysis, resume customization, cover letters, and interview preparation.",
                intent=self.INTENT_GENERAL,
            )

        # Get or create conversation context
        context = self._get_context(session_id)
        context["last_message"] = message
        context["last_message_time"] = datetime.now().isoformat()

        # Classify intent
        intent = self._classify_intent(message)

        # Route to appropriate handler
        if intent == self.INTENT_MATCH:
            return self._handle_match(message, student_profile, context)
        elif intent == self.INTENT_SKILL_GAP:
            return self._handle_skill_gap(message, student_profile, context)
        elif intent == self.INTENT_RESUME:
            return self._handle_resume(message, student_profile, context)
        elif intent == self.INTENT_COVER_LETTER:
            return self._handle_cover_letter(message, student_profile, context)
        elif intent == self.INTENT_INTERVIEW:
            return self._handle_interview(message, student_profile, context)
        elif intent == self.INTENT_COMPARE:
            return self._handle_compare(message, student_profile, context)
        elif intent == self.INTENT_RAG_QUERY:
            return self._handle_rag_query(message, context)
        else:
            return self._handle_general(message, student_profile, context)

    def get_history(self, session_id: str = "default") -> List[Dict]:
        """Get conversation history for a session."""
        context = self._get_context(session_id)
        return context.get("history", [])

    # ── Intent classification ──

    def _classify_intent(self, message: str) -> str:
        """Classify user intent from message text."""
        msg_lower = message.lower()

        scores = {}
        for intent, patterns in self.INTENT_PATTERNS.items():
            score = sum(1 for p in patterns if p in msg_lower)
            if score > 0:
                scores[intent] = score

        if scores:
            return max(scores, key=scores.get)

        return self.INTENT_GENERAL

    # ── Intent handlers ──

    def _handle_match(self, message: str, profile: Dict, context: Dict) -> Dict:
        """Handle job matching queries."""
        if not profile or not profile.get("technical_skills"):
            return self._build_response(
                "I'd love to find matching internships for you, but I need your profile first. "
                "Please go to the **Candidate Profile & Resume** tab and upload or paste your resume.",
                intent=self.INTENT_MATCH,
                action_needed="upload_profile",
            )

        if self.matching_agent:
            matches = self.matching_agent.match_jobs(profile, top_k=5)
            context["recent_matches"] = matches

            if not matches:
                return self._build_response(
                    "I couldn't find any strong matches in the knowledge base for your current profile. "
                    "Consider broadening your preferred domains or adding more technical skills.",
                    intent=self.INTENT_MATCH,
                )

            # Build match summary
            top = matches[0]
            job = top["job"]
            context["selected_job"] = job
            context["selected_job_id"] = job.get("id", "")

            match_text = f"Based on your profile, here are your top matches:\n\n"
            for i, m in enumerate(matches[:5], 1):
                j = m["job"]
                match_text += (
                    f"**{i}. {j['title']}** at {j['company']} — "
                    f"**{m['overall_match_pct']}%** match ({m['match_tier']})\n"
                    f"   Matching skills: {', '.join(m['matching_skills'][:4])}\n"
                )
                if m['missing_skills']:
                    match_text += f"   Missing: {', '.join(m['missing_skills'][:3])}\n"
                match_text += "\n"

            match_text += (
                f"\n💡 Your best match is **{job['title']}** at **{job['company']}** "
                f"with **{top['overall_match_pct']}%** compatibility.\n\n"
                f"You can ask me to analyze skill gaps, customize your resume, or prepare "
                f"for the interview for any of these roles!"
            )

            return self._build_response(
                match_text,
                intent=self.INTENT_MATCH,
                data={"matches": matches[:5]},
                suggestions=["Analyze skill gaps for the top match",
                             "Customize my resume for this role",
                             "Prepare for the interview"],
            )

        return self._build_response(
            "The matching engine is not available right now. Please try the **AI Role Matcher** tab directly.",
            intent=self.INTENT_MATCH,
        )

    def _handle_skill_gap(self, message: str, profile: Dict, context: Dict) -> Dict:
        """Handle skill gap analysis queries."""
        if not profile:
            return self._build_response(
                "I need your profile to analyze skill gaps. Please upload your resume first.",
                intent=self.INTENT_SKILL_GAP,
                action_needed="upload_profile",
            )

        # Determine which job to analyze against
        job = context.get("selected_job")
        if not job:
            # Try to find the best match
            if self.matching_agent:
                matches = self.matching_agent.match_jobs(profile, top_k=1)
                if matches:
                    job = matches[0]["job"]
                    context["selected_job"] = job

        if not job:
            return self._build_response(
                "I need a target internship to compare your skills against. "
                "Please select an internship from the **Knowledge Base** tab, or ask me to find matching jobs first.",
                intent=self.INTENT_SKILL_GAP,
                suggestions=["Find matching internships for my profile"],
            )

        if self.skill_gap_agent:
            analysis = self.skill_gap_agent.analyze(profile, job)
            context["recent_skill_gap"] = analysis
            summary = analysis.get("summary", {})

            response_text = (
                f"📊 **Skill Gap Analysis for {job.get('title', 'this role')}** "
                f"at {job.get('company', '')}\n\n"
                f"**Overall Assessment:** {summary.get('overall_assessment', 'N/A')} "
                f"({summary.get('match_percentage', 0)}% skill match)\n\n"
            )

            if analysis.get("critical_gaps"):
                response_text += "🔴 **Critical Missing Skills:**\n"
                for gap in analysis["critical_gaps"][:4]:
                    response_text += f"  • **{gap['skill']}** — {gap['importance']}\n"
                response_text += "\n"

            if analysis.get("partial_gaps"):
                response_text += "🟡 **Partially Demonstrated:**\n"
                for gap in analysis["partial_gaps"][:3]:
                    response_text += f"  • **{gap['skill']}** — {gap['student_evidence']}\n"
                response_text += "\n"

            if analysis.get("recommendations"):
                response_text += "💡 **Top Recommendations:**\n"
                for rec in analysis["recommendations"][:2]:
                    response_text += f"  • [{rec['priority']}] {rec['action']}\n"

            return self._build_response(
                response_text,
                intent=self.INTENT_SKILL_GAP,
                data={"skill_gap": analysis},
                suggestions=["Customize my resume for this role",
                             "How can I learn the missing skills?",
                             "Prepare for the interview"],
            )

        return self._build_response(
            "Skill gap analysis is not available right now. Please use the **Skill Gap** tab.",
            intent=self.INTENT_SKILL_GAP,
        )

    def _handle_resume(self, message: str, profile: Dict, context: Dict) -> Dict:
        """Handle resume customization queries."""
        if not profile:
            return self._build_response(
                "I need your profile to customize your resume. Please upload your resume first.",
                intent=self.INTENT_RESUME,
                action_needed="upload_profile",
            )

        job = context.get("selected_job")
        if not job:
            return self._build_response(
                "I need a target role to customize your resume for. "
                "Please select a job or ask me to find matching internships first.",
                intent=self.INTENT_RESUME,
                suggestions=["Find matching internships for my profile"],
            )

        if self.resume_agent:
            skill_gap = context.get("recent_skill_gap")
            tailored = self.resume_agent.customize_resume(profile, job, skill_gap)

            response_text = (
                f"✅ **Tailored Resume Generated** for {job.get('title', 'this role')} "
                f"at {job.get('company', '')}!\n\n"
                f"**Relevant Skills Highlighted:** {', '.join(tailored.get('relevant_skills', []))}\n\n"
                f"**Featured Projects:** "
                + ", ".join(p['title'] for p in tailored.get('tailored_projects', [])[:3])
                + "\n\n"
            )

            if tailored.get("suggested_improvements"):
                response_text += "📝 **Suggested Improvements (learn these to strengthen your application):**\n"
                for sug in tailored["suggested_improvements"][:3]:
                    response_text += f"  • **{sug['skill']}** — {sug['suggestion']}\n"

            response_text += "\nYou can view and edit the full tailored resume in the **Resume & Cover Letter** tab."

            return self._build_response(
                response_text,
                intent=self.INTENT_RESUME,
                data={"tailored_resume": tailored},
                suggestions=["Generate a cover letter too",
                             "Prepare for the interview",
                             "Analyze skill gaps"],
            )

        return self._build_response(
            "Resume customization is not available right now. Please use the **Resume & Cover Letter** tab.",
            intent=self.INTENT_RESUME,
        )

    def _handle_cover_letter(self, message: str, profile: Dict, context: Dict) -> Dict:
        """Handle cover letter generation queries."""
        if not profile:
            return self._build_response(
                "I need your profile to generate a cover letter. Please upload your resume first.",
                intent=self.INTENT_COVER_LETTER,
                action_needed="upload_profile",
            )

        job = context.get("selected_job")
        if not job:
            return self._build_response(
                "I need a target role to write a cover letter for. "
                "Please select a job first.",
                intent=self.INTENT_COVER_LETTER,
                suggestions=["Find matching internships for my profile"],
            )

        if self.resume_agent:
            cover_letter = self.resume_agent.generate_cover_letter(profile, job)

            response_text = (
                f"✉️ **Cover Letter Generated** for {job.get('title', 'this role')} "
                f"at {job.get('company', '')}!\n\n"
                f"Highlighted skills: {', '.join(cover_letter.get('matching_skills_highlighted', []))}\n"
            )
            if cover_letter.get("featured_project"):
                response_text += f"Featured project: {cover_letter['featured_project']}\n"

            response_text += "\nYou can view, edit, and copy the full letter in the **Resume & Cover Letter** tab."

            return self._build_response(
                response_text,
                intent=self.INTENT_COVER_LETTER,
                data={"cover_letter": cover_letter},
                suggestions=["Prepare for the interview",
                             "Analyze skill gaps"],
            )

        return self._build_response(
            "Cover letter generation is not available right now.",
            intent=self.INTENT_COVER_LETTER,
        )

    def _handle_interview(self, message: str, profile: Dict, context: Dict) -> Dict:
        """Handle interview preparation queries."""
        if not profile:
            return self._build_response(
                "I need your profile to prepare personalized interview questions. Please upload your resume first.",
                intent=self.INTENT_INTERVIEW,
                action_needed="upload_profile",
            )

        job = context.get("selected_job")
        if not job:
            return self._build_response(
                "I need a target role to prepare interview questions for. "
                "Please select a job first.",
                intent=self.INTENT_INTERVIEW,
                suggestions=["Find matching internships for my profile"],
            )

        if self.interview_agent:
            skill_gap = context.get("recent_skill_gap")
            prep = self.interview_agent.generate_preparation(profile, job, skill_gap)

            total = prep.get("total_questions", 0)
            response_text = (
                f"🎤 **Interview Preparation for {job.get('title', 'this role')}** "
                f"at {job.get('company', '')}\n\n"
                f"Generated **{total} questions** across 5 categories:\n"
                f"  • Technical: {len(prep.get('technical_questions', []))}\n"
                f"  • Resume-Based: {len(prep.get('resume_questions', []))}\n"
                f"  • Project-Based: {len(prep.get('project_questions', []))}\n"
                f"  • Role-Specific: {len(prep.get('role_questions', []))}\n"
                f"  • HR/General: {len(prep.get('hr_questions', []))}\n\n"
            )

            # Show revision plan summary
            revision = prep.get("revision_plan", {})
            p1 = revision.get("priority_1", {}).get("topics", [])
            if p1:
                response_text += f"📚 **Priority 1 Revision:** {', '.join(p1[:3])}\n"

            response_text += "\nView the full preparation material in the **Interview Prep** tab."

            return self._build_response(
                response_text,
                intent=self.INTENT_INTERVIEW,
                data={"interview_prep": prep},
                suggestions=["What questions will they ask about my projects?",
                             "Help me prepare for HR questions"],
            )

        return self._build_response(
            "Interview preparation is not available right now. Please use the **Interview Prep** tab.",
            intent=self.INTENT_INTERVIEW,
        )

    def _handle_compare(self, message: str, profile: Dict, context: Dict) -> Dict:
        """Handle job comparison queries."""
        if not profile:
            return self._build_response(
                "I need your profile to compare internships. Please upload your resume first.",
                intent=self.INTENT_COMPARE,
                action_needed="upload_profile",
            )

        if not self.matching_agent:
            return self._build_response(
                "Comparison is not available right now.",
                intent=self.INTENT_COMPARE,
            )

        matches = self.matching_agent.match_jobs(profile, top_k=5)
        if len(matches) < 2:
            return self._build_response(
                "I need at least 2 matches to compare. Your profile may need more skills.",
                intent=self.INTENT_COMPARE,
            )

        top2 = matches[:2]
        j1, j2 = top2[0], top2[1]
        job1, job2 = j1["job"], j2["job"]

        comparison_text = (
            f"📊 **Comparison: Top 2 Matched Internships**\n\n"
            f"| Aspect | {job1['title']} | {job2['title']} |\n"
            f"|--------|{'─'*len(job1['title'])}--|{'─'*len(job2['title'])}--|\n"
            f"| Company | {job1['company']} | {job2['company']} |\n"
            f"| Match % | **{j1['overall_match_pct']}%** | **{j2['overall_match_pct']}%** |\n"
            f"| Domain | {job1['domain']} | {job2['domain']} |\n"
            f"| Location | {job1['location']} | {job2['location']} |\n"
            f"| Work Mode | {job1['work_mode']} | {job2['work_mode']} |\n"
            f"| Stipend | {job1['stipend']} | {job2['stipend']} |\n"
            f"| Missing Skills | {', '.join(j1['missing_skills'][:3])} | {', '.join(j2['missing_skills'][:3])} |\n\n"
            f"💡 **{job1['title']}** at {job1['company']} is your best match with "
            f"**{j1['overall_match_pct']}%** compatibility."
        )

        return self._build_response(
            comparison_text,
            intent=self.INTENT_COMPARE,
            data={"comparison": [j1, j2]},
            suggestions=["Analyze skill gaps for the top match",
                         "Customize resume for the best match"],
        )

    def _handle_rag_query(self, message: str, context: Dict) -> Dict:
        """Handle queries requiring RAG knowledge base lookup."""
        job = context.get("selected_job")

        if job:
            # Use the selected job for context-aware answers
            response_text = self._answer_job_query(message, job)
            return self._build_response(
                response_text,
                intent=self.INTENT_RAG_QUERY,
                data={"job": job},
            )

        # Search the knowledge base
        if self.rag_engine:
            msg_lower = message.lower()
            results = self.rag_engine.search_jobs(query=msg_lower)
            if results:
                job = results[0]
                context["selected_job"] = job
                context["selected_job_id"] = job.get("id", "")

                response_text = (
                    f"📋 **{job['title']}** at {job['company']}\n\n"
                    f"**Domain:** {job['domain']}\n"
                    f"**Location:** {job['location']} ({job['work_mode']})\n"
                    f"**Stipend:** {job['stipend']}\n"
                    f"**Duration:** {job.get('duration', 'Not specified')}\n\n"
                    f"**Description:** {job['description']}\n\n"
                    f"**Required Skills:** {', '.join(job.get('technical_skills', []))}\n\n"
                    f"**Responsibilities:**\n"
                )
                for resp in job.get("responsibilities", []):
                    response_text += f"  • {resp}\n"

                return self._build_response(
                    response_text,
                    intent=self.INTENT_RAG_QUERY,
                    data={"job": job},
                    suggestions=["Analyze my skill gaps for this role",
                                 "Customize my resume for this",
                                 "Prepare for the interview"],
                )

        return self._build_response(
            "I couldn't find relevant information. Try searching in the **Knowledge Base** tab "
            "or ask a more specific question about an internship.",
            intent=self.INTENT_RAG_QUERY,
        )

    def _handle_general(self, message: str, profile: Dict, context: Dict) -> Dict:
        """Handle general career queries."""
        msg_lower = message.lower()

        # Greeting detection
        greetings = ["hi", "hello", "hey", "good morning", "good evening", "howdy"]
        if any(msg_lower.strip().startswith(g) for g in greetings):
            name = profile.get("name", "there") if profile else "there"
            return self._build_response(
                f"Hello {name}! 👋 I'm your AI Career Companion Assistant. I can help you with:\n\n"
                f"🎯 **Finding matching internships** for your profile\n"
                f"📊 **Analyzing skill gaps** between you and a target role\n"
                f"📄 **Customizing your resume** for specific applications\n"
                f"✉️ **Generating cover letters** tailored to roles\n"
                f"🎤 **Preparing for interviews** with personalized questions\n"
                f"🔍 **Exploring internships** in the knowledge base\n\n"
                f"What would you like to start with?",
                intent=self.INTENT_GENERAL,
                suggestions=["Find matching internships",
                             "Analyze my skill gaps",
                             "Help me prepare for interviews"],
            )

        # Help request
        if any(w in msg_lower for w in ["help", "what can you do", "features", "how to"]):
            return self._build_response(
                "Here's what I can help you with:\n\n"
                "🎯 **Job Matching** — \"Which internships match my profile?\"\n"
                "📊 **Skill Gap Analysis** — \"What skills am I missing for [role]?\"\n"
                "📄 **Resume Customization** — \"Customize my resume for [internship]\"\n"
                "✉️ **Cover Letter** — \"Write a cover letter for [position]\"\n"
                "🎤 **Interview Prep** — \"What questions might they ask?\"\n"
                "📖 **Job Info** — \"Tell me about [internship/company]\"\n"
                "🔄 **Compare Jobs** — \"Compare my top two matches\"\n\n"
                "💡 Tip: Upload your resume first, then I can give personalized advice!",
                intent=self.INTENT_GENERAL,
                suggestions=["Find matching internships",
                             "What skills should I learn?",
                             "Help me prepare for interviews"],
            )

        # Default response
        return self._build_response(
            "I'm not sure I understood that fully. Here are some things I can help with:\n\n"
            "• **\"Which internships match my profile?\"**\n"
            "• **\"What skills am I missing?\"**\n"
            "• **\"Customize my resume for [role]\"**\n"
            "• **\"Prepare me for the interview\"**\n"
            "• **\"Compare my top matches\"**\n\n"
            "Try asking one of these questions, or type **help** for a full guide!",
            intent=self.INTENT_GENERAL,
            suggestions=["Find matching internships",
                         "Analyze my skill gaps",
                         "Help me with interviews"],
        )

    # ── Helpers ──

    def _answer_job_query(self, message: str, job: Dict) -> str:
        """Answer a specific query about a selected job."""
        msg_lower = message.lower()

        if any(w in msg_lower for w in ["requirement", "required", "skills needed", "technical skills"]):
            skills = job.get("technical_skills", [])
            return (
                f"**Required Skills for {job['title']}:**\n\n"
                + "\n".join(f"  • {s}" for s in skills)
                + f"\n\n**Qualification:** {job.get('min_qualification', 'Not specified')}"
            )

        if any(w in msg_lower for w in ["responsibilit", "what will i do", "duties"]):
            resps = job.get("responsibilities", [])
            return (
                f"**Responsibilities for {job['title']}:**\n\n"
                + "\n".join(f"  • {r}" for r in resps)
            )

        if any(w in msg_lower for w in ["stipend", "salary", "pay", "compensation"]):
            return f"The stipend for **{job['title']}** at {job['company']} is **{job.get('stipend', 'Not specified')}**."

        if any(w in msg_lower for w in ["location", "where", "office", "remote"]):
            return f"**{job['title']}** is located in **{job['location']}** ({job['work_mode']})."

        if any(w in msg_lower for w in ["duration", "how long", "months"]):
            return f"The duration for **{job['title']}** is **{job.get('duration', 'Not specified')}**."

        if any(w in msg_lower for w in ["interview round", "selection process", "hiring process"]):
            rounds = job.get("interview_rounds", [])
            return (
                f"**Interview Process for {job['title']}:**\n\n"
                + "\n".join(f"  {r}" for r in rounds)
            )

        # General job info
        return (
            f"📋 **{job['title']}** at {job['company']}\n\n"
            f"{job.get('description', '')}\n\n"
            f"**Domain:** {job['domain']} | **Location:** {job['location']} | "
            f"**Stipend:** {job.get('stipend', 'N/A')}"
        )

    def _get_context(self, session_id: str) -> Dict:
        """Get or create conversation context."""
        if session_id not in self.conversations:
            self.conversations[session_id] = {
                "session_id": session_id,
                "selected_job": None,
                "selected_job_id": None,
                "recent_matches": None,
                "recent_skill_gap": None,
                "last_message": None,
                "last_message_time": None,
                "history": [],
            }
        return self.conversations[session_id]

    def _build_response(self, text: str, intent: str,
                        data: Dict = None, action_needed: str = None,
                        suggestions: List[str] = None) -> Dict:
        """Build a structured response."""
        return {
            "response": text,
            "intent": intent,
            "data": data or {},
            "action_needed": action_needed,
            "suggestions": suggestions or [],
            "timestamp": datetime.now().isoformat(),
        }

    def set_selected_job(self, job: Dict, session_id: str = "default"):
        """Externally set the selected job for a session."""
        context = self._get_context(session_id)
        context["selected_job"] = job
        context["selected_job_id"] = job.get("id", "")

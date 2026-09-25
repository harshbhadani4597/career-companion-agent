"""
M3.3 Routes — Interview Preparation API endpoints.
"""

from flask import Blueprint, request, jsonify

interview_bp = Blueprint("interview_m3", __name__)

# Agent references
_interview_agent = None
_skill_gap_agent = None
_rag_engine = None


def init_interview_routes(interview_agent, skill_gap_agent, rag_engine):
    """Initialize route with agent references."""
    global _interview_agent, _skill_gap_agent, _rag_engine
    _interview_agent = interview_agent
    _skill_gap_agent = skill_gap_agent
    _rag_engine = rag_engine


def _resolve_job(data):
    """Resolve job from request data."""
    job = data.get("job")
    job_id = data.get("job_id")
    if not job and job_id and _rag_engine:
        all_jobs = _rag_engine.get_all_jobs()
        job = next((j for j in all_jobs if j.get("id") == job_id), None)
    return job


@interview_bp.route("/api/interview/prepare", methods=["POST"])
def prepare_interview():
    """
    Generate comprehensive interview preparation with all 5 question categories.
    """
    data = request.get_json() or {}
    student_profile = data.get("student_profile")
    job = _resolve_job(data)
    difficulty_level = data.get("difficulty_level") or data.get("difficulty") or "Medium"

    if not student_profile:
        return jsonify({"error": "Student profile is required."}), 400
    if not job:
        return jsonify({"error": "Job data or valid job_id is required."}), 400
    if not _interview_agent:
        return jsonify({"error": "Interview agent is not initialized."}), 500

    skill_gap = None
    if data.get("include_skill_gap", False) and _skill_gap_agent:
        skill_gap = _skill_gap_agent.analyze(student_profile, job)

    result = _interview_agent.generate_preparation(student_profile, job, skill_gap, difficulty_level=difficulty_level)
    return jsonify(result)


@interview_bp.route("/api/interview/mock/start", methods=["POST"])
def start_mock_interview():
    """
    Start a mock interview session — returns the first question.
    """
    data = request.get_json() or {}
    student_profile = data.get("student_profile")
    job = _resolve_job(data)
    category = data.get("category", "technical")
    difficulty_level = data.get("difficulty_level") or data.get("difficulty") or "Medium"

    if not student_profile:
        return jsonify({"error": "Student profile is required."}), 400
    if not job:
        return jsonify({"error": "Job data or valid job_id is required."}), 400
    if not _interview_agent:
        return jsonify({"error": "Interview agent is not initialized."}), 500

    prep = _interview_agent.generate_preparation(student_profile, job, difficulty_level=difficulty_level)

    # Select questions from the requested category
    category_map = {
        "technical": "technical_questions",
        "resume": "resume_questions",
        "project": "project_questions",
        "role": "role_questions",
        "hr": "hr_questions",
    }
    questions_key = category_map.get(category, "technical_questions")
    questions = prep.get(questions_key, [])

    if not questions:
        return jsonify({"error": f"No questions available for category: {category}"}), 404

    return jsonify({
        "session_category": category,
        "difficulty_level": difficulty_level,
        "total_questions": len(questions),
        "current_index": 0,
        "current_question": questions[0],
        "all_questions": questions,
    })


@interview_bp.route("/api/interview/mock/answer", methods=["POST"])
def submit_mock_answer():
    """
    Submit an answer for mock interview evaluation.
    """
    data = request.get_json() or {}
    question = data.get("question", "")
    expected_concepts = data.get("expected_concepts", [])
    user_answer = data.get("user_answer", "")
    question_type = data.get("question_type", "Technical")
    difficulty_level = data.get("difficulty_level") or data.get("difficulty") or "Medium"

    if not question:
        return jsonify({"error": "Question is required."}), 400
    if not user_answer:
        return jsonify({"error": "Your answer is required."}), 400
    if not _interview_agent:
        return jsonify({"error": "Interview agent is not initialized."}), 500

    result = _interview_agent.evaluate_mock_answer(question, expected_concepts, user_answer, question_type, difficulty_level=difficulty_level)
    return jsonify(result)


@interview_bp.route("/api/interview/simulated-chat", methods=["POST", "OPTIONS"])
def simulated_chat():
    """
    Interactive multi-turn AI mock interviewer turn endpoint.
    """
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json() or {}
    student_profile = data.get("student_profile")
    job = _resolve_job(data)
    current_index = int(data.get("current_question_index", 0))
    candidate_answer = data.get("candidate_answer", "")
    difficulty_level = data.get("difficulty_level") or data.get("difficulty") or "Medium"

    if not student_profile:
        student_profile = {
            "name": "Candidate",
            "education": [{"degree": "B.Tech Computer Science"}],
            "technical_skills": ["Python", "JavaScript", "REST APIs", "Git"],
            "projects": [{"title": "Web Application", "tech_stack": ["React", "Flask"], "description": "Full-stack application"}]
        }

    if not job and _rag_engine:
        all_jobs = _rag_engine.get_all_jobs()
        job = all_jobs[0] if all_jobs else None

    if not job:
        job = {
            "id": "JOB-101",
            "title": "Software Developer Intern",
            "company": "Tech Corp",
            "domain": "Full-Stack Web Development",
            "technical_skills": ["Python", "React", "REST APIs", "SQL"],
            "responsibilities": ["Develop web components", "Integrate REST APIs"],
            "min_qualification": "B.Tech CS/IT"
        }

    if not _interview_agent:
        return jsonify({"error": "Interview agent is not initialized."}), 500

    result = _interview_agent.conduct_simulated_turn(
        student_profile=student_profile,
        job=job,
        candidate_answer=candidate_answer,
        current_question_index=current_index,
        difficulty_level=difficulty_level
    )
    return jsonify(result)


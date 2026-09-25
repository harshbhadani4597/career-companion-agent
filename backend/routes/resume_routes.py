"""
M3.2 Routes — Resume & Cover Letter Customization API endpoints.
"""

from flask import Blueprint, request, jsonify

resume_bp = Blueprint("resume", __name__)

# Agent references — set during app initialization
_resume_agent = None
_skill_gap_agent = None
_rag_engine = None


def init_resume_routes(resume_agent, skill_gap_agent, rag_engine):
    """Initialize route with agent references."""
    global _resume_agent, _skill_gap_agent, _rag_engine
    _resume_agent = resume_agent
    _skill_gap_agent = skill_gap_agent
    _rag_engine = rag_engine


def _resolve_job(data):
    """Resolve job from request data (direct object or ID lookup)."""
    job = data.get("job")
    job_id = data.get("job_id")
    if not job and job_id and _rag_engine:
        all_jobs = _rag_engine.get_all_jobs()
        job = next((j for j in all_jobs if j.get("id") == job_id), None)
    return job


@resume_bp.route("/api/resume/customize", methods=["POST"])
def customize_resume():
    """
    Generate a tailored resume for a target job.

    Request body:
        {
            "student_profile": { ... },
            "job_id": "JOB-101",   // or "job": { ... }
            "include_skill_gap": true  // optional, runs skill gap first
        }
    """
    data = request.get_json() or {}
    student_profile = data.get("student_profile")
    job = _resolve_job(data)

    if not student_profile:
        return jsonify({"error": "Student profile is required."}), 400
    if not job:
        return jsonify({"error": "Job data or valid job_id is required."}), 400
    if not _resume_agent:
        return jsonify({"error": "Resume agent is not initialized."}), 500

    # Optionally run skill gap analysis first
    skill_gap = None
    if data.get("include_skill_gap", False) and _skill_gap_agent:
        skill_gap = _skill_gap_agent.analyze(student_profile, job)

    result = _resume_agent.customize_resume(student_profile, job, skill_gap)
    return jsonify(result)


@resume_bp.route("/api/cover-letter/generate", methods=["POST"])
def generate_cover_letter():
    """
    Generate a role-specific cover letter.

    Request body:
        {
            "student_profile": { ... },
            "job_id": "JOB-101",   // or "job": { ... }
        }
    """
    data = request.get_json() or {}
    student_profile = data.get("student_profile")
    job = _resolve_job(data)

    if not student_profile:
        return jsonify({"error": "Student profile is required."}), 400
    if not job:
        return jsonify({"error": "Job data or valid job_id is required."}), 400
    if not _resume_agent:
        return jsonify({"error": "Resume agent is not initialized."}), 500

    result = _resume_agent.generate_cover_letter(student_profile, job)
    return jsonify(result)


@resume_bp.route("/api/resume/ats-optimize", methods=["POST"])
def ats_optimize_resume():
    """
    Generate an ATS-optimized resume with score and keyword feedback.

    Request body:
        {
            "student_profile": { ... },
            "job_id": "JOB-101",
            "include_skill_gap": true
        }
    """
    data = request.get_json() or {}
    student_profile = data.get("student_profile")
    job = _resolve_job(data)

    if not student_profile:
        return jsonify({"error": "Student profile is required."}), 400
    if not job:
        return jsonify({"error": "Job data or valid job_id is required."}), 400
    if not _resume_agent:
        return jsonify({"error": "Resume agent is not initialized."}), 500

    skill_gap = None
    if data.get("include_skill_gap", False) and _skill_gap_agent:
        skill_gap = _skill_gap_agent.analyze(student_profile, job)

    result = _resume_agent.optimize_ats_resume(student_profile, job, skill_gap)
    return jsonify(result)


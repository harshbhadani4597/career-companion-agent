"""
M3.1 Routes — Skill Gap Analysis API endpoints.
"""

from flask import Blueprint, request, jsonify

skill_gap_bp = Blueprint("skill_gap", __name__)

# Agent reference — set during app initialization
_skill_gap_agent = None
_rag_engine = None


def init_skill_gap_routes(skill_gap_agent, rag_engine):
    """Initialize route with agent references."""
    global _skill_gap_agent, _rag_engine
    _skill_gap_agent = skill_gap_agent
    _rag_engine = rag_engine


@skill_gap_bp.route("/api/skill-gap/analyze", methods=["POST"])
def analyze_skill_gap():
    """
    Analyze skill gaps between a student profile and a target job.

    Request body:
        {
            "student_profile": { ... },
            "job_id": "JOB-101"       // OR provide full job object:
            "job": { ... }
        }
    """
    data = request.get_json() or {}
    student_profile = data.get("student_profile")
    job = data.get("job")
    job_id = data.get("job_id")

    if not student_profile:
        return jsonify({"error": "Student profile is required."}), 400

    # Resolve job from ID if not provided directly
    if not job and job_id and _rag_engine:
        all_jobs = _rag_engine.get_all_jobs()
        job = next((j for j in all_jobs if j.get("id") == job_id), None)

    if not job:
        return jsonify({"error": "Job data or valid job_id is required."}), 400

    if not _skill_gap_agent:
        return jsonify({"error": "Skill gap agent is not initialized."}), 500

    result = _skill_gap_agent.analyze(student_profile, job)
    return jsonify(result)

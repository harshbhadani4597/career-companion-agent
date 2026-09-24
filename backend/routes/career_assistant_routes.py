"""
M3.4 Routes — Conversational Career Assistant API endpoints.
"""

from flask import Blueprint, request, jsonify

career_assistant_bp = Blueprint("career_assistant", __name__)

# Agent reference
_career_agent = None


def init_career_assistant_routes(career_agent):
    """Initialize route with agent reference."""
    global _career_agent
    _career_agent = career_agent


@career_assistant_bp.route("/api/career-assistant/chat", methods=["POST"])
def chat():
    """
    Send a message to the career assistant.

    Request body:
        {
            "message": "Which internships match my profile?",
            "student_profile": { ... },
            "session_id": "user-123",      // optional
            "selected_job": { ... }         // optional context
        }
    """
    data = request.get_json() or {}
    message = data.get("message", "")
    student_profile = data.get("student_profile")
    session_id = data.get("session_id", "default")
    selected_job = data.get("selected_job")

    if not message:
        return jsonify({"error": "Message is required."}), 400

    if not _career_agent:
        return jsonify({"error": "Career assistant is not initialized."}), 500

    # Set job context if provided
    if selected_job:
        _career_agent.set_selected_job(selected_job, session_id)

    result = _career_agent.chat(message, student_profile, session_id)

    # Add message to history
    context = _career_agent._get_context(session_id)
    context["history"].append({
        "role": "user",
        "content": message,
        "timestamp": result.get("timestamp"),
    })
    context["history"].append({
        "role": "assistant",
        "content": result.get("response", ""),
        "intent": result.get("intent"),
        "timestamp": result.get("timestamp"),
    })

    # Limit history size
    if len(context["history"]) > 100:
        context["history"] = context["history"][-100:]

    return jsonify(result)


@career_assistant_bp.route("/api/career-assistant/history", methods=["GET"])
def get_history():
    """
    Get conversation history for a session.

    Query params:
        session_id: optional (defaults to "default")
    """
    session_id = request.args.get("session_id", "default")

    if not _career_agent:
        return jsonify({"error": "Career assistant is not initialized."}), 500

    history = _career_agent.get_history(session_id)
    return jsonify({
        "session_id": session_id,
        "total_messages": len(history),
        "history": history,
    })


@career_assistant_bp.route("/api/career-assistant/context", methods=["POST"])
def set_context():
    """
    Set context for the career assistant (e.g., selected job).

    Request body:
        {
            "session_id": "default",
            "selected_job": { ... }
        }
    """
    data = request.get_json() or {}
    session_id = data.get("session_id", "default")
    selected_job = data.get("selected_job")

    if not _career_agent:
        return jsonify({"error": "Career assistant is not initialized."}), 500

    if selected_job:
        _career_agent.set_selected_job(selected_job, session_id)

    return jsonify({"success": True, "message": "Context updated."})

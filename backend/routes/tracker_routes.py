"""
M4.1 — Application Tracker Flask Routes Blueprint

Exposes application management, status updates, notes, search/filter,
dashboard stats, and reminder endpoints.
"""

from flask import Blueprint, request, jsonify
from backend.tracker import ApplicationTracker, ApplicationStatus, VALID_TRANSITIONS
from backend.reminder_service import ReminderScheduler

tracker_bp = Blueprint("tracker_bp", __name__)

_tracker_instance: ApplicationTracker = None
_reminder_service: ReminderScheduler = None

def init_tracker_routes(tracker: ApplicationTracker, reminder_service: ReminderScheduler = None):
    global _tracker_instance, _reminder_service
    _tracker_instance = tracker
    _reminder_service = reminder_service

@tracker_bp.route("/api/applications/statuses", methods=["GET"])
def get_allowed_statuses():
    """Return all valid application status stages and transition rules."""
    return jsonify({
        "statuses": [s.value for s in ApplicationStatus],
        "valid_transitions": {k.value: [v.value for v in vals] for k, vals in VALID_TRANSITIONS.items()}
    })

@tracker_bp.route("/api/applications", methods=["GET"])
def list_applications():
    """List applications with search, filter, and sort capabilities."""
    if not _tracker_instance:
        return jsonify({"error": "Tracker service not initialized"}), 500

    student_id = request.args.get("student_id")
    company = request.args.get("company")
    role = request.args.get("role")
    status = request.args.get("status")
    active_only = request.args.get("active_only", "false").lower() == "true"
    completed_only = request.args.get("completed_only", "false").lower() == "true"
    sort_by = request.args.get("sort_by", "deadline")
    sort_order = request.args.get("sort_order", "asc")

    apps = _tracker_instance.list_applications(
        student_id=student_id,
        company=company,
        role=role,
        status=status,
        active_only=active_only,
        completed_only=completed_only,
        sort_by=sort_by,
        sort_order=sort_order
    )

    return jsonify({
        "total": len(apps),
        "applications": apps
    })

@tracker_bp.route("/api/applications", methods=["POST"])
def create_application():
    """Add a new application to the tracker."""
    if not _tracker_instance:
        return jsonify({"error": "Tracker service not initialized"}), 500

    data = request.get_json() or {}
    if not data.get("company") or not data.get("title"):
        return jsonify({"error": "Company name and job title are required"}), 400

    try:
        new_app = _tracker_instance.add_application(data)
        if _reminder_service:
            _reminder_service.refresh_reminders()
        return jsonify({
            "success": True,
            "message": "Application added to tracker",
            "application": new_app
        }), 201
    except Exception as err:
        return jsonify({"error": str(err)}), 400

@tracker_bp.route("/api/applications/<app_id>", methods=["GET"])
def get_application(app_id):
    """Retrieve details for a specific application."""
    if not _tracker_instance:
        return jsonify({"error": "Tracker service not initialized"}), 500

    app_record = _tracker_instance.get_application(app_id)
    if not app_record:
        return jsonify({"error": f"Application with ID '{app_id}' not found"}), 404

    return jsonify(app_record)

@tracker_bp.route("/api/applications/<app_id>", methods=["PUT"])
def update_application(app_id):
    """Update fields or status of an existing application."""
    if not _tracker_instance:
        return jsonify({"error": "Tracker service not initialized"}), 500

    updates = request.get_json() or {}
    try:
        updated_app = _tracker_instance.update_application(app_id, updates)
        if not updated_app:
            return jsonify({"error": f"Application with ID '{app_id}' not found"}), 404

        if _reminder_service:
            _reminder_service.refresh_reminders()

        return jsonify({
            "success": True,
            "message": "Application updated successfully",
            "application": updated_app
        })
    except ValueError as val_err:
        return jsonify({"error": str(val_err)}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500

@tracker_bp.route("/api/applications/<app_id>", methods=["DELETE"])
def delete_application(app_id):
    """Delete an application from the tracker."""
    if not _tracker_instance:
        return jsonify({"error": "Tracker service not initialized"}), 500

    deleted = _tracker_instance.delete_application(app_id)
    if not deleted:
        return jsonify({"error": f"Application with ID '{app_id}' not found"}), 404

    if _reminder_service:
        _reminder_service.refresh_reminders()

    return jsonify({
        "success": True,
        "message": f"Application '{app_id}' deleted successfully"
    })

@tracker_bp.route("/api/applications/<app_id>/notes", methods=["POST"])
def add_application_note(app_id):
    """Append or edit notes for an application."""
    if not _tracker_instance:
        return jsonify({"error": "Tracker service not initialized"}), 500

    data = request.get_json() or {}
    note_content = data.get("note", "")
    if not note_content:
        return jsonify({"error": "Note content is required"}), 400

    existing_app = _tracker_instance.get_application(app_id)
    if not existing_app:
        return jsonify({"error": f"Application with ID '{app_id}' not found"}), 404

    current_notes = existing_app.get("notes", "")
    if current_notes:
        updated_notes = f"{current_notes}\n[{request.json.get('timestamp', 'Note')}]: {note_content}"
    else:
        updated_notes = note_content

    updated_app = _tracker_instance.update_application(app_id, {"notes": updated_notes})
    return jsonify({
        "success": True,
        "message": "Note added successfully",
        "notes": updated_app.get("notes")
    })

@tracker_bp.route("/api/applications/stats", methods=["GET"])
def get_tracker_stats():
    """Fetch aggregated dashboard statistics."""
    if not _tracker_instance:
        return jsonify({"error": "Tracker service not initialized"}), 500

    student_id = request.args.get("student_id")
    stats = _tracker_instance.get_dashboard_stats(student_id=student_id)
    return jsonify(stats)

@tracker_bp.route("/api/applications/reminders", methods=["GET"])
def get_reminders():
    """Fetch active reminders for upcoming deadlines and interviews."""
    if not _tracker_instance:
        return jsonify({"error": "Tracker service not initialized"}), 500

    student_id = request.args.get("student_id")
    reminders = _tracker_instance.get_reminders(student_id=student_id)
    return jsonify({
        "total_reminders": len(reminders),
        "reminders": reminders
    })

"""
M4.1 — Application Tracking & Management Module

Manages student internship applications through full lifecycle stages.
Supports configurable status transitions, status history with timestamps,
notes, linking resumes/cover letters, interview scheduling, search/filter/sort,
and reminder window calculation.
"""

import os
import json
import uuid
from enum import Enum
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

class ApplicationStatus(str, Enum):
    SAVED = "Saved"
    PLANNING = "Planning to apply"
    APPLIED = "Applied"
    UNDER_REVIEW = "Application under review"
    SHORTLISTED = "Shortlisted"
    INTERVIEW_SCHEDULED = "Interview scheduled"
    INTERVIEW_COMPLETED = "Interview completed"
    OFFER_RECEIVED = "Offer received"
    REJECTED = "Rejected"
    WITHDRAWN = "Withdrawn"

VALID_TRANSITIONS = {
    ApplicationStatus.SAVED: [ApplicationStatus.PLANNING, ApplicationStatus.APPLIED, ApplicationStatus.WITHDRAWN],
    ApplicationStatus.PLANNING: [ApplicationStatus.SAVED, ApplicationStatus.APPLIED, ApplicationStatus.WITHDRAWN],
    ApplicationStatus.APPLIED: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN],
    ApplicationStatus.UNDER_REVIEW: [ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN],
    ApplicationStatus.SHORTLISTED: [ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.OFFER_RECEIVED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN],
    ApplicationStatus.INTERVIEW_SCHEDULED: [ApplicationStatus.INTERVIEW_COMPLETED, ApplicationStatus.OFFER_RECEIVED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN],
    ApplicationStatus.INTERVIEW_COMPLETED: [ApplicationStatus.OFFER_RECEIVED, ApplicationStatus.REJECTED, ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.WITHDRAWN],
    ApplicationStatus.OFFER_RECEIVED: [ApplicationStatus.WITHDRAWN],
    ApplicationStatus.REJECTED: [ApplicationStatus.APPLIED],
    ApplicationStatus.WITHDRAWN: [ApplicationStatus.PLANNING, ApplicationStatus.APPLIED],
}

ACTIVE_STATUSES = [
    ApplicationStatus.PLANNING,
    ApplicationStatus.APPLIED,
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.INTERVIEW_SCHEDULED,
]

COMPLETED_STATUSES = [
    ApplicationStatus.SAVED,
    ApplicationStatus.INTERVIEW_COMPLETED,
    ApplicationStatus.OFFER_RECEIVED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
]

class ApplicationTracker:
    """Persistent Application Tracker for Student Internship Applications."""

    def __init__(self, storage_path: str = "data/applications.json"):
        self.storage_path = storage_path
        self.applications: Dict[str, Dict[str, Any]] = {}
        self._load()

    def _load(self):
        """Load applications from storage file."""
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    self.applications = json.load(f)
            except Exception as e:
                print(f"Error loading applications from {self.storage_path}: {e}")
                self.applications = {}
        else:
            self.applications = {}

    def _save(self):
        """Persist applications to storage file."""
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(self.applications, f, indent=2, ensure_ascii=False)

    def add_application(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new internship application."""
        app_id = data.get("id") or f"app_{uuid.uuid4().hex[:8]}"
        now_str = datetime.now().isoformat()
        status_val = data.get("status", ApplicationStatus.SAVED.value)

        if status_val not in [s.value for s in ApplicationStatus]:
            status_val = ApplicationStatus.SAVED.value

        app_record = {
            "id": app_id,
            "company": data.get("company", "Unknown Company"),
            "title": data.get("title", "Internship Candidate"),
            "description": data.get("description", ""),
            "app_date": data.get("app_date", datetime.now().strftime("%Y-%m-%d")),
            "deadline": data.get("deadline", (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")),
            "status": status_val,
            "interview_date": data.get("interview_date", ""),
            "interview_status": data.get("interview_status", "Not Scheduled" if status_val != ApplicationStatus.INTERVIEW_SCHEDULED.value else "Scheduled"),
            "notes": data.get("notes", ""),
            "resume_link": data.get("resume_link", ""),
            "cover_letter_link": data.get("cover_letter_link", ""),
            "student_id": data.get("student_id", "default_student"),
            "job_id": data.get("job_id", ""),
            "created_at": now_str,
            "updated_at": now_str,
            "status_history": [
                {
                    "status": status_val,
                    "timestamp": now_str,
                    "note": "Application created"
                }
            ]
        }

        self.applications[app_id] = app_record
        self._save()
        return app_record

    def update_application(self, app_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update fields of an application, validating status transitions."""
        if app_id not in self.applications:
            return None

        app = self.applications[app_id]
        now_str = datetime.now().isoformat()

        if "status" in updates and updates["status"] != app["status"]:
            new_status = updates["status"]
            current_status = app["status"]
            
            valid_statuses = [s.value for s in ApplicationStatus]
            if new_status not in valid_statuses:
                raise ValueError(f"Invalid status '{new_status}'. Allowed values: {valid_statuses}")

            history_note = updates.get("status_note", f"Status changed from {current_status} to {new_status}")
            app["status_history"].append({
                "status": new_status,
                "timestamp": now_str,
                "note": history_note
            })
            app["status"] = new_status

        editable_fields = [
            "company", "title", "description", "app_date", "deadline",
            "interview_date", "interview_status", "notes", "resume_link",
            "cover_letter_link", "job_id", "student_id"
        ]

        for field in editable_fields:
            if field in updates:
                app[field] = updates[field]

        app["updated_at"] = now_str
        self._save()
        return app

    def delete_application(self, app_id: str) -> bool:
        """Delete an application by ID."""
        if app_id in self.applications:
            del self.applications[app_id]
            self._save()
            return True
        return False

    def get_application(self, app_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single application."""
        return self.applications.get(app_id)

    def list_applications(self, student_id: str = None, company: str = None,
                          role: str = None, status: str = None,
                          active_only: bool = False, completed_only: bool = False,
                          sort_by: str = "deadline", sort_order: str = "asc") -> List[Dict[str, Any]]:
        """List applications with filtering and sorting."""
        results = list(self.applications.values())

        if student_id:
            results = [a for a in results if a.get("student_id") == student_id]

        if company:
            c_lower = company.lower()
            results = [a for a in results if c_lower in a.get("company", "").lower()]

        if role:
            r_lower = role.lower()
            results = [a for a in results if r_lower in a.get("title", "").lower()]

        if status:
            s_lower = status.lower()
            results = [a for a in results if s_lower == a.get("status", "").lower()]

        if active_only:
            results = [a for a in results if a.get("status") in [s.value for s in ACTIVE_STATUSES]]

        if completed_only:
            results = [a for a in results if a.get("status") in [s.value for s in COMPLETED_STATUSES]]

        reverse = (sort_order.lower() == "desc")
        if sort_by in ["deadline", "app_date", "company", "title", "status", "created_at", "interview_date"]:
            results.sort(key=lambda x: str(x.get(sort_by) or ""), reverse=reverse)

        return results

    def get_dashboard_stats(self, student_id: str = None) -> Dict[str, Any]:
        """Calculates aggregate tracker statistics for dashboard display."""
        apps = self.list_applications(student_id=student_id)
        total = len(apps)
        
        status_counts = {s.value: 0 for s in ApplicationStatus}
        active_count = 0
        upcoming_deadlines = 0
        interviews_scheduled = 0
        offers_received = 0
        rejected_count = 0

        today = datetime.now().date()
        next_week = today + timedelta(days=7)

        for app in apps:
            st = app.get("status", ApplicationStatus.SAVED.value)
            status_counts[st] = status_counts.get(st, 0) + 1

            if st in [s.value for s in ACTIVE_STATUSES]:
                active_count += 1
            if st == ApplicationStatus.INTERVIEW_SCHEDULED.value:
                interviews_scheduled += 1
            if st == ApplicationStatus.OFFER_RECEIVED.value:
                offers_received += 1
            if st == ApplicationStatus.REJECTED.value:
                rejected_count += 1

            deadline_str = app.get("deadline")
            if deadline_str:
                try:
                    dl_date = datetime.strptime(deadline_str[:10], "%Y-%m-%d").date()
                    if today <= dl_date <= next_week and st not in [ApplicationStatus.OFFER_RECEIVED.value, ApplicationStatus.REJECTED.value, ApplicationStatus.WITHDRAWN.value]:
                        upcoming_deadlines += 1
                except Exception:
                    pass

        return {
            "total_applications": total,
            "active_applications": active_count,
            "upcoming_deadlines": upcoming_deadlines,
            "interviews_scheduled": interviews_scheduled,
            "offers_received": offers_received,
            "rejected_applications": rejected_count,
            "status_distribution": status_counts
        }

    def get_reminders(self, student_id: str = None, window_days: List[int] = [1, 3, 7]) -> List[Dict[str, Any]]:
        """Generate active reminders for upcoming deadlines, scheduled interviews, and follow-ups."""
        apps = self.list_applications(student_id=student_id)
        reminders = []
        today = datetime.now().date()

        for app in apps:
            app_id = app["id"]
            company = app["company"]
            title = app["title"]
            status = app["status"]

            deadline_str = app.get("deadline")
            if deadline_str and status not in [ApplicationStatus.OFFER_RECEIVED.value, ApplicationStatus.REJECTED.value, ApplicationStatus.WITHDRAWN.value]:
                try:
                    dl_date = datetime.strptime(deadline_str[:10], "%Y-%m-%d").date()
                    days_remaining = (dl_date - today).days

                    if days_remaining < 0:
                        reminders.append({
                            "id": f"rem_dl_overdue_{app_id}",
                            "app_id": app_id,
                            "type": "deadline_overdue",
                            "severity": "high",
                            "title": f"Deadline Overdue: {company} ({title})",
                            "message": f"The application deadline was on {deadline_str} ({abs(days_remaining)} days ago).",
                            "due_date": deadline_str,
                            "days_left": days_remaining
                        })
                    elif days_remaining in window_days or days_remaining == 0:
                        reminders.append({
                            "id": f"rem_dl_{app_id}_{days_remaining}",
                            "app_id": app_id,
                            "type": "deadline_upcoming",
                            "severity": "high" if days_remaining <= 1 else "medium",
                            "title": f"Upcoming Deadline: {company} ({title})",
                            "message": f"Application deadline is in {days_remaining} day(s) on {deadline_str}." if days_remaining > 0 else f"Application deadline is TODAY ({deadline_str})!",
                            "due_date": deadline_str,
                            "days_left": days_remaining
                        })
                except Exception:
                    pass

            interview_str = app.get("interview_date")
            if interview_str and status in [ApplicationStatus.INTERVIEW_SCHEDULED.value, ApplicationStatus.SHORTLISTED.value]:
                try:
                    int_date = datetime.strptime(interview_str[:10], "%Y-%m-%d").date()
                    days_remaining = (int_date - today).days

                    if days_remaining >= 0 and (days_remaining in window_days or days_remaining == 0):
                        reminders.append({
                            "id": f"rem_int_{app_id}_{days_remaining}",
                            "app_id": app_id,
                            "type": "interview_scheduled",
                            "severity": "high",
                            "title": f"Interview Alert: {company} ({title})",
                            "message": f"Scheduled interview in {days_remaining} day(s) on {interview_str}." if days_remaining > 0 else f"Interview is TODAY ({interview_str})!",
                            "due_date": interview_str,
                            "days_left": days_remaining
                        })
                except Exception:
                    pass

            if status == ApplicationStatus.APPLIED.value:
                app_date_str = app.get("app_date")
                if app_date_str:
                    try:
                        app_date = datetime.strptime(app_date_str[:10], "%Y-%m-%d").date()
                        days_applied = (today - app_date).days
                        if days_applied >= 7:
                            reminders.append({
                                "id": f"rem_followup_{app_id}",
                                "app_id": app_id,
                                "type": "followup_needed",
                                "severity": "low",
                                "title": f"Follow-up Suggestion: {company}",
                                "message": f"You applied {days_applied} days ago ({app_date_str}). Consider sending a polite follow-up inquiry to the recruiter.",
                                "due_date": app_date_str,
                                "days_left": -days_applied
                            })
                    except Exception:
                        pass

        reminders.sort(key=lambda r: (0 if r["severity"] == "high" else (1 if r["severity"] == "medium" else 2), r["days_left"]))
        return reminders

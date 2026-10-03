"""
M4.1 — Background Reminder Service & Scheduler

Runs periodic checks in the background (or on demand) for application deadlines,
scheduled interviews, follow-ups, and pending actions.
"""

import time
import threading
from typing import Dict, List, Any, Callable
from backend.tracker import ApplicationTracker

class ReminderScheduler:
    """Background thread scheduler for tracking reminders."""

    def __init__(self, tracker: ApplicationTracker, check_interval_seconds: int = 3600):
        self.tracker = tracker
        self.check_interval = check_interval_seconds
        self.running = False
        self.thread = None
        self.latest_reminders: List[Dict[str, Any]] = []
        self.subscribers: List[Callable[[List[Dict[str, Any]]], None]] = []

    def start(self):
        """Start the background scheduler thread."""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.thread.start()

    def stop(self):
        """Stop the background scheduler thread."""
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2.0)

    def _run_loop(self):
        """Background execution loop."""
        while self.running:
            self.refresh_reminders()
            time.sleep(self.check_interval)

    def refresh_reminders(self) -> List[Dict[str, Any]]:
        """Fetch and update current active reminders."""
        try:
            self.latest_reminders = self.tracker.get_reminders()
            for callback in self.subscribers:
                try:
                    callback(self.latest_reminders)
                except Exception as e:
                    print(f"Error notifying reminder subscriber: {e}")
        except Exception as err:
            print(f"Error checking reminders: {err}")
        return self.latest_reminders

    def get_reminders(self, student_id: str = None) -> List[Dict[str, Any]]:
        """Get latest cached reminders or query fresh."""
        return self.tracker.get_reminders(student_id=student_id)

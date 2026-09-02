import React from "react";

export function ApplicationsPage({ applications, darkMode }) {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Saved":
        return darkMode
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-100 text-slate-700 border-slate-200";
      case "Applied":
        return darkMode
          ? "bg-blue-950/60 text-blue-300 border-blue-800/40"
          : "bg-blue-50 text-blue-700 border-blue-200";
      case "Interview":
        return darkMode
          ? "bg-purple-950/60 text-purple-300 border-purple-800/40"
          : "bg-purple-50 text-purple-700 border-purple-200";
      case "Selected":
        return darkMode
          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/40"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Rejected":
        return darkMode
          ? "bg-red-950/60 text-red-300 border-red-800/40"
          : "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-800 text-slate-300";
    }
  };

  return (
    <div className="space-y-8">
      <div className={`rounded-3xl p-6 sm:p-8 shadow-sm border transition-all ${
        darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        <h2 className="text-2xl font-bold">Internship Applications Tracker</h2>
        <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          Track saved, applied, interviewing, and selected internships in your active career pipeline.
        </p>
      </div>

      {applications?.length === 0 ? (
        <div className={`rounded-3xl p-12 text-center border space-y-3 transition-all ${
          darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}>
          <span className="text-4xl block">📌</span>
          <h3 className="text-lg font-bold">No applications tracked yet</h3>
          <p className={`text-sm max-w-md mx-auto ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            Browse internship recommendations under the "Internship Matching" tab and click "+ Track / Save Application" to add them to your tracker.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app, idx) => (
            <div
              key={idx}
              className={`rounded-3xl shadow-sm border p-6 space-y-4 transition-all ${
                darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${getStatusBadgeClass(app.status)}`}>
                  {app.status}
                </span>
                <span className={`text-xs font-mono ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{app.job_id}</span>
              </div>

              <div>
                <h3 className="text-lg font-bold">{app.title}</h3>
                <p className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{app.company}</p>
                <p className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>📍 {app.location}</p>
              </div>

              <div className={`pt-3 border-t text-xs flex justify-between ${
                darkMode ? "border-slate-800 text-slate-500" : "border-slate-100 text-slate-400"
              }`}>
                <span>Added: {app.created_at ? new Date(app.created_at).toLocaleDateString() : "Today"}</span>
                {app.applied_at && <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

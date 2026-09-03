import React from "react";

export function DashboardPage({ profile, jobMatches, skillGaps, applications, setActiveTab, darkMode }) {
  const topMatch = jobMatches.length > 0 ? jobMatches[0] : null;

  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 22) return "Good evening";
    return "Good night";
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "☀️";
    if (hour >= 12 && hour < 17) return "🌤️";
    if (hour >= 17 && hour < 22) return "🌆";
    return "🌙";
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome Banner */}
      <div className={`rounded-3xl p-8 shadow-xl transition-all duration-300 ${
        darkMode
          ? "bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-blue-800/40 text-white shadow-blue-950/40"
          : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-500/20"
      }`}>
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 font-semibold px-3 py-1 rounded-full text-xs border border-emerald-500/30">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
              Live Monitoring & RAG Active
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
            {getDynamicGreeting()}, {profile?.name || "Candidate"} {getGreetingEmoji()}
          </h1>
          <p className="mt-3 text-blue-100/90 text-sm sm:text-base leading-relaxed">
            Your AI Career Companion is actively evaluating 160+ internship postings, calculating transparent match scores, and mapping actionable skill gap learning paths.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={() => setActiveTab("resume")}
              className="bg-white text-blue-900 hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98] px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all duration-200"
            >
              📄 Upload / Update Resume
            </button>
            <button
              onClick={() => setActiveTab("matching")}
              className="bg-blue-600/80 hover:bg-blue-600 text-white hover:scale-[1.02] active:scale-[0.98] px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all duration-200 border border-blue-400/30"
            >
              🎯 Explore Job Matches ({jobMatches.length})
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards - Sleek Dark / Light rounded-3xl cards with Hover Lift */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Profile Completion */}
        <div className={`p-6 rounded-3xl shadow-sm border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${
          darkMode ? "bg-slate-900 border-slate-800 text-white hover:border-blue-500/40" : "bg-white border-slate-200 text-slate-900 hover:border-blue-300"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Profile Completion
            </span>
            <span className="text-xl animate-float">👤</span>
          </div>
          <p className="text-3xl font-black mt-2">
            {profile ? "95%" : "20%"}
          </p>
          <div className={`w-full rounded-full h-2 mt-3 ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: profile ? "95%" : "20%" }}
            ></div>
          </div>
          <p className={`text-xs mt-2 font-medium ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            {profile ? "✓ MongoDB Candidate Record Verified" : "Upload resume to complete profile"}
          </p>
        </div>

        {/* Resume Status */}
        <div className={`p-6 rounded-3xl shadow-sm border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${
          darkMode ? "bg-slate-900 border-slate-800 text-white hover:border-emerald-500/40" : "bg-white border-slate-200 text-slate-900 hover:border-emerald-300"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Resume Status
            </span>
            <span className="text-xl animate-float">📄</span>
          </div>
          <p className="text-xl font-bold mt-2">
            {profile ? "Parsed & Verified" : "Not Uploaded"}
          </p>
          <span className={`inline-block mt-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
            profile
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          }`}>
            {profile ? "✓ Ready for RAG Matching" : "Action Required"}
          </span>
        </div>

        {/* Top Match Score */}
        <div className={`p-6 rounded-3xl shadow-sm border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${
          darkMode ? "bg-slate-900 border-slate-800 text-white hover:border-purple-500/40" : "bg-white border-slate-200 text-slate-900 hover:border-purple-300"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Top Match Score
            </span>
            <span className="text-xl animate-float">🎯</span>
          </div>
          <p className="text-3xl font-black text-purple-500 mt-2">
            {topMatch ? `${topMatch.match_percentage}%` : "--"}
          </p>
          <p className={`text-xs mt-2 truncate font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            {topMatch ? `${topMatch.title} @ ${topMatch.company}` : "Upload resume to calculate score"}
          </p>
        </div>

        {/* Applications Tracked */}
        <div className={`p-6 rounded-3xl shadow-sm border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${
          darkMode ? "bg-slate-900 border-slate-800 text-white hover:border-indigo-500/40" : "bg-white border-slate-200 text-slate-900 hover:border-indigo-300"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Applications Tracked
            </span>
            <span className="text-xl animate-float">📌</span>
          </div>
          <p className="text-3xl font-black mt-2">
            {applications?.length || 0}
          </p>
          <p className={`text-xs mt-2 font-medium ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            Active pipeline entries
          </p>
        </div>
      </div>

      {/* Top Match Spotlight */}
      {topMatch && (
        <div className={`rounded-3xl p-6 sm:p-8 shadow-xl border relative overflow-hidden transition-all duration-300 hover:border-purple-500/50 ${
          darkMode ? "bg-slate-900 border-purple-900/40 text-white" : "bg-white border-purple-100 text-slate-900"
        }`}>
          <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl shadow animate-pulse">
            🔥 Top Recommended Match
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="text-xs font-semibold text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/40">
                {topMatch.work_mode} | {topMatch.location}
              </span>
              <h2 className="text-2xl font-bold mt-3">{topMatch.title}</h2>
              <p className={`text-sm font-medium mt-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                {topMatch.company} • <span className="text-emerald-400 font-bold">{topMatch.stipend}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-center px-5 py-3 rounded-2xl border ${
                darkMode ? "bg-slate-800/60 border-purple-800/30" : "bg-purple-50 border-purple-100"
              }`}>
                <span className="text-3xl font-black text-purple-500 block leading-none">
                  {topMatch.match_percentage}%
                </span>
                <span className="text-xs font-semibold text-purple-400 mt-1 block">Match Score</span>
              </div>
              <button
                onClick={() => setActiveTab("matching")}
                className="bg-purple-600 hover:bg-purple-500 hover:scale-[1.03] active:scale-[0.97] text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-md transition-all duration-200"
              >
                View Details & Apply →
              </button>
            </div>
          </div>

          <div className={`mt-6 border-t pt-6 ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-slate-400" : "text-slate-700"}`}>
              AI Match Explanation
            </h4>
            <p className={`text-sm p-4 rounded-2xl leading-relaxed ${
              darkMode ? "bg-slate-800/40 text-slate-300 border border-slate-800" : "bg-slate-50 text-slate-600"
            }`}>
              {topMatch.reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { searchJobs } from "../services/api";

export function MatchingPage({ jobMatches, profile, onSaveApplication, darkMode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const displayJobs = searchResults || jobMatches;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const res = await searchJobs(searchQuery, 10);
      setSearchResults(res.jobs);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Search Bar */}
      <div className={`rounded-3xl p-6 sm:p-8 shadow-sm border transition-all ${
        darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold">Internship Matching & RAG Search</h2>
          <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Jobs ranked transparently using vector embeddings (SentenceTransformers), ChromaDB / NumPy RAG, and 5-factor candidate feature scoring.
          </p>

          <form onSubmit={handleSearch} className="mt-6 flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role or domain (e.g. Machine Learning, React, AWS Cloud, Remote)..."
              className={`flex-1 border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${
                darkMode ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-300 text-slate-900"
              }`}
            />
            <button
              type="submit"
              disabled={searching}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow transition-all flex items-center gap-2"
            >
              {searching ? "Searching Vector DB..." : "🔍 Search Jobs"}
            </button>
            {searchResults && (
              <button
                type="button"
                onClick={() => { setSearchResults(null); setSearchQuery(""); }}
                className={`font-semibold px-4 py-3 rounded-2xl text-sm ${
                  darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
            {searchResults ? `Search Results (${searchResults.length})` : `Top Recommended Matches (${jobMatches.length})`}
          </h3>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            darkMode ? "bg-slate-900 border border-slate-800 text-slate-400" : "bg-slate-200 text-slate-600"
          }`}>
            160 Jobs Vector Index Active
          </span>
        </div>

        {displayJobs.map((job) => (
          <div
            key={job.job_id}
            className={`rounded-3xl shadow-sm border p-6 sm:p-8 transition-all ${
              darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-800/40">
                    {job.job_id}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                    darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                  }`}>
                    📍 {job.location} ({job.work_mode})
                  </span>
                </div>
                <h3 className="text-xl font-bold mt-2">{job.title}</h3>
                <p className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-700"}`}>
                  {job.company} • <span className="text-emerald-400 font-bold">{job.stipend || "₹25,000 / month"}</span>
                </p>
              </div>

              {job.match_percentage !== undefined && (
                <div className="text-right">
                  <div className="text-3xl font-black text-purple-500">
                    {job.match_percentage}%
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                    Match Score
                  </span>
                </div>
              )}
            </div>

            <p className={`text-sm mt-4 leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
              {job.description}
            </p>

            {/* Matched & Missing Skills */}
            <div className={`mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-5 ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
              <div>
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">✓ Matched Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.matched_skills?.length > 0 ? (
                    job.matched_skills.map((sk, idx) => (
                      <span key={idx} className={`font-semibold px-2.5 py-1 rounded-lg text-xs border ${
                        darkMode ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/40" : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}>
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">None matched</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">⚠ Skills to Improve</h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.missing_skills?.length > 0 ? (
                    job.missing_skills.map((sk, idx) => (
                      <span key={idx} className={`font-semibold px-2.5 py-1 rounded-lg text-xs border ${
                        darkMode ? "bg-amber-950/60 text-amber-300 border-amber-800/40" : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold">100% Skill Coverage!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Score Breakdown if present */}
            {job.score_breakdown && (
              <div className={`mt-4 p-4 rounded-2xl text-xs space-y-2 border ${
                darkMode ? "bg-slate-800/50 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-600"
              }`}>
                <p className="font-bold text-slate-300">5-Factor Transparent Score Breakdown:</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>Skills (50%): <strong className={darkMode ? "text-white" : "text-slate-800"}>{job.score_breakdown.skill_score_50pct}%</strong></div>
                  <div>Education (15%): <strong className={darkMode ? "text-white" : "text-slate-800"}>{job.score_breakdown.education_score_15pct}%</strong></div>
                  <div>Projects (15%): <strong className={darkMode ? "text-white" : "text-slate-800"}>{job.score_breakdown.project_score_15pct}%</strong></div>
                  <div>Semantic (15%): <strong className={darkMode ? "text-white" : "text-slate-800"}>{job.score_breakdown.semantic_score_15pct}%</strong></div>
                  <div>Location (5%): <strong className={darkMode ? "text-white" : "text-slate-800"}>{job.score_breakdown.location_score_5pct}%</strong></div>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className={`mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-4 ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
              <a
                href={job.application_url || "#"}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-blue-400 hover:underline"
              >
                🔗 View Verified Internship Source
              </a>
              <button
                onClick={() => onSaveApplication && onSaveApplication(job)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-all"
              >
                + Track / Save Application
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

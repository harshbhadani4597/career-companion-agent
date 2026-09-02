import React, { useState } from "react";
import { uploadResume } from "../services/api";

export function ResumePage({ onResumeParsed, profile, darkMode }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF resume file first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await uploadResume(file);
      if (onResumeParsed) {
        onResumeParsed(data);
      }
    } catch (err) {
      setError(err.message || "Error uploading resume. Check FastAPI backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Card */}
      <div className={`rounded-3xl shadow-sm border p-8 transition-all ${
        darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold">Upload Your Resume (PDF)</h2>
          <p className={`mt-2 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Our AI parser powered by PyMuPDF and Google Gemini will automatically extract your technical skills, education, work experience, projects, and certifications.
          </p>

          <div className={`mt-6 border-2 border-dashed rounded-3xl p-8 text-center transition-colors ${
            darkMode ? "border-slate-700 bg-slate-850 hover:border-blue-500" : "border-slate-300 bg-slate-50 hover:border-blue-500"
          }`}>
            <input
              type="file"
              accept=".pdf"
              id="resume-input"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="resume-input" className="cursor-pointer space-y-3 block">
              <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-2xl mx-auto shadow-inner border border-blue-500/30">
                📁
              </div>
              <div>
                <span className="text-blue-400 font-semibold hover:underline">Click to browse</span> or drag & drop PDF resume
              </div>
              <p className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>PDF files up to 10MB supported</p>
            </label>

            {file && (
              <div className={`mt-4 p-3 rounded-2xl border text-sm font-medium flex items-center justify-between max-w-md mx-auto shadow-sm ${
                darkMode ? "bg-slate-800 border-blue-900/50 text-slate-200" : "bg-white border-blue-200 text-slate-700"
              }`}>
                <span className="truncate">📄 {file.name}</span>
                <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-950/60 text-red-300 text-sm font-medium rounded-2xl border border-red-800/40">
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-bold px-6 py-3.5 rounded-2xl text-sm shadow transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Parsing & Extracting Profile with AI...
              </>
            ) : (
              "Upload & Extract Profile"
            )}
          </button>
        </div>
      </div>

      {/* Extracted Information Display */}
      {profile && (
        <div className={`rounded-3xl shadow-sm border p-8 space-y-8 transition-all ${
          darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}>
          <div className={`flex items-center justify-between border-b pb-5 ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
            <div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
                ✓ Gemini AI Extraction Verified
              </span>
              <h3 className="text-2xl font-bold mt-2">{profile.name || "Candidate Name"}</h3>
              <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{profile.email} • {profile.phone}</p>
            </div>
          </div>

          {/* Extracted Skills */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? "text-slate-400" : "text-slate-700"}`}>Extracted Skills</h4>
            <div className="flex flex-wrap gap-2">
              {profile.skills?.map((skill, idx) => (
                <span key={idx} className={`font-semibold px-3 py-1.5 rounded-xl text-sm border ${
                  darkMode ? "bg-blue-950/60 text-blue-300 border-blue-800/40" : "bg-blue-50 text-blue-700 border-blue-100"
                }`}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Education */}
          {profile.education?.length > 0 && (
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? "text-slate-400" : "text-slate-700"}`}>Education</h4>
              <div className="space-y-3">
                {profile.education.map((edu, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-850 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                    <p className="font-bold">{edu.degree}</p>
                    <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{edu.institution || edu.college} {edu.branch ? `• ${edu.branch}` : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {profile.projects?.length > 0 && (
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? "text-slate-400" : "text-slate-700"}`}>Key Projects</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.projects.map((proj, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border space-y-1 ${darkMode ? "bg-slate-850 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                    <p className="font-bold">{proj.name}</p>
                    <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

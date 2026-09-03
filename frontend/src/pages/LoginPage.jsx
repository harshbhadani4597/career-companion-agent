import React, { useState } from "react";
import { loginApi, registerApi } from "../services/api";

export function LoginPage({ onLoginSuccess, darkMode }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error("Please enter your full name.");
        const data = await registerApi(name, email, password, phone);
        onLoginSuccess(data);
      } else {
        const data = await loginApi(email, password);
        onLoginSuccess(data);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoName = "Demo Student") => {
    setLoading(true);
    setError("");
    try {
      const data = await loginApi(demoEmail, "password123");
      onLoginSuccess(data);
    } catch (err) {
      // Fallback local demo login if backend is initializing
      onLoginSuccess({
        user: { name: demoName, email: demoEmail },
        profile: {
          name: demoName,
          email: demoEmail,
          skills: ["Python", "Machine Learning", "React", "SQL", "Pandas"],
          education: [{ degree: "B.Tech", institution: "IIT", branch: "Computer Science" }],
          projects: [{ name: "AI Internship Companion", description: "Built RAG job matching platform." }],
          certifications: ["Google Data Analytics"]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-md w-full rounded-3xl p-8 shadow-2xl border transition-all ${
        darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        {/* Branding Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white mx-auto shadow-xl shadow-blue-500/20">
            AI
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isRegister ? "Create Your Account" : "Sign In to Career Companion"}
          </h2>
          <p className={`text-xs sm:text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            AI-powered internship matching, resume parsing & skill gap roadmaps.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={`mt-6 p-1 rounded-2xl flex border ${
          darkMode ? "bg-slate-850 border-slate-800" : "bg-slate-100 border-slate-200"
        }`}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(""); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              !isRegister
                ? "bg-blue-600 text-white shadow-md"
                : darkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(""); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              isRegister
                ? "bg-blue-600 text-white shadow-md"
                : darkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-red-950/60 text-red-300 text-xs font-semibold rounded-2xl border border-red-800/40">
            ⚠️ {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                darkMode ? "text-slate-400" : "text-slate-700"
              }`}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Student Full Name"
                className={`w-full border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  darkMode ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-300 text-slate-900"
                }`}
                required={isRegister}
              />
            </div>
          )}

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
              darkMode ? "text-slate-400" : "text-slate-700"
            }`}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className={`w-full border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                darkMode ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-300 text-slate-900"
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
              darkMode ? "text-slate-400" : "text-slate-700"
            }`}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                darkMode ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-300 text-slate-900"
              }`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              isRegister ? "Complete Registration →" : "Sign In to Dashboard →"
            )}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className={`mt-8 pt-6 border-t ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
          <p className={`text-xs font-bold uppercase tracking-wider text-center mb-3 ${
            darkMode ? "text-slate-400" : "text-slate-500"
          }`}>
            ⚡ Quick Demo Access
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleDemoLogin("harsh.student@example.com", "Harsh Rajpal")}
              disabled={loading}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                darkMode ? "bg-slate-800 hover:bg-slate-750 border-slate-700 text-blue-300" : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-blue-700"
              }`}
            >
              <span>🚀</span> Demo Candidate
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin("guest@example.com", "Guest Candidate")}
              disabled={loading}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                darkMode ? "bg-slate-800 hover:bg-slate-750 border-slate-700 text-emerald-300" : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-emerald-700"
              }`}
            >
              <span>👤</span> Guest Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

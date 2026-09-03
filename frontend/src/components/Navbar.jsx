import React from "react";

export function Navbar({ activeTab, setActiveTab, darkMode, toggleDarkMode, user, onLogout, onShowLogin }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "resume", label: "Resume Upload", icon: "📄" },
    { id: "profile", label: "Candidate Profile", icon: "👤" },
    { id: "matching", label: "Internship Matching", icon: "🎯" },
    { id: "skillgap", label: "Skill Gap Analysis", icon: "💡" },
    { id: "applications", label: "Applications", icon: "📌" },
  ];

  return (
    <header className={`${darkMode ? "bg-slate-950 border-b border-slate-800" : "bg-slate-900"} text-white shadow-xl sticky top-0 z-50 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-500/20">
              AI
            </div>
            <div>
              <span className="font-bold text-lg text-white block leading-none">
                Career Companion
              </span>
              <span className="text-xs text-blue-400 font-medium">
                Intelligent Internship & Career Assistant
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Navigation Tabs */}
            <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 sm:p-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border ${
                darkMode
                  ? "bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-800"
                  : "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
              } shadow-sm`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* User Auth Profile / Logout Button */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="hidden lg:block text-right">
                  <span className="text-xs font-bold text-white block">{user.name || "Student"}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">{user.email}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                  title="Log Out"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onShowLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

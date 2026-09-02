import React from "react";

export function Navbar({ activeTab, setActiveTab, darkMode, toggleDarkMode }) {
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
          <div className="flex items-center gap-3">
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
            <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
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
              className={`p-2.5 rounded-xl text-sm font-medium transition-all border ${
                darkMode
                  ? "bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-800"
                  : "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
              } shadow-sm`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

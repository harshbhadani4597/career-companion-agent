import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { DashboardPage } from "./pages/DashboardPage";
import { ResumePage } from "./pages/ResumePage";
import { ProfilePage } from "./pages/ProfilePage";
import { MatchingPage } from "./pages/MatchingPage";
import { SkillGapPage } from "./pages/SkillGapPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { createApplicationApi } from "./services/api";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [jobMatches, setJobMatches] = useState([]);
  const [skillGaps, setSkillGaps] = useState([]);
  const [applications, setApplications] = useState([]);
  
  // Theme state with localStorage persistence (defaults to Dark Mode as shown in design reference)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleResumeParsed = (data) => {
    if (data.profile) setProfile(data.profile);
    if (data.job_matches) setJobMatches(data.job_matches);
    if (data.skill_gap_analysis) setSkillGaps(data.skill_gap_analysis);
    setActiveTab("dashboard");
  };

  const handleSaveApplication = async (job) => {
    const newApp = {
      profile_id: profile?.id || "demo_profile_id",
      job_id: job.job_id,
      title: job.title,
      company: job.company,
      location: job.location,
      status: "Saved",
      applied_at: null,
      notes: "Tracked from Internship Matching page"
    };

    try {
      await createApplicationApi(newApp);
    } catch (err) {
      console.warn("Saving locally as fallback...");
    }

    setApplications((prev) => [...prev, newApp]);
    alert(`✓ ${job.title} at ${job.company} added to Application Tracker!`);
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
      darkMode ? "bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white" : "bg-slate-100 text-slate-900 selection:bg-blue-500 selection:text-white"
    }`}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <DashboardPage
            profile={profile}
            jobMatches={jobMatches}
            skillGaps={skillGaps}
            applications={applications}
            setActiveTab={setActiveTab}
            darkMode={darkMode}
          />
        )}

        {activeTab === "resume" && (
          <ResumePage
            profile={profile}
            onResumeParsed={handleResumeParsed}
            darkMode={darkMode}
          />
        )}

        {activeTab === "profile" && (
          <ProfilePage
            profile={profile}
            setProfile={setProfile}
            darkMode={darkMode}
          />
        )}

        {activeTab === "matching" && (
          <MatchingPage
            jobMatches={jobMatches}
            profile={profile}
            onSaveApplication={handleSaveApplication}
            darkMode={darkMode}
          />
        )}

        {activeTab === "skillgap" && (
          <SkillGapPage
            skillGaps={skillGaps}
            darkMode={darkMode}
          />
        )}

        {activeTab === "applications" && (
          <ApplicationsPage
            applications={applications}
            darkMode={darkMode}
          />
        )}
      </main>

      <footer className={`${
        darkMode ? "bg-slate-950 border-t border-slate-800/80 text-slate-500" : "bg-slate-900 border-t border-slate-800 text-slate-400"
      } py-8 mt-16 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs space-y-2">
          <p className="font-semibold text-slate-300">AI Career Companion Agent</p>
          <p>Powered by Python FastAPI, Google Gemini LLM, Vector RAG & React</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

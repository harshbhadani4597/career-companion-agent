// ══════════════════════════════════════════════
//  AI Career Companion Agent — Frontend JS
//  M1/M2 + M3 Complete Implementation
// ══════════════════════════════════════════════

// Global Application State
let currentProfile = null;
let allJobs = [];
let matchedJobs = [];
let currentInterviewQuestions = [];
let domainChart = null;
let locationChart = null;

// M3 State
let currentSkillGapResult = null;
let currentTailoredResume = null;
let currentCoverLetter = null;
let currentInterviewPrep = null;
let chatHistory = [];
let selectedM3Job = null;

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  loadStatus();
  loadAllJobs();
  loadSavedOrEmptyProfile();
  checkInitialAuthSession();
});

function updateWelcomeBanner(candidateName) {
  const greetingEl = document.getElementById("welcome-greeting");
  const nameEl = document.getElementById("welcome-candidate-name");
  
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon";
  } else if (hour >= 17) {
    greeting = "Good evening";
  }

  if (greetingEl) greetingEl.innerText = greeting;
  if (nameEl) nameEl.innerText = candidateName || "Candidate";
}

// ══════════════════════════════════════════════
//  TAB NAVIGATION (supports M1/M2 + M3 tabs)
// ══════════════════════════════════════════════

function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.remove("active", "border-indigo-500", "text-indigo-400");
    btn.classList.add("border-transparent", "text-slate-400");
  });

  document.querySelectorAll(".tab-view").forEach(view => {
    view.classList.add("hidden");
  });

  const activeBtn = document.getElementById(`tab-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add("active", "border-indigo-500", "text-indigo-400");
    activeBtn.classList.remove("border-transparent", "text-slate-400");
  }

  const activeView = document.getElementById(`view-${tabId}`);
  if (activeView) {
    activeView.classList.remove("hidden");
  }

  if (tabId === 'matcher' && matchedJobs.length === 0) {
    executeMatching();
  }

  // Populate M3 & M4 job selectors / load tracker when switching to tabs
  if (['skill-gap', 'resume-customizer', 'interview-prep', 'interview', 'roadmap'].includes(tabId)) {
    populateM3JobSelectors();
    const timeline = document.getElementById("roadmap-timeline");
    if (tabId === 'roadmap' && (!timeline || timeline.children.length === 0 || timeline.innerText.includes("No Target Role Selected"))) {
      generateRoadmapFromUI();
    }
  }

  if (tabId === 'tracker') {
    loadTrackerApplications();
  }
}


// ══════════════════════════════════════════════
//  M1/M2 — EXISTING FUNCTIONALITY (unchanged)
// ══════════════════════════════════════════════

async function loadStatus() {
  try {
    const res = await fetch("/api/status");
    const data = await res.json();
    document.getElementById("system-status-badge").innerText = `${data.total_jobs_indexed} Jobs Indexed | RAG Active`;
    document.getElementById("stat-total-jobs").innerText = data.total_jobs_indexed;
  } catch (err) {
    console.error("Error loading status:", err);
  }
}

function loadSavedOrEmptyProfile() {
  const saved = localStorage.getItem("career_companion_profile");
  if (saved) {
    try {
      currentProfile = JSON.parse(saved);
      renderProfileUI(currentProfile);
      executeMatching();
      return;
    } catch (e) {
      console.warn("Error parsing saved profile:", e);
    }
  }
  currentProfile = null;
  renderProfileUI(null);
}

async function loadSampleProfile() {
  try {
    const res = await fetch("/api/profile/sample");
    currentProfile = await res.json();
    localStorage.setItem("career_companion_profile", JSON.stringify(currentProfile));
    renderProfileUI(currentProfile);
    populateM3JobSelectors();
    executeMatching();
    alert("Sample student profile loaded successfully!");
  } catch (err) {
    console.error("Error loading sample profile:", err);
  }
}

function clearProfile() {
  currentProfile = null;
  matchedJobs = [];
  localStorage.removeItem("career_companion_profile");
  const textInput = document.getElementById("resume-text-input");
  if (textInput) textInput.value = "";
  renderProfileUI(null);
  
  const matchContainer = document.getElementById("matching-results-container");
  if (matchContainer) {
    matchContainer.innerHTML = `
      <div class="p-8 text-center text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700">
        <i data-lucide="file-up" class="w-10 h-10 mx-auto text-indigo-400 mb-2 opacity-80"></i>
        <p class="font-medium text-slate-300">No Candidate Profile Loaded</p>
        <p class="text-xs text-slate-400 mt-1">Go to the "Profile & Resume" tab and upload or paste your resume to run AI matching.</p>
      </div>
    `;
    lucide.createIcons();
  }
}

function renderProfileUI(profile) {
  updateWelcomeBanner(profile?.name);
  const nameDisplay = document.getElementById("stat-candidate-name");
  const subDisplay = document.getElementById("stat-candidate-subtitle");
  const topMatchDisplay = document.getElementById("stat-top-match");
  const skillsContainer = document.getElementById("prof-skills-container");
  const projContainer = document.getElementById("prof-projects-container");

  if (!profile || !profile.name) {
    if (nameDisplay) nameDisplay.innerText = "Not Uploaded";
    if (subDisplay) subDisplay.innerText = "Upload resume to match";
    if (topMatchDisplay) topMatchDisplay.innerText = "--%";
    document.getElementById("prof-name").value = "";
    document.getElementById("prof-email").value = "";
    document.getElementById("prof-phone").value = "";
    
    if (skillsContainer) {
      skillsContainer.innerHTML = `<span class="text-xs text-slate-500 italic p-1">No skills extracted yet. Paste your resume above and click "Run Resume Parsing Agent".</span>`;
    }
    if (projContainer) {
      projContainer.innerHTML = `<div class="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-500 italic">No projects extracted yet.</div>`;
    }
    return;
  }
  
  if (nameDisplay) nameDisplay.innerText = profile.name;
  if (subDisplay) {
    const edu = (profile.education && profile.education[0] && profile.education[0].degree) || "Active Profile";
    subDisplay.innerText = edu;
  }

  document.getElementById("prof-name").value = profile.name || "";
  document.getElementById("prof-email").value = profile.email || "";
  document.getElementById("prof-phone").value = profile.phone || "";

  if (skillsContainer) {
    skillsContainer.innerHTML = "";
    (profile.technical_skills || []).forEach(skill => {
      const span = document.createElement("span");
      span.className = "px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-semibold flex items-center gap-1";
      span.innerHTML = `<i data-lucide="check-circle-2" class="w-3 h-3 text-indigo-400"></i> ${skill}`;
      skillsContainer.appendChild(span);
    });
  }

  if (projContainer) {
    projContainer.innerHTML = "";
    (profile.projects || []).forEach(proj => {
      const div = document.createElement("div");
      div.className = "p-3 bg-slate-900 border border-slate-700 rounded-lg space-y-1.5";
      div.innerHTML = `
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold text-slate-200">${proj.title}</h4>
          <div class="flex flex-wrap gap-1">
            ${(proj.tech_stack || []).map(t => `<span class="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded">${t}</span>`).join('')}
          </div>
        </div>
        <p class="text-[11px] text-slate-400">${proj.description}</p>
      `;
      projContainer.appendChild(div);
    });
  }

  lucide.createIcons();
}

function handleFileSelected(event) {
  const file = event.target.files[0];
  const label = document.getElementById("file-drop-label");
  if (file) {
    label.innerText = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  } else {
    label.innerText = "Click to select or drag & drop resume file";
  }
}

async function uploadResumeFile() {
  const fileInput = document.getElementById("resume-file-input");
  const file = fileInput.files[0];
  if (!file) {
    alert("Please click on the file box to select a resume file (.pdf, .docx, .txt) first.");
    return;
  }

  const btn = document.getElementById("btn-upload-file");
  const originalBtnText = btn.innerHTML;
  btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Uploading & Extracting File...';
  btn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/resume/upload", {
      method: "POST",
      body: formData
    });

    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      const rawText = await res.text();
      console.error("Non-JSON server response:", rawText);
      alert("Server returned error (Status " + res.status + "): " + (rawText.slice(0, 150) || "Unable to parse file"));
      return;
    }

    if (!res.ok || data.error) {
      alert("Upload error: " + (data.error || "Failed to process file"));
    } else {
      currentProfile = data.profile;
      localStorage.setItem("career_companion_profile", JSON.stringify(currentProfile));
      renderProfileUI(currentProfile);
      populateM3JobSelectors();
      alert(`Resume file "${data.filename}" uploaded and parsed successfully!`);
      switchTab("profile");
      executeMatching();
    }
  } catch (err) {
    console.error("Resume upload error:", err);
    alert("Upload network request failed: " + err.message);
  } finally {
    btn.innerHTML = originalBtnText;
    btn.disabled = false;
    lucide.createIcons();
  }
}

async function parseResumeInput() {
  const text = document.getElementById("resume-text-input").value;
  if (!text) {
    alert("Please paste resume text into the text box.");
    return;
  }

  try {
    const res = await fetch("/api/resume/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    currentProfile = await res.json();
    localStorage.setItem("career_companion_profile", JSON.stringify(currentProfile));
    renderProfileUI(currentProfile);
    alert("Resume parsed successfully!");
    switchTab("profile");
    executeMatching();
  } catch (err) {
    console.error("Resume parse error:", err);
  }
}

function triggerMatchingFromProfile() {
  switchTab("matcher");
  executeMatching();
}

async function loadAllJobs() {
  try {
    const [jobsRes, statsRes] = await Promise.all([
      fetch("/api/jobs"),
      fetch("/api/jobs/stats")
    ]);
    
    const jobsData = await jobsRes.json();
    const statsData = await statsRes.json();

    allJobs = jobsData.jobs;
    renderJobsGrid(allJobs);
    renderStatsCharts(statsData);
  } catch (err) {
    console.error("Error loading jobs:", err);
  }
}

function renderJobsGrid(jobs) {
  const container = document.getElementById("jobs-grid");
  container.innerHTML = "";

  jobs.slice(0, 30).forEach(job => {
    const card = document.createElement("div");
    card.className = "bg-slate-800/80 border border-slate-700 hover:border-indigo-500/50 rounded-xl p-5 flex flex-col justify-between transition group card-glow";
    card.innerHTML = `
      <div>
        <div class="flex items-start justify-between gap-2 mb-2">
          <span class="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold rounded-md uppercase">${job.domain}</span>
          <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold rounded-md">${job.stipend}</span>
        </div>
        <h3 class="text-sm font-bold text-white group-hover:text-indigo-300 transition">${job.title}</h3>
        <p class="text-xs text-slate-400 font-medium mb-3">${job.company} &bull; ${job.location} (${job.work_mode})</p>
        <p class="text-[11px] text-slate-300 line-clamp-2 mb-3">${job.description}</p>
      </div>

      <div>
        <div class="flex flex-wrap gap-1 mb-3">
          ${(job.technical_skills || []).slice(0, 4).map(s => `<span class="px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded">${s}</span>`).join('')}
        </div>
        <div class="flex gap-1.5">
          <button onclick="selectJobForM3('${job.id}')" class="flex-1 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-[11px] font-semibold rounded-lg transition flex items-center justify-center gap-1">
            <i data-lucide="search" class="w-3.5 h-3.5"></i> Gap
          </button>
          <button onclick="document.getElementById('resume-job-select').value='${job.id}'; switchTab('resume-customizer'); generateTailoredResume();" class="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-semibold rounded-lg transition flex items-center justify-center gap-1">
            <i data-lucide="file-edit" class="w-3.5 h-3.5"></i> Tailor
          </button>
          <button onclick="prepareInterviewForJob('${job.title}', '${job.domain}')" class="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-semibold rounded-lg transition flex items-center justify-center gap-1">
            <i data-lucide="mic" class="w-3.5 h-3.5"></i> Mock
          </button>
          <button onclick="quickAddTrackerJob('${(job.company || '').replace(/'/g, "\\'")}', '${(job.title || '').replace(/'/g, "\\'")}', '${(job.description || '').replace(/'/g, "\\'")}')" class="flex-1 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-[11px] font-semibold rounded-lg transition flex items-center justify-center gap-1" title="Add to Application Tracker">
            <i data-lucide="clipboard-list" class="w-3.5 h-3.5"></i> Track
          </button>
        </div>

      </div>
    `;
    container.appendChild(card);
  });

  lucide.createIcons();
}

function filterJobs() {
  const query = document.getElementById("job-search-query").value.toLowerCase();
  const domain = document.getElementById("job-domain-select").value;
  const workMode = document.getElementById("job-workmode-select").value;

  const filtered = allJobs.filter(job => {
    const matchesQuery = !query || job.title.toLowerCase().includes(query) || job.company.toLowerCase().includes(query) || job.technical_skills.some(s => s.toLowerCase().includes(query));
    const matchesDomain = !domain || job.domain === domain;
    const matchesWorkMode = workMode === "all" || job.work_mode.toLowerCase() === workMode.toLowerCase();

    return matchesQuery && matchesDomain && matchesWorkMode;
  });

  renderJobsGrid(filtered);
}

function renderStatsCharts(stats) {
  const domainLabels = Object.keys(stats.domain_distribution);
  const domainValues = Object.values(stats.domain_distribution);

  const ctxDomain = document.getElementById("chart-domains").getContext("2d");
  if (domainChart) domainChart.destroy();
  domainChart = new Chart(ctxDomain, {
    type: "doughnut",
    data: {
      labels: domainLabels,
      datasets: [{
        data: domainValues,
        backgroundColor: ["#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#14b8a6", "#64748b", "#a855f7", "#06b6d4"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 10 } } }
      }
    }
  });

  const locLabels = Object.keys(stats.location_distribution);
  const locValues = Object.values(stats.location_distribution);

  const ctxLoc = document.getElementById("chart-locations").getContext("2d");
  if (locationChart) locationChart.destroy();
  locationChart = new Chart(ctxLoc, {
    type: "bar",
    data: {
      labels: locLabels,
      datasets: [{
        label: "Jobs Count",
        data: locValues,
        backgroundColor: "#6366f1",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

async function executeMatching() {
  if (!currentProfile || !currentProfile.technical_skills || currentProfile.technical_skills.length === 0) {
    const container = document.getElementById("matching-results-container");
    if (container) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700 space-y-3">
          <i data-lucide="file-text" class="w-10 h-10 mx-auto text-indigo-400 opacity-80"></i>
          <h4 class="text-sm font-bold text-slate-200">No Resume Profile Active</h4>
          <p class="text-xs text-slate-400 max-w-md mx-auto">Please paste and parse your resume in the "Profile & Resume" tab to calculate personalized AI role compatibility.</p>
          <button onclick="switchTab('profile')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow">
            Go to Resume Parser
          </button>
        </div>
      `;
      lucide.createIcons();
    }
    return;
  }

  try {
    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentProfile)
    });
    const data = await res.json();
    matchedJobs = data.matches;

    if (matchedJobs.length > 0) {
      document.getElementById("stat-top-match").innerText = `${matchedJobs[0].overall_match_pct}%`;
    } else {
      document.getElementById("stat-top-match").innerText = "--%";
    }

    renderMatchResults(matchedJobs);
  } catch (err) {
    console.error("Match error:", err);
  }
}

function renderMatchResults(matches) {
  const container = document.getElementById("matching-results-container");
  container.innerHTML = "";

  matches.forEach(m => {
    const job = m.job;
    const card = document.createElement("div");
    card.className = "bg-slate-800/90 border border-slate-700 rounded-xl p-5 space-y-4 shadow-md fade-in";

    card.innerHTML = `
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold rounded-md uppercase">${job.domain}</span>
            <span class="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold rounded-md">${job.stipend}</span>
          </div>
          <h3 class="text-base font-bold text-white mt-1">${job.title}</h3>
          <p class="text-xs text-slate-400">${job.company} &bull; ${job.location} (${job.work_mode})</p>
        </div>

        <div class="text-right">
          <div class="text-2xl font-extrabold text-emerald-400">${m.overall_match_pct}%</div>
          <span class="text-[10px] font-semibold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">${m.match_tier}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
        <div>
          <div class="flex justify-between text-[11px] text-slate-300 mb-1">
            <span>Skill Match</span>
            <span class="font-bold text-indigo-400">${m.skill_match_pct}%</span>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="bg-indigo-500 h-full rounded-full" style="width: ${m.skill_match_pct}%"></div>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-[11px] text-slate-300 mb-1">
            <span>Project Match</span>
            <span class="font-bold text-purple-400">${m.project_match_pct}%</span>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="bg-purple-500 h-full rounded-full" style="width: ${m.project_match_pct}%"></div>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-[11px] text-slate-300 mb-1">
            <span>Domain Alignment</span>
            <span class="font-bold text-teal-400">${m.domain_match_pct}%</span>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="bg-teal-500 h-full rounded-full" style="width: ${m.domain_match_pct}%"></div>
          </div>
        </div>
      </div>

      <div class="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-lg space-y-1">
        <p class="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
          <i data-lucide="bot" class="w-4 h-4 text-indigo-400"></i> AI Matching Reasoning:
        </p>
        <p class="text-xs text-slate-300 leading-relaxed">${m.ai_reasoning}</p>
        <p class="text-[11px] text-amber-300 mt-1 font-medium">&bull; Recommendation: ${m.actionable_recommendation}</p>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div class="flex flex-wrap gap-1.5">
          ${m.matching_skills.map(s => `<span class="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium rounded flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> ${s}</span>`).join('')}
          ${m.missing_skills.map(s => `<span class="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-medium rounded flex items-center gap-1"><i data-lucide="x" class="w-3 h-3"></i> ${s}</span>`).join('')}
        </div>

        <div class="flex items-center gap-1.5 flex-wrap">
          <button onclick="applyToMatchedJob('${(job.company || '').replace(/'/g, "\\'")}', '${(job.title || '').replace(/'/g, "\\'")}', '${(job.description || '').replace(/'/g, "\\'")}', '${job.id}')" class="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-lg shadow-md transition flex items-center gap-1">
            <i data-lucide="send" class="w-3.5 h-3.5"></i> Apply
          </button>
          <button onclick="selectJobForM3('${job.id}')" class="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1">
            <i data-lucide="search" class="w-3.5 h-3.5"></i> Skill Gap
          </button>
          <button onclick="document.getElementById('resume-job-select').value='${job.id}'; switchTab('resume-customizer'); generateTailoredResume();" class="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1">
            <i data-lucide="file-edit" class="w-3.5 h-3.5"></i> Tailor Resume
          </button>
          <button onclick="fetchRoadmapForMatch('${job.title}', '${m.missing_skills.join(',')}')" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1">
            <i data-lucide="compass" class="w-3.5 h-3.5"></i> Roadmap
          </button>
          <button onclick="prepareInterviewForJob('${job.title}', '${job.domain}', '${m.missing_skills.join(',')}')" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition flex items-center gap-1">
            <i data-lucide="mic" class="w-3.5 h-3.5"></i> Interview
          </button>
          <button onclick="quickAddTrackerJob('${(job.company || '').replace(/'/g, "\\'")}', '${(job.title || '').replace(/'/g, "\\'")}', '${(job.description || '').replace(/'/g, "\\'")}')" class="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1" title="Add to Application Tracker">
            <i data-lucide="clipboard-list" class="w-3.5 h-3.5"></i> Track
          </button>
        </div>


      </div>
    `;

    container.appendChild(card);
  });

  lucide.createIcons();
}

async function prepareInterviewForJob(jobTitle, domain, missingSkillsStr = "") {
  switchTab("interview");
  document.getElementById("interview-target-role").innerText = `${jobTitle} (${domain})`;

  const missingSkills = missingSkillsStr ? missingSkillsStr.split(",") : [];

  try {
    const res = await fetch("/api/interview/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_title: jobTitle,
        domain: domain,
        missing_skills: missingSkills
      })
    });
    const data = await res.json();
    currentInterviewQuestions = data.questions;
    renderInterviewQuestions(currentInterviewQuestions);
  } catch (err) {
    console.error("Interview generate error:", err);
  }
}

function renderInterviewQuestions(questions) {
  const container = document.getElementById("interview-qa-container");
  container.innerHTML = "";

  questions.forEach((q, idx) => {
    const qCard = document.createElement("div");
    qCard.className = "p-5 bg-slate-900/90 border border-slate-700 rounded-xl space-y-4";
    qCard.id = `qcard-${idx}`;

    qCard.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="px-2.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-bold rounded-md uppercase">Question ${idx + 1} &bull; ${q.type}</span>
        <span class="text-xs text-slate-400 font-mono">Target Key Concepts: ${q.key_points.length}</span>
      </div>

      <h3 class="text-sm font-bold text-slate-100 leading-snug">${q.question}</h3>

      <div class="space-y-2">
        <label class="block text-xs font-semibold text-slate-400">Your AI Mock Interview Answer:</label>
        <textarea id="answer-input-${idx}" rows="3" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:border-purple-500 focus:outline-none" placeholder="Type your technical response..."></textarea>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex gap-1.5 flex-wrap">
          ${q.key_points.map(kp => `<span class="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded border border-slate-700/60">${kp}</span>`).join('')}
        </div>
        <button onclick="submitAnswerEvaluation(${idx})" class="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5">
          <i data-lucide="send" class="w-3.5 h-3.5"></i> Evaluate
        </button>
      </div>

      <div id="feedback-area-${idx}" class="hidden p-4 rounded-lg border space-y-2 text-xs"></div>
    `;

    container.appendChild(qCard);
  });

  lucide.createIcons();
}

async function submitAnswerEvaluation(idx) {
  const q = currentInterviewQuestions[idx];
  const answer = document.getElementById(`answer-input-${idx}`).value;

  try {
    const res = await fetch("/api/interview/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: q.question,
        key_points: q.key_points,
        user_answer: answer
      })
    });
    const result = await res.json();
    renderFeedback(idx, result);
  } catch (err) {
    console.error("Evaluation error:", err);
  }
}

function renderFeedback(idx, result) {
  const area = document.getElementById(`feedback-area-${idx}`);
  area.classList.remove("hidden");

  const isGood = result.score >= 70;
  area.className = `p-4 rounded-lg border text-xs space-y-2 ${isGood ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' : 'bg-amber-950/30 border-amber-500/30 text-amber-200'}`;

  area.innerHTML = `
    <div class="flex items-center justify-between">
      <span class="font-bold flex items-center gap-1.5 text-sm">
        <i data-lucide="${isGood ? 'check-circle' : 'alert-circle'}" class="w-4 h-4"></i> ${result.verdict}
      </span>
      <span class="px-2.5 py-0.5 rounded font-extrabold text-sm ${isGood ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">
        Score: ${result.score}/100
      </span>
    </div>
    <p class="leading-relaxed">${result.feedback}</p>
  `;

  lucide.createIcons();
}

function getJobById(jobId) {
  if (!allJobs || allJobs.length === 0) return null;
  return allJobs.find(j => j.id === jobId) || null;
}

async function generateRoadmapFromUI() {
  const sel = document.getElementById("roadmap-job-select");
  const jobId = sel ? sel.value : "";
  
  let targetRole = "Software Developer Intern";
  let missingSkills = ["PyTorch", "Docker", "REST APIs"];
  
  if (jobId) {
    const job = getJobById(jobId);
    if (job) {
      targetRole = job.title;
      const jobSkills = job.technical_skills || [];
      const studentSkills = currentProfile ? (currentProfile.technical_skills || []).map(s => s.toLowerCase()) : [];
      missingSkills = jobSkills.filter(s => !studentSkills.includes(s.toLowerCase()));
      if (missingSkills.length === 0) missingSkills = jobSkills.slice(0, 3);
    }
  } else if (matchedJobs && matchedJobs.length > 0) {
    targetRole = matchedJobs[0].job.title;
    missingSkills = matchedJobs[0].missing_skills || [];
  } else if (allJobs && allJobs.length > 0) {
    targetRole = allJobs[0].title;
    missingSkills = allJobs[0].technical_skills ? allJobs[0].technical_skills.slice(0, 3) : ["Python", "Git", "REST APIs"];
  }

  fetchRoadmapForMatch(targetRole, missingSkills.join(","));
}

function onRoadmapJobSelected() {
  generateRoadmapFromUI();
}

async function fetchRoadmapForMatch(targetRole, missingSkillsStr) {
  const missingSkills = missingSkillsStr ? missingSkillsStr.split(",") : [];

  const container = document.getElementById("roadmap-timeline");
  if (container) {
    container.innerHTML = '<div class="p-8 text-center"><div class="typing-indicator mx-auto"><span></span><span></span><span></span></div><p class="text-xs text-slate-400 mt-2">Building personalized 95%+ compatibility career roadmap...</p></div>';
  }

  try {
    const res = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_role: targetRole,
        missing_skills: missingSkills
      })
    });
    const roadmap = await res.json();
    renderRoadmap(roadmap);
  } catch (err) {
    console.error("Roadmap error:", err);
    if (container) container.innerHTML = '<div class="p-6 text-center text-rose-400 text-xs">Error generating career roadmap. Please try again.</div>';
  }
}

function renderRoadmap(roadmap) {
  const container = document.getElementById("roadmap-timeline");
  container.innerHTML = "";

  // Summary Card
  const summaryDiv = document.createElement("div");
  summaryDiv.className = "bg-slate-900/90 border border-emerald-500/30 rounded-xl p-5 mb-4 fade-in";
  summaryDiv.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3 mb-3">
      <div>
        <h3 class="text-base font-bold text-white">${roadmap.role || "Target Role Roadmap"}</h3>
        <p class="text-xs text-slate-400">Target Compatibility: <span class="text-emerald-400 font-bold">95%+ Fit</span> &bull; Focus Skills: ${roadmap.missing_skills_count || 0}</p>
      </div>
      <span class="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-full flex items-center gap-1.5">
        <i data-lucide="target" class="w-3.5 h-3.5 text-emerald-400"></i> ${roadmap.status || "Action Plan Ready"}
      </span>
    </div>
    <p class="text-xs text-slate-300 leading-relaxed">
      Complete these step-by-step learning modules to master key technical competencies and build verified projects required for high-compatibility shortlisting.
    </p>
  `;
  container.appendChild(summaryDiv);

  // Roadmap Steps
  (roadmap.roadmap_steps || []).forEach((step, idx) => {
    const div = document.createElement("div");
    div.className = "p-5 bg-slate-900 border border-slate-700 rounded-xl space-y-3 relative pl-6 border-l-4 border-l-emerald-500 fade-in";

    div.innerHTML = `
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
          <i data-lucide="check-circle-2" class="w-4.5 h-4.5 text-emerald-400"></i> ${step.phase}
        </h3>
        <span class="text-[10px] text-slate-400 font-mono">Module ${idx + 1} of ${roadmap.roadmap_steps.length}</span>
      </div>
      <div class="space-y-2 pt-1">
        ${step.actions.map((act, aIdx) => `
          <div class="flex items-start gap-2.5 p-2 bg-slate-950/60 rounded-lg border border-slate-800">
            <input type="checkbox" id="step-${idx}-${aIdx}" class="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer" />
            <label for="step-${idx}-${aIdx}" class="text-xs text-slate-200 cursor-pointer leading-snug">${act}</label>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(div);
  });

  lucide.createIcons();
}

// ══════════════════════════════════════════════
//  AUTHENTICATION & LANDING GATE MODULE
// ══════════════════════════════════════════════

let currentLoginRole = 'candidate';
let currentUser = null;
let currentAuthGateTab = 'login';

function setAuthGateTab(tab) {
  currentAuthGateTab = tab;
  const loginBtn = document.getElementById("gate-tab-login");
  const regBtn = document.getElementById("gate-tab-register");
  const nameGroup = document.getElementById("gate-name-group");
  const submitBtn = document.getElementById("gate-submit-btn");

  if (tab === 'login') {
    if (loginBtn) loginBtn.className = "py-2.5 rounded-lg text-white bg-indigo-600 shadow-md transition flex items-center justify-center gap-1.5";
    if (regBtn) regBtn.className = "py-2.5 rounded-lg text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1.5";
    if (nameGroup) nameGroup.classList.add("hidden");
    if (submitBtn) submitBtn.innerHTML = '<i data-lucide="log-in" class="w-4 h-4"></i> Sign In to Account';
  } else {
    if (regBtn) regBtn.className = "py-2.5 rounded-lg text-white bg-indigo-600 shadow-md transition flex items-center justify-center gap-1.5";
    if (loginBtn) loginBtn.className = "py-2.5 rounded-lg text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1.5";
    if (nameGroup) nameGroup.classList.remove("hidden");
    if (submitBtn) submitBtn.innerHTML = '<i data-lucide="user-plus" class="w-4 h-4"></i> Create Free Account';
  }
  lucide.createIcons();
}

function openLoginModal() {
  const modal = document.getElementById("login-modal");
  if (modal) modal.classList.remove("hidden");
}

function closeLoginModal() {
  const modal = document.getElementById("login-modal");
  if (modal) modal.classList.add("hidden");
}

function setLoginRole(role) {
  currentLoginRole = role;
  const candBtn = document.getElementById("role-candidate-btn");
  const recBtn = document.getElementById("role-recruiter-btn");
  const gateCandBtn = document.getElementById("gate-role-candidate-btn");
  const gateRecBtn = document.getElementById("gate-role-recruiter-btn");

  const activeClass = "role-btn py-2 px-3 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-indigo-500";
  const inactiveClass = "role-btn py-2 px-3 bg-slate-800 text-slate-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 hover:bg-slate-750";

  if (role === 'candidate') {
    if (candBtn) candBtn.className = activeClass;
    if (recBtn) recBtn.className = inactiveClass;
    if (gateCandBtn) gateCandBtn.className = activeClass;
    if (gateRecBtn) gateRecBtn.className = inactiveClass;
  } else {
    if (recBtn) recBtn.className = activeClass;
    if (candBtn) candBtn.className = inactiveClass;
    if (gateRecBtn) gateRecBtn.className = activeClass;
    if (gateCandBtn) gateCandBtn.className = inactiveClass;
  }
}

async function handleAuthGateSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("gate-email")?.value || "candidate@example.com";
  const password = document.getElementById("gate-password")?.value || "demo1234";
  const name = document.getElementById("gate-name")?.value || "";

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: currentLoginRole, name })
    });
    const data = await res.json();
    if (data.success) {
      if (name && currentAuthGateTab === 'register') {
        data.user.name = name;
      }
      currentUser = data.user;
      localStorage.setItem("career_companion_user", JSON.stringify(currentUser));
      revealAuthenticatedApp();
    }
  } catch (err) {
    console.error("Auth gate error:", err);
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("login-email")?.value;
  const password = document.getElementById("login-password")?.value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: currentLoginRole })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      localStorage.setItem("career_companion_user", JSON.stringify(currentUser));
      revealAuthenticatedApp();
      closeLoginModal();
    }
  } catch (err) {
    console.error("Login error:", err);
  }
}

function quickAuthGateDemo() {
  const emailEl = document.getElementById("gate-email");
  const passEl = document.getElementById("gate-password");
  if (emailEl) emailEl.value = "candidate@example.com";
  if (passEl) passEl.value = "demo1234";
  handleAuthGateSubmit(new Event('submit'));
}

function quickLoginDemo() {
  document.getElementById("login-email").value = "candidate@example.com";
  document.getElementById("login-password").value = "demo1234";
  handleLoginSubmit(new Event('submit'));
}

function revealAuthenticatedApp() {
  const gate = document.getElementById("auth-gate-screen");
  const appHeader = document.getElementById("app-header");
  const appMain = document.getElementById("app-main");

  if (gate) gate.classList.add("hidden");
  if (appHeader) appHeader.classList.remove("hidden");
  if (appMain) appMain.classList.remove("hidden");

  updateAuthUI(currentUser);
  updateWelcomeBanner(currentProfile?.name || currentUser?.name);
  switchTab("dashboard");
}

function updateAuthUI(user) {
  const navBtn = document.getElementById("login-nav-btn");
  const userBadge = document.getElementById("user-logged-badge");
  const userNameSpan = document.getElementById("user-display-name");

  if (user) {
    if (navBtn) navBtn.classList.add("hidden");
    if (userBadge) userBadge.classList.remove("hidden");
    if (userNameSpan) userNameSpan.innerText = user.name + (user.role === 'recruiter' ? ' (HR)' : '');
  } else {
    if (navBtn) navBtn.classList.remove("hidden");
    if (userBadge) userBadge.classList.add("hidden");
  }
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem("career_companion_user");

  const gate = document.getElementById("auth-gate-screen");
  const appHeader = document.getElementById("app-header");
  const appMain = document.getElementById("app-main");

  if (gate) gate.classList.remove("hidden");
  if (appHeader) appHeader.classList.add("hidden");
  if (appMain) appMain.classList.add("hidden");
  updateAuthUI(null);
}

function checkInitialAuthSession() {
  const savedUser = localStorage.getItem("career_companion_user");
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      revealAuthenticatedApp();
      return;
    } catch (e) {}
  }
  // Not logged in -> show login gate screen
  logoutUser();
}


// ══════════════════════════════════════════════
//  M3 — NEW FUNCTIONALITY
// ══════════════════════════════════════════════

// ── Helper: Populate M3 job selectors ──
function populateM3JobSelectors() {
  const selectors = ['skill-gap-job-select', 'resume-job-select', 'interview-prep-job-select', 'mock-sim-job-select', 'roadmap-job-select'];
  
  selectors.forEach(selId => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">-- Select internship --</option>';
    
    // Add matched jobs first (if available)
    if (matchedJobs.length > 0) {
      const group = document.createElement("optgroup");
      group.label = "Top Matched Jobs";
      matchedJobs.slice(0, 10).forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.job.id;
        opt.textContent = `${m.job.title} @ ${m.job.company} (${m.overall_match_pct}% match)`;
        group.appendChild(opt);
      });
      sel.appendChild(group);
    }
    
    // Add all jobs
    const allGroup = document.createElement("optgroup");
    allGroup.label = "All Jobs";
    allJobs.slice(0, 30).forEach(j => {
      const opt = document.createElement("option");
      opt.value = j.id;
      opt.textContent = `${j.title} @ ${j.company}`;
      allGroup.appendChild(opt);
    });
    sel.appendChild(allGroup);
    
    if (currentVal) sel.value = currentVal;
  });
}

function getJobById(jobId) {
  return allJobs.find(j => j.id === jobId) || null;
}

function selectJobForM3(jobId) {
  selectedM3Job = getJobById(jobId);
  if (!selectedM3Job) return;
  
  // Set all selectors to this job
  ['skill-gap-job-select', 'resume-job-select', 'interview-prep-job-select'].forEach(selId => {
    const sel = document.getElementById(selId);
    if (sel) sel.value = jobId;
  });
  
  switchTab('skill-gap');
  populateM3JobSelectors();
  document.getElementById('skill-gap-job-select').value = jobId;
  runSkillGapAnalysis();
}


// ══════════════════════════════════════════════
//  M3.1 — SKILL GAP ANALYSIS
// ══════════════════════════════════════════════

async function runSkillGapAnalysis() {
  if (!currentProfile) {
    alert("Please upload your resume first in the Profile & Resume tab.");
    return;
  }
  
  const jobId = document.getElementById("skill-gap-job-select").value;
  if (!jobId) {
    alert("Please select an internship to analyze.");
    return;
  }

  const container = document.getElementById("skill-gap-results");
  container.innerHTML = '<div class="p-8 text-center"><div class="typing-indicator mx-auto"><span></span><span></span><span></span></div><p class="text-xs text-slate-400 mt-2">Analyzing skill gaps...</p></div>';

  try {
    const res = await fetch("/api/skill-gap/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_profile: currentProfile,
        job_id: jobId
      })
    });
    currentSkillGapResult = await res.json();
    renderSkillGapResults(currentSkillGapResult);
  } catch (err) {
    console.error("Skill gap error:", err);
    container.innerHTML = '<div class="p-6 text-center text-red-400">Error analyzing skill gaps. Please try again.</div>';
  }
}

function renderSkillGapResults(result) {
  const container = document.getElementById("skill-gap-results");
  container.innerHTML = "";
  
  const summary = result.summary || {};
  
  // Summary Card
  const summaryCard = document.createElement("div");
  const assessColor = summary.match_percentage >= 70 ? 'emerald' : (summary.match_percentage >= 45 ? 'amber' : 'rose');
  summaryCard.className = "bg-slate-800/80 border border-slate-700 rounded-xl p-6 fade-in";
  summaryCard.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
      <div>
        <h3 class="text-lg font-bold text-white">${result.job_title}</h3>
        <p class="text-xs text-slate-400">${result.job_company} &bull; ${result.job_domain}</p>
      </div>
      <div class="text-right">
        <div class="text-3xl font-extrabold text-${assessColor}-400">${summary.match_percentage}%</div>
        <span class="text-xs font-semibold px-2.5 py-0.5 bg-${assessColor}-500/20 text-${assessColor}-300 rounded">${summary.overall_assessment}</span>
      </div>
    </div>
    <p class="text-xs text-slate-300 leading-relaxed">${summary.summary_text}</p>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
      <div class="p-3 bg-slate-900/60 rounded-lg text-center">
        <div class="text-lg font-bold text-emerald-400">${summary.skills_matched}</div>
        <div class="text-[10px] text-slate-400">Matched</div>
      </div>
      <div class="p-3 bg-slate-900/60 rounded-lg text-center">
        <div class="text-lg font-bold text-amber-400">${summary.skills_partial}</div>
        <div class="text-[10px] text-slate-400">Partial</div>
      </div>
      <div class="p-3 bg-slate-900/60 rounded-lg text-center">
        <div class="text-lg font-bold text-rose-400">${summary.skills_missing}</div>
        <div class="text-[10px] text-slate-400">Missing</div>
      </div>
      <div class="p-3 bg-slate-900/60 rounded-lg text-center">
        <div class="text-lg font-bold text-blue-400">${summary.total_required_skills}</div>
        <div class="text-[10px] text-slate-400">Total Required</div>
      </div>
    </div>
  `;
  container.appendChild(summaryCard);

  // Matched Skills
  if (result.matching_skills && result.matching_skills.length > 0) {
    container.appendChild(createGapSection("✅ Matching Skills", result.matching_skills, "matched"));
  }

  // Critical Gaps
  if (result.critical_gaps && result.critical_gaps.length > 0) {
    container.appendChild(createGapSection("🔴 Critical Missing Skills", result.critical_gaps, "critical"));
  }

  // Partial Gaps
  if (result.partial_gaps && result.partial_gaps.length > 0) {
    container.appendChild(createGapSection("🟡 Partially Demonstrated Skills", result.partial_gaps, "partial"));
  }

  // Experience Gaps
  if (result.experience_gaps && result.experience_gaps.length > 0) {
    container.appendChild(createGapSection("📋 Experience Gaps", result.experience_gaps, "critical"));
  }

  // Recommendations
  if (result.recommendations && result.recommendations.length > 0) {
    const recCard = document.createElement("div");
    recCard.className = "bg-slate-800/80 border border-slate-700 rounded-xl p-6 fade-in";
    recCard.innerHTML = `
      <h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <i data-lucide="lightbulb" class="w-4 h-4 text-amber-400"></i> Recommendations
      </h3>
      ${result.recommendations.map(r => `
        <div class="p-3 bg-slate-900/60 border border-slate-700/50 rounded-lg mb-2">
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 text-[10px] font-bold rounded priority-${r.priority.toLowerCase()}">${r.priority}</span>
            <span class="text-xs text-slate-300 font-medium">${r.timeframe}</span>
          </div>
          <p class="text-xs text-slate-200">${r.action}</p>
        </div>
      `).join('')}
    `;
    container.appendChild(recCard);
  }

  // Action Buttons
  const actionDiv = document.createElement("div");
  actionDiv.className = "flex flex-wrap gap-3 fade-in";
  actionDiv.innerHTML = `
    <button onclick="document.getElementById('resume-job-select').value='${result.job_id}'; switchTab('resume-customizer')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2">
      <i data-lucide="file-edit" class="w-4 h-4"></i> Customize Resume for This Job
    </button>
    <button onclick="document.getElementById('interview-prep-job-select').value='${result.job_id}'; switchTab('interview-prep')" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2">
      <i data-lucide="graduation-cap" class="w-4 h-4"></i> Prepare Interview
    </button>
  `;
  container.appendChild(actionDiv);

  lucide.createIcons();
}

function createGapSection(title, items, type) {
  const section = document.createElement("div");
  section.className = "bg-slate-800/80 border border-slate-700 rounded-xl p-6 fade-in";
  
  let html = `<h3 class="text-sm font-bold text-white mb-3">${title}</h3><div class="space-y-2">`;
  
  items.forEach(item => {
    if (type === "matched") {
      html += `
        <div class="flex items-center gap-2 p-2 bg-slate-900/60 rounded-lg">
          <span class="px-2 py-0.5 text-[10px] font-bold rounded gap-badge-matched">Matched</span>
          <span class="text-xs text-slate-200 font-medium">${item.skill}</span>
          <span class="text-[10px] text-slate-400 ml-auto">${item.student_evidence || ''}</span>
        </div>
      `;
    } else {
      const badgeClass = type === 'critical' ? 'gap-badge-critical' : 'gap-badge-partial';
      html += `
        <div class="p-3 bg-slate-900/60 border border-slate-700/50 rounded-lg">
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 text-[10px] font-bold rounded ${badgeClass}">${item.status}</span>
            <span class="text-xs text-slate-200 font-semibold">${item.skill}</span>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded priority-${(item.priority || 'medium').toLowerCase()} ml-auto">${item.priority}</span>
          </div>
          <p class="text-[11px] text-slate-400">${item.importance}</p>
          <p class="text-[11px] text-cyan-300 mt-1">💡 ${item.recommendation}</p>
        </div>
      `;
    }
  });
  
  html += '</div>';
  section.innerHTML = html;
  return section;
}


// ══════════════════════════════════════════════
//  M3.2 — RESUME & COVER LETTER CUSTOMIZATION
// ══════════════════════════════════════════════

async function generateTailoredResume() {
  if (!currentProfile) {
    alert("Please upload your resume first.");
    return;
  }
  const jobId = document.getElementById("resume-job-select").value;
  if (!jobId) {
    alert("Please select an internship.");
    return;
  }

  document.getElementById("resume-empty-state").classList.add("hidden");

  try {
    const res = await fetch("/api/resume/customize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_profile: currentProfile,
        job_id: jobId,
        include_skill_gap: true
      })
    });
    currentTailoredResume = await res.json();
    
    const outputContainer = document.getElementById("resume-output-container");
    outputContainer.classList.remove("hidden");
    document.getElementById("resume-output-text").value = currentTailoredResume.resume_text || "";
  } catch (err) {
    console.error("Resume customize error:", err);
    alert("Error generating tailored resume.");
  }
}

async function generateCoverLetter() {
  if (!currentProfile) {
    alert("Please upload your resume first.");
    return;
  }
  const jobId = document.getElementById("resume-job-select").value;
  if (!jobId) {
    alert("Please select an internship.");
    return;
  }

  document.getElementById("resume-empty-state").classList.add("hidden");

  try {
    const res = await fetch("/api/cover-letter/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_profile: currentProfile,
        job_id: jobId
      })
    });
    currentCoverLetter = await res.json();
    
    const outputContainer = document.getElementById("cover-letter-output-container");
    outputContainer.classList.remove("hidden");
    document.getElementById("cover-letter-output-text").value = currentCoverLetter.cover_letter_text || "";
  } catch (err) {
    console.error("Cover letter error:", err);
    alert("Error generating cover letter.");
  }
}

function copyResumeText() {
  const text = document.getElementById("resume-output-text").value;
  navigator.clipboard.writeText(text).then(() => alert("Resume copied to clipboard!"));
}

function copyCoverLetter() {
  const text = document.getElementById("cover-letter-output-text").value;
  navigator.clipboard.writeText(text).then(() => alert("Cover letter copied to clipboard!"));
}

async function runAtsOptimization() {
  if (!currentProfile) {
    alert("Please upload your resume first.");
    return;
  }
  const jobId = document.getElementById("resume-job-select").value;
  if (!jobId) {
    alert("Please select an internship to optimize for ATS.");
    return;
  }

  document.getElementById("resume-empty-state").classList.add("hidden");
  const outputContainer = document.getElementById("ats-output-container");
  outputContainer.classList.remove("hidden");

  const scoreText = document.getElementById("ats-score-text");
  scoreText.innerText = "Analyzing ATS Match...";

  try {
    const res = await fetch("/api/resume/ats-optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_profile: currentProfile,
        job_id: jobId,
        include_skill_gap: true
      })
    });
    const result = await res.json();
    
    // Render ATS Score
    const score = result.ats_compatibility_score || 85;
    scoreText.innerText = `${score}% ATS Score (${result.ats_verdict || 'Good Match'})`;

    // Render Matched Keywords
    const matchedContainer = document.getElementById("ats-matched-keywords");
    matchedContainer.innerHTML = (result.matched_keywords || []).map(k => 
      `<span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-md">${k}</span>`
    ).join('') || '<span class="text-xs text-slate-400">None detected</span>';

    // Render Missing Keywords
    const missingContainer = document.getElementById("ats-missing-keywords");
    missingContainer.innerHTML = (result.missing_keywords || []).map(k => 
      `<span class="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-md">${k}</span>`
    ).join('') || '<span class="text-xs text-emerald-400 font-semibold">100% Target Keywords Present!</span>';

    // Render Recommendations
    const recList = document.getElementById("ats-recommendations-list");
    recList.innerHTML = (result.ats_recommendations || []).map(r => `<li>${r}</li>`).join('');

    // Render Output text
    document.getElementById("ats-resume-output-text").value = result.ats_resume_text || "";
    lucide.createIcons();

  } catch (err) {
    console.error("ATS Optimization error:", err);
    alert("Error running ATS optimization. Please try again.");
  }
}

function copyAtsResumeText() {
  const text = document.getElementById("ats-resume-output-text").value;
  navigator.clipboard.writeText(text).then(() => alert("ATS-optimized resume text copied to clipboard!"));
}



// ══════════════════════════════════════════════
//  M3.3 — INTERVIEW PREPARATION
// ══════════════════════════════════════════════

async function generateInterviewPrep() {
  if (!currentProfile) {
    alert("Please upload your resume first.");
    return;
  }
  const jobId = document.getElementById("interview-prep-job-select").value;
  if (!jobId) {
    alert("Please select an internship.");
    return;
  }

  document.getElementById("interview-prep-empty").classList.add("hidden");
  const tabsDiv = document.getElementById("interview-prep-tabs");
  tabsDiv.classList.remove("hidden");

  const content = document.getElementById("interview-prep-content");
  content.innerHTML = '<div class="p-8 text-center"><div class="typing-indicator mx-auto"><span></span><span></span><span></span></div><p class="text-xs text-slate-400 mt-2">Generating interview preparation...</p></div>';

  const diffSelect = document.getElementById("interview-prep-difficulty-select");
  const difficultyLevel = diffSelect ? diffSelect.value : "Medium";

  try {
    const res = await fetch("/api/interview/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_profile: currentProfile,
        job_id: jobId,
        include_skill_gap: true,
        difficulty_level: difficultyLevel
      })
    });
    currentInterviewPrep = await res.json();
    switchInterviewCategory('technical');
  } catch (err) {
    console.error("Interview prep error:", err);
    content.innerHTML = '<div class="p-6 text-center text-red-400">Error generating preparation. Please try again.</div>';
  }
}

function switchInterviewCategory(category) {
  // Update tab buttons
  document.querySelectorAll(".interview-cat-btn").forEach(btn => {
    btn.classList.remove("active-cat");
    btn.classList.add("bg-slate-700", "text-slate-300");
    btn.classList.remove("bg-indigo-600", "text-white");
  });
  const activeBtn = document.getElementById(`ipt-${category}`);
  if (activeBtn) {
    activeBtn.classList.add("active-cat");
    activeBtn.classList.remove("bg-slate-700", "text-slate-300");
    activeBtn.classList.add("bg-indigo-600", "text-white");
  }

  if (!currentInterviewPrep) return;

  const content = document.getElementById("interview-prep-content");

  if (category === 'revision') {
    renderRevisionPlan(content);
    return;
  }

  if (category === 'mock') {
    renderMockInterviewUI(content);
    return;
  }

  const categoryMap = {
    technical: 'technical_questions',
    resume: 'resume_questions',
    project: 'project_questions',
    role: 'role_questions',
    hr: 'hr_questions',
  };

  const questions = currentInterviewPrep[categoryMap[category]] || [];
  renderPrepQuestions(content, questions, category);
}

function renderPrepQuestions(container, questions, category) {
  container.innerHTML = "";
  
  if (questions.length === 0) {
    container.innerHTML = '<div class="p-6 text-center text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700"><p class="text-xs">No questions available for this category.</p></div>';
    return;
  }

  questions.forEach((q, idx) => {
    const card = document.createElement("div");
    card.className = "bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-3 fade-in";
    
    const diffColor = q.difficulty === 'Hard' ? 'text-rose-400' : (q.difficulty === 'Medium' ? 'text-amber-400' : 'text-emerald-400');

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold rounded-md uppercase">Q${idx + 1}</span>
          <span class="text-[10px] text-slate-400">${q.topic}</span>
          <span class="text-[10px] font-bold ${diffColor}">${q.difficulty}</span>
        </div>
      </div>
      <h4 class="text-sm font-bold text-slate-100 leading-snug">${q.question}</h4>
      <div class="p-3 bg-slate-900/60 border border-slate-700/50 rounded-lg space-y-2">
        <p class="text-[11px] text-cyan-300"><strong>Why asked:</strong> ${q.why_asked}</p>
        <p class="text-[11px] text-emerald-300"><strong>Guidance:</strong> ${q.guidance}</p>
        <div class="flex flex-wrap gap-1 mt-2">
          ${(q.key_concepts || []).map(c => `<span class="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded border border-slate-700">${c}</span>`).join('')}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderRevisionPlan(container) {
  const plan = currentInterviewPrep.revision_plan || {};
  container.innerHTML = "";
  
  ['priority_1', 'priority_2', 'priority_3'].forEach(key => {
    const p = plan[key];
    if (!p) return;
    
    const priorityColor = key === 'priority_1' ? 'rose' : (key === 'priority_2' ? 'amber' : 'blue');
    const card = document.createElement("div");
    card.className = `bg-slate-800/80 border border-slate-700 rounded-xl p-5 border-l-4 border-l-${priorityColor}-500 fade-in`;
    card.innerHTML = `
      <h4 class="text-sm font-bold text-white mb-1">${p.label}</h4>
      <p class="text-[11px] text-slate-400 mb-3">${p.description}</p>
      <div class="flex flex-wrap gap-2">
        ${(p.topics || []).map(t => `
          <span class="px-3 py-1.5 bg-${priorityColor}-500/10 border border-${priorityColor}-500/30 text-${priorityColor}-300 text-xs font-medium rounded-lg">${t}</span>
        `).join('')}
      </div>
    `;
    container.appendChild(card);
  });
}

function renderMockInterviewUI(container) {
  container.innerHTML = `
    <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4 fade-in">
      <h3 class="text-base font-bold text-white flex items-center gap-2">
        <i data-lucide="mic" class="w-5 h-5 text-purple-400"></i> Mock Interview Mode
      </h3>
      <p class="text-xs text-slate-400">Select a question category and practice answering. Your response will be evaluated.</p>
      <div class="flex flex-wrap gap-2">
        <button onclick="startMockInterview('technical')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition">Start Technical</button>
        <button onclick="startMockInterview('resume')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition">Start Resume-Based</button>
        <button onclick="startMockInterview('project')" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition">Start Project-Based</button>
        <button onclick="startMockInterview('hr')" class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition">Start HR</button>
      </div>
      <div id="mock-interview-area"></div>
    </div>
  `;
  lucide.createIcons();
}

let mockQuestions = [];
let mockIndex = 0;

function startMockInterview(category) {
  const categoryMap = {
    technical: 'technical_questions',
    resume: 'resume_questions',
    project: 'project_questions',
    hr: 'hr_questions',
  };
  mockQuestions = currentInterviewPrep[categoryMap[category]] || [];
  mockIndex = 0;
  renderMockQuestion();
}

function renderMockQuestion() {
  const area = document.getElementById("mock-interview-area");
  if (mockIndex >= mockQuestions.length) {
    area.innerHTML = `
      <div class="p-6 text-center bg-emerald-950/30 border border-emerald-500/30 rounded-xl mt-4">
        <i data-lucide="check-circle" class="w-8 h-8 text-emerald-400 mx-auto mb-2"></i>
        <p class="text-sm font-bold text-emerald-300">Mock Interview Complete!</p>
        <p class="text-xs text-slate-400 mt-1">You've answered all ${mockQuestions.length} questions in this category.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const q = mockQuestions[mockIndex];
  area.innerHTML = `
    <div class="p-5 bg-slate-900 border border-slate-700 rounded-xl mt-4 space-y-4">
      <div class="flex items-center justify-between">
        <span class="px-2.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-bold rounded-md uppercase">Question ${mockIndex + 1} of ${mockQuestions.length}</span>
        <span class="text-xs text-slate-400">${q.topic} • ${q.difficulty}</span>
      </div>
      <h4 class="text-sm font-bold text-slate-100">${q.question}</h4>
      <textarea id="mock-answer-input" rows="4" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:border-purple-500 focus:outline-none" placeholder="Type your answer here..."></textarea>
      <button onclick="submitMockAnswer()" class="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-md transition flex items-center gap-2">
        <i data-lucide="send" class="w-4 h-4"></i> Submit & Evaluate
      </button>
      <div id="mock-feedback-area" class="hidden"></div>
    </div>
  `;
  lucide.createIcons();
}

async function submitMockAnswer() {
  const q = mockQuestions[mockIndex];
  const answer = document.getElementById("mock-answer-input").value;

  try {
    const res = await fetch("/api/interview/mock/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: q.question,
        expected_concepts: q.key_concepts || [],
        user_answer: answer,
        question_type: q.topic
      })
    });
    const result = await res.json();
    
    const feedbackArea = document.getElementById("mock-feedback-area");
    feedbackArea.classList.remove("hidden");
    const isGood = result.score >= 65;
    feedbackArea.className = `p-4 rounded-lg border text-xs space-y-3 ${isGood ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-amber-950/30 border-amber-500/30'}`;
    feedbackArea.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-bold text-sm ${isGood ? 'text-emerald-300' : 'text-amber-300'}">${result.verdict}</span>
        <span class="px-2.5 py-0.5 rounded font-extrabold text-sm ${isGood ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">Score: ${result.score}/100</span>
      </div>
      <div><strong class="text-emerald-300">Good:</strong> ${(result.what_was_good || []).join(', ')}</div>
      <div><strong class="text-amber-300">Improve:</strong> ${(result.what_could_improve || []).join(', ')}</div>
      ${result.missing_points && result.missing_points.length ? `<div><strong class="text-cyan-300">Missing concepts:</strong> ${result.missing_points.join(', ')}</div>` : ''}
      <button onclick="mockIndex++; renderMockQuestion()" class="mt-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition">Next Question →</button>
    `;
  } catch (err) {
    console.error("Mock evaluation error:", err);
  }
}


// ══════════════════════════════════════════════
//  M3.4 — CAREER ASSISTANT CHAT
// ══════════════════════════════════════════════

function sendAssistantQuick(message) {
  document.getElementById("chat-input").value = message;
  sendAssistantMessage();
}

async function sendAssistantMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (!message) return;
  
  input.value = "";
  
  // Add user message
  appendChatMessage("user", message);
  
  // Show typing indicator
  const typingId = appendTypingIndicator();
  
  try {
    const body = {
      message: message,
      student_profile: currentProfile,
      session_id: "default",
    };
    
    if (selectedM3Job) {
      body.selected_job = selectedM3Job;
    }
    
    const res = await fetch("/api/career-assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    
    // Remove typing indicator
    removeTypingIndicator(typingId);
    
    // Add assistant response
    appendChatMessage("assistant", data.response, data.suggestions);
    
    // Update context badge
    if (data.data && data.data.matches) {
      selectedM3Job = data.data.matches[0]?.job || selectedM3Job;
    }
    if (data.data && data.data.skill_gap) {
      currentSkillGapResult = data.data.skill_gap;
    }
    
    updateContextBadge();
    
  } catch (err) {
    removeTypingIndicator(typingId);
    appendChatMessage("assistant", "Sorry, I encountered an error. Please try again.");
    console.error("Chat error:", err);
  }
}

function appendChatMessage(role, content, suggestions = []) {
  const container = document.getElementById("chat-messages");
  const div = document.createElement("div");
  div.className = `chat-message ${role === 'user' ? 'user-msg' : 'assistant-msg'}`;
  
  // Simple markdown-like formatting
  let formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '&bull; ');
  
  if (role === 'user') {
    div.innerHTML = `
      <div class="flex items-start gap-3 justify-end">
        <div class="bg-indigo-600/20 border border-indigo-500/30 rounded-lg rounded-tr-none p-3 text-xs text-slate-200 leading-relaxed max-w-[85%]">
          ${formatted}
        </div>
        <div class="p-1.5 bg-slate-700 rounded-lg flex-shrink-0 mt-0.5">
          <i data-lucide="user" class="w-4 h-4 text-slate-300"></i>
        </div>
      </div>
    `;
  } else {
    let suggestionsHtml = '';
    if (suggestions && suggestions.length > 0) {
      suggestionsHtml = `
        <div class="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-700/50">
          ${suggestions.map(s => `<button onclick="sendAssistantQuick('${s.replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-[10px] rounded-md transition">${s}</button>`).join('')}
        </div>
      `;
    }
    
    div.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="p-1.5 bg-indigo-600/20 rounded-lg flex-shrink-0 mt-0.5">
          <i data-lucide="bot" class="w-4 h-4 text-indigo-400"></i>
        </div>
        <div class="bg-slate-900/80 border border-slate-700 rounded-lg rounded-tl-none p-3 text-xs text-slate-200 leading-relaxed max-w-[85%] chat-md">
          ${formatted}
          ${suggestionsHtml}
        </div>
      </div>
    `;
  }
  
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  lucide.createIcons();
}

let typingCounter = 0;
function appendTypingIndicator() {
  const id = `typing-${++typingCounter}`;
  const container = document.getElementById("chat-messages");
  const div = document.createElement("div");
  div.id = id;
  div.className = "chat-message assistant-msg";
  div.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="p-1.5 bg-indigo-600/20 rounded-lg flex-shrink-0 mt-0.5">
        <i data-lucide="bot" class="w-4 h-4 text-indigo-400"></i>
      </div>
      <div class="typing-indicator bg-slate-900/80 border border-slate-700 rounded-lg rounded-tl-none">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  lucide.createIcons();
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function updateContextBadge() {
  const badge = document.getElementById("assistant-context-badge");
  const text = document.getElementById("assistant-context-text");
  
  if (selectedM3Job) {
    badge.classList.remove("hidden");
    text.innerText = `${selectedM3Job.title} @ ${selectedM3Job.company}`;
  }
}

// ══════════════════════════════════════════════
//  AI INTERACTIVE MOCK INTERVIEWER CHAT ROOM
// ══════════════════════════════════════════════

let simCurrentQuestionIndex = 0;
let simTotalQuestions = 5;
let simSessionActive = false;
let simSelectedJobId = null;

async function startInteractiveSimulatedInterview() {
  if (!currentProfile) {
    alert("Please upload or load your resume profile first in the Profile & Resume tab.");
    return;
  }
  
  const jobId = document.getElementById("mock-sim-job-select").value;
  if (!jobId) {
    alert("Please select an internship to start your live mock interview.");
    return;
  }

  simSelectedJobId = jobId;
  simCurrentQuestionIndex = 0;
  simSessionActive = true;

  const job = getJobById(jobId);
  if (job) {
    document.getElementById("sim-progress-title").innerText = `Mock Interview: ${job.title}`;
    document.getElementById("sim-progress-badge").innerText = `Round 1 of 5`;
    document.getElementById("sim-role-subtitle").innerText = `${job.company} • ${job.domain}`;
  }

  const chatLog = document.getElementById("sim-chat-log");
  chatLog.innerHTML = '<div class="p-6 text-center"><div class="typing-indicator mx-auto"><span></span><span></span><span></span></div><p class="text-xs text-slate-400 mt-2">Connecting to AI Technical Lead Sarah...</p></div>';

  const diffSelect = document.getElementById("mock-sim-difficulty-select");
  const difficultyLevel = diffSelect ? diffSelect.value : "Medium";

  try {
    const res = await fetch("/api/interview/simulated-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_profile: currentProfile,
        job_id: jobId,
        current_question_index: 0,
        candidate_answer: "",
        difficulty_level: difficultyLevel
      })
    });
    const data = await res.json();
    chatLog.innerHTML = "";
    appendSimulatedInterviewerMessage(data.interviewer_message);
  } catch (err) {
    console.error("Error starting interactive interview:", err);
    chatLog.innerHTML = '<div class="p-6 text-center text-rose-400 text-xs">Failed to connect to AI Interviewer. Please try again.</div>';
  }
}

async function submitSimulatedAnswer() {
  stopInterviewVoiceInput();
  if (!simSessionActive && simCurrentQuestionIndex > 0) {
    alert("Interview session is completed! Click 'Restart Session' to practice again.");
    return;
  }
  
  const input = document.getElementById("sim-candidate-input");
  const answer = input.value.trim();
  if (!answer) {
    alert("Please type or speak your technical response before submitting.");
    return;
  }

  input.value = "";
  appendSimulatedCandidateMessage(answer);

  const chatLog = document.getElementById("sim-chat-log");
  const typingId = `sim-typing-${Date.now()}`;
  
  const typingDiv = document.createElement("div");
  typingDiv.id = typingId;
  typingDiv.className = "flex items-start gap-3 fade-in";
  typingDiv.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center flex-shrink-0 text-purple-300 text-xs font-bold">AI</div>
    <div class="typing-indicator bg-slate-900 border border-slate-700 rounded-xl rounded-tl-none p-3">
      <span></span><span></span><span></span>
    </div>
  `;
  chatLog.appendChild(typingDiv);
  chatLog.scrollTop = chatLog.scrollHeight;

  const diffSelect = document.getElementById("mock-sim-difficulty-select");
  const difficultyLevel = diffSelect ? diffSelect.value : "Medium";

  try {
    const res = await fetch("/api/interview/simulated-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_profile: currentProfile,
        job_id: simSelectedJobId,
        current_question_index: simCurrentQuestionIndex,
        candidate_answer: answer,
        difficulty_level: difficultyLevel
      })
    });
    const data = await res.json();
    document.getElementById(typingId)?.remove();

    simCurrentQuestionIndex = data.current_question_index;
    simSessionActive = data.session_active;

    document.getElementById("sim-progress-badge").innerText = `Round ${Math.min(simCurrentQuestionIndex + 1, data.total_questions)} of ${data.total_questions}`;

    appendSimulatedInterviewerMessage(data.interviewer_message);

  } catch (err) {
    document.getElementById(typingId)?.remove();
    console.error("Simulated interview error:", err);
    appendSimulatedInterviewerMessage("Sorry, I had trouble evaluating that response. Let's try again.");
  }
}

function appendSimulatedInterviewerMessage(content) {
  const chatLog = document.getElementById("sim-chat-log");
  const div = document.createElement("div");
  div.className = "flex items-start gap-3 fade-in";
  
  let formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '&bull; ');

  div.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center flex-shrink-0 text-purple-300 text-xs font-bold">AI</div>
    <div class="bg-slate-900/90 border border-purple-500/30 rounded-xl rounded-tl-none p-4 text-xs text-slate-200 leading-relaxed max-w-[90%] space-y-2">
      <div class="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span> Sarah • AI Lead Technical Interviewer
      </div>
      <div>${formatted}</div>
    </div>
  `;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  lucide.createIcons();
}

function appendSimulatedCandidateMessage(content) {
  const chatLog = document.getElementById("sim-chat-log");
  const div = document.createElement("div");
  div.className = "flex items-start gap-3 justify-end fade-in";

  div.innerHTML = `
    <div class="bg-indigo-600/20 border border-indigo-500/30 rounded-xl rounded-tr-none p-3.5 text-xs text-slate-200 leading-relaxed max-w-[85%]">
      <div class="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-1">Candidate Response</div>
      ${content.replace(/\n/g, '<br>')}
    </div>
    <div class="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center flex-shrink-0 text-indigo-300 text-xs font-bold">YOU</div>
  `;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  lucide.createIcons();
}

function resetSimulatedInterview() {
  stopInterviewVoiceInput();
  simCurrentQuestionIndex = 0;
  simSessionActive = false;
  document.getElementById("sim-progress-title").innerText = "Interview Session Idle";
  document.getElementById("sim-progress-badge").innerText = "0 / 5 Rounds";
  document.getElementById("sim-role-subtitle").innerText = "Select an internship above and click 'Start Live AI Interview'";
  
  const chatLog = document.getElementById("sim-chat-log");
  chatLog.innerHTML = `
    <div class="p-8 text-center text-slate-400">
      <i data-lucide="mic" class="w-12 h-12 mx-auto text-purple-400 mb-3 opacity-60"></i>
      <h4 class="text-sm font-bold text-slate-200">Session Reset</h4>
      <p class="text-xs text-slate-400 max-w-md mx-auto mt-1">Select your target internship and click "Start Live AI Interview" to launch a new interview session.</p>
    </div>
  `;
  lucide.createIcons();
}

// ══════════════════════════════════════════════
//  SPEECH RECOGNITION / VOICE INPUT MODULE
// ══════════════════════════════════════════════

let speechRecognition = null;
let isInterviewListening = false;
let assistantRecognition = null;
let isAssistantListening = false;

function getSpeechRecognitionInstance() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return null;
  const instance = new SpeechRec();
  instance.continuous = true;
  instance.interimResults = true;
  instance.lang = 'en-US';
  return instance;
}

function toggleVoiceInput() {
  const btn = document.getElementById("btn-mic-sim-input");
  const label = document.getElementById("mic-btn-label");
  const indicator = document.getElementById("mic-status-indicator");
  const textarea = document.getElementById("sim-candidate-input");

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    alert("Speech recognition is not supported in this browser. Please try Google Chrome or MS Edge, or type your answer.");
    return;
  }

  if (isInterviewListening) {
    stopInterviewVoiceInput();
    return;
  }

  try {
    speechRecognition = getSpeechRecognitionInstance();
    if (!speechRecognition) return;

    let finalTranscript = textarea ? textarea.value : "";
    if (finalTranscript && !finalTranscript.endsWith(" ")) {
      finalTranscript += " ";
    }

    speechRecognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (textarea) {
        textarea.value = finalTranscript + interimTranscript;
      }
    };

    speechRecognition.onerror = (err) => {
      console.warn("Speech recognition error:", err.error);
      if (err.error === 'not-allowed') {
        alert("Microphone access denied. Please allow microphone permissions in your browser settings.");
      }
      stopInterviewVoiceInput();
    };

    speechRecognition.onend = () => {
      if (!isInterviewListening) {
        if (btn) btn.className = "px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5";
        if (label) label.innerText = "Mic";
        if (indicator) indicator.classList.add("hidden");
      }
    };

    speechRecognition.start();
    isInterviewListening = true;
    if (btn) btn.className = "px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5 animate-pulse shadow-lg shadow-rose-600/30";
    if (label) label.innerText = "Recording...";
    if (indicator) indicator.classList.remove("hidden");
    lucide.createIcons();

  } catch (err) {
    console.error("Speech recognition startup error:", err);
    alert("Could not start microphone voice input: " + err.message);
  }
}

function stopInterviewVoiceInput() {
  if (speechRecognition) {
    try { speechRecognition.stop(); } catch (e) {}
  }
  isInterviewListening = false;
  const btn = document.getElementById("btn-mic-sim-input");
  const label = document.getElementById("mic-btn-label");
  const indicator = document.getElementById("mic-status-indicator");
  if (btn) btn.className = "px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5";
  if (label) label.innerText = "Mic";
  if (indicator) indicator.classList.add("hidden");
}

function toggleAssistantVoiceInput() {
  const btn = document.getElementById("btn-assistant-mic");
  const input = document.getElementById("chat-input");

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    alert("Speech recognition is not supported in this browser. Please try Google Chrome or MS Edge.");
    return;
  }

  if (isAssistantListening) {
    if (assistantRecognition) try { assistantRecognition.stop(); } catch (e) {}
    isAssistantListening = false;
    if (btn) btn.className = "px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5";
    return;
  }

  try {
    assistantRecognition = getSpeechRecognitionInstance();
    if (!assistantRecognition) return;

    let finalTranscript = input ? input.value : "";
    if (finalTranscript && !finalTranscript.endsWith(" ")) finalTranscript += " ";

    assistantRecognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (input) input.value = finalTranscript + interimTranscript;
    };

    assistantRecognition.onerror = (err) => {
      isAssistantListening = false;
      if (btn) btn.className = "px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5";
    };

    assistantRecognition.onend = () => {
      isAssistantListening = false;
      if (btn) btn.className = "px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5";
    };

    assistantRecognition.start();
    isAssistantListening = true;
    if (btn) btn.className = "px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 animate-pulse shadow-lg shadow-rose-600/30";
  } catch (err) {
    console.error("Assistant speech error:", err);
  }
}

// ══════════════════════════════════════════════
//  M4.1 — APPLICATION TRACKER FRONTEND LOGIC
// ══════════════════════════════════════════════

let trackerApplications = [];
let trackerReminders = [];

async function loadTrackerApplications() {
  try {
    const res = await fetch("/api/applications");
    if (!res.ok) throw new Error("Failed to load applications");
    const data = await res.json();
    trackerApplications = data.applications || [];

    // Load reminders
    try {
      const remRes = await fetch("/api/applications/reminders");
      if (remRes.ok) {
        const remData = await remRes.json();
        trackerReminders = remData.reminders || [];
      }
    } catch (e) {
      console.warn("Could not load reminders:", e);
    }

    renderTrackerApplicationsList();
  } catch (err) {
    console.error("Error loading tracker applications:", err);
  }
}

function renderTrackerApplicationsList() {
  const container = document.getElementById("tracker-applications-list");
  if (!container) return;

  const searchQuery = (document.getElementById("tr-filter-search")?.value || "").toLowerCase();
  const statusFilter = document.getElementById("tr-filter-status")?.value || "ALL";
  const sortFilter = document.getElementById("tr-filter-sort")?.value || "deadline";

  // Calculate Metrics
  const totalCount = trackerApplications.length;
  const activeCount = trackerApplications.filter(a => ["Planning to apply", "Applied", "Application under review", "Shortlisted", "Interview scheduled"].includes(a.status)).length;
  const interviewsCount = trackerApplications.filter(a => a.status === "Interview scheduled" || a.interview_date).length;
  const offersCount = trackerApplications.filter(a => a.status === "Offer received").length;
  const rejectedCount = trackerApplications.filter(a => a.status === "Rejected" || a.status === "Withdrawn").length;
  const upcomingDeadlinesCount = trackerApplications.filter(a => a.deadline && new Date(a.deadline) >= new Date()).length;

  document.getElementById("tr-stat-total").innerText = totalCount;
  document.getElementById("tr-stat-active").innerText = activeCount;
  document.getElementById("tr-stat-deadlines").innerText = upcomingDeadlinesCount;
  document.getElementById("tr-stat-interviews").innerText = interviewsCount;
  document.getElementById("tr-stat-offers").innerText = offersCount;
  document.getElementById("tr-stat-rejected").innerText = rejectedCount;

  // Render Reminders List
  const remindersContainer = document.getElementById("tracker-reminders-list");
  if (remindersContainer) {
    if (trackerReminders.length === 0) {
      remindersContainer.innerHTML = `<p class="text-slate-400 italic">No urgent deadline or interview reminders pending.</p>`;
    } else {
      remindersContainer.innerHTML = trackerReminders.map(rem => `
        <div class="flex items-center justify-between p-2 bg-slate-900/80 border border-amber-500/20 rounded-lg text-xs">
          <span class="font-medium text-amber-200">🔔 <strong>${rem.company}</strong> (${rem.title}): ${rem.message}</span>
          <span class="text-[10px] text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded font-mono">${rem.type.toUpperCase()}</span>
        </div>
      `).join("");
    }
  }

  // Filter & Sort Applications
  let filtered = trackerApplications.filter(app => {
    const matchesSearch = (app.company || "").toLowerCase().includes(searchQuery) ||
                          (app.title || "").toLowerCase().includes(searchQuery);
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  filtered.sort((a, b) => {
    if (sortFilter === "deadline") {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    } else if (sortFilter === "applied_date") {
      return new Date(b.application_date || 0) - new Date(a.application_date || 0);
    } else if (sortFilter === "company") {
      return (a.company || "").localeCompare(b.company || "");
    }
    return 0;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700 space-y-2">
        <i data-lucide="clipboard-list" class="w-10 h-10 mx-auto text-amber-400 opacity-60"></i>
        <p class="font-medium text-slate-300">No Applications Found</p>
        <p class="text-xs text-slate-400">Click "Add Application to Tracker" or browse jobs in Knowledge Base to add applications.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const statusColors = {
    "Saved": "bg-slate-700 text-slate-200 border-slate-600",
    "Planning to apply": "bg-blue-500/10 text-blue-300 border-blue-500/30",
    "Applied": "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    "Application under review": "bg-purple-500/10 text-purple-300 border-purple-500/30",
    "Shortlisted": "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    "Interview scheduled": "bg-amber-500/10 text-amber-300 border-amber-500/30",
    "Interview completed": "bg-teal-500/10 text-teal-300 border-teal-500/30",
    "Offer received": "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    "Rejected": "bg-rose-500/10 text-rose-300 border-rose-500/30",
    "Withdrawn": "bg-slate-800 text-slate-400 border-slate-700",
  };

  container.innerHTML = filtered.map(app => {
    const statusBadge = statusColors[app.status] || "bg-slate-700 text-slate-200 border-slate-600";
    
    return `
      <div class="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-4 hover:border-amber-500/40 transition">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-base font-bold text-white">${app.company}</h3>
              <span class="px-2.5 py-0.5 border text-xs font-semibold rounded-full ${statusBadge}">
                ${app.status}
              </span>
            </div>
            <p class="text-xs font-semibold text-amber-300">${app.title}</p>
          </div>

          <div class="flex items-center gap-2">
            <select onchange="updateTrackerStatus('${app.id}', this.value)" class="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-amber-500 focus:outline-none">
              ${["Saved", "Planning to apply", "Applied", "Application under review", "Shortlisted", "Interview scheduled", "Interview completed", "Offer received", "Rejected", "Withdrawn"].map(st => `
                <option value="${st}" ${st === app.status ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
            <button onclick="editTrackerApplication('${app.id}')" class="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs" title="Edit Application">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteTrackerApplication('${app.id}')" class="p-1.5 bg-slate-700 hover:bg-rose-600 text-slate-200 hover:text-white rounded-lg text-xs transition" title="Delete Application">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-900/60 border border-slate-700/60 rounded-lg p-3">
          <div>
            <span class="text-slate-400">Application Date:</span>
            <span class="font-medium text-slate-200 block">${app.application_date || 'N/A'}</span>
          </div>
          <div>
            <span class="text-slate-400">Deadline:</span>
            <span class="font-medium text-amber-300 block">${app.deadline || 'No deadline set'}</span>
          </div>
          <div>
            <span class="text-slate-400">Interview Schedule:</span>
            <span class="font-medium text-purple-300 block">${app.interview_date || 'Not scheduled'}</span>
          </div>
        </div>

        ${app.notes ? `
          <div class="text-xs bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/40 text-slate-300">
            <span class="text-slate-400 font-semibold block mb-0.5">Notes & Follow-up:</span>
            ${app.notes}
          </div>
        ` : ''}

        <div class="flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/50 pt-2.5">
          <span>Status updated: ${app.last_updated ? new Date(app.last_updated).toLocaleString() : 'N/A'}</span>
          <div class="flex items-center gap-3">
            <button onclick="sendAssistantQuick('Update my ${app.company} application status to Interview scheduled')" class="text-amber-400 hover:underline flex items-center gap-1">
              <i data-lucide="bot" class="w-3 h-3"></i> Ask Assistant
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function openAddApplicationModal(prefillData = null) {
  const modal = document.getElementById("tracker-modal");
  if (!modal) return;

  document.getElementById("tr-modal-id").value = prefillData?.id || "";
  document.getElementById("tr-modal-company").value = prefillData?.company || "";
  document.getElementById("tr-modal-title-input").value = prefillData?.title || "";
  document.getElementById("tr-modal-status").value = prefillData?.status || "Applied";
  document.getElementById("tr-modal-deadline").value = prefillData?.deadline || "";
  document.getElementById("tr-modal-interview-date").value = prefillData?.interview_date || "";
  document.getElementById("tr-modal-interview-status").value = prefillData?.interview_status || "";
  document.getElementById("tr-modal-description").value = prefillData?.description || "";
  document.getElementById("tr-modal-notes").value = prefillData?.notes || "";

  document.getElementById("tracker-modal-title").innerHTML = prefillData?.id
    ? `<i data-lucide="edit-3" class="w-5 h-5 text-amber-400"></i> Edit Application`
    : `<i data-lucide="plus-circle" class="w-5 h-5 text-amber-400"></i> Add Internship Application`;

  modal.classList.remove("hidden");
  lucide.createIcons();
}

function closeTrackerModal() {
  const modal = document.getElementById("tracker-modal");
  if (modal) modal.classList.add("hidden");
}

async function handleTrackerModalSubmit(event) {
  event.preventDefault();
  const appId = document.getElementById("tr-modal-id").value;

  const payload = {
    company: document.getElementById("tr-modal-company").value,
    title: document.getElementById("tr-modal-title-input").value,
    status: document.getElementById("tr-modal-status").value,
    deadline: document.getElementById("tr-modal-deadline").value,
    interview_date: document.getElementById("tr-modal-interview-date").value,
    interview_status: document.getElementById("tr-modal-interview-status").value,
    description: document.getElementById("tr-modal-description").value,
    notes: document.getElementById("tr-modal-notes").value,
    student_id: currentProfile ? currentProfile.id : "student_default"
  };

  try {
    let res;
    if (appId) {
      res = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) {
      const err = await res.json();
      alert("Error saving application: " + (err.error || "Unknown error"));
      return;
    }

    closeTrackerModal();
    await loadTrackerApplications();
  } catch (err) {
    console.error("Error saving application:", err);
    alert("Could not save application: " + err.message);
  }
}

async function quickAddTrackerJob(company, title, description) {
  openAddApplicationModal({
    company: company,
    title: title,
    description: description,
    status: "Applied"
  });
}

async function editTrackerApplication(appId) {
  const app = trackerApplications.find(a => a.id === appId);
  if (app) openAddApplicationModal(app);
}

async function updateTrackerStatus(appId, newStatus) {
  try {
    const res = await fetch(`/api/applications/${appId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) {
      const err = await res.json();
      alert("Failed to update status: " + (err.error || "Invalid transition"));
      await loadTrackerApplications();
      return;
    }
    await loadTrackerApplications();
  } catch (err) {
    console.error("Error updating status:", err);
  }
}

async function applyToMatchedJob(company, title, description, jobId = '') {
  try {
    const payload = {
      company: company,
      title: title,
      description: description,
      status: "Applied",
      application_date: new Date().toISOString().split("T")[0],
      student_id: currentProfile ? (currentProfile.id || "student_default") : "student_default",
      job_id: jobId
    };

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert(`🎉 Application Submitted!\n\nSuccessfully applied for '${title}' at ${company}.\nStatus stage updated to 'Applied' in your Application Tracker.`);
      if (typeof loadTrackerApplications === "function") {
        await loadTrackerApplications();
      }
    } else {
      const err = await res.json();
      alert("Application tracking note: " + (err.error || "Application record already exists in tracker."));
    }
  } catch (err) {
    console.error("Apply error:", err);
    alert("Could not submit application: " + err.message);
  }
}

async function deleteTrackerApplication(appId) {
  if (!confirm("Are you sure you want to delete this application record from your tracker?")) return;

  try {
    const res = await fetch(`/api/applications/${appId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete application");
    await loadTrackerApplications();
  } catch (err) {
    console.error("Error deleting application:", err);
    alert("Could not delete application: " + err.message);
  }
}



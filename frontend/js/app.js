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
});

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

  // Populate M3 job selectors when switching to M3 tabs
  if (['skill-gap', 'resume-customizer', 'interview-prep'].includes(tabId)) {
    populateM3JobSelectors();
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
        <div class="flex gap-2">
          <button onclick="selectJobForM3('${job.id}')" class="flex-1 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5">
            <i data-lucide="search" class="w-3.5 h-3.5"></i> Analyze
          </button>
          <button onclick="prepareInterviewForJob('${job.title}', '${job.domain}')" class="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5">
            <i data-lucide="mic" class="w-3.5 h-3.5"></i> Mock
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

        <div class="flex items-center gap-2">
          <button onclick="selectJobForM3('${job.id}')" class="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1">
            <i data-lucide="search" class="w-3.5 h-3.5"></i> Skill Gap
          </button>
          <button onclick="fetchRoadmapForMatch('${job.title}', '${m.missing_skills.join(',')}')" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1">
            <i data-lucide="compass" class="w-3.5 h-3.5"></i> Roadmap
          </button>
          <button onclick="prepareInterviewForJob('${job.title}', '${job.domain}', '${m.missing_skills.join(',')}')" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition flex items-center gap-1">
            <i data-lucide="mic" class="w-3.5 h-3.5"></i> Interview
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

async function fetchRoadmapForMatch(targetRole, missingSkillsStr) {
  switchTab("roadmap");
  const missingSkills = missingSkillsStr ? missingSkillsStr.split(",") : [];

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
  }
}

function renderRoadmap(roadmap) {
  const container = document.getElementById("roadmap-timeline");
  container.innerHTML = "";

  (roadmap.roadmap_steps || []).forEach(step => {
    const div = document.createElement("div");
    div.className = "p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-2 relative pl-6 border-l-4 border-l-emerald-500";

    div.innerHTML = `
      <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
        <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i> ${step.phase}
      </h3>
      <ul class="space-y-1 text-xs text-slate-300 pl-6 list-disc">
        ${step.actions.map(act => `<li>${act}</li>`).join('')}
      </ul>
    `;
    container.appendChild(div);
  });

  lucide.createIcons();
}

// Authentication (unchanged)
let currentLoginRole = 'candidate';
let currentUser = null;

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

  if (role === 'candidate') {
    candBtn.className = "role-btn py-2 px-3 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-indigo-500";
    recBtn.className = "role-btn py-2 px-3 bg-slate-800 text-slate-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 hover:bg-slate-750";
  } else {
    recBtn.className = "role-btn py-2 px-3 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-indigo-500";
    candBtn.className = "role-btn py-2 px-3 bg-slate-800 text-slate-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 hover:bg-slate-750";
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: currentLoginRole })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      updateAuthUI(currentUser);
      closeLoginModal();
    }
  } catch (err) {
    console.error("Login error:", err);
  }
}

function quickLoginDemo() {
  document.getElementById("login-email").value = "candidate@example.com";
  document.getElementById("login-password").value = "demo1234";
  handleLoginSubmit(new Event('submit'));
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
  updateAuthUI(null);
}


// ══════════════════════════════════════════════
//  M3 — NEW FUNCTIONALITY
// ══════════════════════════════════════════════

// ── Helper: Populate M3 job selectors ──
function populateM3JobSelectors() {
  const selectors = ['skill-gap-job-select', 'resume-job-select', 'interview-prep-job-select'];
  
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

  try {
    const res = await fetch("/api/interview/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_profile: currentProfile,
        job_id: jobId,
        include_skill_gap: true
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

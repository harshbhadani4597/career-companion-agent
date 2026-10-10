// ══════════════════════════════════════════════
//  AI Career Companion Agent — Frontend JS
//  M1/M2 + M3 Complete Implementation
// ══════════════════════════════════════════════

// Global Application State
let currentProfile = null;
let extractedResumeProfile = null;
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

function initApp() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
  loadStatus();
  loadAllJobs();
  loadSavedOrEmptyProfile();
  initStep1ValidationListeners();
  initCompleteProfileListeners();
  checkInitialAuthSession();
  fetchCaptcha('gate');

  // Initialize Password Strength Meters
  if (typeof PasswordStrengthMeter !== 'undefined') {
    window.gatePasswordMeter = new PasswordStrengthMeter({
      container: '#gate-password-meter',
      input: '#gate-password',
      submitButton: '#gate-submit-btn'
    });
    window.modalPasswordMeter = new PasswordStrengthMeter({
      container: '#modal-password-meter',
      input: '#login-password'
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

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

  const effectiveName = currentUser?.fullName || currentUser?.name || candidateName || "Candidate";

  if (greetingEl) greetingEl.innerText = greeting;
  if (nameEl) nameEl.innerText = effectiveName;
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
    if (tabId === 'resume-customizer') {
      initResumeCustomizerView();
    }
    const timeline = document.getElementById("roadmap-timeline");
    if (tabId === 'roadmap' && (!timeline || timeline.children.length === 0 || timeline.innerText.includes("No Target Role Selected"))) {
      generateRoadmapFromUI();
    }
  }

  if (tabId === 'career-snapshot') {
    loadCareerSnapshotUI();
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  if (tabId === 'tracker') {
    loadTrackerApplications();
  }
}

// ══════════════════════════════════════════════
//  FUTURE CAREER SNAPSHOT / STUDENT PROFILE
// ══════════════════════════════════════════════

let snapshotTargetRoles = [];
let snapshotTechSkills = [];
let snapshotSoftSkills = [];
let snapshotProjects = [];

function loadCareerSnapshotUI() {
  const uniInput = document.getElementById("snap-university");
  const degInput = document.getElementById("snap-degree");
  const yearInput = document.getElementById("snap-grad-year");
  const phoneInput = document.getElementById("snap-phone");
  const cityInput = document.getElementById("snap-city");
  const prefLocInput = document.getElementById("snap-pref-location");

  const edu = currentProfile?.education?.[0] || {};
  if (uniInput) uniInput.value = currentUser?.university || edu.institution || "";
  if (degInput) degInput.value = currentUser?.degree || edu.degree || "";
  if (yearInput) yearInput.value = currentUser?.graduationYear || edu.year || "2026";

  const rawPhone = currentUser?.mobile 
    ? `${currentUser.countryCode || "+91"} ${currentUser.mobile}`.trim()
    : (currentUser?.phone || currentProfile?.phone || "");
  if (phoneInput) phoneInput.value = rawPhone;

  if (cityInput) cityInput.value = currentUser?.city || currentProfile?.location || "";
  if (prefLocInput) {
    prefLocInput.value = currentUser?.preferredLocation || currentProfile?.preferred_locations?.[0] || "";
  }

  // Load arrays
  snapshotTargetRoles = Array.from(new Set([
    ...(currentUser?.targetRoles || []),
    ...(currentProfile?.target_roles || ["Full-Stack Developer", "Software Engineer"])
  ]));

  snapshotTechSkills = Array.from(new Set([
    ...(currentUser?.skills || []),
    ...(currentProfile?.technical_skills || ["React", "Node.js", "Python", "SQL", "Git"])
  ]));

  snapshotSoftSkills = Array.from(new Set([
    ...(currentUser?.softSkills || []),
    ...(currentProfile?.soft_skills || ["Agile Methodologies", "Problem Solving", "Team Leadership"])
  ]));

  snapshotProjects = Array.isArray(currentUser?.projects) && currentUser.projects.length > 0
    ? [...currentUser.projects]
    : (Array.isArray(currentProfile?.projects) ? [...currentProfile.projects] : []);

  renderSnapshotTags();
  renderSnapshotProjects();
}

function renderSnapshotTags() {
  // 1. Roles
  const rolesCont = document.getElementById("snap-roles-container");
  if (rolesCont) {
    if (snapshotTargetRoles.length === 0) {
      rolesCont.innerHTML = `<span class="text-[11px] text-slate-500 italic">No target roles added yet.</span>`;
    } else {
      rolesCont.innerHTML = snapshotTargetRoles.map((role, idx) => `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg">
          <span>${role}</span>
          <button type="button" onclick="removeSnapshotRole(${idx})" class="text-slate-400 hover:text-rose-400 text-xs transition">✕</button>
        </span>
      `).join('');
    }
  }

  // 2. Tech Skills (Matches purple pill badge from screenshot)
  const techCont = document.getElementById("snap-tech-skills-container");
  if (techCont) {
    if (snapshotTechSkills.length === 0) {
      techCont.innerHTML = `<span class="text-[11px] text-slate-500 italic">No technical skills added yet.</span>`;
    } else {
      techCont.innerHTML = snapshotTechSkills.map((skill, idx) => `
        <span class="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 text-xs font-semibold rounded-lg shadow-sm">
          <span>${skill}</span>
          <button type="button" onclick="removeSnapshotTechSkill(${idx})" class="text-indigo-400 hover:text-white text-xs transition font-bold" title="Remove skill">✕</button>
        </span>
      `).join('');
    }
  }

  // 3. Soft Skills
  const softCont = document.getElementById("snap-soft-skills-container");
  if (softCont) {
    if (snapshotSoftSkills.length === 0) {
      softCont.innerHTML = `<span class="text-[11px] text-slate-500 italic">No soft skills added yet.</span>`;
    } else {
      softCont.innerHTML = snapshotSoftSkills.map((skill, idx) => `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg">
          <span>${skill}</span>
          <button type="button" onclick="removeSnapshotSoftSkill(${idx})" class="text-slate-400 hover:text-rose-400 text-xs transition">✕</button>
        </span>
      `).join('');
    }
  }
}

function addSnapshotRole() {
  const inp = document.getElementById("snap-role-input");
  if (!inp) return;
  const val = inp.value.trim();
  if (val && !snapshotTargetRoles.includes(val)) {
    snapshotTargetRoles.push(val);
    renderSnapshotTags();
  }
  inp.value = "";
  inp.focus();
}

function removeSnapshotRole(idx) {
  snapshotTargetRoles.splice(idx, 1);
  renderSnapshotTags();
}

function addSnapshotTechSkill() {
  const inp = document.getElementById("snap-tech-skill-input");
  if (!inp) return;
  const val = inp.value.trim();
  if (val && !snapshotTechSkills.includes(val)) {
    snapshotTechSkills.push(val);
    renderSnapshotTags();
  }
  inp.value = "";
  inp.focus();
}

function removeSnapshotTechSkill(idx) {
  snapshotTechSkills.splice(idx, 1);
  renderSnapshotTags();
}

function addSnapshotSoftSkill() {
  const inp = document.getElementById("snap-soft-skill-input");
  if (!inp) return;
  const val = inp.value.trim();
  if (val && !snapshotSoftSkills.includes(val)) {
    snapshotSoftSkills.push(val);
    renderSnapshotTags();
  }
  inp.value = "";
  inp.focus();
}

function removeSnapshotSoftSkill(idx) {
  snapshotSoftSkills.splice(idx, 1);
  renderSnapshotTags();
}

function renderSnapshotProjects() {
  const container = document.getElementById("snap-projects-container");
  if (!container) return;

  if (snapshotProjects.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-500 text-xs italic bg-slate-950/40 rounded-xl border border-slate-800/80">
        No projects added yet. Click "+ Add Project" above to showcase your portfolio.
      </div>
    `;
    return;
  }

  container.innerHTML = snapshotProjects.map((p, idx) => {
    const techBadges = Array.isArray(p.tech_stack)
      ? p.tech_stack
      : (typeof p.tech_stack === "string" ? p.tech_stack.split(",").map(s => s.trim()).filter(Boolean) : []);

    return `
      <div class="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-3 group hover:border-slate-700 transition">
        <div class="space-y-1.5 flex-1">
          <div class="flex items-center gap-2">
            <h4 class="text-xs font-bold text-white">${p.title || "Untitled Project"}</h4>
            ${p.link ? `<a href="${p.link}" target="_blank" class="text-indigo-400 hover:text-indigo-300 text-[11px] flex items-center gap-1"><i data-lucide="external-link" class="w-3 h-3"></i></a>` : ""}
          </div>
          <p class="text-[11px] text-slate-400 leading-relaxed">${p.description || "No description provided."}</p>
          <div class="flex flex-wrap gap-1.5 pt-1">
            ${techBadges.map(t => `<span class="px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded-md font-mono">${t}</span>`).join('')}
          </div>
        </div>
        <button type="button" onclick="removeSnapshotProject(${idx})" class="text-slate-500 hover:text-rose-400 text-xs font-semibold self-start sm:self-auto p-1.5 rounded-lg hover:bg-slate-900 transition" title="Remove project">
          ✕
        </button>
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function openAddProjectModal() {
  const modal = document.getElementById("snap-project-modal");
  if (modal) {
    document.getElementById("snap-modal-proj-title").value = "";
    document.getElementById("snap-modal-proj-tech").value = "";
    document.getElementById("snap-modal-proj-desc").value = "";
    document.getElementById("snap-modal-proj-link").value = "";
    modal.classList.remove("hidden");
  }
}

function closeAddProjectModal() {
  const modal = document.getElementById("snap-project-modal");
  if (modal) modal.classList.add("hidden");
}

function submitAddProjectModal() {
  const title = document.getElementById("snap-modal-proj-title")?.value?.trim();
  const tech = document.getElementById("snap-modal-proj-tech")?.value?.trim();
  const desc = document.getElementById("snap-modal-proj-desc")?.value?.trim();
  const link = document.getElementById("snap-modal-proj-link")?.value?.trim();

  if (!title) {
    alert("Please enter a project title.");
    return;
  }

  const techStack = tech ? tech.split(",").map(s => s.trim()).filter(Boolean) : [];
  snapshotProjects.push({
    title,
    tech_stack: techStack,
    description: desc,
    link
  });

  closeAddProjectModal();
  renderSnapshotProjects();
}

function removeSnapshotProject(idx) {
  snapshotProjects.splice(idx, 1);
  renderSnapshotProjects();
}

async function saveCareerSnapshot() {
  const university = document.getElementById("snap-university")?.value?.trim() || "";
  const degree = document.getElementById("snap-degree")?.value?.trim() || "";
  const gradYear = document.getElementById("snap-grad-year")?.value?.trim() || "2026";
  const phone = document.getElementById("snap-phone")?.value?.trim() || "";
  const city = document.getElementById("snap-city")?.value?.trim() || "";
  const prefLocation = document.getElementById("snap-pref-location")?.value?.trim() || "";

  // Parse phone into country code and mobile
  let countryCode = "+91";
  let mobileDigits = phone.replace(/\D/g, "");
  if (phone.startsWith("+")) {
    const parts = phone.split(" ");
    if (parts.length > 1) {
      countryCode = parts[0];
      mobileDigits = parts.slice(1).join("").replace(/\D/g, "");
    }
  }

  // Update currentUser object
  if (currentUser) {
    currentUser.university = university;
    currentUser.degree = degree;
    currentUser.graduationYear = gradYear;
    if (mobileDigits) currentUser.mobile = mobileDigits;
    currentUser.countryCode = countryCode;
    currentUser.city = city;
    currentUser.preferredLocation = prefLocation;
    currentUser.targetRoles = snapshotTargetRoles;
    currentUser.skills = snapshotTechSkills;
    currentUser.softSkills = snapshotSoftSkills;
    currentUser.projects = snapshotProjects;
    localStorage.setItem("career_companion_user", JSON.stringify(currentUser));
  }

  // Update currentProfile object
  syncProfileWithCurrentUser();

  // Send to backend
  const token = localStorage.getItem("auth_token") || localStorage.getItem("career_companion_token") || currentUser?.token || "";
  const payload = {
    fullName: currentUser?.fullName || currentUser?.name || "Candidate",
    countryCode: countryCode,
    mobile: mobileDigits || "9999999999",
    university: university || "University",
    degree: degree || "Student",
    graduationYear: parseInt(gradYear, 10) || 2026,
    city: city || "City",
    skills: snapshotTechSkills.length > 0 ? snapshotTechSkills : ["General"],
    preferredLocation: prefLocation,
    targetRoles: snapshotTargetRoles,
    softSkills: snapshotSoftSkills,
    projects: snapshotProjects,
    token: token,
    email: currentUser?.email || ""
  };

  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        currentUser = { ...(currentUser || {}), ...data.user };
        localStorage.setItem("career_companion_user", JSON.stringify(currentUser));
      }
    }
  } catch (err) {
    console.warn("Backend profile sync notice:", err);
  }

  showToast("Future Career Snapshot saved successfully!", "success");
  if (typeof executeMatching === "function") {
    executeMatching();
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

function syncProfileWithCurrentUser() {
  if (!currentUser) return;

  const candidateName = currentUser.fullName || currentUser.name || "Candidate";
  const candidateEmail = currentUser.email || "";
  const candidatePhone = currentUser.mobile
    ? `${currentUser.countryCode || "+91"} ${currentUser.mobile}`.trim()
    : (currentUser.phone || "");

  // Key storage per user to avoid collision with other accounts
  const userProfileKey = `career_companion_profile_${currentUser.email || currentUser.id}`;
  let existingProfile = null;
  const rawSaved = localStorage.getItem(userProfileKey) || localStorage.getItem("career_companion_profile");
  if (rawSaved) {
    try {
      const parsed = JSON.parse(rawSaved);
      // Only retain extra parsed resume attributes if it belongs to this user
      if (parsed && (!parsed.email || parsed.email.toLowerCase() === candidateEmail.toLowerCase())) {
        existingProfile = parsed;
      }
    } catch (e) {}
  }

  // Load any previously extracted resume profile specifically uploaded by this user
  extractedResumeProfile = loadExtractedResumeProfile();

  currentProfile = {
    ...(existingProfile || {}),
    ...(extractedResumeProfile || {}),
    name: candidateName,
    email: candidateEmail,
    phone: candidatePhone,
    location: currentUser.city || existingProfile?.location || "",
    preferred_locations: currentUser.city ? [currentUser.city] : (existingProfile?.preferred_locations || []),
    education: [
      {
        institution: currentUser.university || (existingProfile?.education?.[0]?.institution) || "",
        degree: currentUser.degree || (existingProfile?.education?.[0]?.degree) || "Student",
        year: String(currentUser.graduationYear || (existingProfile?.education?.[0]?.year) || "2026"),
        graduation: `Graduation: ${currentUser.graduationYear || (existingProfile?.education?.[0]?.year) || "2026"}`
      }
    ],
    technical_skills: Array.from(new Set([
      ...(currentUser.skills || []),
      ...(existingProfile?.technical_skills || []),
      ...(extractedResumeProfile?.technical_skills || [])
    ])),
    soft_skills: Array.from(new Set([
      ...(currentUser.softSkills || []),
      ...(existingProfile?.soft_skills || [])
    ])),
    target_roles: Array.from(new Set([
      ...(currentUser.targetRoles || []),
      ...(existingProfile?.target_roles || [])
    ])),
    projects: (currentUser.projects && currentUser.projects.length > 0)
      ? currentUser.projects
      : (existingProfile?.projects || extractedResumeProfile?.projects || [])
  };

  localStorage.setItem(userProfileKey, JSON.stringify(currentProfile));
  localStorage.setItem("career_companion_profile", JSON.stringify(currentProfile));

  // Extracted Candidate Profile Data Model is filled ONLY when a resume has been uploaded/parsed
  renderExtractedResumeUI(extractedResumeProfile);
  updateCandidateStatsUI();

  if (typeof executeMatching === "function") {
    executeMatching();
  }
}

function getResumeStorageKey() {
  const email = currentUser?.email || (currentUser?.id ? String(currentUser.id) : "guest");
  return `career_companion_extracted_resume_${email}`;
}

function saveExtractedResumeProfile(profile) {
  if (!profile) {
    localStorage.removeItem(getResumeStorageKey());
  } else {
    localStorage.setItem(getResumeStorageKey(), JSON.stringify(profile));
  }
}

function loadExtractedResumeProfile() {
  const key = getResumeStorageKey();
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && (
        (parsed.name && parsed.name.trim()) ||
        (parsed.email && parsed.email.trim()) ||
        (parsed.phone && parsed.phone.trim()) ||
        (Array.isArray(parsed.technical_skills) && parsed.technical_skills.length > 0) ||
        (Array.isArray(parsed.projects) && parsed.projects.length > 0)
      )) {
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse stored extracted resume", e);
    }
  }
  return null;
}

function updateCandidateStatsUI() {
  const candidateName = currentUser?.fullName || currentUser?.name || extractedResumeProfile?.name || currentProfile?.name || "";
  updateWelcomeBanner(candidateName);

  const nameDisplay = document.getElementById("stat-candidate-name");
  const subDisplay = document.getElementById("stat-candidate-subtitle");
  const topMatchDisplay = document.getElementById("stat-top-match");

  if (candidateName) {
    if (nameDisplay) nameDisplay.innerText = candidateName;
    if (subDisplay) {
      subDisplay.innerText = currentUser?.degree || (currentProfile?.education?.[0]?.degree) || "Active Student Profile";
    }
  } else {
    if (nameDisplay) nameDisplay.innerText = "Not Uploaded";
    if (subDisplay) subDisplay.innerText = "Upload resume to match";
    if (topMatchDisplay) topMatchDisplay.innerText = "--%";
  }
}

function renderExtractedResumeUI(profile) {
  const nameInp = document.getElementById("prof-name");
  const emailInp = document.getElementById("prof-email");
  const phoneInp = document.getElementById("prof-phone");
  const skillsContainer = document.getElementById("prof-skills-container");
  const projContainer = document.getElementById("prof-projects-container");
  const statusBadge = document.getElementById("prof-extraction-status");

  const hasExtractedData = profile && (
    (profile.name && profile.name.trim()) ||
    (profile.email && profile.email.trim()) ||
    (profile.phone && profile.phone.trim()) ||
    (Array.isArray(profile.technical_skills) && profile.technical_skills.length > 0) ||
    (Array.isArray(profile.projects) && profile.projects.length > 0)
  );

  if (!hasExtractedData) {
    if (nameInp) nameInp.value = "";
    if (emailInp) emailInp.value = "";
    if (phoneInp) phoneInp.value = "";
    if (statusBadge) {
      statusBadge.className = "text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400";
      statusBadge.innerText = "Awaiting Resume Upload";
    }
    if (skillsContainer) {
      skillsContainer.innerHTML = `<span class="text-xs text-slate-500 italic p-1">No technical skills extracted yet. Upload or paste your resume above and click "Run Resume Parsing Agent".</span>`;
    }
    if (projContainer) {
      projContainer.innerHTML = `<div class="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-500 italic">No academic/technical projects extracted yet. Upload or paste your resume above and parse it.</div>`;
    }
    return;
  }

  if (statusBadge) {
    statusBadge.className = "text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1";
    statusBadge.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-emerald-400"></i> Parsed from Resume`;
  }

  if (nameInp) nameInp.value = profile.name || "";
  if (emailInp) emailInp.value = profile.email || "";
  if (phoneInp) phoneInp.value = profile.phone || "";

  if (skillsContainer) {
    skillsContainer.innerHTML = "";
    const skills = profile.technical_skills || [];
    if (skills.length === 0) {
      skillsContainer.innerHTML = `<span class="text-xs text-slate-500 italic p-1">No technical skills detected in the parsed resume.</span>`;
    } else {
      skills.forEach(skill => {
        const span = document.createElement("span");
        span.className = "px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1";
        span.innerHTML = `<i data-lucide="check-circle-2" class="w-3 h-3 text-emerald-400"></i> ${skill}`;
        skillsContainer.appendChild(span);
      });
    }
  }

  if (projContainer) {
    projContainer.innerHTML = "";
    const projs = profile.projects || [];
    if (projs.length === 0) {
      projContainer.innerHTML = `<div class="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-500 italic">No specific projects identified in the parsed resume.</div>`;
    } else {
      projs.forEach(proj => {
        const div = document.createElement("div");
        div.className = "p-3 bg-slate-900 border border-slate-700 rounded-lg space-y-1.5";
        div.innerHTML = `
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-slate-200">${proj.title || "Project"}</h4>
            <div class="flex flex-wrap gap-1">
              ${(proj.tech_stack || []).map(t => `<span class="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded">${t}</span>`).join('')}
            </div>
          </div>
          <p class="text-[11px] text-slate-400">${proj.description || ""}</p>
        `;
        projContainer.appendChild(div);
      });
    }
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function renderProfileUI(profile) {
  // Retained for backward compatibility
  if (profile) {
    renderExtractedResumeUI(profile);
  } else {
    renderExtractedResumeUI(null);
  }
  updateCandidateStatsUI();
}

function loadSavedOrEmptyProfile() {
  if (currentUser) {
    syncProfileWithCurrentUser();
    return;
  }

  extractedResumeProfile = loadExtractedResumeProfile();
  renderExtractedResumeUI(extractedResumeProfile);

  const saved = localStorage.getItem("career_companion_profile");
  if (saved) {
    try {
      currentProfile = JSON.parse(saved);
      updateCandidateStatsUI();
      executeMatching();
      return;
    } catch (e) {
      console.warn("Error parsing saved profile:", e);
    }
  }
  currentProfile = null;
  updateCandidateStatsUI();
}

async function loadSampleProfile() {
  try {
    const res = await fetch("/api/profile/sample");
    const sample = await res.json();
    extractedResumeProfile = sample;
    saveExtractedResumeProfile(extractedResumeProfile);
    renderExtractedResumeUI(extractedResumeProfile);

    currentProfile = {
      ...(currentProfile || {}),
      ...sample,
      name: currentUser?.fullName || sample.name,
      email: currentUser?.email || sample.email,
      phone: (currentUser?.mobile ? `${currentUser.countryCode || "+91"} ${currentUser.mobile}`.trim() : null) || sample.phone || ""
    };
    localStorage.setItem("career_companion_profile", JSON.stringify(currentProfile));
    updateCandidateStatsUI();
    populateM3JobSelectors();
    executeMatching();
    alert("Sample candidate resume loaded and parsed successfully!");
  } catch (err) {
    console.error("Error loading sample profile:", err);
  }
}

function clearProfile() {
  extractedResumeProfile = null;
  saveExtractedResumeProfile(null);
  renderExtractedResumeUI(null);

  const textInput = document.getElementById("resume-text-input");
  if (textInput) textInput.value = "";
  const fileInput = document.getElementById("resume-file-input");
  if (fileInput) fileInput.value = "";
  const fileLabel = document.getElementById("file-drop-label");
  if (fileLabel) fileLabel.innerText = "Click to select or drag & drop resume file";

  if (currentUser) {
    syncProfileWithCurrentUser();
  } else {
    currentProfile = null;
    matchedJobs = [];
    localStorage.removeItem("career_companion_profile");
    updateCandidateStatsUI();

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
      extractedResumeProfile = data.profile;
      saveExtractedResumeProfile(extractedResumeProfile);
      renderExtractedResumeUI(extractedResumeProfile);

      currentProfile = {
        ...(currentProfile || {}),
        ...data.profile,
        name: data.profile.name || currentUser?.fullName || currentProfile?.name || "",
        email: data.profile.email || currentUser?.email || currentProfile?.email || "",
        phone: data.profile.phone || (currentUser?.mobile ? `${currentUser.countryCode || "+91"} ${currentUser.mobile}`.trim() : "") || currentProfile?.phone || "",
        technical_skills: Array.from(new Set([
          ...(currentUser?.skills || []),
          ...(data.profile.technical_skills || [])
        ]))
      };
      localStorage.setItem("career_companion_profile", JSON.stringify(currentProfile));
      updateCandidateStatsUI();
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
    const parsed = await res.json();
    extractedResumeProfile = parsed;
    saveExtractedResumeProfile(extractedResumeProfile);
    renderExtractedResumeUI(extractedResumeProfile);

    currentProfile = {
      ...(currentProfile || {}),
      ...parsed,
      name: parsed.name || currentUser?.fullName || currentProfile?.name || "",
      email: parsed.email || currentUser?.email || currentProfile?.email || "",
      phone: parsed.phone || (currentUser?.mobile ? `${currentUser.countryCode || "+91"} ${currentUser.mobile}`.trim() : "") || currentProfile?.phone || "",
      technical_skills: Array.from(new Set([
        ...(currentUser?.skills || []),
        ...(parsed.technical_skills || [])
      ]))
    };
    localStorage.setItem("career_companion_profile", JSON.stringify(currentProfile));
    updateCandidateStatsUI();
    alert("Resume parsed successfully!");
    switchTab("profile");
    executeMatching();
  } catch (err) {
    console.error("Resume parse error:", err);
  }
}

function triggerMatchingFromProfile() {
  const nameInp = document.getElementById("prof-name");
  const emailInp = document.getElementById("prof-email");
  const phoneInp = document.getElementById("prof-phone");

  if (!extractedResumeProfile && (!nameInp?.value && !emailInp?.value)) {
    if (currentProfile && currentProfile.technical_skills && currentProfile.technical_skills.length > 0) {
      switchTab("matcher");
      executeMatching();
      return;
    }
    alert("Please upload or paste a resume above and click 'Run Resume Parsing Agent' first.");
    return;
  }

  if (extractedResumeProfile) {
    if (nameInp && nameInp.value) extractedResumeProfile.name = nameInp.value;
    if (emailInp && emailInp.value) extractedResumeProfile.email = emailInp.value;
    if (phoneInp && phoneInp.value) extractedResumeProfile.phone = phoneInp.value;
    saveExtractedResumeProfile(extractedResumeProfile);
    currentProfile = {
      ...(currentProfile || {}),
      ...extractedResumeProfile
    };
  }

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
let googleClientId = '';

// ── Server-Side Typed Text CAPTCHA Manager ──
let gateCaptchaId = null;
let modalCaptchaId = null;

async function fetchCaptcha(target = 'gate') {
  try {
    const res = await fetch('/api/auth/captcha');
    if (!res.ok) throw new Error('Failed to load CAPTCHA');
    const data = await res.json();
    
    if (target === 'gate' || target === 'both') {
      gateCaptchaId = data.captcha_id;
      const img = document.getElementById('gate-captcha-img');
      const hiddenId = document.getElementById('gate-captcha-id');
      const input = document.getElementById('gate-captcha-input');
      const err = document.getElementById('gate-captcha-error');
      if (img) img.src = data.captcha_image;
      if (hiddenId) hiddenId.value = data.captcha_id;
      if (input) input.value = '';
      if (err) err.classList.add('hidden');
    }
    if (target === 'modal' || target === 'both') {
      modalCaptchaId = data.captcha_id;
      const img = document.getElementById('modal-captcha-img');
      const hiddenId = document.getElementById('modal-captcha-id');
      const input = document.getElementById('modal-captcha-input');
      const err = document.getElementById('modal-captcha-error');
      if (img) img.src = data.captcha_image;
      if (hiddenId) hiddenId.value = data.captcha_id;
      if (input) input.value = '';
      if (err) err.classList.add('hidden');
    }
  } catch (e) {
    console.error('Error fetching CAPTCHA challenge:', e);
  }
}

function refreshCaptcha(target = 'gate') {
  fetchCaptcha(target);
}

// ── Google Identity Services (GSI) & Account Chooser Setup ──
async function initGoogleOAuth() {
  try {
    const res = await fetch('/api/auth/config');
    const cfg = await res.json();
    if (cfg && cfg.google_client_id && !cfg.google_client_id.includes('your-client-id') && cfg.google_client_id.includes('.apps.googleusercontent.com')) {
      googleClientId = cfg.google_client_id;
      if (window.google && window.google.accounts && window.google.accounts.id) {
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false
        });
      }
    }
  } catch (err) {
    console.warn('Google OAuth config check:', err);
  }
}

function handleGoogleCredentialResponse(response) {
  if (response && response.credential) {
    // Verified Google ID token received from official Google popup
    selectGoogleAccount(null, null, null, response.credential);
  }
}

function setGoogleButtonLoading(isLoading) {
  const gateBtn = document.getElementById('gate-google-btn');
  const gateSpinner = document.getElementById('gate-google-btn-spinner');
  const gateText = document.getElementById('gate-google-btn-text');

  const modalBtn = document.getElementById('modal-google-btn');
  const modalSpinner = document.getElementById('modal-google-btn-spinner');
  const modalText = document.getElementById('modal-google-btn-text');

  if (isLoading) {
    if (gateBtn) gateBtn.disabled = true;
    if (gateSpinner) gateSpinner.classList.remove('hidden');
    if (gateText) gateText.textContent = 'Connecting with Google...';

    if (modalBtn) modalBtn.disabled = true;
    if (modalSpinner) modalSpinner.classList.remove('hidden');
    if (modalText) modalText.textContent = 'Connecting with Google...';
  } else {
    const defaultText = currentAuthGateTab === 'register' ? 'Sign up with Google' : 'Continue with Google';
    if (gateBtn) gateBtn.disabled = false;
    if (gateSpinner) gateSpinner.classList.add('hidden');
    if (gateText) gateText.textContent = defaultText;

    if (modalBtn) modalBtn.disabled = false;
    if (modalSpinner) modalSpinner.classList.add('hidden');
    if (modalText) modalText.textContent = 'Continue with Google';
  }
}

function handleGoogleSignIn() {
  setGoogleButtonLoading(true);

  // If real Google Client ID is configured and Google GSI is loaded
  if (googleClientId && window.google && window.google.accounts && window.google.accounts.id) {
    try {
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Open interactive Google Account Chooser modal fallback
          openGoogleOAuthModal();
        }
      });
      return;
    } catch (e) {
      console.warn('GSI prompt exception:', e);
    }
  }

  // Fallback to interactive Google Account Chooser modal
  openGoogleOAuthModal();
}

function openGoogleOAuthModal() {
  setGoogleButtonLoading(false);
  const modal = document.getElementById('google-oauth-modal');
  const modalTitle = document.getElementById('google-modal-brand-text');
  const acc1Name = document.getElementById('google-account-1-name');
  const acc1Email = document.getElementById('google-account-1-email');

  const typedEmail = document.getElementById('gate-email')?.value || document.getElementById('login-email')?.value;
  const typedName = document.getElementById('gate-name')?.value;

  const role = currentLoginRole || 'candidate';
  const isCandidate = role === 'candidate';

  const defaultEmail = typedEmail && typedEmail.includes('@') ? typedEmail : (isCandidate ? 'jeebitsat4597@gmail.com' : 'recruiter.talent@google.com');
  const defaultName = typedName ? typedName : (isCandidate ? 'Harsh Kumar Bhadani' : 'Google Tech Talent Partner');

  if (acc1Name) acc1Name.textContent = defaultName;
  if (acc1Email) acc1Email.textContent = defaultEmail;

  if (modalTitle) {
    modalTitle.textContent = currentAuthGateTab === 'register' ? 'Sign up with Google' : 'Sign in with Google';
  }

  if (modal) {
    modal.classList.remove('hidden');
    const loader = document.getElementById('google-loading-overlay');
    if (loader) loader.classList.add('hidden');
  } else {
    selectGoogleAccount(defaultEmail, defaultName);
  }
}

function closeGoogleOAuthModal() {
  const modal = document.getElementById('google-oauth-modal');
  if (modal) modal.classList.add('hidden');
  setGoogleButtonLoading(false);
}

function toggleGoogleCustomInput() {
  const box = document.getElementById('google-custom-input-box');
  if (box) {
    box.classList.toggle('hidden');
    if (!box.classList.contains('hidden')) {
      document.getElementById('google-custom-email-input')?.focus();
    }
  }
}

function submitCustomGoogleAccount() {
  const input = document.getElementById('google-custom-email-input');
  const email = input?.value?.trim();
  if (!email || !email.includes('@')) {
    alert('Please enter a valid Google email address.');
    return;
  }
  const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  selectGoogleAccount(email, name);
}

async function selectGoogleAccount(chosenEmail, chosenName, chosenAvatar, credential = null) {
  const loader = document.getElementById('google-loading-overlay');
  const loadText = document.getElementById('google-loading-text');
  if (loader) {
    loader.classList.remove('hidden');
    if (loadText) loadText.textContent = `Signing in with Google (${chosenEmail || 'jeebitsat4597@gmail.com'})...`;
  }

  const role = currentLoginRole || 'candidate';
  const email = chosenEmail || document.getElementById('google-account-1-email')?.textContent || 'jeebitsat4597@gmail.com';
  const name = chosenName || document.getElementById('google-account-1-name')?.textContent || 'Harsh Kumar Bhadani';

  try {
    const payload = {
      role,
      name,
      email,
      avatar: chosenAvatar || null,
      credential: credential || null
    };

    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.error || 'Google Sign-In failed. Please try again.');
      if (loader) loader.classList.add('hidden');
      setGoogleButtonLoading(false);
      return;
    }

    currentUser = data.user;
    localStorage.setItem('career_companion_user', JSON.stringify(currentUser));

    setTimeout(() => {
      closeGoogleOAuthModal();
      closeLoginModal();
      setGoogleButtonLoading(false);
      revealAuthenticatedApp();
    }, 350);
  } catch (err) {
    console.error('Google Sign-in request failed:', err);
    alert('Network error connecting to authentication service. Please check your connection.');
    if (loader) loader.classList.add('hidden');
    setGoogleButtonLoading(false);
  }
}

function togglePasswordVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  if (btnEl) {
    const EYE_SVG = `<svg class="w-4 h-4 text-slate-400 hover:text-slate-200 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const EYE_OFF_SVG = `<svg class="w-4 h-4 text-indigo-400 hover:text-indigo-300 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>`;

    btnEl.innerHTML = isPassword ? EYE_OFF_SVG : EYE_SVG;
    btnEl.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    btnEl.setAttribute('title', isPassword ? 'Hide password' : 'Show password');
  }
}

function setAuthGateTab(tab) {
  currentAuthGateTab = tab;
  const loginBtn = document.getElementById('gate-tab-login');
  const regBtn = document.getElementById('gate-tab-register');
  const nameGroup = document.getElementById('gate-name-group');
  const submitBtn = document.getElementById('gate-submit-btn');

  // Refresh CAPTCHA on switching tab
  fetchCaptcha('gate');

  if (tab === 'login') {
    if (loginBtn) loginBtn.className = 'py-2.5 rounded-lg text-white bg-indigo-600 shadow-md transition flex items-center justify-center gap-1.5';
    if (regBtn) regBtn.className = 'py-2.5 rounded-lg text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1.5';
    if (nameGroup) nameGroup.classList.add('hidden');
    if (submitBtn) {
      submitBtn.innerHTML = '<i data-lucide="log-in" class="w-4 h-4"></i> Sign In to Account';
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      submitBtn.removeAttribute('title');
    }
  } else {
    if (regBtn) regBtn.className = 'py-2.5 rounded-lg text-white bg-indigo-600 shadow-md transition flex items-center justify-center gap-1.5';
    if (loginBtn) loginBtn.className = 'py-2.5 rounded-lg text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1.5';
    if (nameGroup) nameGroup.classList.remove('hidden');
    if (submitBtn) submitBtn.innerHTML = '<i data-lucide="user-plus" class="w-4 h-4"></i> Create Free Account';
  }

  // Update password meter visibility based on whether password has been entered
  if (window.gatePasswordMeter) {
    window.gatePasswordMeter.evaluate(document.getElementById('gate-password')?.value || '');
  }

  lucide.createIcons();
}

function openLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.remove('hidden');
  fetchCaptcha('modal');
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.add('hidden');
}

function setLoginRole(role) {
  currentLoginRole = role;
  const candBtn = document.getElementById('role-candidate-btn');
  const recBtn = document.getElementById('role-recruiter-btn');
  const gateCandBtn = document.getElementById('gate-role-candidate-btn');
  const gateRecBtn = document.getElementById('gate-role-recruiter-btn');

  const activeClass = 'role-btn py-2 px-3 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-indigo-500';
  const inactiveClass = 'role-btn py-2 px-3 bg-slate-800 text-slate-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 hover:bg-slate-750';

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

function setGateButtonLoading(isLoading, text = null) {
  const btn = document.getElementById('gate-submit-btn');
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.classList.add('opacity-75', 'cursor-wait');
    btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> ${text || (currentAuthGateTab === 'register' ? 'Creating Account...' : 'Signing In...')}`;
  } else {
    btn.disabled = false;
    btn.classList.remove('opacity-75', 'cursor-wait');
    const defaultIcon = currentAuthGateTab === 'register' ? 'user-plus' : 'log-in';
    const defaultLabel = currentAuthGateTab === 'register' ? 'Create Free Account' : 'Sign In to Account';
    btn.innerHTML = `<i data-lucide="${defaultIcon}" class="w-4 h-4"></i> ${defaultLabel}`;
    if (window.lucide && lucide.createIcons) lucide.createIcons();
  }
}

function showToast(message, type = 'success', duration = 2500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-slate-900 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-rose-500/50 text-rose-300';
  const icon = type === 'success' ? 'check-circle' : 'alert-circle';
  toast.className = `${bg} border px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md transform transition-all duration-300 translate-y-[-10px] opacity-0 pointer-events-auto`;
  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 flex-shrink-0"></i><span>${message}</span>`;
  container.appendChild(toast);
  if (window.lucide && lucide.createIcons) lucide.createIcons();
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-[-10px]', 'opacity-0');
  });
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-[-10px]');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function initStep1ValidationListeners() {
  const nameEl = document.getElementById('gate-name');
  if (nameEl) {
    nameEl.addEventListener('input', () => {
      document.getElementById('gate-name-error')?.classList.add('hidden');
    });
  }
  const emailEl = document.getElementById('gate-email');
  if (emailEl) {
    emailEl.addEventListener('input', () => {
      document.getElementById('gate-email-error')?.classList.add('hidden');
    });
  }
  const passEl = document.getElementById('gate-password');
  if (passEl) {
    passEl.addEventListener('input', () => {
      document.getElementById('gate-password-error')?.classList.add('hidden');
    });
  }
}

async function handleAuthGateSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const email = document.getElementById('gate-email')?.value?.trim();
  const password = document.getElementById('gate-password')?.value;
  const name = document.getElementById('gate-name')?.value?.trim() || '';
  const captchaInput = document.getElementById('gate-captcha-input')?.value?.trim();
  const captchaId = document.getElementById('gate-captcha-id')?.value || gateCaptchaId;
  const errEl = document.getElementById('gate-captcha-error');
  const errText = document.getElementById('gate-captcha-error-text');

  // Clear previous errors
  document.getElementById('gate-name-error')?.classList.add('hidden');
  document.getElementById('gate-email-error')?.classList.add('hidden');
  document.getElementById('gate-password-error')?.classList.add('hidden');
  if (errEl) errEl.classList.add('hidden');

  let hasValidationError = false;

  // Step 1 Validation (When in Sign Up / Register Mode)
  if (currentAuthGateTab === 'register') {
    if (!name || name.length < 2) {
      document.getElementById('gate-name-error')?.classList.remove('hidden');
      document.getElementById('gate-name')?.focus();
      hasValidationError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      document.getElementById('gate-email-error')?.classList.remove('hidden');
      if (!hasValidationError) document.getElementById('gate-email')?.focus();
      hasValidationError = true;
    }

    const pw = password || '';
    const hasLength = pw.length >= 8;
    const hasLetters = /[a-zA-Z]/.test(pw);
    const hasNumbers = /[0-9]/.test(pw);
    const hasSpecial = /[@$!%*#?&_\^~+\-=/\\|<>{}[\]():;,.]/.test(pw);
    if (!hasLength || !hasLetters || !hasNumbers || !hasSpecial) {
      document.getElementById('gate-password-error')?.classList.remove('hidden');
      if (!hasValidationError) document.getElementById('gate-password')?.focus();
      hasValidationError = true;
    }

    if (hasValidationError) return;
  }

  if (!captchaInput) {
    if (errEl) {
      if (errText) errText.textContent = 'Please enter the characters shown in the security CAPTCHA.';
      errEl.classList.remove('hidden');
    }
    document.getElementById('gate-captcha-input')?.focus();
    return;
  }

  setGateButtonLoading(true, currentAuthGateTab === 'register' ? 'Creating Account...' : 'Signing In...');

  const endpoint = currentAuthGateTab === 'register' ? '/api/auth/register' : '/api/auth/login';
  const payload = {
    email,
    password,
    role: currentLoginRole,
    name,
    fullName: name,
    captcha_id: captchaId,
    captcha_input: captchaInput
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setGateButtonLoading(false);

    if (!res.ok || !data.success) {
      if (errEl) {
        if (errText) errText.textContent = data.error || 'Authentication error. Please try again.';
        errEl.classList.remove('hidden');
      }
      // Auto-refresh CAPTCHA and clear input on failure
      fetchCaptcha('gate');
      const inputEl = document.getElementById('gate-captcha-input');
      if (inputEl) {
        inputEl.value = '';
        inputEl.focus();
      }
      return;
    }

    if (errEl) errEl.classList.add('hidden');
    currentUser = data.user;
    if (data.token) {
      currentUser.token = data.token;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('career_companion_token', data.token);
    }
    localStorage.setItem('career_companion_user', JSON.stringify(currentUser));

    if (currentAuthGateTab === 'register') {
      showToast('Account created! Proceeding to Step 2: Complete Profile...', 'success');
      showCompleteProfileScreen(currentUser);
    } else {
      showToast('Signed in successfully!', 'success');
      // On every login, check profileCompleted. If false, redirect to /complete-profile
      if (!currentUser.profileCompleted) {
        showCompleteProfileScreen(currentUser);
      } else {
        revealAuthenticatedApp();
      }
    }
  } catch (err) {
    setGateButtonLoading(false);
    console.error('Auth gate error:', err);
    if (errEl) {
      if (errText) errText.textContent = 'Network error connecting to server. Please try again.';
      errEl.classList.remove('hidden');
    }
    fetchCaptcha('gate');
  }
}

async function handleLoginSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const email = document.getElementById('login-email')?.value?.trim();
  const password = document.getElementById('login-password')?.value;
  const captchaInput = document.getElementById('modal-captcha-input')?.value?.trim();
  const captchaId = document.getElementById('modal-captcha-id')?.value || modalCaptchaId;
  const errEl = document.getElementById('modal-captcha-error');
  const errText = document.getElementById('modal-captcha-error-text');

  if (!captchaInput) {
    if (errEl) {
      if (errText) errText.textContent = 'Please enter the characters shown in the security CAPTCHA.';
      errEl.classList.remove('hidden');
    }
    document.getElementById('modal-captcha-input')?.focus();
    return;
  }

  const payload = {
    email,
    password,
    role: currentLoginRole,
    captcha_id: captchaId,
    captcha_input: captchaInput
  };

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      if (errEl) {
        if (errText) errText.textContent = data.error || 'Invalid credentials or CAPTCHA.';
        errEl.classList.remove('hidden');
      }
      // Auto-refresh CAPTCHA and clear input on failure
      fetchCaptcha('modal');
      const inputEl = document.getElementById('modal-captcha-input');
      if (inputEl) {
        inputEl.value = '';
        inputEl.focus();
      }
      return;
    }

    if (errEl) errEl.classList.add('hidden');
    currentUser = data.user;
    if (data.token) {
      currentUser.token = data.token;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('career_companion_token', data.token);
    }
    localStorage.setItem('career_companion_user', JSON.stringify(currentUser));
    closeLoginModal();

    // Check profileCompleted
    if (!currentUser.profileCompleted) {
      showCompleteProfileScreen(currentUser);
    } else {
      revealAuthenticatedApp();
    }
  } catch (err) {
    console.error('Login error:', err);
    if (errEl) {
      if (errText) errText.textContent = 'Network error connecting to server.';
      errEl.classList.remove('hidden');
    }
    fetchCaptcha('modal');
  }
}

async function quickAuthGateDemo() {
  const emailEl = document.getElementById('gate-email');
  const passEl = document.getElementById('gate-password');
  if (emailEl) emailEl.value = 'candidate@example.com';
  if (passEl) passEl.value = 'demo1234';
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'candidate@example.com',
        password: 'demo1234',
        role: currentLoginRole || 'candidate',
        captcha_id: 'demo',
        captcha_input: 'DEMO'
      })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      if (data.token) {
        currentUser.token = data.token;
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('career_companion_token', data.token);
      }
      localStorage.setItem('career_companion_user', JSON.stringify(currentUser));
      if (!currentUser.profileCompleted) {
        showCompleteProfileScreen(currentUser);
      } else {
        revealAuthenticatedApp();
      }
    }
  } catch(e) {
    console.error('Quick demo error:', e);
  }
}

async function quickLoginDemo() {
  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-password');
  if (emailEl) emailEl.value = 'candidate@example.com';
  if (passEl) passEl.value = 'demo1234';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'candidate@example.com',
        password: 'demo1234',
        role: currentLoginRole || 'candidate',
        captcha_id: 'demo',
        captcha_input: 'DEMO'
      })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      if (data.token) {
        currentUser.token = data.token;
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('career_companion_token', data.token);
      }
      localStorage.setItem('career_companion_user', JSON.stringify(currentUser));
      closeLoginModal();
      if (!currentUser.profileCompleted) {
        showCompleteProfileScreen(currentUser);
      } else {
        revealAuthenticatedApp();
      }
    }
  } catch(e) {
    console.error('Quick demo error:', e);
  }
}

// ══════════════════════════════════════════════
//  STEP 2: COMPLETE YOUR PROFILE CONTROLLER
// ══════════════════════════════════════════════

function updateMobileFormat() {
  const countryCodeSelect = document.getElementById('cp-country-code');
  const mobileInput = document.getElementById('cp-mobile');
  const mobileCounter = document.getElementById('cp-mobile-counter');
  if (!mobileInput) return;

  const code = countryCodeSelect ? countryCodeSelect.value : '+91';
  let val = mobileInput.value.replace(/\D/g, '');

  if (code === '+91') {
    mobileInput.maxLength = 10;
    mobileInput.placeholder = 'e.g. 9876543210 (10 Digits)';
    if (val.length > 10) val = val.slice(0, 10);
    mobileInput.value = val;
    if (mobileCounter) {
      mobileCounter.textContent = `${val.length}/10 digits entered`;
      if (val.length === 10) {
        mobileCounter.classList.remove('text-slate-500');
        mobileCounter.classList.add('text-emerald-400');
      } else {
        mobileCounter.classList.remove('text-emerald-400');
        mobileCounter.classList.add('text-slate-500');
      }
    }
  } else {
    mobileInput.maxLength = 15;
    mobileInput.placeholder = 'e.g. 2025550143';
    mobileInput.value = val;
    if (mobileCounter) {
      mobileCounter.textContent = `${val.length} digits entered`;
      if (val.length >= 7) {
        mobileCounter.classList.remove('text-slate-500');
        mobileCounter.classList.add('text-emerald-400');
      } else {
        mobileCounter.classList.remove('text-emerald-400');
        mobileCounter.classList.add('text-slate-500');
      }
    }
  }
}

function initCompleteProfileListeners() {
  const countryCodeSelect = document.getElementById('cp-country-code');
  const mobileInput = document.getElementById('cp-mobile');

  if (countryCodeSelect) {
    countryCodeSelect.addEventListener('change', () => {
      updateMobileFormat();
      clearCpFieldError('mobile');
    });
  }

  if (mobileInput) {
    mobileInput.addEventListener('input', () => {
      updateMobileFormat();
      clearCpFieldError('mobile');
    });
  }

  ['name', 'university', 'degree', 'city', 'skills'].forEach((field) => {
    const el = document.getElementById(`cp-${field}`);
    if (el) {
      el.addEventListener('input', () => clearCpFieldError(field));
    }
  });

  const yearEl = document.getElementById('cp-grad-year') || document.getElementById('cp-gradyear');
  if (yearEl) {
    yearEl.addEventListener('change', () => clearCpFieldError('grad-year'));
  }

  const form = document.getElementById('complete-profile-form');
  if (form) {
    form.addEventListener('submit', handleCompleteProfileSubmit);
  }

  const backBtn = document.getElementById('cp-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', handleCompleteProfileBack);
  }
}

function clearCpFieldError(field) {
  const errEl = document.getElementById(`cp-${field}-error`) || document.getElementById(`cp-${field.replace('-', '')}-error`);
  if (errEl) {
    errEl.textContent = '';
    errEl.classList.add('hidden');
  }
}

function showCpFieldError(field, msg) {
  const errEl = document.getElementById(`cp-${field}-error`) || document.getElementById(`cp-${field.replace('-', '')}-error`);
  if (errEl) {
    const span = errEl.querySelector('span');
    if (span) {
      span.textContent = msg;
    } else {
      errEl.textContent = msg;
    }
    errEl.classList.remove('hidden');
  }
}

function showCompleteProfileScreen(user) {
  const gate = document.getElementById('auth-gate-screen');
  const cpScreen = document.getElementById('complete-profile-screen');
  const appHeader = document.getElementById('app-header');
  const appMain = document.getElementById('app-main');

  if (gate) gate.classList.add('hidden');
  if (appHeader) appHeader.classList.add('hidden');
  if (appMain) appMain.classList.add('hidden');
  if (cpScreen) cpScreen.classList.remove('hidden');

  // Prefill Full Name
  const nameInput = document.getElementById('cp-name') || document.getElementById('cp-fullname');
  if (nameInput) {
    nameInput.value = user?.fullName || user?.name || '';
  }

  // Country Code setup
  const countryCodeSelect = document.getElementById('cp-country-code');
  if (countryCodeSelect && user?.countryCode) {
    countryCodeSelect.value = user.countryCode;
  }

  // Mobile setup
  const mobileInput = document.getElementById('cp-mobile');
  if (mobileInput) {
    mobileInput.value = user?.mobile || '';
    updateMobileFormat();
  }

  if (window.history && window.history.pushState) {
    window.history.pushState({}, '', '/complete-profile');
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function handleCompleteProfileBack() {
  if (confirm('Going back will sign you out. Are you sure you want to exit onboarding?')) {
    logoutUser();
  }
}

async function handleCompleteProfileSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const fullName = (document.getElementById('cp-name') || document.getElementById('cp-fullname'))?.value?.trim();
  const countryCode = document.getElementById('cp-country-code')?.value || '+91';
  const mobile = document.getElementById('cp-mobile')?.value?.trim();
  const university = document.getElementById('cp-university')?.value?.trim();
  const degree = document.getElementById('cp-degree')?.value?.trim();
  const graduationYear = (document.getElementById('cp-grad-year') || document.getElementById('cp-gradyear'))?.value?.trim();
  const city = document.getElementById('cp-city')?.value?.trim();
  const skillsRaw = document.getElementById('cp-skills')?.value?.trim();

  let hasErrors = false;

  if (!fullName || fullName.length < 2) {
    showCpFieldError('name', 'Please enter your full name (at least 2 characters).');
    hasErrors = true;
  }

  if (countryCode === '+91') {
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      showCpFieldError('mobile', 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      hasErrors = true;
    }
  } else {
    if (!mobile || mobile.length < 7 || mobile.length > 15) {
      showCpFieldError('mobile', 'Enter a valid mobile number (7-15 digits).');
      hasErrors = true;
    }
  }

  if (!university) {
    showCpFieldError('university', 'University or college name is required.');
    hasErrors = true;
  }
  if (!degree) {
    showCpFieldError('degree', 'Degree & branch is required (e.g. B.Tech CS).');
    hasErrors = true;
  }
  if (!graduationYear) {
    showCpFieldError('grad-year', 'Please select your graduation year.');
    hasErrors = true;
  }
  if (!city) {
    showCpFieldError('city', 'Current city is required (e.g. Bengaluru, India).');
    hasErrors = true;
  }

  const parsedSkills = Array.from(new Set(
    (skillsRaw || '').split(',').map(s => s.trim()).filter(Boolean)
  ));
  if (parsedSkills.length === 0) {
    showCpFieldError('skills', 'Enter at least one technical skill, separated by commas.');
    hasErrors = true;
  }

  if (hasErrors) return;

  const submitBtn = document.getElementById('cp-submit-btn');
  const btnOriginal = submitBtn?.innerHTML;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
    submitBtn.innerHTML = `
      <svg class="animate-spin h-5 w-5 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      Saving Profile & Launching...
    `;
  }

  const token = localStorage.getItem('auth_token') || 
                localStorage.getItem('career_companion_token') || 
                currentUser?.token || 
                '';
  const userEmail = currentUser?.email || (currentUser?.user && currentUser.user.email) || '';

  const payload = {
    fullName,
    countryCode,
    mobile,
    university,
    degree,
    graduationYear,
    city,
    skills: parsedSkills,
    token: token,
    email: userEmail
  };

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      if (res.status === 401) {
        alert('Your session has expired. Please sign in again.');
        logoutUser();
        return;
      }
      alert(data.error || 'Failed to update profile. Please check the fields and try again.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        submitBtn.innerHTML = btnOriginal;
      }
      return;
    }

    // Success! Update currentUser state & localStorage
    currentUser = {
      ...(currentUser || {}),
      ...data.user,
      profileCompleted: true
    };
    localStorage.setItem('career_companion_user', JSON.stringify(currentUser));
    
    // Immediately sync user details into dashboard profile
    syncProfileWithCurrentUser();

    showToast('Profile completed successfully! Welcome to your dashboard.');

    // Transition to dashboard
    const cpScreen = document.getElementById('complete-profile-screen');
    if (cpScreen) cpScreen.classList.add('hidden');
    revealAuthenticatedApp();

  } catch (err) {
    console.error('Save profile error:', err);
    alert('Network error while saving profile. Please try again.');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
      submitBtn.innerHTML = btnOriginal;
    }
  }
}

function revealAuthenticatedApp() {
  // Guard: if user has not completed profile, redirect them to /complete-profile
  if (currentUser && !currentUser.profileCompleted) {
    showCompleteProfileScreen(currentUser);
    return;
  }

  const gate = document.getElementById("auth-gate-screen");
  const cpScreen = document.getElementById("complete-profile-screen");
  const appHeader = document.getElementById("app-header");
  const appMain = document.getElementById("app-main");

  if (gate) gate.classList.add("hidden");
  if (cpScreen) cpScreen.classList.add("hidden");
  if (appHeader) appHeader.classList.remove("hidden");
  if (appMain) appMain.classList.remove("hidden");

  if (window.history && window.history.pushState) {
    window.history.pushState({}, '', '/dashboard');
  }

  updateAuthUI(currentUser);
  syncProfileWithCurrentUser();
  loadCareerSnapshotUI();
  updateWelcomeBanner(currentUser?.fullName || currentUser?.name);
  switchTab("dashboard");
}

function updateAuthUI(user) {
  const navBtn = document.getElementById("login-nav-btn");
  const userBadge = document.getElementById("user-logged-badge");
  const userNameSpan = document.getElementById("user-display-name");

  if (user) {
    if (navBtn) navBtn.classList.add("hidden");
    if (userBadge) userBadge.classList.remove("hidden");
    if (userNameSpan) userNameSpan.innerText = (user.fullName || user.name) + (user.role === 'recruiter' ? ' (HR)' : '');
  } else {
    if (navBtn) navBtn.classList.remove("hidden");
    if (userBadge) userBadge.classList.add("hidden");
  }
}

function logoutUser() {
  currentUser = null;
  currentProfile = null;
  extractedResumeProfile = null;
  localStorage.removeItem("career_companion_user");
  localStorage.removeItem("auth_token");
  localStorage.removeItem("career_companion_token");
  localStorage.removeItem("career_companion_profile");
  renderExtractedResumeUI(null);
  updateCandidateStatsUI();

  const gate = document.getElementById("auth-gate-screen");
  const cpScreen = document.getElementById("complete-profile-screen");
  const appHeader = document.getElementById("app-header");
  const appMain = document.getElementById("app-main");

  if (cpScreen) cpScreen.classList.add("hidden");
  if (gate) gate.classList.remove("hidden");
  if (appHeader) appHeader.classList.add("hidden");
  if (appMain) appMain.classList.add("hidden");

  if (window.history && window.history.pushState) {
    window.history.pushState({}, '', '/');
  }

  updateAuthUI(null);
  fetchCaptcha('gate');
}

function checkInitialAuthSession() {
  const savedUser = localStorage.getItem("career_companion_user");
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('career_companion_token');
      if (token && currentUser) {
        currentUser.token = token;
      }
      // If profile is not completed, block dashboard and redirect to /complete-profile
      if (!currentUser.profileCompleted) {
        showCompleteProfileScreen(currentUser);
        return;
      }
      // If profile completed, user must never see /complete-profile again
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

// ── Default ATS Resume Template Data (Harsh Kumar Bhadani) ──
const DEFAULT_ATS_TEMPLATE = {
  header: {
    name: "HARSH KUMAR BHADANI",
    title: "AI/ML & Generative AI Developer | Full-Stack Developer | B.Tech CSE (AI & ML)",
    location: "Koderma, Jharkhand",
    phone: "+91 5765656655",
    email: "kumarharsh6754@gmail.com",
    linkedin: "https://linkedin.com/in/harsh-kumar-bhadani",
    github: "https://github.com/harshbhadani4597"
  },
  summary: "B.Tech Computer Science and Engineering (AI & ML) student with hands-on experience in Python, Machine Learning, Generative AI, LLMs, RAG, NLP, Computer Vision, and full-stack web development. Built AI agent applications using FastAPI, React.js, LangChain, LangGraph, Gemini API, MongoDB, and ChromaDB during AI internships with Infosys Springboard and Edunet × IBM SkillsBuild. Seeking Software Developer and AI/ML Engineer roles to build practical, scalable, real-world applications.",
  technical_skills: [
    {
      category: "Programming Languages",
      skills: "Python, C, C++, SQL"
    },
    {
      category: "AI / ML & Generative AI",
      skills: "Machine Learning, Generative AI, Large Language Models (LLMs), RAG, NLP, AI Agents, Vector Search, Data Analytics"
    },
    {
      category: "AI Frameworks & APIs",
      skills: "LangChain, LangGraph, Gemini API, Scikit-learn, OpenCV, MediaPipe"
    },
    {
      category: "Web & Backend",
      skills: "React.js, FastAPI, Flask, REST APIs, HTML, CSS, MERN Stack"
    },
    {
      category: "Databases & Data",
      skills: "MongoDB, MongoDB Atlas, ChromaDB, SQL, NumPy, Pandas, Matplotlib"
    },
    {
      category: "Cloud",
      skills: "IBM Cloud, IBM watsonx.ai, AWS"
    },
    {
      category: "Tools",
      skills: "Git, GitHub, VS Code, Jupyter Notebook, Vite, Google AI Studio, Antigravity, Stitch"
    }
  ],
  projects: [
    {
      title: "AI Career Companion Agent for Internship Matching and Interview Preparation",
      link_text: "Project Link (GitHub)",
      link_url: "https://github.com/harshbhadani4597/career-companion-agent",
      tech_stack: "Python, FastAPI, React.js, Gemini API, LangChain, LangGraph, ChromaDB, MongoDB, NLP, Machine Learning",
      bullets: [
        "Developed an AI-powered career platform for internship discovery, profile analysis, resume improvement, and interview preparation.",
        "Implemented AI agents for job-resume matching, skill gap analysis, resume and cover-letter customization, and interview preparation.",
        "Applied Retrieval-Augmented Generation (RAG) and vector search to deliver relevant career and internship recommendations.",
        "Built REST APIs with FastAPI and developed the frontend using React.js."
      ]
    },
    {
      title: "The Neural Loom – Decentralized AI Compute Mesh",
      link_text: "Project Link (GitHub)",
      link_url: "https://github.com/harshbhadani4597",
      tech_stack: "MERN Stack, AI/ML, Federated Learning, Web Technologies",
      bullets: [
        "Developed frontend interfaces for connecting devices and managing distributed computing on a platform where users contribute idle resources for AI workloads.",
        "Presented at IDE Bootcamp Edition 3 Phase 2, NIT Patna, as part of Team The Shunya Syndicate."
      ]
    }
  ],
  experience: [
    {
      role: "Infosys Springboard – Virtual Internship 7.0",
      meta: "Artificial Intelligence | Virtual",
      bullets: [
        "Completed AI and machine learning certification modules.",
        "Developed the AI Career Companion Agent using Python, FastAPI, React.js, Gemini API, LangChain, LangGraph, ChromaDB, MongoDB, and NLP/ML techniques."
      ]
    },
    {
      role: "Edunet Foundation × IBM SkillsBuild × AICTE",
      meta: "Artificial Intelligence & Cloud | Virtual",
      bullets: [
        "Completed a hands-on internship in Artificial Intelligence and Cloud technologies.",
        "Developed an AI Trip Planner Agent using IBM Cloud and watsonx.ai, gaining practical experience in cloud-based generative AI."
      ]
    }
  ],
  education: [
    {
      degree: "B.Tech – Computer Science and Engineering (Artificial Intelligence & Machine Learning)",
      graduation: "Graduation: 2027",
      institution: "Ghani Khan Choudhury Institute of Engineering and Technology (GKCIET)"
    }
  ],
  certifications: "Geo-data Sharing and Cyber Security – ISRO; Journey to Cloud: Envisioning Your Solution – IBM SkillsBuild; SQL (Basic) – HackerRank; Introduction to Generative AI; Innovation, Design and Entrepreneurship (IDE) Bootcamp – Edition 3 Phase 2; Build with AI Bootcamp",
  achievements: [
    "Selected/Provisionally Shortlisted for Yuva Sangam Phase 6 from Koderma district.",
    "Shortlisted for Build with AI Bootcamp; participated in IDE Bootcamp Edition 3 Phase 2, NIT Patna.",
    "1st Prize in School Science Exhibition; Senior Member, Coding Club; Member, Drama and Photography Clubs."
  ]
};

let currentResumeState = JSON.parse(JSON.stringify(DEFAULT_ATS_TEMPLATE));
let activeResumeSubView = 'preview';

const DEFAULT_COVER_LETTER_TEMPLATE = {
  header: {
    name: "HARSH KUMAR BHADANI",
    location: "Koderma, Jharkhand",
    phone: "+91 5765656655",
    email: "kumarharsh6754@gmail.com",
    linkedin: "https://linkedin.com/in/harsh-kumar-bhadani",
    github: "https://github.com/harshbhadani4597"
  },
  date: "October 4, 2026",
  recipient: {
    name: "Hiring Manager / Hiring Team",
    company: "Company Name",
    address: "Company Address / City"
  },
  subject: "Subject: Application for [Job Title] – Harsh Kumar Bhadani",
  salutation: "Dear Hiring Team,",
  paragraphs: [
    "I am writing to apply for the [Job Title] position at [Company Name], as advertised on [Job Portal / Company Website]. I am a B.Tech Computer Science and Engineering (AI & ML) student graduating in 2027, with hands-on experience in Python, Machine Learning, Generative AI, LLMs, RAG, and full-stack development. I am excited about the opportunity to contribute to [Company Name]'s work in [mention team, product, or domain].",
    "During my Infosys Springboard Virtual Internship, I developed the AI Career Companion Agent for Internship Matching and Interview Preparation using Python, FastAPI, React.js, Gemini API, LangChain, LangGraph, ChromaDB, and MongoDB. The platform uses AI agents, RAG, and vector search for job-resume matching, skill gap analysis, resume customization, and interview preparation. The system achieved sub-second latency with 94%+ retrieval precision.",
    "Through my internship with Edunet Foundation × IBM SkillsBuild × AICTE, I built an AI Trip Planner Agent with IBM Cloud and watsonx.ai, which gave me practical experience in cloud-based generative AI. I also worked as a frontend developer on The Neural Loom, a decentralized AI compute platform built on the MERN stack, as part of Team The Shunya Syndicate at IDE Bootcamp, NIT Patna.",
    "I am drawn to [Company Name] because of its innovative technical architecture and strong engineering culture. My skills in [2–3 skills from the job description] match the requirements of this role, and I am keen to keep learning while building practical, scalable solutions for your team.",
    "I have attached my resume for your review. Thank you for your time and consideration. I would welcome the chance to discuss how I can contribute to [Company Name], and I can be reached at +91 5765656655 or kumarharsh6754@gmail.com."
  ],
  signoff: "Yours sincerely,",
  signature_name: "Harsh Kumar Bhadani"
};

let currentCoverLetterState = JSON.parse(JSON.stringify(DEFAULT_COVER_LETTER_TEMPLATE));
let activeCoverSubView = 'preview';

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initResumeCustomizerView() {
  if (document.getElementById("sheet-name") && document.getElementById("sheet-skills")) {
    renderResumeSheet();
  }
  if (document.getElementById("cover-sheet-name")) {
    renderCoverLetterSheet();
  }
}

function switchResumeSubView(view) {
  activeResumeSubView = view;
  const previewContainer = document.getElementById("resume-preview-container");
  const editorContainer = document.getElementById("resume-editor-container");
  const atsContainer = document.getElementById("ats-output-container");
  const coverContainer = document.getElementById("cover-letter-output-container");

  if (previewContainer) previewContainer.classList.toggle("hidden", view !== 'preview');
  if (editorContainer) editorContainer.classList.toggle("hidden", view !== 'editor');
  if (atsContainer) atsContainer.classList.toggle("hidden", view !== 'ats');
  if (coverContainer) coverContainer.classList.toggle("hidden", view !== 'cover');

  // Update button states
  ['preview', 'editor', 'ats', 'cover'].forEach(v => {
    const btn = document.getElementById(`subtab-btn-${v}`);
    if (btn) {
      if (v === view) {
        btn.className = "subtab-btn px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-emerald-600 text-white shadow-md";
      } else {
        btn.className = "subtab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/60 transition flex items-center gap-2";
      }
    }
  });

  if (view === 'editor') {
    populateFormEditor();
  } else if (view === 'preview') {
    renderResumeSheet();
  } else if (view === 'cover') {
    renderCoverLetterSheet();
  }

  if (window.lucide) lucide.createIcons();
}

function renderResumeSheet() {
  const state = currentResumeState;

  // Header
  const nameEl = document.getElementById("sheet-name");
  if (nameEl) nameEl.innerText = state.header.name || "HARSH KUMAR BHADANI";

  const titleEl = document.getElementById("sheet-title");
  if (titleEl) titleEl.innerText = state.header.title || "";

  const contactEl = document.getElementById("sheet-contact");
  if (contactEl) {
    const h = state.header;
    const parts = [];
    if (h.location) parts.push(escapeHtml(h.location));
    if (h.phone) parts.push(escapeHtml(h.phone));
    if (h.email) parts.push(`<a href="mailto:${escapeHtml(h.email)}" class="underline text-black">${escapeHtml(h.email)}</a>`);
    if (h.linkedin) parts.push(`<a href="${escapeHtml(h.linkedin)}" target="_blank" class="underline text-black">LinkedIn</a>`);
    if (h.github) parts.push(`<a href="${escapeHtml(h.github)}" target="_blank" class="underline text-black">GitHub</a>`);
    contactEl.innerHTML = parts.join(" | ");
  }

  // Summary
  const summaryEl = document.getElementById("sheet-summary");
  if (summaryEl) summaryEl.innerText = state.summary || "";

  // Skills
  const skillsContainer = document.getElementById("sheet-skills");
  if (skillsContainer) {
    skillsContainer.innerHTML = (state.technical_skills || []).map((cat, idx) => `
      <div class="mb-1 leading-snug">
        <span class="font-bold text-black">${escapeHtml(cat.category)}:</span>
        <span contenteditable="true" oninput="syncSheetSkillCat(${idx}, this.innerText)" class="text-black">${escapeHtml(cat.skills)}</span>
      </div>
    `).join('');
  }

  // Projects
  const projectsContainer = document.getElementById("sheet-projects");
  if (projectsContainer) {
    projectsContainer.innerHTML = (state.projects || []).map((proj, idx) => `
      <div class="project-item mb-2.5">
        <div class="flex justify-between items-baseline font-bold text-black">
          <span contenteditable="true" oninput="syncSheetProject(${idx}, 'title', this.innerText)">${escapeHtml(proj.title)}</span>
          <span class="text-xs font-normal shrink-0 ml-3">
            <a href="${escapeHtml(proj.link_url || '#')}" target="_blank" class="underline text-black">${escapeHtml(proj.link_text || 'Project Link (GitHub)')}</a>
          </span>
        </div>
        <div class="text-[9.5pt] text-slate-800 italic mb-1" contenteditable="true" oninput="syncSheetProject(${idx}, 'tech_stack', this.innerText)">
          ${escapeHtml(proj.tech_stack || '')}
        </div>
        <ul class="list-disc pl-5 space-y-0.5 text-black">
          ${(proj.bullets || []).map((b, bIdx) => `
            <li contenteditable="true" oninput="syncSheetProjectBullet(${idx}, ${bIdx}, this.innerText)">${escapeHtml(b)}</li>
          `).join('')}
        </ul>
      </div>
    `).join('');
  }

  // Internship Experience
  const expContainer = document.getElementById("sheet-experience");
  if (expContainer) {
    expContainer.innerHTML = (state.experience || []).map((exp, idx) => `
      <div class="experience-item mb-2.5">
        <div class="flex justify-between items-baseline font-bold text-black">
          <span contenteditable="true" oninput="syncSheetExperience(${idx}, 'role', this.innerText)">${escapeHtml(exp.role)}</span>
          <span class="text-xs font-normal text-slate-700 shrink-0 ml-3" contenteditable="true" oninput="syncSheetExperience(${idx}, 'meta', this.innerText)">
            ${escapeHtml(exp.meta || 'Artificial Intelligence | Virtual')}
          </span>
        </div>
        <ul class="list-disc pl-5 space-y-0.5 mt-1 text-black">
          ${(exp.bullets || []).map((b, bIdx) => `
            <li contenteditable="true" oninput="syncSheetExperienceBullet(${idx}, ${bIdx}, this.innerText)">${escapeHtml(b)}</li>
          `).join('')}
        </ul>
      </div>
    `).join('');
  }

  // Education
  const eduContainer = document.getElementById("sheet-education");
  if (eduContainer) {
    eduContainer.innerHTML = (state.education || []).map((edu, idx) => `
      <div class="education-item mb-1.5 text-black">
        <div class="flex justify-between items-baseline font-bold">
          <span contenteditable="true" oninput="syncSheetEducation(${idx}, 'degree', this.innerText)">${escapeHtml(edu.degree)}</span>
          <span class="text-xs font-normal text-slate-700 shrink-0 ml-3" contenteditable="true" oninput="syncSheetEducation(${idx}, 'graduation', this.innerText)">
            ${escapeHtml(edu.graduation || 'Graduation: 2027')}
          </span>
        </div>
        <div class="text-[9.5pt] text-slate-800" contenteditable="true" oninput="syncSheetEducation(${idx}, 'institution', this.innerText)">
          ${escapeHtml(edu.institution)}
        </div>
      </div>
    `).join('');
  }

  // Certifications
  const certsEl = document.getElementById("sheet-certifications");
  if (certsEl) certsEl.innerText = state.certifications || "";

  // Achievements
  const achContainer = document.getElementById("sheet-achievements");
  if (achContainer) {
    achContainer.innerHTML = (state.achievements || []).map((ach, idx) => `
      <li contenteditable="true" oninput="syncSheetAchievement(${idx}, this.innerText)">${escapeHtml(ach)}</li>
    `).join('');
  }
}

// ── Real-Time Inline Sheet Sync Handlers ──
function syncSheetToState() {
  const nameEl = document.getElementById("sheet-name");
  if (nameEl) currentResumeState.header.name = nameEl.innerText.trim();

  const titleEl = document.getElementById("sheet-title");
  if (titleEl) currentResumeState.header.title = titleEl.innerText.trim();

  const summaryEl = document.getElementById("sheet-summary");
  if (summaryEl) currentResumeState.summary = summaryEl.innerText.trim();

  const certsEl = document.getElementById("sheet-certifications");
  if (certsEl) currentResumeState.certifications = certsEl.innerText.trim();
}

function syncSheetSkillCat(catIdx, newSkills) {
  if (currentResumeState.technical_skills[catIdx]) {
    currentResumeState.technical_skills[catIdx].skills = newSkills.trim();
  }
}

function syncSheetProject(projIdx, field, val) {
  if (currentResumeState.projects[projIdx]) {
    currentResumeState.projects[projIdx][field] = val.trim();
  }
}

function syncSheetProjectBullet(projIdx, bulletIdx, val) {
  if (currentResumeState.projects[projIdx] && currentResumeState.projects[projIdx].bullets) {
    currentResumeState.projects[projIdx].bullets[bulletIdx] = val.trim();
  }
}

function syncSheetExperience(expIdx, field, val) {
  if (currentResumeState.experience[expIdx]) {
    currentResumeState.experience[expIdx][field] = val.trim();
  }
}

function syncSheetExperienceBullet(expIdx, bulletIdx, val) {
  if (currentResumeState.experience[expIdx] && currentResumeState.experience[expIdx].bullets) {
    currentResumeState.experience[expIdx].bullets[bulletIdx] = val.trim();
  }
}

function syncSheetEducation(eduIdx, field, val) {
  if (currentResumeState.education[eduIdx]) {
    currentResumeState.education[eduIdx][field] = val.trim();
  }
}

function syncSheetAchievement(idx, val) {
  if (currentResumeState.achievements) {
    currentResumeState.achievements[idx] = val.trim();
  }
}

// ── Populate Structured Form Editor ──
function populateFormEditor() {
  const state = currentResumeState;

  // Header inputs
  document.getElementById("edit-header-name").value = state.header.name || "";
  document.getElementById("edit-header-title").value = state.header.title || "";
  document.getElementById("edit-header-location").value = state.header.location || "";
  document.getElementById("edit-header-phone").value = state.header.phone || "";
  document.getElementById("edit-header-email").value = state.header.email || "";
  document.getElementById("edit-header-linkedin").value = state.header.linkedin || "";
  document.getElementById("edit-header-github").value = state.header.github || "";

  // Summary
  document.getElementById("edit-summary").value = state.summary || "";

  // Skills Categories
  const skillsContainer = document.getElementById("edit-skills-container");
  if (skillsContainer) {
    skillsContainer.innerHTML = (state.technical_skills || []).map((cat, idx) => `
      <div class="flex gap-2 items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
        <input type="text" value="${escapeHtml(cat.category)}" onchange="updateFormSkillCat(${idx}, 'category', this.value)" class="w-1/3 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-emerald-300 font-semibold focus:outline-none" placeholder="Category Name" />
        <input type="text" value="${escapeHtml(cat.skills)}" onchange="updateFormSkillCat(${idx}, 'skills', this.value)" class="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none" placeholder="Comma-separated skills" />
        <button onclick="removeFormSkillCat(${idx})" class="p-1 text-rose-400 hover:text-rose-300 transition" title="Delete category">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `).join('');
  }

  // Projects
  const projContainer = document.getElementById("edit-projects-container");
  if (projContainer) {
    projContainer.innerHTML = (state.projects || []).map((proj, idx) => `
      <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5 relative">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-300">Project #${idx + 1}</span>
          <button onclick="removeFormProject(${idx})" class="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Remove
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input type="text" value="${escapeHtml(proj.title)}" onchange="updateFormProjectField(${idx}, 'title', this.value)" placeholder="Project Title" class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-semibold" />
          <input type="text" value="${escapeHtml(proj.link_url || '')}" onchange="updateFormProjectField(${idx}, 'link_url', this.value)" placeholder="GitHub / Demo URL" class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none" />
        </div>
        <input type="text" value="${escapeHtml(proj.tech_stack || '')}" onchange="updateFormProjectField(${idx}, 'tech_stack', this.value)" placeholder="Tech Stack (comma-separated)" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none italic" />
        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">Bullet Points (One per line)</label>
          <textarea rows="3" onchange="updateFormProjectBullets(${idx}, this.value)" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none leading-relaxed">${(proj.bullets || []).join('\n')}</textarea>
        </div>
      </div>
    `).join('');
  }

  // Experience
  const expContainer = document.getElementById("edit-experience-container");
  if (expContainer) {
    expContainer.innerHTML = (state.experience || []).map((exp, idx) => `
      <div class="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-300">Experience #${idx + 1}</span>
          <button onclick="removeFormExperience(${idx})" class="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Remove
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input type="text" value="${escapeHtml(exp.role)}" onchange="updateFormExpField(${idx}, 'role', this.value)" placeholder="Company / Role Name" class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-semibold" />
          <input type="text" value="${escapeHtml(exp.meta || '')}" onchange="updateFormExpField(${idx}, 'meta', this.value)" placeholder="Domain | Location / Virtual" class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none" />
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">Bullet Points (One per line)</label>
          <textarea rows="3" onchange="updateFormExpBullets(${idx}, this.value)" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none leading-relaxed">${(exp.bullets || []).join('\n')}</textarea>
        </div>
      </div>
    `).join('');
  }

  // Education
  const firstEdu = (state.education && state.education[0]) || { degree: "", graduation: "", institution: "" };
  document.getElementById("edit-edu-degree").value = firstEdu.degree || "";
  document.getElementById("edit-edu-grad").value = firstEdu.graduation || "";
  document.getElementById("edit-edu-inst").value = firstEdu.institution || "";

  // Certifications
  document.getElementById("edit-certifications").value = state.certifications || "";

  // Achievements
  document.getElementById("edit-achievements").value = (state.achievements || []).join('\n');

  if (window.lucide) lucide.createIcons();
}

function updateFormSkillCat(idx, field, val) {
  if (currentResumeState.technical_skills[idx]) {
    currentResumeState.technical_skills[idx][field] = val;
  }
}

function removeFormSkillCat(idx) {
  currentResumeState.technical_skills.splice(idx, 1);
  populateFormEditor();
}

function addFormSkillCategory() {
  currentResumeState.technical_skills.push({ category: "New Category", skills: "Skill 1, Skill 2, Skill 3" });
  populateFormEditor();
}

function updateFormProjectField(idx, field, val) {
  if (currentResumeState.projects[idx]) {
    currentResumeState.projects[idx][field] = val;
  }
}

function updateFormProjectBullets(idx, text) {
  if (currentResumeState.projects[idx]) {
    currentResumeState.projects[idx].bullets = text.split('\n').map(s => s.trim()).filter(Boolean);
  }
}

function removeFormProject(idx) {
  currentResumeState.projects.splice(idx, 1);
  populateFormEditor();
}

function addFormProject() {
  currentResumeState.projects.push({
    title: "New Technical Project",
    link_text: "Project Link (GitHub)",
    link_url: "",
    tech_stack: "Python, React, REST APIs",
    bullets: ["Implemented key algorithmic architecture and system features."]
  });
  populateFormEditor();
}

function updateFormExpField(idx, field, val) {
  if (currentResumeState.experience[idx]) {
    currentResumeState.experience[idx][field] = val;
  }
}

function updateFormExpBullets(idx, text) {
  if (currentResumeState.experience[idx]) {
    currentResumeState.experience[idx].bullets = text.split('\n').map(s => s.trim()).filter(Boolean);
  }
}

function removeFormExperience(idx) {
  currentResumeState.experience.splice(idx, 1);
  populateFormEditor();
}

function addFormExperience() {
  currentResumeState.experience.push({
    role: "Company / Program – Role Title",
    meta: "Domain | Virtual / On-site",
    bullets: ["Completed engineering milestones and developed software applications."]
  });
  populateFormEditor();
}

function applyFormToPreview() {
  // Capture header
  currentResumeState.header.name = document.getElementById("edit-header-name").value.trim();
  currentResumeState.header.title = document.getElementById("edit-header-title").value.trim();
  currentResumeState.header.location = document.getElementById("edit-header-location").value.trim();
  currentResumeState.header.phone = document.getElementById("edit-header-phone").value.trim();
  currentResumeState.header.email = document.getElementById("edit-header-email").value.trim();
  currentResumeState.header.linkedin = document.getElementById("edit-header-linkedin").value.trim();
  currentResumeState.header.github = document.getElementById("edit-header-github").value.trim();

  // Capture summary
  currentResumeState.summary = document.getElementById("edit-summary").value.trim();

  // Capture education
  if (!currentResumeState.education || !currentResumeState.education.length) {
    currentResumeState.education = [{}];
  }
  currentResumeState.education[0].degree = document.getElementById("edit-edu-degree").value.trim();
  currentResumeState.education[0].graduation = document.getElementById("edit-edu-grad").value.trim();
  currentResumeState.education[0].institution = document.getElementById("edit-edu-inst").value.trim();

  // Capture certifications
  currentResumeState.certifications = document.getElementById("edit-certifications").value.trim();

  // Capture achievements
  const achText = document.getElementById("edit-achievements").value.trim();
  currentResumeState.achievements = achText.split('\n').map(s => s.trim()).filter(Boolean);

  renderResumeSheet();
  switchResumeSubView('preview');
}

// ── Export & Download Functions ──
async function downloadResumePdf() {
  syncSheetToState();
  const element = document.getElementById("resume-preview-sheet");
  const candidateName = (currentResumeState.header.name || "Harsh_Kumar_Bhadani").replace(/\s+/g, "_");
  const filename = `${candidateName}_ATS_Resume.pdf`;

  if (typeof html2pdf !== "undefined") {
    const opt = {
      margin: [8, 10, 8, 10],
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };
    try {
      await html2pdf().set(opt).from(element).save();
      return;
    } catch (err) {
      console.warn("html2pdf export encountered issue, using print fallback:", err);
    }
  }
  window.print();
}

async function downloadResumeDocx() {
  syncSheetToState();
  try {
    const res = await fetch("/api/resume/download-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentResumeState)
    });
    if (!res.ok) throw new Error("Server error during DOCX generation");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    const candidateName = (currentResumeState.header.name || "Harsh_Kumar_Bhadani").replace(/\s+/g, "_");
    a.href = url;
    a.download = `${candidateName}_ATS_Resume.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (err) {
    console.error("DOCX download error:", err);
    alert("Error downloading DOCX resume. Please try again.");
  }
}

function printResumeSheet() {
  syncSheetToState();
  window.print();
}

function copyFormattedResumeText() {
  syncSheetToState();
  const s = currentResumeState;
  const h = s.header;
  const lines = [
    `${h.name.toUpperCase()}`,
    `${h.title}`,
    `${h.location} | ${h.phone} | ${h.email} | LinkedIn | GitHub`,
    "",
    "PROFESSIONAL SUMMARY",
    "--------------------------------------------------",
    s.summary,
    "",
    "TECHNICAL SKILLS",
    "--------------------------------------------------"
  ];

  (s.technical_skills || []).forEach(cat => {
    lines.push(`${cat.category}: ${cat.skills}`);
  });

  lines.push("", "PROJECTS", "--------------------------------------------------");
  (s.projects || []).forEach(p => {
    lines.push(`${p.title}  [${p.link_text || 'Project Link'}]`);
    if (p.tech_stack) lines.push(`Tech Stack: ${p.tech_stack}`);
    (p.bullets || []).forEach(b => lines.push(`• ${b}`));
    lines.push("");
  });

  lines.push("INTERNSHIP EXPERIENCE", "--------------------------------------------------");
  (s.experience || []).forEach(e => {
    lines.push(`${e.role}  [${e.meta}]`);
    (e.bullets || []).forEach(b => lines.push(`• ${b}`));
    lines.push("");
  });

  lines.push("EDUCATION", "--------------------------------------------------");
  (s.education || []).forEach(edu => {
    lines.push(`${edu.degree}  [${edu.graduation}]`);
    lines.push(edu.institution);
  });

  if (s.certifications) {
    lines.push("", "CERTIFICATIONS", "--------------------------------------------------", s.certifications);
  }

  if (s.achievements && s.achievements.length) {
    lines.push("", "ACHIEVEMENTS & ACTIVITIES", "--------------------------------------------------");
    s.achievements.forEach(a => lines.push(`• ${a}`));
  }

  navigator.clipboard.writeText(lines.join("\n")).then(() => {
    alert("Clean ATS resume text copied to clipboard!");
  });
}

function resetResumeToDefault() {
  if (confirm("Reset resume content back to the default ATS template?")) {
    loadDefaultTemplate();
  }
}

async function loadDefaultTemplate() {
  try {
    const res = await fetch("/api/resume/template");
    if (res.ok) {
      currentResumeState = await res.json();
    } else {
      currentResumeState = JSON.parse(JSON.stringify(DEFAULT_ATS_TEMPLATE));
    }
  } catch (e) {
    currentResumeState = JSON.parse(JSON.stringify(DEFAULT_ATS_TEMPLATE));
  }
  renderResumeSheet();
  switchResumeSubView('preview');
}

// ── Agent Generation & ATS Optimization ──
async function generateTailoredResume() {
  if (!currentProfile) {
    try {
      const pRes = await fetch("/api/profile/sample");
      currentProfile = await pRes.json();
    } catch(e) {}
  }
  const jobId = document.getElementById("resume-job-select").value;
  if (!jobId) {
    alert("Please select a target internship role to tailor your resume.");
    return;
  }

  try {
    const res = await fetch("/api/resume/customize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_profile: currentProfile || DEFAULT_ATS_TEMPLATE,
        job_id: jobId,
        include_skill_gap: true
      })
    });
    const result = await res.json();
    if (result.structured_resume) {
      currentResumeState = result.structured_resume;
    } else if (result.resume_text) {
      currentResumeState.summary = result.professional_summary || currentResumeState.summary;
    }
    renderResumeSheet();
    switchResumeSubView('preview');
    alert("Resume tailored successfully! You can edit any section directly or download PDF / DOCX.");
  } catch (err) {
    console.error("Resume customize error:", err);
    alert("Error tailoring resume. Please try again.");
  }
}

async function runAtsOptimization() {
  if (!currentProfile) {
    try {
      const pRes = await fetch("/api/profile/sample");
      currentProfile = await pRes.json();
    } catch(e) {}
  }
  const jobId = document.getElementById("resume-job-select").value;
  if (!jobId) {
    alert("Please select an internship role to optimize for ATS.");
    return;
  }

  const scoreText = document.getElementById("ats-score-text");
  if (scoreText) scoreText.innerText = "Analyzing ATS Match...";

  try {
    const res = await fetch("/api/resume/ats-optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_profile: currentProfile || DEFAULT_ATS_TEMPLATE,
        job_id: jobId,
        include_skill_gap: true
      })
    });
    const result = await res.json();

    if (result.structured_resume) {
      currentResumeState = result.structured_resume;
      renderResumeSheet();
    }

    // Render ATS Score
    const score = result.ats_compatibility_score || 85;
    if (scoreText) scoreText.innerText = `${score}% ATS Score (${result.ats_verdict || 'Good Match'})`;

    // Render Matched Keywords
    const matchedContainer = document.getElementById("ats-matched-keywords");
    if (matchedContainer) {
      matchedContainer.innerHTML = (result.matched_keywords || []).map(k => 
        `<span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-md">${k}</span>`
      ).join('') || '<span class="text-xs text-slate-400">None detected</span>';
    }

    // Render Missing Keywords
    const missingContainer = document.getElementById("ats-missing-keywords");
    if (missingContainer) {
      missingContainer.innerHTML = (result.missing_keywords || []).map(k => 
        `<span class="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-md">${k}</span>`
      ).join('') || '<span class="text-xs text-emerald-400 font-semibold">100% Target Keywords Present!</span>';
    }

    // Render Recommendations
    const recList = document.getElementById("ats-recommendations-list");
    if (recList) {
      recList.innerHTML = (result.ats_recommendations || []).map(r => `<li>${r}</li>`).join('');
    }

    // Render Output text
    const textOut = document.getElementById("ats-resume-output-text");
    if (textOut) textOut.value = result.ats_resume_text || "";

    switchResumeSubView('ats');
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
//  COVER LETTER AGENT (STRUCTURED, ATS-FRIENDLY & EDITABLE)
// ══════════════════════════════════════════════

function renderCoverLetterSheet() {
  const state = currentCoverLetterState;
  if (!state) return;

  // Header
  const nameEl = document.getElementById("cover-sheet-name");
  if (nameEl) nameEl.innerText = state.header?.name || "HARSH KUMAR BHADANI";

  const contactEl = document.getElementById("cover-sheet-contact");
  if (contactEl) {
    const h = state.header || {};
    const parts = [];
    if (h.location) parts.push(escapeHtml(h.location));
    if (h.phone) parts.push(escapeHtml(h.phone));
    if (h.email) parts.push(`<a href="mailto:${escapeHtml(h.email)}" class="underline text-black">${escapeHtml(h.email)}</a>`);
    if (h.linkedin) parts.push(`<a href="${escapeHtml(h.linkedin)}" target="_blank" class="underline text-black">LinkedIn</a>`);
    if (h.github) parts.push(`<a href="${escapeHtml(h.github)}" target="_blank" class="underline text-black">GitHub</a>`);
    contactEl.innerHTML = parts.join(" | ");
  }

  // Date & Recipient
  const dateEl = document.getElementById("cover-sheet-date");
  if (dateEl) dateEl.innerText = state.date || "October 4, 2026";

  const mgrEl = document.getElementById("cover-sheet-recipient-name");
  if (mgrEl) mgrEl.innerText = state.recipient?.name || "Hiring Manager / Hiring Team";

  const compEl = document.getElementById("cover-sheet-company-name");
  if (compEl) compEl.innerText = state.recipient?.company || "Company Name";

  const addrEl = document.getElementById("cover-sheet-company-address");
  if (addrEl) addrEl.innerText = state.recipient?.address || "Company Address / City";

  // Subject & Salutation
  const subEl = document.getElementById("cover-sheet-subject");
  if (subEl) subEl.innerText = state.subject || "Subject: Application for Internship Role";

  const salEl = document.getElementById("cover-sheet-salutation");
  if (salEl) salEl.innerText = state.salutation || "Dear Hiring Team,";

  // 5 Paragraphs
  const paras = state.paragraphs || [];
  for (let i = 1; i <= 5; i++) {
    const pEl = document.getElementById(`cover-sheet-p${i}`);
    if (pEl) {
      pEl.innerText = paras[i - 1] || "";
    }
  }

  // Sign-off
  const signoffEl = document.getElementById("cover-sheet-signoff");
  if (signoffEl) signoffEl.innerText = state.signoff || "Yours sincerely,";

  const sigNameEl = document.getElementById("cover-sheet-sig-name");
  if (sigNameEl) sigNameEl.innerText = state.signature_name || "Harsh Kumar Bhadani";
}

function syncCoverSheetToState() {
  if (!currentCoverLetterState) {
    currentCoverLetterState = JSON.parse(JSON.stringify(DEFAULT_COVER_LETTER_TEMPLATE));
  }

  const nameEl = document.getElementById("cover-sheet-name");
  if (nameEl) {
    if (!currentCoverLetterState.header) currentCoverLetterState.header = {};
    currentCoverLetterState.header.name = nameEl.innerText.trim();
  }

  const dateEl = document.getElementById("cover-sheet-date");
  if (dateEl) currentCoverLetterState.date = dateEl.innerText.trim();

  if (!currentCoverLetterState.recipient) currentCoverLetterState.recipient = {};
  const mgrEl = document.getElementById("cover-sheet-recipient-name");
  if (mgrEl) currentCoverLetterState.recipient.name = mgrEl.innerText.trim();

  const compEl = document.getElementById("cover-sheet-company-name");
  if (compEl) currentCoverLetterState.recipient.company = compEl.innerText.trim();

  const addrEl = document.getElementById("cover-sheet-company-address");
  if (addrEl) currentCoverLetterState.recipient.address = addrEl.innerText.trim();

  const subEl = document.getElementById("cover-sheet-subject");
  if (subEl) currentCoverLetterState.subject = subEl.innerText.trim();

  const salEl = document.getElementById("cover-sheet-salutation");
  if (salEl) currentCoverLetterState.salutation = salEl.innerText.trim();

  const updatedParas = [];
  for (let i = 1; i <= 5; i++) {
    const pEl = document.getElementById(`cover-sheet-p${i}`);
    if (pEl) {
      updatedParas.push(pEl.innerText.trim());
    }
  }
  if (updatedParas.length > 0) {
    currentCoverLetterState.paragraphs = updatedParas;
  }

  const signoffEl = document.getElementById("cover-sheet-signoff");
  if (signoffEl) currentCoverLetterState.signoff = signoffEl.innerText.trim();

  const sigNameEl = document.getElementById("cover-sheet-sig-name");
  if (sigNameEl) currentCoverLetterState.signature_name = sigNameEl.innerText.trim();
}

function populateCoverFormEditor() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };
  setVal("edit-cover-date", currentCoverLetterState.date);
  setVal("edit-cover-mgr", currentCoverLetterState.recipient?.name);
  setVal("edit-cover-comp", currentCoverLetterState.recipient?.company);
  setVal("edit-cover-addr", currentCoverLetterState.recipient?.address);
  setVal("edit-cover-subject", currentCoverLetterState.subject);
  setVal("edit-cover-salutation", currentCoverLetterState.salutation);

  const paras = currentCoverLetterState.paragraphs || [];
  setVal("edit-cover-p1", paras[0] || "");
  setVal("edit-cover-p2", paras[1] || "");
  setVal("edit-cover-p3", paras[2] || "");
  setVal("edit-cover-p4", paras[3] || "");
  setVal("edit-cover-p5", paras[4] || "");

  setVal("edit-cover-signoff", currentCoverLetterState.signoff);
  setVal("edit-cover-sig-name", currentCoverLetterState.signature_name);
}

function applyCoverFormToPreview() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };

  currentCoverLetterState.date = getVal("edit-cover-date");
  currentCoverLetterState.recipient = {
    name: getVal("edit-cover-mgr"),
    company: getVal("edit-cover-comp"),
    address: getVal("edit-cover-addr")
  };
  currentCoverLetterState.subject = getVal("edit-cover-subject");
  currentCoverLetterState.salutation = getVal("edit-cover-salutation");
  currentCoverLetterState.paragraphs = [
    getVal("edit-cover-p1"),
    getVal("edit-cover-p2"),
    getVal("edit-cover-p3"),
    getVal("edit-cover-p4"),
    getVal("edit-cover-p5")
  ];
  currentCoverLetterState.signoff = getVal("edit-cover-signoff");
  currentCoverLetterState.signature_name = getVal("edit-cover-sig-name");

  renderCoverLetterSheet();
  switchCoverSubView('preview');
}

function switchCoverSubView(view) {
  activeCoverSubView = view;
  const sheetWrapper = document.getElementById("cover-letter-sheet-wrapper");
  const formContainer = document.getElementById("cover-letter-form-container");
  const tabPreview = document.getElementById("cover-subtab-preview");
  const tabForm = document.getElementById("cover-subtab-form");

  if (view === 'preview') {
    if (sheetWrapper) sheetWrapper.classList.remove("hidden");
    if (formContainer) formContainer.classList.add("hidden");
    if (tabPreview) tabPreview.className = "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-purple-600 text-white shadow-md";
    if (tabForm) tabForm.className = "px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/60 transition flex items-center gap-2";
    renderCoverLetterSheet();
  } else {
    if (sheetWrapper) sheetWrapper.classList.add("hidden");
    if (formContainer) formContainer.classList.remove("hidden");
    if (tabPreview) tabPreview.className = "px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/60 transition flex items-center gap-2";
    if (tabForm) tabForm.className = "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-purple-600 text-white shadow-md";
    populateCoverFormEditor();
  }
  if (window.lucide) lucide.createIcons();
}

function downloadCoverLetterPdf() {
  syncCoverSheetToState();
  const element = document.getElementById("cover-letter-preview-sheet");
  if (!element) return;

  const candidateName = (currentCoverLetterState.header?.name || "Harsh_Bhadani").replace(/[^a-zA-Z0-9]/g, "_");
  const companyName = (currentCoverLetterState.recipient?.company || "Internship").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${candidateName}_${companyName}_Cover_Letter.pdf`;

  if (typeof html2pdf !== "undefined") {
    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  } else {
    document.body.classList.add('printing-cover-letter');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-cover-letter');
    }, 1000);
  }
}

async function downloadCoverLetterDocx() {
  syncCoverSheetToState();
  try {
    const res = await fetch("/api/cover-letter/download-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cover_letter: currentCoverLetterState })
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const blob = await res.blob();
    const candidateName = (currentCoverLetterState.header?.name || "Harsh_Bhadani").replace(/[^a-zA-Z0-9]/g, "_");
    const companyName = (currentCoverLetterState.recipient?.company || "Internship").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${candidateName}_${companyName}_Cover_Letter.docx`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    console.error("DOCX download error:", err);
    alert("Error generating DOCX file: " + err.message);
  }
}

function printCoverLetterSheet() {
  syncCoverSheetToState();
  document.body.classList.add('printing-cover-letter');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-cover-letter');
  }, 1000);
}

function copyCoverLetterText() {
  syncCoverSheetToState();
  const c = currentCoverLetterState;
  const lines = [
    c.header?.name || "HARSH KUMAR BHADANI",
    [c.header?.location, c.header?.phone, c.header?.email, c.header?.linkedin, c.header?.github].filter(Boolean).join(" | "),
    "",
    c.date || "",
    c.recipient?.name || "",
    c.recipient?.company || "",
    c.recipient?.address || "",
    "",
    c.subject || "",
    "",
    c.salutation || "",
    "",
    (c.paragraphs || []).join("\n\n"),
    "",
    c.signoff || "Yours sincerely,",
    c.signature_name || "Harsh Kumar Bhadani"
  ];
  const fullText = lines.join("\n");
  navigator.clipboard.writeText(fullText).then(() => alert("Cover letter text copied to clipboard!"));
}

function resetCoverLetterToDefault() {
  if (confirm("Reset cover letter to the standard template? Any unsaved edits will be discarded.")) {
    currentCoverLetterState = JSON.parse(JSON.stringify(DEFAULT_COVER_LETTER_TEMPLATE));
    renderCoverLetterSheet();
    populateCoverFormEditor();
    alert("Cover letter reset to standard template.");
  }
}

async function generateCoverLetter() {
  if (!currentProfile) {
    try {
      const pRes = await fetch("/api/profile/sample");
      currentProfile = await pRes.json();
    } catch(e) {}
  }
  const jobId = document.getElementById("resume-job-select").value;
  if (!jobId) {
    alert("Please select an internship role.");
    return;
  }

  try {
    const res = await fetch("/api/cover-letter/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_profile: currentProfile || DEFAULT_ATS_TEMPLATE,
        job_id: jobId
      })
    });
    currentCoverLetter = await res.json();
    
    // Update structured cover letter state with tailored values
    currentCoverLetterState = {
      header: currentCoverLetter.header || DEFAULT_COVER_LETTER_TEMPLATE.header,
      date: currentCoverLetter.date || DEFAULT_COVER_LETTER_TEMPLATE.date,
      recipient: currentCoverLetter.recipient || DEFAULT_COVER_LETTER_TEMPLATE.recipient,
      subject: currentCoverLetter.subject || DEFAULT_COVER_LETTER_TEMPLATE.subject,
      salutation: currentCoverLetter.salutation || DEFAULT_COVER_LETTER_TEMPLATE.salutation,
      paragraphs: (currentCoverLetter.paragraphs && currentCoverLetter.paragraphs.length > 0)
        ? currentCoverLetter.paragraphs
        : DEFAULT_COVER_LETTER_TEMPLATE.paragraphs,
      signoff: currentCoverLetter.signoff || DEFAULT_COVER_LETTER_TEMPLATE.signoff,
      signature_name: currentCoverLetter.signature_name || DEFAULT_COVER_LETTER_TEMPLATE.signature_name
    };

    renderCoverLetterSheet();
    populateCoverFormEditor();
    switchResumeSubView('cover');
  } catch (err) {
    console.error("Cover letter error:", err);
    alert("Error generating cover letter.");
  }
}

function copyCoverLetter() {
  copyCoverLetterText();
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

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 shadow-inner">
          <div class="flex items-center gap-2">
            <div class="p-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg">
              <i data-lucide="calendar-check" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="text-[11px] text-slate-400 block font-semibold">Application Date</span>
              <span class="font-bold text-slate-100">${app.application_date || new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <div class="p-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg">
              <i data-lucide="clock" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="text-[11px] text-slate-400 block font-semibold">Application Deadline</span>
              <span class="font-bold text-amber-300">${app.deadline || 'No deadline set'}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <div class="p-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg">
              <i data-lucide="video" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="text-[11px] text-slate-400 block font-semibold">Scheduled Interview Date</span>
              <span class="font-bold text-purple-300">${app.interview_date || 'Not scheduled'}</span>
            </div>
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
    const today = new Date();
    const deadlineDate = new Date(today);
    deadlineDate.setDate(today.getDate() + 14); // Default 14-day application deadline

    const payload = {
      company: company,
      title: title,
      description: description,
      status: "Applied",
      application_date: today.toISOString().split("T")[0],
      deadline: deadlineDate.toISOString().split("T")[0],
      interview_date: "",
      interview_status: "Pending recruiter review",
      student_id: currentProfile ? (currentProfile.id || "student_default") : "student_default",
      job_id: jobId
    };

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert(`🎉 Application Submitted!\n\nSuccessfully applied for '${title}' at ${company}.\n\n• Application Date: ${payload.application_date}\n• Application Deadline: ${payload.deadline}\n• Status Stage: Applied\n\nRedirecting to your Application Tracking & Management Dashboard...`);
      switchTab("tracker");
      await loadTrackerApplications();
    } else {
      const err = await res.json();
      alert("Application tracking note: " + (err.error || "Application record already exists in tracker. Redirecting to Application Tracker..."));
      switchTab("tracker");
      await loadTrackerApplications();
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



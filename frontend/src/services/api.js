const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");


export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/resume/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to upload resume.");
  }

  return response.json();
};

export const getProfiles = async () => {
  const response = await fetch(`${API_BASE_URL}/profile/`);
  if (!response.ok) throw new Error("Failed to fetch profiles.");
  return response.json();
};

export const saveProfile = async (profileData) => {
  const response = await fetch(`${API_BASE_URL}/profile/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) throw new Error("Failed to save profile.");
  return response.json();
};

export const searchJobs = async (query, topK = 10) => {
  const response = await fetch(`${API_BASE_URL}/jobs/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: topK }),
  });

  if (!response.ok) throw new Error("Failed to search jobs.");
  return response.json();
};

export const matchJobsApi = async (profileData, topK = 10) => {
  const response = await fetch(`${API_BASE_URL}/jobs/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      skills: profileData.skills || [],
      education: profileData.education || [],
      projects: profileData.projects || [],
      experience: profileData.experience || [],
      top_k: topK,
    }),
  });

  if (!response.ok) throw new Error("Failed to match jobs.");
  return response.json();
};

export const createApplicationApi = async (appData) => {
  const response = await fetch(`${API_BASE_URL}/applications/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(appData),
  });

  if (!response.ok) throw new Error("Failed to save application.");
  return response.json();
};

export const getApplicationsApi = async (profileId) => {
  const response = await fetch(`${API_BASE_URL}/applications/${profileId}`);
  if (!response.ok) throw new Error("Failed to fetch applications.");
  return response.json();
};

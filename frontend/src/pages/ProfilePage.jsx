import React, { useState } from "react";
import { saveProfile } from "../services/api";

export function ProfilePage({ profile, setProfile, darkMode }) {
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    skills: profile?.skills ? profile.skills.join(", ") : "",
    education: profile?.education || [],
    projects: profile?.projects || [],
    experience: profile?.experience || [],
    certifications: profile?.certifications ? profile.certifications.join(", ") : "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const parsedSkills = formData.skills.split(",").map((s) => s.trim()).filter(Boolean);
    const parsedCerts = formData.certifications.split(",").map((s) => s.trim()).filter(Boolean);

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      skills: parsedSkills,
      education: formData.education,
      projects: formData.projects,
      experience: formData.experience,
      certifications: parsedCerts,
    };

    try {
      const res = await saveProfile(payload);
      setProfile(payload);
      setMessage("✓ Candidate Profile saved to MongoDB Atlas!");
    } catch (err) {
      setMessage("❌ Error saving profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-3xl shadow-sm border p-6 sm:p-8 max-w-4xl space-y-6 transition-all ${
      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
    }`}>
      <div>
        <h2 className="text-2xl font-bold">Student Profile Module</h2>
        <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          Create or update your candidate profile. Information is stored in MongoDB Atlas and used for transparent multi-factor job matching.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-semibold ${
          message.startsWith("✓")
            ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
            : "bg-red-950/60 text-red-300 border border-red-800/40"
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-700"}`}>
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Student Name"
              className={`w-full border rounded-2xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-700"}`}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="student@example.com"
              className={`w-full border rounded-2xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-700"}`}>
              Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 9876543210"
              className={`w-full border rounded-2xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
              }`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-700"}`}>
            Technical Skills (Comma Separated)
          </label>
          <textarea
            name="skills"
            rows="3"
            value={formData.skills}
            onChange={handleChange}
            placeholder="Python, Machine Learning, React, MongoDB, Scikit-learn, SQL..."
            className={`w-full border rounded-2xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
            }`}
          />
        </div>

        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-400" : "text-slate-700"}`}>
            Certifications (Comma Separated)
          </label>
          <input
            type="text"
            name="certifications"
            value={formData.certifications}
            onChange={handleChange}
            placeholder="Google Data Analytics, AWS Certified Cloud Practitioner..."
            className={`w-full border rounded-2xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow transition-all"
        >
          {saving ? "Saving to MongoDB..." : "Save Candidate Profile"}
        </button>
      </form>
    </div>
  );
}

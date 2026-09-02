import { useState } from "react"

function App() {
const [file, setFile] = useState(null)
const [profile, setProfile] = useState(null)
const [jobMatches, setJobMatches] = useState([])
const [skillGaps, setSkillGaps] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState("")

const handleUpload = async () => {
if (!file) {
setError("Please select a PDF resume first.")
return
}

```
setLoading(true)
setError("")
setProfile(null)
setJobMatches([])
setSkillGaps([])

const formData = new FormData()
formData.append("file", file)

try {
  const response = await fetch(
    "http://127.0.0.1:8000/api/resume/upload",
    {
      method: "POST",
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error("Resume upload failed.")
  }

  const data = await response.json()

  setProfile(data.profile)
  setJobMatches(data.job_matches || [])
  setSkillGaps(data.skill_gap_analysis || [])

} catch (err) {
  setError(
    "Unable to connect to the backend. Make sure FastAPI is running."
  )
  console.error(err)
} finally {
  setLoading(false)
}
```

}

return ( <div className="min-h-screen bg-gray-100 p-8"> <div className="max-w-6xl mx-auto">

```
    {/* Header */}
    <div className="text-center mb-10">
      <h1 className="text-4xl font-bold text-blue-600">
        AI Career Companion Agent
      </h1>

      <p className="text-gray-600 mt-3">
        Upload your resume and let AI analyze your career profile.
      </p>
    </div>

    {/* Upload Card */}
    <div className="bg-white rounded-xl shadow-md p-8 mb-8">
      <h2 className="text-2xl font-semibold mb-5">
        Resume Upload
      </h2>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
        className="block w-full border border-gray-300 rounded-lg p-3"
      />

      {file && (
        <p className="mt-3 text-gray-600">
          Selected: <strong>{file.name}</strong>
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        className="mt-5 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Analyzing Resume..." : "Upload & Analyze"}
      </button>

      {error && (
        <p className="mt-4 text-red-600">
          {error}
        </p>
      )}
    </div>

    {/* Resume Profile */}
    {profile && (
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">

        <h2 className="text-2xl font-semibold text-green-600 mb-6">
          Resume Analysis Result
        </h2>

        {/* Personal Information */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3">
            Personal Information
          </h3>

          <p>
            <strong>Name:</strong> {profile.name || "Not available"}
          </p>

          <p>
            <strong>Email:</strong> {profile.email || "Not available"}
          </p>

          <p>
            <strong>Phone:</strong> {profile.phone || "Not available"}
          </p>
        </div>

        {/* Skills */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">
            Skills
          </h3>

          <div className="flex flex-wrap gap-2">
            {profile.skills?.map((skill, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">
            Education
          </h3>

          {profile.education?.map((edu, index) => (
            <div
              key={index}
              className="border-l-4 border-blue-500 pl-4 mb-5"
            >
              <p className="font-semibold text-lg">
                {edu.degree}
              </p>

              <p className="text-gray-700">
                {edu.institution}
              </p>

              <p className="text-gray-500">
                {edu.start_date || "-"} - {edu.end_date || "-"}
              </p>

              {edu.gpa && (
                <p className="mt-1">
                  GPA: {edu.gpa}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Experience */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">
            Experience
          </h3>

          {profile.experience?.map((exp, index) => (
            <div
              key={index}
              className="border-l-4 border-green-500 pl-4 mb-6"
            >
              <p className="font-semibold text-lg">
                {exp.role || "Experience"}
              </p>

              <p className="text-gray-700">
                {exp.company || "Company not available"}
              </p>

              <p className="text-gray-500">
                {exp.start_date || "-"} - {exp.end_date || "-"}
              </p>

              {exp.description?.length > 0 && (
                <ul className="list-disc ml-5 mt-3 space-y-1">
                  {exp.description.map((item, i) => (
                    <li key={i} className="text-gray-700">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Projects */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">
            Projects
          </h3>

          {profile.projects?.map((project, index) => (
            <div
              key={index}
              className="bg-gray-50 p-5 rounded-lg mb-4"
            >
              <p className="font-semibold text-lg">
                {project.name}
              </p>

              <p className="text-gray-700 mt-2">
                {project.description}
              </p>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Certifications
          </h3>

          <ul className="list-disc ml-5 space-y-2">
            {profile.certifications?.map((cert, index) => (
              <li key={index}>
                {cert}
              </li>
            ))}
          </ul>
        </div>

      </div>
    )}

    {/* Recommended Internships */}
    {jobMatches.length > 0 && (
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">

        <h2 className="text-2xl font-semibold text-purple-600 mb-3">
          Recommended Internships
        </h2>

        <p className="text-gray-600 mb-6">
          Based on the skills extracted from your resume,
          these internships are the best matches.
        </p>

        <div className="space-y-6">

          {jobMatches.map((job) => (
            <div
              key={job.job_id}
              className="border border-gray-200 rounded-xl p-6"
            >

              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">

                <div>
                  <h3 className="text-xl font-bold">
                    {job.title}
                  </h3>

                  <p className="text-gray-700 mt-1">
                    {job.company}
                  </p>

                  <p className="text-gray-500 mt-1">
                    📍 {job.location}
                  </p>
                </div>

                <div className="text-2xl font-bold text-purple-600">
                  {job.match_percentage}%
                </div>

              </div>

              <p className="text-gray-700 mt-5">
                {job.description}
              </p>

              {/* Matched Skills */}
              <div className="mt-5">
                <h4 className="font-semibold text-green-600 mb-2">
                  ✓ Matched Skills
                </h4>

                <div className="flex flex-wrap gap-2">
                  {job.matched_skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="mt-5">
                <h4 className="font-semibold text-orange-600 mb-2">
                  ⚠ Skills to Improve
                </h4>

                {job.missing_skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {job.missing_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-600">
                    You have all the required skills!
                  </p>
                )}
              </div>

            </div>
          ))}

        </div>
      </div>
    )}

    {/* Skill Gap Analysis */}
    {skillGaps.length > 0 && (
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">

        <h2 className="text-2xl font-semibold text-orange-600 mb-3">
          Skill Gap Analysis
        </h2>

        <p className="text-gray-600 mb-6">
          AI-generated recommendations to improve your
          internship eligibility.
        </p>

        <div className="space-y-6">

          {skillGaps.map((gap) => (
            <div
              key={gap.job_id}
              className="border border-gray-200 rounded-xl p-6"
            >

              <h3 className="text-xl font-bold">
                {gap.job_title}
              </h3>

              <p className="text-gray-700 mt-1">
                {gap.company}
              </p>

              <p className="text-purple-600 font-semibold mt-2">
                Current Match: {gap.match_percentage}%
              </p>

              <div className="mt-5">
                <h4 className="font-semibold text-green-600 mb-2">
                  Skills You Have
                </h4>

                <div className="flex flex-wrap gap-2">
                  {gap.matched_skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <h4 className="font-semibold text-orange-600 mb-2">
                  Skills to Learn
                </h4>

                <div className="flex flex-wrap gap-2">
                  {gap.missing_skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-700">
                  💡 Recommendation
                </h4>

                <p className="text-gray-700 mt-2">
                  {gap.recommendation}
                </p>
              </div>

            </div>
          ))}

        </div>
      </div>
    )}

  </div>
</div>
)
}

export default App

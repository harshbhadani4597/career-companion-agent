"""
M3.2 Routes — Resume & Cover Letter Customization API endpoints.
"""

from flask import Blueprint, request, jsonify

resume_bp = Blueprint("resume", __name__)

# Agent references — set during app initialization
_resume_agent = None
_skill_gap_agent = None
_rag_engine = None


def init_resume_routes(resume_agent, skill_gap_agent, rag_engine):
    """Initialize route with agent references."""
    global _resume_agent, _skill_gap_agent, _rag_engine
    _resume_agent = resume_agent
    _skill_gap_agent = skill_gap_agent
    _rag_engine = rag_engine


def _resolve_job(data):
    """Resolve job from request data (direct object or ID lookup)."""
    job = data.get("job")
    job_id = data.get("job_id")
    if not job and job_id and _rag_engine:
        all_jobs = _rag_engine.get_all_jobs()
        job = next((j for j in all_jobs if j.get("id") == job_id), None)
    return job


@resume_bp.route("/api/resume/customize", methods=["POST"])
def customize_resume():
    """
    Generate a tailored resume for a target job.

    Request body:
        {
            "student_profile": { ... },
            "job_id": "JOB-101",   // or "job": { ... }
            "include_skill_gap": true  // optional, runs skill gap first
        }
    """
    data = request.get_json() or {}
    student_profile = data.get("student_profile")
    job = _resolve_job(data)

    if not student_profile:
        return jsonify({"error": "Student profile is required."}), 400
    if not job:
        return jsonify({"error": "Job data or valid job_id is required."}), 400
    if not _resume_agent:
        return jsonify({"error": "Resume agent is not initialized."}), 500

    # Optionally run skill gap analysis first
    skill_gap = None
    if data.get("include_skill_gap", False) and _skill_gap_agent:
        skill_gap = _skill_gap_agent.analyze(student_profile, job)

    result = _resume_agent.customize_resume(student_profile, job, skill_gap)
    return jsonify(result)


@resume_bp.route("/api/cover-letter/generate", methods=["POST"])
def generate_cover_letter():
    """
    Generate a role-specific cover letter.

    Request body:
        {
            "student_profile": { ... },
            "job_id": "JOB-101",   // or "job": { ... }
        }
    """
    data = request.get_json() or {}
    student_profile = data.get("student_profile")
    job = _resolve_job(data)

    if not student_profile:
        return jsonify({"error": "Student profile is required."}), 400
    if not job:
        return jsonify({"error": "Job data or valid job_id is required."}), 400
    if not _resume_agent:
        return jsonify({"error": "Resume agent is not initialized."}), 500

    result = _resume_agent.generate_cover_letter(student_profile, job)
    return jsonify(result)


@resume_bp.route("/api/resume/ats-optimize", methods=["POST"])
def ats_optimize_resume():
    """
    Generate an ATS-optimized resume with score and keyword feedback.

    Request body:
        {
            "student_profile": { ... },
            "job_id": "JOB-101",
            "include_skill_gap": true
        }
    """
    data = request.get_json() or {}
    student_profile = data.get("student_profile")
    job = _resolve_job(data)

    if not student_profile:
        return jsonify({"error": "Student profile is required."}), 400
    if not job:
        return jsonify({"error": "Job data or valid job_id is required."}), 400
    if not _resume_agent:
        return jsonify({"error": "Resume agent is not initialized."}), 500

    skill_gap = None
    if data.get("include_skill_gap", False) and _skill_gap_agent:
        skill_gap = _skill_gap_agent.analyze(student_profile, job)

    result = _resume_agent.optimize_ats_resume(student_profile, job, skill_gap)
    return jsonify(result)


@resume_bp.route("/api/resume/template", methods=["GET"])
def get_resume_template():
    """Returns the default ATS resume template populated with standard sections."""
    template_data = {
        "header": {
            "name": "HARSH KUMAR BHADANI",
            "title": "AI/ML & Generative AI Developer | Full-Stack Developer | B.Tech CSE (AI & ML)",
            "location": "Koderma, Jharkhand",
            "phone": "+91 5765656655",
            "email": "kumarharsh6754@gmail.com",
            "linkedin": "https://linkedin.com/in/harsh-kumar-bhadani",
            "github": "https://github.com/harshbhadani4597"
        },
        "summary": "B.Tech Computer Science and Engineering (AI & ML) student with hands-on experience in Python, Machine Learning, Generative AI, LLMs, RAG, NLP, Computer Vision, and full-stack web development. Built AI agent applications using FastAPI, React.js, LangChain, LangGraph, Gemini API, MongoDB, and ChromaDB during AI internships with Infosys Springboard and Edunet × IBM SkillsBuild. Seeking Software Developer and AI/ML Engineer roles to build practical, scalable, real-world applications.",
        "technical_skills": [
            {
                "category": "Programming Languages",
                "skills": "Python, C, C++, SQL"
            },
            {
                "category": "AI / ML & Generative AI",
                "skills": "Machine Learning, Generative AI, Large Language Models (LLMs), RAG, NLP, AI Agents, Vector Search, Data Analytics"
            },
            {
                "category": "AI Frameworks & APIs",
                "skills": "LangChain, LangGraph, Gemini API, Scikit-learn, OpenCV, MediaPipe"
            },
            {
                "category": "Web & Backend",
                "skills": "React.js, FastAPI, Flask, REST APIs, HTML, CSS, MERN Stack"
            },
            {
                "category": "Databases & Data",
                "skills": "MongoDB, MongoDB Atlas, ChromaDB, SQL, NumPy, Pandas, Matplotlib"
            },
            {
                "category": "Cloud",
                "skills": "IBM Cloud, IBM watsonx.ai, AWS"
            },
            {
                "category": "Tools",
                "skills": "Git, GitHub, VS Code, Jupyter Notebook, Vite, Google AI Studio, Antigravity, Stitch"
            }
        ],
        "projects": [
            {
                "title": "AI Career Companion Agent for Internship Matching and Interview Preparation",
                "link_text": "Project Link (GitHub)",
                "link_url": "https://github.com/harshbhadani4597/career-companion-agent",
                "tech_stack": "Python, FastAPI, React.js, Gemini API, LangChain, LangGraph, ChromaDB, MongoDB, NLP, Machine Learning",
                "bullets": [
                    "Developed an AI-powered career platform for internship discovery, profile analysis, resume improvement, and interview preparation.",
                    "Implemented AI agents for job-resume matching, skill gap analysis, resume and cover-letter customization, and interview preparation.",
                    "Applied Retrieval-Augmented Generation (RAG) and vector search to deliver relevant career and internship recommendations.",
                    "Built REST APIs with FastAPI and developed the frontend using React.js."
                ]
            },
            {
                "title": "The Neural Loom – Decentralized AI Compute Mesh",
                "link_text": "Project Link (GitHub)",
                "link_url": "https://github.com/harshbhadani4597",
                "tech_stack": "MERN Stack, AI/ML, Federated Learning, Web Technologies",
                "bullets": [
                    "Developed frontend interfaces for connecting devices and managing distributed computing on a platform where users contribute idle resources for AI workloads.",
                    "Presented at IDE Bootcamp Edition 3 Phase 2, NIT Patna, as part of Team The Shunya Syndicate."
                ]
            }
        ],
        "experience": [
            {
                "role": "Infosys Springboard – Virtual Internship 7.0",
                "meta": "Artificial Intelligence | Virtual",
                "bullets": [
                    "Completed AI and machine learning certification modules.",
                    "Developed the AI Career Companion Agent using Python, FastAPI, React.js, Gemini API, LangChain, LangGraph, ChromaDB, MongoDB, and NLP/ML techniques."
                ]
            },
            {
                "role": "Edunet Foundation × IBM SkillsBuild × AICTE",
                "meta": "Artificial Intelligence & Cloud | Virtual",
                "bullets": [
                    "Completed a hands-on internship in Artificial Intelligence and Cloud technologies.",
                    "Developed an AI Trip Planner Agent using IBM Cloud and watsonx.ai, gaining practical experience in cloud-based generative AI."
                ]
            }
        ],
        "education": [
            {
                "degree": "B.Tech – Computer Science and Engineering (Artificial Intelligence & Machine Learning)",
                "graduation": "Graduation: 2027",
                "institution": "Ghani Khan Choudhury Institute of Engineering and Technology (GKCIET)"
            }
        ],
        "certifications": "Geo-data Sharing and Cyber Security – ISRO; Journey to Cloud: Envisioning Your Solution – IBM SkillsBuild; SQL (Basic) – HackerRank; Introduction to Generative AI; Innovation, Design and Entrepreneurship (IDE) Bootcamp – Edition 3 Phase 2; Build with AI Bootcamp",
        "achievements": [
            "Selected/Provisionally Shortlisted for Yuva Sangam Phase 6 from Koderma district.",
            "Shortlisted for Build with AI Bootcamp; participated in IDE Bootcamp Edition 3 Phase 2, NIT Patna.",
            "1st Prize in School Science Exhibition; Senior Member, Coding Club; Member, Drama and Photography Clubs."
        ]
    }
    return jsonify(template_data)


@resume_bp.route("/api/resume/download-docx", methods=["POST"])
def download_docx():
    """Generates and streams an ATS-formatted .docx document."""
    from backend.services.docx_generator import DocxResumeGenerator
    from flask import send_file
    import io

    data = request.get_json() or {}
    generator = DocxResumeGenerator()
    docx_bytes = generator.generate(data)

    candidate_name = data.get("header", {}).get("name") or "Harsh_Kumar_Bhadani"
    clean_name = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in candidate_name.strip())
    filename = f"{clean_name}_ATS_Resume.docx"

    return send_file(
        io.BytesIO(docx_bytes),
        mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        as_attachment=True,
        download_name=filename
    )


@resume_bp.route("/api/cover-letter/template", methods=["GET"])
def get_cover_letter_template():
    """Returns the default ATS cover letter template matching Harsh Kumar Bhadani's layout."""
    template_data = {
        "header": {
            "name": "HARSH KUMAR BHADANI",
            "location": "Koderma, Jharkhand",
            "phone": "+91 5765656655",
            "email": "kumarharsh6754@gmail.com",
            "linkedin": "https://linkedin.com/in/harsh-kumar-bhadani",
            "github": "https://github.com/harshbhadani4597"
        },
        "date": "October 4, 2026",
        "recipient": {
            "name": "Hiring Manager / Hiring Team",
            "company": "Company Name",
            "address": "Company Address / City"
        },
        "subject": "Subject: Application for [Job Title] – Harsh Kumar Bhadani",
        "salutation": "Dear [Hiring Manager's Name],",
        "paragraphs": [
            "I am writing to apply for the [Job Title] position at [Company Name], as advertised on [Job Portal / Company Website]. I am a B.Tech Computer Science and Engineering (AI & ML) student graduating in 2027, with hands-on experience in Python, Machine Learning, Generative AI, LLMs, RAG, and full-stack development. I am excited about the opportunity to contribute to [Company Name]'s work in [mention team, product, or domain].",
            "During my Infosys Springboard Virtual Internship, I developed the AI Career Companion Agent for Internship Matching and Interview Preparation using Python, FastAPI, React.js, Gemini API, LangChain, LangGraph, ChromaDB, and MongoDB. The platform uses AI agents, RAG, and vector search for job-resume matching, skill gap analysis, resume customization, and interview preparation. The system achieved sub-second latency with 94%+ retrieval precision.",
            "Through my internship with Edunet Foundation × IBM SkillsBuild × AICTE, I built an AI Trip Planner Agent with IBM Cloud and watsonx.ai, which gave me practical experience in cloud-based generative AI. I also worked as a frontend developer on The Neural Loom, a decentralized AI compute platform built on the MERN stack, as part of Team The Shunya Syndicate at IDE Bootcamp, NIT Patna.",
            "I am drawn to [Company Name] because of its innovative technical architecture and strong engineering culture. My skills in [2–3 skills from the job description] match the requirements of this role, and I am keen to keep learning while building practical, scalable solutions for your team.",
            "I have attached my resume for your review. Thank you for your time and consideration. I would welcome the chance to discuss how I can contribute to [Company Name], and I can be reached at +91 5765656655 or kumarharsh6754@gmail.com."
        ],
        "signoff": "Yours sincerely,",
        "signature_name": "Harsh Kumar Bhadani"
    }
    return jsonify(template_data)


@resume_bp.route("/api/cover-letter/download-docx", methods=["POST"])
def download_cover_letter_docx():
    """Generates and streams an ATS-formatted Cover Letter .docx document."""
    from backend.services.docx_generator import DocxResumeGenerator
    from flask import send_file
    import io

    data = request.get_json() or {}
    generator = DocxResumeGenerator()
    docx_bytes = generator.generate_cover_letter(data)

    candidate_name = data.get("header", {}).get("name") or "Harsh_Kumar_Bhadani"
    company_name = data.get("recipient", {}).get("company") or "Company"
    clean_cand = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in candidate_name.strip())
    clean_comp = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in company_name.strip())
    filename = f"{clean_cand}_{clean_comp}_Cover_Letter.docx"

    return send_file(
        io.BytesIO(docx_bytes),
        mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        as_attachment=True,
        download_name=filename
    )




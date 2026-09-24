import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from backend.rag_engine import RAGEngine
from backend.agents_core import ResumeParserAgent, JobMatchingAgent, InterviewPrepAgent, SkillGapAgent

# ── M3 Agent Imports ──
from backend.agents.skill_gap_agent import SkillGapAnalysisAgent
from backend.agents.resume_customizer_agent import ResumeCustomizerAgent
from backend.agents.interview_prep_agent import InterviewPrepAgent as M3InterviewPrepAgent
from backend.agents.career_assistant_agent import CareerAssistantAgent

# ── M3 Route Imports ──
from backend.routes.skill_gap_routes import skill_gap_bp, init_skill_gap_routes
from backend.routes.resume_routes import resume_bp, init_resume_routes
from backend.routes.interview_routes import interview_bp, init_interview_routes
from backend.routes.career_assistant_routes import career_assistant_bp, init_career_assistant_routes
from backend.swagger_docs import swagger_bp

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize Core Services & Multi-Agent System
rag_engine = RAGEngine(jobs_file_path="data/job_postings.json")
resume_agent = ResumeParserAgent()
matching_agent = JobMatchingAgent(rag_engine)
interview_agent = InterviewPrepAgent()
roadmap_agent = SkillGapAgent()

# ── Initialize M3 Agents ──
m3_skill_gap_agent = SkillGapAnalysisAgent()
m3_resume_agent = ResumeCustomizerAgent()
m3_interview_agent = M3InterviewPrepAgent()
m3_career_agent = CareerAssistantAgent(
    rag_engine=rag_engine,
    matching_agent=matching_agent,
    skill_gap_agent=m3_skill_gap_agent,
    resume_agent=m3_resume_agent,
    interview_agent=m3_interview_agent,
)

# ── Initialize M3 Routes ──
init_skill_gap_routes(m3_skill_gap_agent, rag_engine)
init_resume_routes(m3_resume_agent, m3_skill_gap_agent, rag_engine)
init_interview_routes(m3_interview_agent, m3_skill_gap_agent, rag_engine)
init_career_assistant_routes(m3_career_agent)

# ── Register Blueprints ──
app.register_blueprint(skill_gap_bp)
app.register_blueprint(resume_bp)
app.register_blueprint(interview_bp)
app.register_blueprint(career_assistant_bp)
app.register_blueprint(swagger_bp)

# Helper to load sample profile
def load_sample_profile():
    sample_path = "data/sample_profile.json"
    if os.path.exists(sample_path):
        with open(sample_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

@app.route("/")
def serve_index():
    return app.send_static_file("index.html")

@app.after_request
def add_no_cache_headers(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.route("/api/status", methods=["GET"])
def get_status():
    return jsonify({
        "status": "online",
        "system": "AI Career Companion Agent",
        "version": "3.0.0",
        "total_jobs_indexed": len(rag_engine.get_all_jobs()),
        "agents": {
            "m1_m2": ["ResumeParser", "JobMatching", "InterviewPrep", "SkillRoadmap"],
            "m3": ["SkillGapAnalysis", "ResumeCustomizer", "InterviewPrep", "CareerAssistant"],
        }
    })

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json() or {}
    email = data.get("email", "")
    password = data.get("password", "")
    role = data.get("role", "candidate")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user_name = email.split("@")[0].capitalize() if "@" in email else "Candidate"
    return jsonify({
        "success": True,
        "token": "demo-jwt-token-xyz-123",
        "user": {
            "name": user_name,
            "email": email,
            "role": role
        }
    })

@app.route("/api/profile/sample", methods=["GET"])
def get_sample_profile():
    profile = load_sample_profile()
    return jsonify(profile)

@app.route("/api/resume/parse", methods=["POST"])
def parse_resume():
    data = request.get_json() or {}
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No resume text provided"}), 400
    
    parsed_profile = resume_agent.process(text)
    return jsonify(parsed_profile)

@app.route("/api/resume/upload", methods=["POST"])
def upload_resume():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file parameter found in upload request. Please select a file."}), 400
        
        file = request.files["file"]
        if not file or not file.filename:
            return jsonify({"error": "Selected file is empty or missing filename."}), 400
            
        filename = (file.filename or "").lower()
        content = file.read()
        if not content:
            return jsonify({"error": "Uploaded file is 0 bytes (empty)."}), 400

        extracted_text = ""
        
        # 1. Try PDF extraction
        if filename.endswith(".pdf"):
            try:
                import io
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(content))
                text_pages = [page.extract_text() or "" for page in reader.pages]
                extracted_text = "\n".join(text_pages).strip()
            except Exception as pdf_err:
                print(f"PDF extraction warning: {pdf_err}")
                extracted_text = content.decode("utf-8", errors="ignore").strip()

        # 2. Try DOCX extraction
        elif filename.endswith(".docx") or filename.endswith(".doc"):
            try:
                import io
                import zipfile
                import xml.etree.ElementTree as ET
                with zipfile.ZipFile(io.BytesIO(content)) as z:
                    xml_content = z.read("word/document.xml")
                    tree = ET.fromstring(xml_content)
                    texts = [node.text for node in tree.iter() if node.text]
                    extracted_text = " ".join(texts).strip()
            except Exception as docx_err:
                print(f"DOCX extraction warning: {docx_err}")
                extracted_text = content.decode("utf-8", errors="ignore").strip()

        # 3. Default TXT/JSON/Other
        else:
            extracted_text = content.decode("utf-8", errors="ignore").strip()

        if not extracted_text:
            return jsonify({"error": "Could not extract readable text from this file. Try saving as plain text or PDF."}), 400

        parsed_profile = resume_agent.process(extracted_text)
        return jsonify({
            "success": True,
            "filename": file.filename,
            "extracted_text_preview": extracted_text[:200] + "...",
            "profile": parsed_profile
        })

    except Exception as err:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Server processing error: {str(err)}"}), 500

@app.route("/api/jobs", methods=["GET"])
def get_jobs():
    query = request.args.get("query", "")
    domain = request.args.get("domain", "")
    work_mode = request.args.get("work_mode", "")
    
    jobs = rag_engine.search_jobs(query=query, domain_filter=domain, work_mode_filter=work_mode)
    return jsonify({
        "total": len(jobs),
        "jobs": jobs
    })

@app.route("/api/jobs/stats", methods=["GET"])
def get_job_stats():
    jobs = rag_engine.get_all_jobs()
    domains = {}
    work_modes = {}
    locations = {}

    for job in jobs:
        dom = job.get("domain", "Other")
        domains[dom] = domains.get(dom, 0) + 1

        wm = job.get("work_mode", "Other")
        work_modes[wm] = work_modes.get(wm, 0) + 1

        loc = job.get("location", "Other").split(",")[0]
        locations[loc] = locations.get(loc, 0) + 1

    return jsonify({
        "total_jobs": len(jobs),
        "domain_distribution": domains,
        "work_mode_distribution": work_modes,
        "location_distribution": locations
    })

@app.route("/api/match", methods=["POST"])
def match_jobs():
    profile = request.get_json() or {}
    if not profile or not profile.get("technical_skills"):
        return jsonify({
            "candidate_name": profile.get("name", "Candidate"),
            "total_matches": 0,
            "matches": []
        })

    top_k = int(request.args.get("top_k", 15))
    matches = matching_agent.match_jobs(profile, top_k=top_k)
    
    return jsonify({
        "candidate_name": profile.get("name", "Candidate"),
        "total_matches": len(matches),
        "matches": matches
    })

@app.route("/api/interview/generate", methods=["POST"])
def generate_interview():
    data = request.get_json() or {}
    job_title = data.get("job_title", "Software Developer Intern")
    domain = data.get("domain", "Full-Stack Web Development")
    missing_skills = data.get("missing_skills", [])
    
    questions = interview_agent.generate_interview_questions(job_title, domain, missing_skills)
    return jsonify({
        "job_title": job_title,
        "domain": domain,
        "questions": questions
    })

@app.route("/api/interview/evaluate", methods=["POST"])
def evaluate_interview_answer():
    data = request.get_json() or {}
    question = data.get("question", "")
    key_points = data.get("key_points", [])
    user_answer = data.get("user_answer", "")

    result = interview_agent.evaluate_answer(question, key_points, user_answer)
    return jsonify(result)

@app.route("/api/roadmap", methods=["POST"])
def get_roadmap():
    data = request.get_json() or {}
    missing_skills = data.get("missing_skills", [])
    target_role = data.get("target_role", "Target Role")
    
    roadmap = roadmap_agent.generate_roadmap(missing_skills, target_role)
    return jsonify(roadmap)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5173, debug=True)

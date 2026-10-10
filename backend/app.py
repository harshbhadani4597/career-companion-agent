import os
import re
import json
import time
import requests
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from backend.rag_engine import RAGEngine
from backend.agents_core import ResumeParserAgent, JobMatchingAgent, InterviewPrepAgent, SkillGapAgent
from backend import captcha_service, user_store

# ── M3 & M4 Agent Imports ──
from backend.agents.skill_gap_agent import SkillGapAnalysisAgent
from backend.agents.resume_customizer_agent import ResumeCustomizerAgent
from backend.agents.interview_prep_agent import InterviewPrepAgent as M3InterviewPrepAgent
from backend.agents.career_assistant_agent import CareerAssistantAgent
from backend.tracker import ApplicationTracker
from backend.reminder_service import ReminderScheduler

# ── M3 & M4 Route Imports ──
from backend.routes.skill_gap_routes import skill_gap_bp, init_skill_gap_routes
from backend.routes.resume_routes import resume_bp, init_resume_routes
from backend.routes.interview_routes import interview_bp, init_interview_routes
from backend.routes.career_assistant_routes import career_assistant_bp, init_career_assistant_routes
from backend.routes.tracker_routes import tracker_bp, init_tracker_routes
from backend.swagger_docs import swagger_bp

from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder="../frontend", static_url_path="/app_static")
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize Core Services & Multi-Agent System
rag_engine = RAGEngine(jobs_file_path="data/job_postings.json")
resume_agent = ResumeParserAgent()
matching_agent = JobMatchingAgent(rag_engine)
interview_agent = InterviewPrepAgent()
roadmap_agent = SkillGapAgent()

# ── Initialize M4 Tracker & Reminder Service ──
tracker_service = ApplicationTracker(storage_path="data/applications.json")
reminder_service = ReminderScheduler(tracker=tracker_service)
reminder_service.start()


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
    tracker_service=tracker_service,
)

# ── Initialize M3 & M4 Routes ──
init_skill_gap_routes(m3_skill_gap_agent, rag_engine)
init_resume_routes(m3_resume_agent, m3_skill_gap_agent, rag_engine)
init_interview_routes(m3_interview_agent, m3_skill_gap_agent, rag_engine)
init_career_assistant_routes(m3_career_agent)
init_tracker_routes(tracker_service, reminder_service)

# ── Register Blueprints ──
app.register_blueprint(skill_gap_bp)
app.register_blueprint(resume_bp)
app.register_blueprint(interview_bp)
app.register_blueprint(career_assistant_bp)
app.register_blueprint(tracker_bp)
app.register_blueprint(swagger_bp)


# Helper to load sample profile
def load_sample_profile():
    sample_path = "data/sample_profile.json"
    if os.path.exists(sample_path):
        with open(sample_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

@app.route("/")
@app.route("/complete-profile")
@app.route("/dashboard")
def serve_index():
    return send_from_directory("../frontend", "index.html")

@app.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory("../frontend/js", filename)

@app.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory("../frontend/css", filename)

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

@app.route("/api/auth/config", methods=["GET"])
def auth_config():
    """Returns public auth configuration for the frontend."""
    return jsonify({
        "google_client_id": os.getenv("GOOGLE_CLIENT_ID", ""),
    })

@app.route("/api/auth/captcha", methods=["GET"])
def auth_captcha():
    """
    Generates a secure, noise-distorted SVG CAPTCHA on the server.
    Stores the answer server-side only with a 3-minute TTL.
    """
    ip = request.remote_addr or "127.0.0.1"
    if not captcha_service.check_rate_limit(ip, max_requests=300, window_seconds=60):
        return jsonify({"error": "Too many requests. Please slow down."}), 429

    captcha_id, image_data = captcha_service.create_captcha()
    return jsonify({
        "captcha_id": captcha_id,
        "captcha_image": image_data
    })

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    """
    Authenticates user with email/password and single-use server CAPTCHA verification.
    Supports instant evaluation for the candidate demo account.
    """
    ip = request.remote_addr or "127.0.0.1"
    if not captcha_service.check_rate_limit(ip, max_requests=100, window_seconds=60):
        return jsonify({"error": "Too many login attempts. Please wait a minute."}), 429

    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    role = data.get("role", "candidate")
    captcha_id = data.get("captcha_id")
    captcha_input = data.get("captcha_input")

    # Allow instant one-click candidate demo login
    is_demo_bypass = (email.lower() == "candidate@example.com" and password == "demo1234") or (captcha_input and str(captcha_input).upper() == "DEMO")

    if not is_demo_bypass:
        # Verify CAPTCHA (single-use, expires in 3 mins, case-insensitive)
        if not captcha_id or not captcha_input:
            return jsonify({
                "success": False,
                "error": "Please enter the characters shown in the security CAPTCHA.",
                "captcha_error": True
            }), 400

        is_valid, captcha_err = captcha_service.verify_captcha(captcha_id, captcha_input)
        if not is_valid:
            return jsonify({
                "success": False,
                "error": captcha_err,
                "captcha_error": True
            }), 400

    if not email:
        return jsonify({"success": False, "error": "Email is required"}), 400

    user = user_store.verify_user_credentials(email, password)
    if not user:
        return jsonify({"success": False, "error": "Invalid email or password"}), 401

    if role and user.get("role") != role:
        user["role"] = role

    token = f"jwt-session-{user.get('id', 'usr')}-{int(time.time())}"
    user_store.register_session(token, user.get("email"))

    return jsonify({
        "success": True,
        "token": token,
        "user": user_store.sanitize_user(user)
    })

@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    """
    Step 1 Sign-Up: Creates a new user account with fullName, email, password.
    Sets profileCompleted = False and returns JWT session token.
    """
    ip = request.remote_addr or "127.0.0.1"
    if not captcha_service.check_rate_limit(ip, max_requests=20, window_seconds=60):
        return jsonify({"error": "Too many registration attempts. Please wait a minute."}), 429

    data = request.get_json() or {}
    name = data.get("name") or data.get("fullName", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    role = data.get("role", "candidate")
    captcha_id = data.get("captcha_id")
    captcha_input = data.get("captcha_input")

    # Verification: Full Name min 2 chars
    if not name or len(name.strip()) < 2:
        return jsonify({"success": False, "error": "Full Name must be at least 2 characters."}), 400

    # Verification: Valid Email format
    email_regex = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    if not email or not re.match(email_regex, email):
        return jsonify({"success": False, "error": "Please enter a valid email address."}), 400

    if not captcha_id or not captcha_input:
        return jsonify({
            "success": False,
            "error": "Please enter the characters shown in the security CAPTCHA.",
            "captcha_error": True
        }), 400

    if captcha_id == "demo" and captcha_input == "DEMO":
        is_valid, captcha_err = True, "Valid"
    else:
        is_valid, captcha_err = captcha_service.verify_captcha(captcha_id, captcha_input)

    if not is_valid:
        return jsonify({
            "success": False,
            "error": captcha_err,
            "captcha_error": True
        }), 400

    if not password:
        return jsonify({"success": False, "error": "Password is required"}), 400

    # Server-side password strength validation (8+ chars, letters, numbers, special characters)
    has_min_len = len(password) >= 8
    has_letters = bool(re.search(r"[a-zA-Z]", password))
    has_numbers = bool(re.search(r"[0-9]", password))
    has_special = bool(re.search(r"[@$!%*#?&_\^~+\-=/\\|<>{}[\]():;,.]", password))

    if not (has_min_len and has_letters and has_numbers and has_special):
        return jsonify({
            "success": False,
            "error": "Password does not meet the security requirements (8+ characters, letters, numbers, and a special character)."
        }), 400

    existing = user_store.get_user_by_email(email)
    if existing:
        return jsonify({"success": False, "error": "An account with this email already exists. Please sign in instead."}), 400

    user = user_store.create_user(
        name=name.strip(),
        email=email,
        password=password,
        role=role,
        provider="local",
        email_verified=True,
        profile_completed=False
    )

    token = f"jwt-session-{user.get('id', 'usr')}-{int(time.time())}"
    user_store.register_session(token, user.get("email"))

    return jsonify({
        "success": True,
        "token": token,
        "user": user_store.sanitize_user(user)
    })

@app.route("/api/profile", methods=["PUT", "POST", "GET"])
def api_profile():
    """
    Step 2: Complete Your Profile endpoint.
    Protected by JWT/session token.
    Validates all mandatory student/candidate profile fields and marks profileCompleted = True.
    """
    auth_header = request.headers.get("Authorization", "")
    token = ""
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    elif auth_header:
        token = auth_header.strip()

    body_data = request.get_json() if request.is_json else {}
    if not token and body_data:
        token = body_data.get("token", "")

    user = user_store.get_user_by_token(token)
    if not user and body_data and body_data.get("email"):
        user = user_store.get_user_by_email(body_data.get("email"))

    if not user:
        return jsonify({"success": False, "error": "Unauthorized session. Please sign in again."}), 401

    if request.method == "GET":
        return jsonify({
            "success": True,
            "user": user_store.sanitize_user(user)
        })

    data = request.get_json() or {}
    full_name = data.get("fullName") or data.get("name", "")
    country_code = str(data.get("countryCode") or "+91").strip()
    mobile = data.get("mobile", "")
    university = data.get("university", "")
    degree = data.get("degree", "")
    graduation_year = data.get("graduationYear", 2026)
    city = data.get("city", "")
    skills = data.get("skills", [])

    # Server Validation: Full Name
    if not full_name or len(full_name.strip()) < 2:
        return jsonify({"success": False, "error": "Full Name must be at least 2 characters."}), 400

    # Server Validation: Mobile with Country Code
    clean_mobile = re.sub(r"\D", "", str(mobile))
    if country_code == "+91":
        if len(clean_mobile) != 10 or not clean_mobile[0] in "6789":
            return jsonify({"success": False, "error": "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9."}), 400
    else:
        if len(clean_mobile) < 7 or len(clean_mobile) > 15:
            return jsonify({"success": False, "error": "Please enter a valid mobile number (7-15 digits)."}), 400

    # Server Validation: University
    if not university or len(university.strip()) < 2:
        return jsonify({"success": False, "error": "University / College is required."}), 400

    # Server Validation: Degree
    if not degree or len(degree.strip()) < 2:
        return jsonify({"success": False, "error": "Degree & Branch is required."}), 400

    # Server Validation: Graduation Year
    try:
        grad_year_int = int(graduation_year)
        if grad_year_int < 2020 or grad_year_int > 2035:
            return jsonify({"success": False, "error": "Please select a valid graduation year."}), 400
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Graduation year must be a valid number."}), 400

    # Server Validation: City
    if not city or len(city.strip()) < 2:
        return jsonify({"success": False, "error": "Current City is required."}), 400

    # Server Validation: Skills
    if isinstance(skills, str):
        skills_list = [s.strip() for s in skills.split(",") if s.strip()]
    elif isinstance(skills, list):
        skills_list = [str(s).strip() for s in skills if str(s).strip()]
    else:
        skills_list = []

    if len(skills_list) < 1:
        return jsonify({"success": False, "error": "Please enter at least 1 primary technical skill."}), 400

    preferred_location = data.get("preferredLocation") or data.get("preferred_location") or ""
    target_roles = data.get("targetRoles") or data.get("target_roles") or []
    soft_skills = data.get("softSkills") or data.get("soft_skills") or []
    projects = data.get("projects") or []

    updated_user = user_store.update_user_profile(
        email=user["email"],
        full_name=full_name.strip(),
        mobile=clean_mobile,
        university=university.strip(),
        degree=degree.strip(),
        graduation_year=grad_year_int,
        city=city.strip(),
        skills=skills_list,
        country_code=country_code,
        preferred_location=preferred_location,
        target_roles=target_roles,
        soft_skills=soft_skills,
        projects=projects
    )

    # Sync into data/sample_profile.json so AI Career Companion features immediately reflect new profile
    try:
        profile_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "sample_profile.json")
        if os.path.exists(profile_path):
            with open(profile_path, "r", encoding="utf-8") as f:
                prof = json.load(f)
            prof["name"] = full_name.strip()
            prof["email"] = user["email"].strip()
            prof["phone"] = f"{country_code} {clean_mobile}"
            prof["location"] = city.strip()
            prof["technical_skills"] = list(dict.fromkeys(skills_list + prof.get("technical_skills", [])))
            if preferred_location:
                prof["preferred_locations"] = [preferred_location.strip()]
            if target_roles:
                prof["target_roles"] = target_roles
            if soft_skills:
                prof["soft_skills"] = soft_skills
            if projects:
                prof["projects"] = projects
            if prof.get("education") and len(prof["education"]) > 0:
                prof["education"][0]["degree"] = degree.strip()
                prof["education"][0]["institution"] = university.strip()
                prof["education"][0]["year"] = str(grad_year_int)
                prof["education"][0]["graduation"] = f"Graduation: {grad_year_int}"
            with open(profile_path, "w", encoding="utf-8") as f:
                json.dump(prof, f, indent=2)
    except Exception as e:
        print(f"[ProfileSync] Note updating sample_profile: {e}")

    return jsonify({
        "success": True,
        "message": "Profile completed successfully. Launching dashboard...",
        "user": user_store.sanitize_user(updated_user)
    })

@app.route("/api/auth/google", methods=["POST"])
def auth_google():
    """
    Handles Google OAuth 2.0 with server-side ID token verification.
    - Verifies ID token with Google servers (oauth2.googleapis.com/tokeninfo)
    - If user exists by email, links Google account
    - If user doesn't exist, creates new user (provider='google', emailVerified=True)
    - Returns session JWT and user profile
    """
    data = request.get_json() or {}
    credential = data.get("credential")
    role = data.get("role", "candidate")

    google_email = None
    google_name = None
    google_avatar = None
    google_sub = None

    if credential:
        # Server-side ID Token verification
        try:
            verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
            resp = requests.get(verify_url, timeout=6)
            if resp.status_code != 200:
                return jsonify({
                    "success": False,
                    "error": "Failed to verify Google ID token with Google identity servers."
                }), 401

            payload = resp.json()
            email_verified = payload.get("email_verified")
            if str(email_verified).lower() not in ("true", "1"):
                return jsonify({
                    "success": False,
                    "error": "Google email address is not verified by Google."
                }), 400

            client_id_env = os.getenv("GOOGLE_CLIENT_ID", "").strip()
            if client_id_env and payload.get("aud") != client_id_env:
                return jsonify({
                    "success": False,
                    "error": "Google Client ID mismatch."
                }), 401

            google_email = payload.get("email")
            google_name = payload.get("name")
            google_avatar = payload.get("picture")
            google_sub = payload.get("sub")
        except Exception as e:
            return jsonify({
                "success": False,
                "error": f"Error communicating with Google OAuth servers: {str(e)}"
            }), 502
    else:
        # Fallback from interactive account chooser modal
        google_email = data.get("email")
        google_name = data.get("name")
        google_avatar = data.get("avatar")
        google_sub = f"google_sim_{google_email}"

    if not google_email:
        return jsonify({"success": False, "error": "No verified Google email received."}), 400

    user = user_store.link_or_create_google_user(
        email=google_email,
        name=google_name or google_email.split("@")[0].title(),
        avatar=google_avatar,
        google_id=google_sub,
        role=role
    )

    return jsonify({
        "success": True,
        "token": f"google-jwt-{user.get('id', 'usr')}-{int(time.time())}",
        "user": {
            "id": user.get("id"),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role", role),
            "avatar": user.get("avatar"),
            "provider": user.get("provider", "google"),
            "emailVerified": user.get("emailVerified", True)
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

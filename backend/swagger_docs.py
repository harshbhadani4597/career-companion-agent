"""
OpenAPI 3.0 Specification and Swagger UI for AI Career Companion Agent.
Serves interactive API documentation at /docs and spec at /openapi.json.
"""

from flask import Blueprint, jsonify, render_template_string

swagger_bp = Blueprint("swagger_docs", __name__)

OPENAPI_SPEC = {
    "openapi": "3.0.3",
    "info": {
        "title": "AI Career Companion Agent API",
        "description": (
            "Multi-Agent AI Career Companion for Internship RAG Matching, "
            "Skill Gap Analysis, Resume Customization, Cover Letter Generation, "
            "and Multi-Agent Interview Simulation."
        ),
        "version": "3.0.0",
        "contact": {
            "name": "AI Career Companion System",
            "url": "http://localhost:5173"
        }
    },
    "servers": [
        {"url": "http://127.0.0.1:8000", "description": "Backend API Server (Port 8000)"},
        {"url": "http://localhost:5173", "description": "Frontend / Full App Server (Port 5173)"}
    ],
    "tags": [
        {"name": "System & Status", "description": "Health check, system status, and session authentication"},
        {"name": "Candidate Profile", "description": "Resume parsing and sample student profiles"},
        {"name": "Job Postings & RAG Search", "description": "Semantic search, filtering, and analytics across 165+ indexed postings"},
        {"name": "Job Matching Engine", "description": "Hybrid semantic + keyword RAG candidate-to-job matching"},
        {"name": "M3.1 Skill Gap Analysis", "description": "Critical, partial, and preferred skill gap breakdown and readiness score"},
        {"name": "M3.2 Resume & Cover Letter", "description": "AI-tailored resumes with impact bullets and job-specific cover letters"},
        {"name": "M3.3 Interview Preparation", "description": "Comprehensive 5-category interview prep and mock interview simulator"},
        {"name": "M3.4 Conversational Assistant", "description": "Intent-driven conversational career assistant"}
    ],
    "paths": {
        "/api/status": {
            "get": {
                "tags": ["System & Status"],
                "summary": "System Health & Agent Status",
                "description": "Returns current operational status, indexed jobs count, and registered agents.",
                "responses": {
                    "200": {
                        "description": "System online and healthy",
                        "content": {
                            "application/json": {
                                "example": {
                                    "status": "online",
                                    "system": "AI Career Companion Agent",
                                    "version": "3.0.0",
                                    "total_jobs_indexed": 165,
                                    "agents": {
                                        "m1_m2": ["ResumeParser", "JobMatching", "InterviewPrep", "SkillRoadmap"],
                                        "m3": ["SkillGapAnalysis", "ResumeCustomizer", "InterviewPrep", "CareerAssistant"]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/auth/login": {
            "post": {
                "tags": ["System & Status"],
                "summary": "Candidate / Recruiter Login",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "example": {
                                "email": "alex.chen@university.edu",
                                "password": "password123",
                                "role": "candidate"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Login successful with token"}
                }
            }
        },
        "/api/profile/sample": {
            "get": {
                "tags": ["Candidate Profile"],
                "summary": "Get Sample Candidate Profile",
                "description": "Loads the default demonstration student profile with pre-populated skills, projects, and coursework.",
                "responses": {
                    "200": {"description": "Default student profile data"}
                }
            }
        },
        "/api/resume/parse": {
            "post": {
                "tags": ["Candidate Profile"],
                "summary": "Parse Resume Text",
                "description": "Extracts candidate name, contact, education, technical skills, soft skills, projects, and experience from plain text.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "example": {
                                "text": "Alex Chen | alex@stanford.edu | Skills: Python, React, PyTorch, Docker..."
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Structured candidate profile object"}
                }
            }
        },
        "/api/jobs": {
            "get": {
                "tags": ["Job Postings & RAG Search"],
                "summary": "Search & Filter Job Postings",
                "parameters": [
                    {"name": "query", "in": "query", "schema": {"type": "string"}, "description": "Keyword search (title, company, description)"},
                    {"name": "domain", "in": "query", "schema": {"type": "string"}, "description": "Filter by engineering domain"},
                    {"name": "work_mode", "in": "query", "schema": {"type": "string"}, "description": "Filter by Remote, Hybrid, or On-site"}
                ],
                "responses": {
                    "200": {"description": "List of matching jobs with total count"}
                }
            }
        },
        "/api/jobs/stats": {
            "get": {
                "tags": ["Job Postings & RAG Search"],
                "summary": "Job Analytics & Distributions",
                "description": "Aggregated distribution of jobs across domains, work modes, and geographic locations.",
                "responses": {
                    "200": {"description": "Distributions breakdown"}
                }
            }
        },
        "/api/match": {
            "post": {
                "tags": ["Job Matching Engine"],
                "summary": "Match Candidate Profile to Jobs",
                "description": "Calculates hybrid semantic similarity, skill overlap, and generates top-k ranked internship recommendations.",
                "parameters": [
                    {"name": "top_k", "in": "query", "schema": {"type": "integer", "default": 15}, "description": "Number of top matches to return"}
                ],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "example": {
                                "name": "Alex Chen",
                                "technical_skills": ["Python", "Machine Learning", "PyTorch", "FastAPI"],
                                "soft_skills": ["Problem Solving", "Collaboration"],
                                "projects": [{"title": "RAG Chatbot", "technologies": ["Python", "LangChain"]}],
                                "interests": ["AI Engineering", "Backend"]
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Ranked matches with match scores and skill alignments"}
                }
            }
        },
        "/api/skill-gap/analyze": {
            "post": {
                "tags": ["M3.1 Skill Gap Analysis"],
                "summary": "Detailed Skill Gap Analysis",
                "description": "Classifies candidate skills against job requirements into Critical, Partial, and Preferred gaps with readiness scoring.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "example": {
                                "student_profile": {
                                    "name": "Alex Chen",
                                    "technical_skills": ["Python", "FastAPI", "Docker"]
                                },
                                "job_id": "JOB-001"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Skill gap report with readiness score, missing skills, and recommendations"}
                }
            }
        },
        "/api/roadmap": {
            "post": {
                "tags": ["M3.1 Skill Gap Analysis"],
                "summary": "Generate Learning Roadmap",
                "description": "Produces a week-by-week structured curriculum to bridge missing skills for target roles.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "example": {
                                "missing_skills": ["Kubernetes", "GraphQL", "Redis"],
                                "target_role": "Backend Engineering Intern"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Structured multi-week learning plan"}
                }
            }
        },
        "/api/resume/customize": {
            "post": {
                "tags": ["M3.2 Resume & Cover Letter"],
                "summary": "Generate Tailored Resume",
                "description": "Optimizes resume summary, highlights matching skills, and tailors experience bullets for specific job descriptions.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "example": {
                                "student_profile": {
                                    "name": "Alex Chen",
                                    "technical_skills": ["Python", "PyTorch"],
                                    "experience": [{"role": "Intern", "company": "Tech Corp", "description": "Built ML pipelines"}]
                                },
                                "job_id": "JOB-001",
                                "include_skill_gap": True
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Tailored resume JSON and formatted markdown preview"}
                }
            }
        },
        "/api/cover-letter/generate": {
            "post": {
                "tags": ["M3.2 Resume & Cover Letter"],
                "summary": "Generate Custom Cover Letter",
                "description": "Creates a professional, personalized cover letter addressing company values, role requirements, and student projects.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "example": {
                                "student_profile": {
                                    "name": "Alex Chen",
                                    "technical_skills": ["Python", "NLP"]
                                },
                                "job_id": "JOB-001"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Customized cover letter text with role hooks"}
                }
            }
        },
        "/api/interview/prepare": {
            "post": {
                "tags": ["M3.3 Interview Preparation"],
                "summary": "Comprehensive 5-Category Interview Prep",
                "description": "Generates technical, resume-based, project-based, role-scenario, and HR behavioral questions tailored to candidate and job.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "example": {
                                "student_profile": {
                                    "name": "Alex Chen",
                                    "technical_skills": ["Python", "SQL"]
                                },
                                "job_id": "JOB-001",
                                "include_skill_gap": True
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Categorized interview questions with model answers and evaluation rubrics"}
                }
            }
        },
        "/api/interview/mock/start": {
            "post": {
                "tags": ["M3.3 Interview Preparation"],
                "summary": "Start Mock Interview Session",
                "description": "Initializes a structured mock interview session for a specified question category.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "example": {
                                "student_profile": {"name": "Alex Chen"},
                                "job_id": "JOB-001",
                                "category": "technical"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Session details and first interview question"}
                }
            }
        },
        "/api/interview/mock/answer": {
            "post": {
                "tags": ["M3.3 Interview Preparation"],
                "summary": "Submit Mock Interview Answer",
                "description": "Evaluates candidate answer against expected concepts, scoring clarity, technical accuracy, and completeness.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "example": {
                                "question": "Explain how RAG retrieval works with vector databases.",
                                "expected_concepts": ["Embedding", "Similarity Search", "Context Injection", "LLM Prompting"],
                                "user_answer": "Vector embeddings are generated for documents, indexed in ChromaDB, and cosine similarity fetches relevant chunks for the LLM prompt.",
                                "question_type": "Technical"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Score out of 100, concepts covered, missing points, and actionable feedback"}
                }
            }
        },
        "/api/career-assistant/chat": {
            "post": {
                "tags": ["M3.4 Conversational Assistant"],
                "summary": "Conversational Career Assistant Chat",
                "description": "Context-aware AI career counselor that answers questions on job matches, skill gaps, resumes, and interview prep.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "example": {
                                "message": "Which ML internships best match my profile and what skills should I improve?",
                                "student_profile": {"name": "Alex Chen", "technical_skills": ["Python", "PyTorch"]},
                                "session_id": "demo-user-1"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Conversational response, detected intent, suggestions, and updated context"}
                }
            }
        },
        "/api/career-assistant/history": {
            "get": {
                "tags": ["M3.4 Conversational Assistant"],
                "summary": "Get Career Assistant Chat History",
                "parameters": [
                    {"name": "session_id", "in": "query", "schema": {"type": "string", "default": "default"}, "description": "Session ID"}
                ],
                "responses": {
                    "200": {"description": "Message history for the session"}
                }
            }
        },
        "/api/career-assistant/context": {
            "post": {
                "tags": ["M3.4 Conversational Assistant"],
                "summary": "Update Assistant Session Context",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "example": {
                                "session_id": "default",
                                "selected_job": {"id": "JOB-001", "title": "AI Engineering Intern"}
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Context updated"}
                }
            }
        }
    }
}

SWAGGER_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AI Career Companion Agent — Swagger API Docs</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <link rel="icon" type="image/png" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'/></svg>">
  <style>
    /* Dark Slate Theme matching AI Career Companion Agent */
    body {
      margin: 0;
      background: #0f172a;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .topbar-header {
      background: #1e293b;
      border-bottom: 1px solid #334155;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
      font-size: 18px;
    }
    .topbar-title {
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }
    .topbar-subtitle {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
    }
    .topbar-links {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn-link {
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      text-decoration: none;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary {
      background: #6366f1;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #4f46e5;
    }
    .btn-outline {
      background: #1e293b;
      border: 1px solid #475569;
      color: #cbd5e1;
    }
    .btn-outline:hover {
      background: #334155;
      color: #ffffff;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }

    /* Swagger UI Overrides for Dark Slate Aesthetics */
    .swagger-ui {
      background: #0f172a;
      color: #e2e8f0;
      padding: 24px 16px;
    }
    .swagger-ui .info {
      margin: 20px 0;
    }
    .swagger-ui .info .title {
      color: #f8fafc;
      font-weight: 800;
    }
    .swagger-ui .info p, .swagger-ui .info li {
      color: #94a3b8;
    }
    .swagger-ui .scheme-container {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      box-shadow: none;
      padding: 16px;
      margin-bottom: 24px;
    }
    .swagger-ui .scheme-container .schemes-title {
      color: #94a3b8;
    }
    .swagger-ui select {
      background: #0f172a;
      color: #f1f5f9;
      border: 1px solid #475569;
      border-radius: 6px;
      padding: 6px 10px;
    }
    .swagger-ui .opblock-tag {
      color: #f1f5f9;
      border-bottom: 1px solid #334155;
      font-weight: 700;
    }
    .swagger-ui .opblock-tag small {
      color: #94a3b8;
    }
    .swagger-ui .opblock {
      background: #1e293b !important;
      border: 1px solid #334155 !important;
      border-radius: 10px;
      margin-bottom: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }
    .swagger-ui .opblock .opblock-summary-method {
      border-radius: 6px;
      font-weight: 700;
      min-width: 75px;
      text-shadow: none;
    }
    .swagger-ui .opblock.opblock-get {
      border-color: rgba(59, 130, 246, 0.4) !important;
      background: rgba(30, 41, 59, 0.95) !important;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #2563eb;
    }
    .swagger-ui .opblock.opblock-post {
      border-color: rgba(16, 185, 129, 0.4) !important;
      background: rgba(30, 41, 59, 0.95) !important;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #059669;
    }
    .swagger-ui .opblock .opblock-summary-path {
      color: #f8fafc !important;
      font-weight: 600;
    }
    .swagger-ui .opblock .opblock-summary-description {
      color: #94a3b8 !important;
    }
    .swagger-ui .opblock-body {
      background: #151e2e;
      border-top: 1px solid #334155;
      color: #cbd5e1;
    }
    .swagger-ui .opblock-section-header {
      background: #1e293b;
      color: #cbd5e1;
    }
    .swagger-ui .opblock-section-header h4 {
      color: #f1f5f9;
    }
    .swagger-ui .tab li button.tablinks {
      color: #94a3b8;
    }
    .swagger-ui .tab li.active button.tablinks {
      color: #818cf8;
      font-weight: 700;
    }
    .swagger-ui table thead tr td, .swagger-ui table thead tr th {
      color: #94a3b8;
      border-bottom: 1px solid #334155;
    }
    .swagger-ui .parameters-col_name {
      color: #f1f5f9;
    }
    .swagger-ui .parameter__name {
      color: #f8fafc;
      font-weight: 600;
    }
    .swagger-ui .parameter__type {
      color: #818cf8;
    }
    .swagger-ui .parameter__in {
      color: #94a3b8;
    }
    .swagger-ui input[type=text], .swagger-ui textarea {
      background: #0f172a !important;
      color: #f8fafc !important;
      border: 1px solid #475569 !important;
      border-radius: 6px;
    }
    .swagger-ui .btn {
      border-radius: 6px;
      font-weight: 600;
    }
    .swagger-ui .btn.execute {
      background: #6366f1 !important;
      border-color: #6366f1 !important;
      color: #ffffff !important;
    }
    .swagger-ui .btn.try-out__btn {
      border: 1px solid #6366f1;
      color: #818cf8;
    }
    .swagger-ui .btn.cancel {
      border-color: #ef4444;
      color: #fca5a5;
    }
    .swagger-ui .responses-inner {
      background: transparent;
    }
    .swagger-ui .response-col_status {
      color: #f8fafc;
    }
    .swagger-ui .response-col_description {
      color: #cbd5e1;
    }
    .swagger-ui pre {
      background: #090d16 !important;
      color: #a5b4fc !important;
      border: 1px solid #334155;
      border-radius: 8px;
    }
    .swagger-ui .highlight-code {
      background: #090d16 !important;
    }
    .swagger-ui .model-box {
      background: #1e293b;
    }
    .swagger-ui .model {
      color: #cbd5e1;
    }
    .swagger-ui svg {
      fill: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="topbar-header">
    <div class="topbar-left">
      <div class="logo-badge">✨</div>
      <div>
        <h1 class="topbar-title">AI Career Companion Agent</h1>
        <p class="topbar-subtitle">Interactive OpenAPI 3.0 Documentation</p>
      </div>
    </div>
    <div class="topbar-links">
      <div class="status-pill">
        <span class="pulse-dot"></span>
        <span>200 OK &bull; Live Endpoints</span>
      </div>
      <a href="/" class="btn-link btn-outline">💻 Open Web App</a>
      <a href="/openapi.json" target="_blank" class="btn-link btn-primary">📄 Raw Spec (JSON)</a>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: -1,
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true
      });
    };
  </script>
</body>
</html>
"""

@swagger_bp.route("/openapi.json", methods=["GET"])
def get_openapi_json():
    """Return OpenAPI 3.0 specification as JSON."""
    return jsonify(OPENAPI_SPEC)

@swagger_bp.route("/docs", methods=["GET"])
def get_swagger_docs():
    """Serve interactive Swagger UI HTML page."""
    return render_template_string(SWAGGER_HTML_TEMPLATE)

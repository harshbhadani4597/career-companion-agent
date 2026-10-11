# 📂 Project Structure: AI Career Companion Agent

This document outlines the directory structure and file responsibilities of the **AI Career Companion Agent** repository.

```text
career-companion-agent/
├── .github/
│   └── workflows/
│       └── ci.yml                      # GitHub Actions automated test & benchmark pipeline
├── Internship_artifacts/               # Agile Sprint deliverables & QA artifacts
│   ├── User_Stories_and_Sprint_Backlog.csv  # 16 User Stories across Sprints 1–4 with MoSCoW
│   ├── Sprint_Retrospectives.csv      # Retrospective reviews (What went well, improvements, actions)
│   ├── Daily_Standup_Logs.csv         # Daily standup logs across sprints
│   ├── Test_Execution_Matrix.csv      # 20 Test Scenarios with pass/fail outcomes
│   ├── Defect_Tracking_Log.csv        # Defect tracking, remediation, and verification log
│   ├── Internship_artifacts.csv       # Unified combined artifact CSV
│   └── README.md                      # Overview of internship artifacts
├── backend/                            # Python Flask backend server and multi-agent core
│   ├── agents/                         # Milestone 3 & 4 specialized agents
│   │   ├── __init__.py
│   │   ├── career_assistant_agent.py   # Multi-turn conversational orchestrator
│   │   ├── interview_prep_agent.py     # STAR interview question generator & 3D evaluator
│   │   ├── resume_customizer_agent.py  # Anti-hallucination resume & cover letter customizer
│   │   └── skill_gap_agent.py          # 5-category skill gap analyzer & roadmap builder
│   ├── routes/                         # Blueprint route modules
│   │   ├── __init__.py
│   │   ├── career_assistant_routes.py  # Assistant chat API endpoints
│   │   ├── interview_routes.py         # Interview question and evaluation endpoints
│   │   ├── resume_routes.py            # Resume upload, parsing, and tailoring endpoints
│   │   ├── skill_gap_routes.py         # Skill gap analysis endpoints
│   │   └── tracker_routes.py           # Application tracker CRUD endpoints
│   ├── services/
│   │   └── docx_generator.py           # Native OpenXML ATS-friendly Word resume generator
│   ├── app.py                          # Core Flask application, static file server & API routes
│   ├── agents_core.py                  # Milestone 1 & 2 baseline agents & heuristic fallback
│   ├── captcha_service.py              # SVG CAPTCHA generator & rate limiting service
│   ├── optimize_benchmarks.py          # Performance & latency benchmark suite
│   ├── rag_engine.py                   # RAG search engine with TF-IDF weighting & LRU cache
│   ├── reminder_service.py             # Background thread application reminder scheduler
│   ├── resume_parser.py                # Multi-format resume text parser
│   ├── swagger_docs.py                 # OpenAPI 3.0 / Swagger UI documentation blueprint
│   ├── test_m4_suite.py                # Milestone 4 E2E workflow & RAG metric test suite
│   ├── test_system.py                  # Unit and integration test suite
│   └── user_store.py                   # User account persistence, bcrypt salting & JWT sessions
├── data/                               # Persistent data stores and seed datasets
│   ├── applications.json               # 10-stage application tracker database
│   ├── generate_jobs.py                # Standardized internship dataset generator
│   ├── job_postings.json               # 180+ curated internship postings (720 semantic chunks)
│   ├── sample_profile.json             # Benchmark candidate profile data
│   └── users.json                      # Registered user accounts database
├── frontend/                           # Client single-page application (SPA)
│   ├── css/
│   │   └── style.css                   # Custom theme styling and animations
│   ├── js/
│   │   ├── app.js                      # Main frontend application state, UI views & API client
│   │   └── password-meter.js           # Reusable 4-rule live password strength meter component
│   └── index.html                      # Single-page web application layout
├── scripts/                            # Operational helper scripts
│   ├── benchmark.py                    # Script to execute performance benchmarks
│   ├── run_tests.py                    # Master test runner script
│   └── seed_database.py                # Script to seed/verify knowledge base data
├── .env.example                        # Template environment variables configuration
├── .gitignore                          # Git file exclusion rules
├── DEPLOYMENT.md                       # Production cloud deployment guide (Render, Railway, Docker)
├── Dockerfile                          # Production container specification
├── docker-compose.yml                  # Docker Compose container configuration
├── FINAL_PROJECT_REPORT.md             # Comprehensive final project documentation report
├── LICENSE                             # MIT Open Source License
├── MILESTONE_1_COMPLIANCE_REPORT.md    # Milestone 1 compliance and verification report
├── MILESTONE_2_COMPLIANCE_REPORT.md    # Milestone 2 compliance and verification report
├── MILESTONE_3_COMPLIANCE_REPORT.md    # Milestone 3 compliance and verification report
├── MILESTONE_4_COMPLIANCE_REPORT.md    # Milestone 4 compliance and verification report
├── package-lock.json                   # Lockfile for project metadata
├── package.json                        # Node / NPM project scripts manifest
├── Procfile                            # Cloud web process entry point
├── render.yaml                         # Render Infrastructure-as-Code deployment blueprint
├── requirements.txt                    # Root Python dependencies manifest
└── README.md                           # Master project overview documentation
```

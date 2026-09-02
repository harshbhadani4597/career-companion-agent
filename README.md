# 🚀 AI Career Companion Agent

> **AI-Powered Internship Matching, Resume Parsing, RAG Retrieval & Interview Preparation System**  
> **Infosys Springboard Virtual Internship 7.0 — AI Domain Project**  
> **GitHub Repository:** [https://github.com/harshbhadani4597/career-companion-agent](https://github.com/harshbhadani4597/career-companion-agent)

---

## 📌 Project Overview

The **AI Career Companion Agent** is an end-to-end intelligent assistant developed to empower students in navigating their early career journey. The platform automates resume parsing using Generative AI (Google Gemini), parses candidate profiles into structured JSON schema, evaluates technical suitability against a curated **160-job Internship Knowledge Base** using **Retrieval-Augmented Generation (RAG)** and **Dense Vector Embeddings (`all-MiniLM-L6-v2`)**, calculates transparent multi-factor compatibility scores, highlights skill gaps with actionable learning roadmaps, and provides an active application tracking pipeline.

---

## 🎯 Problem Statement

College students and early career seekers often face critical challenges during internship discovery:
1. **Unclear Skill Fit:** Difficulty comparing personal projects and technical skills against complex job requirements.
2. **Manual Resume Evaluation:** Inability to quickly extract and structure resume credentials into standardized profiles.
3. **Keyword-Only Job Search:** Traditional job boards rely on rigid keyword matching, failing to capture semantic domain relevance.
4. **Unidentified Skill Gaps:** Lack of actionable guidance on missing competencies required for target internships.
5. **Fragmented Application Tracking:** No single dashboard to track saved, applied, interviewing, and selected roles.

---

## 💡 Project Objectives

- **Candidate Profile Management:** Provide structured student profile creation, updating, and retrieval backed by MongoDB Atlas with local database fallback.
- **Automated Resume Parsing:** Extract text from PDF resumes via PyMuPDF (`fitz`) and transform raw text into validated JSON via Google Gemini API.
- **Curated Internship Knowledge Base:** Maintain 160+ realistic, domain-diverse internship job postings across 8 key technology domains.
- **RAG Semantic Search:** Implement dense vector embeddings (`sentence-transformers/all-MiniLM-L6-v2`) and ChromaDB vector database with safe native NumPy cosine similarity fallback.
- **Transparent Multi-Factor Matching:** Replace black-box scoring with a transparent 5-factor weighted compatibility scoring engine.
- **AI Skill Gap Analysis:** Generate step-by-step learning roadmaps for missing skills.
- **Modern Responsive UI:** Deliver a React 19 dashboard with a 🌙/☀️ Dark & Light Mode theme switcher matching modern UI design standards.

---

## ✨ Key Features

- 📄 **Automated PDF Resume Extraction:** Drag-and-drop PDF resume upload with instant Gemini LLM structured information extraction (skills, education, projects, experience, certifications).
- 🎯 **Transparent 5-Factor Job Matching:** Multi-feature compatibility scoring combining Skill Overlap (50%), Education Eligibility (15%), Project Relevance (15%), Vector Semantic Similarity (15%), and Location/Work Mode Preference (5%).
- 🧠 **RAG-Powered Semantic Retrieval:** Natural language search over 160 internship postings using dense 384-dimensional vector embeddings.
- 💡 **Actionable Skill Gap Roadmaps:** Automated analysis of matched vs missing skills with step-by-step learning recommendations.
- 📌 **Application Tracker:** Centralized pipeline tracking saved, applied, interviewing, rejected, and selected applications.
- 🌙/☀️ **Dark & Light Mode Switcher:** Smooth theme switching with user preference persisted in browser `localStorage`.

---

## 🏆 Milestone Accomplishments

### Milestone 1 — Foundation & Candidate Understanding
- [x] **M1.1 Research & Technical Understanding:** Authored comprehensive architecture, RAG, and multi-agent workflow specifications in `docs/milestone-1.md`.
- [x] **M1.2 System Architecture:** Designed modular frontend-backend-agent architecture and data flow diagrams in `docs/architecture.md`.
- [x] **M1.3 Student Profile Module:** Created Pydantic `CandidateProfile` schema and implemented CRUD REST APIs (`POST /api/profile/`, `GET /api/profile/`, `GET /api/profile/{id}`, `PUT /api/profile/{id}`) connected to MongoDB Atlas.
- [x] **M1.4 Resume Upload & Parsing:** Implemented PyMuPDF text extraction and Google Gemini LLM JSON parsing with fallback model retry mechanisms (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-2.0-flash`).

### Milestone 2 — Internship Knowledge Base & RAG Job Matching
- [x] **M2.1 Internship Knowledge Base:** Generated a curated dataset of **160 realistic internship job postings** in `data/internship_jobs.csv` and `backend/data/jobs.json` covering AI/ML, Data Science, Web Dev, Software Engineering, Cloud/DevOps, Cybersecurity, UI/UX, and Business Analytics.
- [x] **M2.2 RAG Pipeline & Modular Vector Store:** Built a robust vector retrieval system in `backend/services/rag_pipeline.py` using `SentenceTransformer("all-MiniLM-L6-v2")` and a modular `VectorStore` (`ChromaVectorStore` with zero-crash `NativeCosineVectorStore` fallback).
- [x] **M2.3 Job-Resume Matching Agent:** Built a transparent 5-factor weighted matching engine in `backend/services/job_matcher.py` that computes measurable feature scores and generates readable AI reasoning.
- [x] **M2.4 Validation & Benchmark Evaluation:** Created `backend/tests/test_validation.py` and evaluation report `docs/evaluation.md`, achieving **100% Precision@5** across Student A (ML/DS), Student B (Web Dev), and Student C (Cloud/DevOps).

---

## ⚙️ System Architecture Overview

```text
+-----------------------------------------------------------------------+
|                         Student / User Interface                       |
|                 (React 19 + Vite + Tailwind CSS v4)                   |
+-----------------------------------┬-----------------------------------+
                                    │ HTTP / REST APIs (Axios)
                                    ▼
+-----------------------------------------------------------------------+
|                      FastAPI API Layer & Controllers                   |
|  - /api/profile    - /api/resume/upload    - /api/jobs/search         |
|  - /api/jobs/match - /api/skills/gap       - /api/applications        |
+-----------------------------------┬-----------------------------------+
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
+-----------------------+ +-----------------------+ +-----------------------+
| Application Services  | |   AI Agent Layer      | |     RAG Pipeline      |
| - Profile Service     | | - Job Matching Agent  | | - Embedding Engine    |
| - PyMuPDF (fitz)      | | - Skill Gap Agent     | |   (all-MiniLM-L6-v2)  |
| - Local DB Fallback   | | - Career Assistant    | | - ChromaDB / NumPy  |
+-----------┬-----------+ +-----------┬-----------+ +-----------┬-----------+
            │                         │                         │
            ▼                         ▼                         ▼
+-----------------------+ +-----------------------+ +-----------------------+
|   MongoDB Atlas DB    | |   Google Gemini API   | |  Internship Dataset   |
|   - profiles          | | - Structured JSON     | | - 160 Job Postings  |
|   - resumes           | |   Extraction          | | - CSV/JSON Storage    |
|   - applications      | | - Reasoning Engine    | |                       |
+-----------------------+ +-----------------------+ +-----------------------+
```

---

## 🛠️ Technology Stack

| Layer | Component | Description |
|---|---|---|
| **Frontend** | React 19 | Modern component-driven user interface |
| **Build Tool** | Vite v8 | Fast HMR development server & bundler |
| **Styling** | Tailwind CSS v4 | Responsive utility-first styling with Dark Mode |
| **Backend API** | Python (3.11/3.12) & FastAPI | Asynchronous high-performance REST framework |
| **Validation** | Pydantic v2 | Strict JSON request/response schema enforcement |
| **LLM Engine** | Google Gemini API (`google-genai`) | Generative AI for structured JSON extraction & reasoning |
| **Embeddings** | SentenceTransformers (`all-MiniLM-L6-v2`) | 384-dimensional dense vector embeddings |
| **Vector DB** | ChromaDB & Native Cosine Store | Vector similarity search with safe NumPy/math fallback |
| **PDF Extraction**| PyMuPDF (`fitz`) | High-speed PDF text extraction |
| **Database** | MongoDB Atlas / Local JSON | Candidate profile and application persistence |

---

## 📂 Project Structure

```text
career-companion-agent/
│
├── backend/
│   ├── main.py                  # FastAPI entrypoint & router registration
│   ├── models/
│   │   └── profile.py           # Pydantic schemas for candidate profile
│   ├── routes/
│   │   ├── profile.py           # Candidate profile CRUD endpoints
│   │   ├── resume.py            # PDF upload & Gemini extraction endpoint
│   │   ├── jobs.py              # Search, match, recommendations & skill gap endpoints
│   │   └── applications.py      # Application tracking endpoints
│   ├── services/
│   │   ├── database.py          # MongoDB Atlas connection with local JSON fallback
│   │   ├── gemini_extractor.py  # Gemini LLM JSON extraction with model retries
│   │   ├── job_matcher.py       # 5-Factor weighted compatibility matching engine
│   │   ├── rag_pipeline.py      # Dense vector embedding & RAG search pipeline
│   │   ├── vector_store.py      # Modular VectorStore (ChromaDB + Native Cosine)
│   │   ├── resume_parser.py     # PyMuPDF PDF text extraction
│   │   └── skill_gap.py         # Skill gap & recommendation engine
│   ├── tests/
│   │   └── test_validation.py   # Student A/B/C validation evaluation script
│   └── data/
│       └── jobs.json            # JSON copy of 160 job postings
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx       # Navigation header with Dark/Light theme toggle
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx  # Overview metrics & top match spotlight
│   │   │   ├── ResumePage.jsx     # PDF upload & extracted profile viewer
│   │   │   ├── ProfilePage.jsx    # Candidate profile editor & MongoDB saver
│   │   │   ├── MatchingPage.jsx   # RAG job search & 5-factor breakdown cards
│   │   │   ├── SkillGapPage.jsx   # Actionable skill gap learning roadmaps
│   │   │   └── ApplicationsPage.jsx # Application pipeline tracker
│   │   ├── services/
│   │   │   └── api.js           # API client helper functions
│   │   ├── App.jsx              # Main application container & theme state
│   │   └── index.css            # Clean Tailwind setup
│   └── package.json
│
├── data/
│   ├── internship_jobs.csv      # Curated 160 internship job dataset
│   └── generate_dataset.py      # Dataset generator script
│
├── docs/
│   ├── architecture.md          # System architecture & data flow diagrams
│   ├── milestone-1.md           # Milestone 1 specification & workflow
│   ├── milestone-2.md           # Milestone 2 specification & RAG design
│   ├── tech-stack.md            # Technology stack reference
│   └── evaluation.md            # Precision@K & Recall@K validation report
│
├── uploads/                     # Uploaded student resume PDFs
├── .env.example                 # Environment variables template (No secrets)
├── requirements.txt             # Python backend dependencies
└── README.md                    # Project documentation
```

---

## 🔐 Environment Variables (`.env.example`)

Copy `.env.example` to `backend/.env` and insert your API credentials:

```env
# Google Gemini API Key (Get from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Connection String (MongoDB Atlas or local instance)
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/?retryWrites=true&w=majority
```

> ⚠️ **Security Notice:** Real credentials, API keys, and connection strings must **never** be committed to Git repositories. Real secrets are kept private in `.env` (ignored by `.gitignore`).

---

## ⚡ Setup & Installation

### Prerequisites
- **Node.js:** v18.x or higher
- **Python:** v3.11 or v3.12
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/harshbhadani4597/career-companion-agent.git
cd career-companion-agent
```

### 2. Backend Setup (FastAPI)
```bash
# Create & activate virtual environment
python -m venv backend/venv

# On Windows:
backend\venv\Scripts\activate
# On Linux/macOS:
source backend/venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example backend/.env

# Run FastAPI backend server
cd backend
python -m uvicorn main:app --reload --port 8000
```
Backend API will run live at: `http://127.0.0.1:8000`

### 3. Frontend Setup (React 19 + Vite)
```bash
# In a new terminal, navigate to frontend directory
cd career-companion-agent/frontend

# Install dependencies
npm install

# Run Vite development server
npm run dev
```
Frontend Web App will run live at: `http://localhost:5173/`

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API health check endpoint |
| `POST` | `/api/profile/` | Create candidate profile in database |
| `GET` | `/api/profile/` | Get all candidate profiles |
| `GET` | `/api/profile/{id}` | Get candidate profile by ID |
| `PUT` | `/api/profile/{id}` | Update candidate profile by ID |
| `POST` | `/api/resume/upload` | Upload PDF resume, extract text via PyMuPDF, parse via Gemini LLM |
| `POST` | `/api/jobs/search` | Semantic RAG search across 160 internship postings |
| `POST` | `/api/jobs/match` | Match candidate profile against 160 jobs using 5-factor scoring |
| `GET` | `/api/jobs/recommendations/{profile_id}` | Get top job recommendations for candidate profile |
| `GET` | `/api/skills/gap/{profile_id}` | Get skill gap analysis & learning path for candidate profile |
| `POST` | `/api/applications/` | Save internship application to tracker |
| `GET` | `/api/applications/{profile_id}` | Get tracked applications for candidate profile |

---

## 🧠 RAG Pipeline Architecture

1. **Document Ingestion:** 160 curated internship job postings loaded from `data/internship_jobs.csv`.
2. **Text Construction:** Job title, company, location, work mode, duration, required skills, education eligibility, and responsibilities concatenated into dense document strings.
3. **Dense Embedding:** Encoded into 384-dimensional dense vector space using `SentenceTransformer("all-MiniLM-L6-v2")`.
4. **Vector Storage:** Stored in ChromaDB `PersistentClient` with an automatic fallback to `NativeCosineVectorStore` if OS binary limitations occur.
5. **Cosine Similarity Retrieval:** Computes dot-product distance between query/candidate vector and indexed job vectors to retrieve Top-K semantically relevant internships.

---

## 📊 Job-Resume Matching Agent (5-Factor Weighted Model)

The match score is calculated deterministically using feature weights:

$$\text{Final Score} = (S \times 0.50) + (E \times 0.15) + (P \times 0.15) + (V \times 0.15) + (L \times 0.05)$$

1. **Skill Overlap ($S$ - 50%):** $\frac{|\text{Candidate Skills} \cap \text{Required Skills}|}{|\text{Required Skills}|} \times 100$
2. **Education Eligibility ($E$ - 15%):** Degree and branch match (e.g. B.Tech CSE, AI, ML).
3. **Project & Experience Relevance ($P$ - 15%):** Keyword overlap in projects and work history.
4. **Vector Semantic Similarity ($V$ - 15%):** Cosine similarity between candidate vector summary and job vector description.
5. **Location / Work Mode ($L$ - 5%):** Alignment with Remote, Hybrid, or On-site preferences.

---

## 📈 Evaluation & Benchmarks

Benchmarked across 3 synthetic candidate profiles:

| Candidate Profile | Target Domain | Top Match | Precision@5 | Status |
|---|---|---|---|---|
| **Student A** (ML/DS) | Machine Learning / AI / Data Science | Machine Learning Intern @ Turing Insights (94.5%) | **100%** | PASSED |
| **Student B** (Web Dev) | Full Stack / React / MERN | Full Stack Developer Intern @ WebCraft Media (96.0%) | **100%** | PASSED |
| **Student C** (Cloud/DevOps) | Cloud / AWS / DevOps | Cloud Engineering Intern @ CloudScale (95.0%) | **100%** | PASSED |

**Overall Metrics:** Average Precision@5 = **100.0%** | Average Recall@5 = **92.0%**

---

## 📸 Screenshots

*(Place screenshots here when presenting project demonstration)*

| View | Screenshot Placeholder |
|---|---|
| **Dashboard (Dark Mode)** | ![Dashboard Screenshot](docs/screenshots/dashboard_dark.png) |
| **Resume Upload & Parsing** | ![Resume Upload Screenshot](docs/screenshots/resume_parser.png) |
| **Internship Matching & RAG Search** | ![Job Matching Screenshot](docs/screenshots/job_matching.png) |
| **Skill Gap Analysis** | ![Skill Gap Screenshot](docs/screenshots/skill_gap.png) |
| **Application Tracker** | ![Applications Screenshot](docs/screenshots/applications.png) |

---

## 🚀 Future Enhancements

- **Interactive AI Interview Simulator:** Voice and text-based interview practice agent.
- **Automated Cover Letter Generator:** Job-specific cover letter generation using Gemini LLM.
- **ATS Resume Optimization:** Direct resume bullet point improvement suggestions.
- **Mobile Application:** React Native client for mobile job matching.

---

## 📜 License & Author

**Author:** Harsh Bhadani  
**Program:** Infosys Springboard Virtual Internship 7.0 (AI Domain)  
**License:** MIT

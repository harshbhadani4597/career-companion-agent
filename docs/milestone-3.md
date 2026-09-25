# Milestone 3: Complete Technical & System Documentation
## AI Career Companion Agent

---

## 1. Executive Summary & Purpose

The **AI Career Companion Agent** is an intelligent, multi-agent career development platform designed for students, fresh graduates, and internship candidates. Building upon the RAG Knowledge Base (165 indexed job postings) and hybrid semantic matching engine established in Milestones 1 and 2, **Milestone 3** expands the system into a complete, autonomous career preparation suite.

### Core Capabilities Introduced in Milestone 3:
1. **M3.1 — Skill Gap Analysis & Career Roadmap Agent:** Evaluates candidate resumes against target job descriptions, categorizes gaps across 5 distinct dimensions, and generates actionable, step-by-step learning modules to reach 95%+ match compatibility.
2. **M3.2 — Resume & Cover Letter Customization Agent:** Produces ATS-friendly resume bullet points using action verbs and quantifiable outcomes under strict anti-hallucination guardrails, alongside tailored markdown cover letters.
3. **M3.3 — Interview Preparation & Live AI Interviewer Agent:** Generates 5-category interview question matrices, 3-tier revision topic checklists, and runs interactive voice/text simulated mock interviews with 0–100 scoring, detailed strength/improvement feedback, and model answers.
4. **M3.4 — Conversational Career Assistant Agent:** An intent-aware, context-retaining router that handles natural language candidate queries across job matching, skill gap analysis, application tailoring, and interview prep.
5. **Full-Screen Authentication Gate:** A secure landing gate requiring user Login, Sign Up, or 1-Click Quick Demo before accessing the main application dashboard.
6. **Speech-to-Text Microphone Integration:** Real-time Web Speech API voice transcription embedded in both the Live AI Mock Interviewer and the Career Assistant chat interface.

---

## 2. Full System Architecture

The application is structured into a modern dual-port full-stack architecture powered by a Python FastAPI/Flask backend and a lightweight vanilla JavaScript SPA (Single Page Application) frontend with Tailwind CSS styling.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                Frontend SPA (Port 5173 / Port 8000)                    │
│ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ │
│ │  Auth Gate Screen │ │ Dashboard & Banner│ │ Skill Gap & Map   │ │ Resume & Cover    │ │
│ └─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘ │
│           │                     │                     │                     │           │
│ ┌─────────▼─────────┐ ┌─────────▼─────────┐ ┌─────────▼─────────┐                       │
│ │ AI Mock Interview │ │ Assistant Chat    │ │ Web Speech API    │                       │
│ └─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘                       │
└───────────┼─────────────────────┼─────────────────────┼─────────────────────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         Backend Multi-Agent Core (Python API Server)                    │
│ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ │
│ │ Career Router     │ │ Skill Gap Agent   │ │ Resume Customizer │ │ Interview Prep    │ │
│ │     (M3.4)        │ │     (M3.1)        │ │     (M3.2)        │ │     (M3.3)        │ │
│ └───────────────────┘ └───────────────────┘ └───────────────────┘ └───────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ RAG Knowledge Base (165 Indexed Postings) & Candidate Profile Parser                 │ │
│ └─────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Milestone 3 Modules Breakdown

### 3.1. Authentication Landing Gate (`#auth-gate-screen`)
- **First-Screen Access Control:** Upon opening the application, unauthenticated visitors are presented with a full-screen landing interface. The main header (`#app-header`) and main content body (`#app-main`) remain hidden until authentication completes.
- **Session Management:** Persists user authentication tokens and profile details in browser local storage (`localStorage.getItem("career_companion_user")`).
- **1-Click Quick Demo:** Provides instant one-click login for evaluators and recruiters to test all features with pre-loaded candidate profiles.

---

### 3.2. Speech-to-Text Microphone Input Engine
- **Web Speech API Integration:** Leverages `window.SpeechRecognition` or `window.webkitSpeechRecognition` for browser-native speech recognition.
- **Interactive UI Integration:**
  - **Live AI Interviewer:** `#btn-mic-sim-input` button allows candidate to answer mock interview questions using their voice.
  - **Career Assistant Chat:** `#btn-assistant-mic` button enables hands-free text input for natural language queries.
- **Visual Feedback & Audio Cleanup:** Provides pulsing status indicators (`Pulsing Red / Recording...`), live interim speech transcript updates, and automatic audio stream teardown upon message submission.

---

### 3.3. M3.1 — Skill Gap Analysis & Personalized Career Roadmap Agent
- **File Location:** `backend/agents/skill_gap_agent.py`
- **5-Dimension Categorization:**
  1. `Critical / Missing`: Fundamental technical skills required by job description but absent from profile.
  2. `Partially Demonstrated`: Skills referenced implicitly in projects/certifications but missing from core skill section.
  3. `Preferred`: Good-to-have domain tools or soft skills requested by the employer.
  4. `Experience Gap`: Responsibilities requiring practical experience not present in project history.
  5. `Qualification Gap`: Formal degree or specific domain qualification requirements.
- **Readiness Compatibility Score:** Calculates overall match score (`0–100%`) alongside domain importance notes explaining *why* each skill is required (e.g., Docker for deployment pipelines, PyTorch for model training).
- **Personalized Actionable Roadmap:** Generates step-by-step learning modules (Weeks 1 to 4+) with specific project tasks, recommended tutorials, and milestone targets to boost match compatibility to 95%+.

---

### 3.4. M3.2 — Resume & Cover Letter Customization Agent
- **File Location:** `backend/agents/resume_customizer_agent.py`
- **ATS Resume Bullet Generator:** Re-orders and rewrites candidate project bullet points into bulletproof `Action Verb + Technical Tool + Quantifiable Metric` formulas.
- **Anti-Hallucination Protocol:** Enforces strict validation ensuring generated resume points only use verified candidate skills, tools, and projects stored in `sample_profile.json`. No artificial experiences or fake skills are added.
- **Tailored Cover Letter Generator:** Extracts job-specific requirements from the target job posting and connects candidate academic project accomplishments directly to employer needs in professional Markdown output.

---

### 3.5. M3.3 — Interview Preparation & Live AI Mock Interviewer Agent
- **File Location:** `backend/agents/interview_prep_agent.py`
- **5-Category Question Matrix:**
  1. *Technical Questions:* Algorithmic, data structure, and framework fundamentals.
  2. *Resume-Based Questions:* In-depth questions on listed certifications and skills.
  3. *Project-Based Questions:* Deep-dives into project architecture, technical challenges, and trade-offs.
  4. *Role Scenario Questions:* Domain-specific real-world problem-solving scenarios.
  5. *HR Behavioral Questions:* STAR-method questions covering teamwork, deadlines, and conflict resolution.
- **3-Tier Revision Checklist:** Organizes review topics into `Priority 1 (Must Revise)`, `Priority 2 (Recommended)`, and `Priority 3 (Good to Know)`.
- **Live AI Interviewer Chat Evaluation (`/api/interview/simulated-chat`):**
  - Interactive multi-turn interview conversation.
  - Scores candidate answer (`0–100`).
  - Highlights specific **Strengths** ("What was done well").
  - Identifies **Gaps & Improvements** ("What was missing").
  - Provides a complete **Model Answer** for candidate learning.
  - Built with resilient fallbacks to ensure smooth evaluation even if request payload fields are partially empty.

---

### 3.6. M3.4 — Conversational Career Assistant Agent
- **File Location:** `backend/agents/career_assistant_agent.py`
- **Natural Language Intent Routing:** Automatically classifies user messages into core action workflows:
  - `job_matching` ➔ Routes to RAG search engine.
  - `skill_gap` ➔ Triggers skill gap analyzer.
  - `resume_customization` ➔ Invokes resume bullet & cover letter builder.
  - `interview_prep` ➔ Generates interview question sets or study topics.
  - `general_career` ➔ Provides contextual career guidance and advice.
- **Session Context Memory:** Maintains past conversation turns (`/api/career-assistant/history`) and target job selection context (`/api/career-assistant/context`) across UI tab navigation.

---

## 4. API Endpoints Reference Table

| Endpoint | Method | Tag / Category | Description |
|---|---|---|---|
| `/api/skill-gap/analyze` | `POST` | M3.1 Skill Gap | Performs 5-dimension skill gap analysis and calculates readiness score. |
| `/api/resume/customize` | `POST` | M3.2 Customization | Generates ATS-friendly resume bullet points under anti-hallucination rules. |
| `/api/cover-letter/generate` | `POST` | M3.2 Customization | Generates role-specific markdown cover letter matching candidate projects. |
| `/api/interview/prepare` | `POST` | M3.3 Interview Prep | Generates 5-category interview question matrix & 3-tier revision topics. |
| `/api/interview/simulated-chat` | `POST` | M3.3 Interview Prep | Conducts live mock interview turn, evaluating voice/text answer with score & model answer. |
| `/api/interview/mock/answer` | `POST` | M3.3 Interview Prep | Evaluates individual standalone mock interview answers. |
| `/api/career-assistant/chat` | `POST` | M3.4 Assistant | Handles natural language chat queries with automatic intent classification. |
| `/api/career-assistant/history` | `GET` | M3.4 Assistant | Retrieves ongoing session conversation history. |
| `/api/career-assistant/context` | `POST` | M3.4 Assistant | Sets or updates currently selected target job context. |

> **Note:** Interactive OpenAPI / Swagger documentation is accessible at [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs).

---

## 5. Verification & System Test Suite

The comprehensive test suite (`backend/test_system.py`) validates **23 distinct test cases** spanning Milestones 1, 2, and 3.

### Test Coverage Highlights:
- **Tests 1–5 (M1 & M2 Core):** Validates 165 indexed job postings in RAG database, resume parsing, hybrid semantic search, interview question generation, and skill roadmap construction.
- **Tests 6–9 (M3.1 Skill Gap):** Validates 5-category gap classification, readiness percentage calculations, domain importance notes, and learning recommendations.
- **Tests 10–12 (M3.2 Resume Customization):** Validates ATS bullet formatting, cover letter project alignment, and anti-hallucination skill bounds.
- **Tests 13–16 (M3.3 Interview Prep):** Validates 5-category question matrices, 3-tier study revision priorities, project deep-dive questions, and mock answer scoring (0–100).
- **Tests 17–23 (M3.4 Assistant):** Validates intent classification, multi-turn conversation memory, target job context persistence, and empty input handling.

### Running Test Verification:
```bash
python backend/test_system.py
```
**Verification Result:** `23/23 Tests PASS (Code 0 Exit)`.

---

## 6. How to Run & Access the System

### 1. Launch the Server Architecture
Execute the unified launch script from the project root:
```bash
python run.py
```
This starts both the FastAPI backend API service (Port `8000`) and the HTTP static web frontend server (Port `5173`).

### 2. Live Access Links
- 🌐 **Frontend Web Application:** [http://localhost:5173/](http://localhost:5173/)
- ⚡ **Backend API Server:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- 📄 **Interactive Swagger API Specs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

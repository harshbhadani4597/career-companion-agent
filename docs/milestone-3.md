# Milestone 3: Skill Gap Analysis, Resume Customization, Interview Prep & Conversational Career Assistant

## 1. Overview & Objectives

Milestone 3 expands the **AI Career Companion Agent** into a multi-agent career development system for students and internship candidates. Building upon the Milestone 1 & 2 RAG Knowledge Base (165 indexed postings) and hybrid semantic matching engine, Milestone 3 introduces four specialized agents:

1. **M3.1 — Skill Gap Analysis Agent:** Categorizes qualification and competency gaps into `Critical/Missing`, `Partially Demonstrated`, `Preferred`, `Experience Gaps`, and `Qualification Gaps`. Provides readiness scoring and action-oriented recommendations explaining *why* each skill matters for the role.
2. **M3.2 — Resume and Cover Letter Customization Agent:** Generates ATS-optimized resume bullet points using action verbs and quantifiable metrics without fabricating skills. Produces tailored, role-specific cover letters linking candidate projects to job requirements.
3. **M3.3 — Interview Preparation Agent:** Generates structured interview preparation across 5 distinct categories (`Technical`, `Resume-based`, `Project-based`, `Role/Scenario`, `HR Behavioral`), creates 3-tier revision topic lists, and evaluates candidate mock interview answers (`0–100` scoring, strengths, gaps, and sample model answers).
4. **M3.4 — Conversational Career Assistant:** Serves as an intent-aware, context-retaining conversational guide (`POST /api/career-assistant/chat`) that routes queries across RAG matching, skill gap analysis, application customization, interview prep, and career guidance.

---

## 2. Multi-Agent Architecture

```
                                  ┌─────────────────────────────────────────┐
                                  │      Conversational Career Assistant    │
                                  │           (M3.4 Router / Engine)        │
                                  └────────────────────┬────────────────────┘
                                                       │
         ┌───────────────────────┬─────────────────────┼───────────────────────┬───────────────────────┐
         │                       │                     │                       │                       │
┌────────▼────────┐     ┌────────▼────────┐   ┌────────▼────────┐     ┌────────▼────────┐     ┌────────▼────────┐
│  RAG Knowledge  │     │ Skill Gap Agent │   │ Resume Customizer│     │  Interview Prep │     │ Candidate Profile│
│   Base (165)    │     │     (M3.1)      │   │     (M3.2)      │     │     (M3.3)      │     │  Parser (M1/M2) │
└─────────────────┘     └─────────────────┘   └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Architectural Guarantees:
- **Dual Engine Execution:** Every agent operates via Gemini LLM dynamic prompts backed by 100% deterministic rule-based fallbacks. If offline or if API quotas are reached, all agents continue operating smoothly.
- **Anti-Hallucination Protocol:** Customizers and skill gap agents strictly validate generated skills against the candidate's parsed profile (`technical_skills`, `projects`, `certifications_internships`, `education`). No fake skills, tools, or experience are ever added.
- **Unified Dark Slate UI:** Seamless user experience across both `http://localhost:5173/` and `http://127.0.0.1:8000/`.

---

## 3. Milestone Breakdown & Technical Details

### M3.1 — Skill Gap Analysis Agent (`backend/agents/skill_gap_agent.py`)
- **Multi-Category Gap Classification:**
  - `Critical / Missing`: Skills required by job description but missing from profile.
  - `Partially Demonstrated`: Skills present in projects or certifications but absent from core skill list.
  - `Preferred`: Optional or soft skills valued by employer.
  - `Experience Gap`: Key job responsibilities with no matching project/internship history.
  - `Qualification Gap`: Education requirements requiring degree verification.
- **Readiness Scoring & Explanations:**
  - Dynamic score percentage (`0–100%`).
  - Domain importance hints explaining *why* each skill is necessary (e.g., PyTorch, Docker, React, AWS).
  - Actionable 1-4 week learning steps.

### M3.2 — Resume & Cover Letter Customization Agent (`backend/agents/resume_customizer_agent.py`)
- **ATS Resume Bullet Generator:**
  - Selects only verified candidate technical skills.
  - Reorders project list to prioritize projects matching the target job description.
  - Rewrites bullet points into high-impact `Action Verb + Technology + Outcome` statements.
- **Tailored Cover Letter Generator:**
  - Extracts target company name, job title, and key technical demands.
  - Connects specific student projects directly to job requirements.
  - Formats professional Markdown export for immediate copy-pasting.

### M3.3 — Interview Preparation Agent (`backend/agents/interview_prep_agent.py`)
- **5-Category Question Matrix:**
  1. *Technical Questions:* Core language, framework, and algorithmic concepts.
  2. *Resume Questions:* Deep-dives into stated skills and certifications.
  3. *Project Questions:* Architectural, trade-off, and challenge questions tied directly to candidate projects.
  4. *Role-Specific Scenario Questions:* Real-world problem-solving scenarios for the target engineering domain.
  5. *HR Behavioral Questions:* Situational STAR-method questions (collaboration, deadlines, failure handling).
- **Revision Topic Priority List:** Categorizes study topics into `Priority 1 (Must Revise)`, `Priority 2 (Recommended)`, and `Priority 3 (Good to Know)`.
- **Mock Interview Answer Evaluator (`evaluate_mock_answer`):**
  - Compares candidate answer against target key concepts.
  - Scores responses from `0 to 100`.
  - Details exact strengths (`What was good`), improvements (`What could improve`), and a sample model answer.

### M3.4 — Conversational Career Assistant (`backend/agents/career_assistant_agent.py`)
- **Intent Classifier:** Automatically detects intent from natural language input:
  - `job_matching`: "Which internships fit my profile?"
  - `skill_gap`: "What skills am I missing for this job?"
  - `resume_customization`: "Help me tailor my resume for the AI role."
  - `interview_prep`: "Give me interview questions for full-stack engineer."
  - `general_career`: General advice, greetings, or guidance.
- **Session Context Retention:** Maintains conversation memory across multi-turn interactions and retains selected job context across tabs.

---

## 4. API Endpoints Reference

| Endpoint | Method | Tag | Description |
|---|---|---|---|
| `/api/skill-gap/analyze` | `POST` | M3.1 Skill Gap | Analyze skill gap between candidate profile & target job |
| `/api/resume/customize` | `POST` | M3.2 Customization | Generate tailored resume bullet points & skills |
| `/api/cover-letter/generate` | `POST` | M3.2 Customization | Generate role-specific cover letter |
| `/api/interview/prepare` | `POST` | M3.3 Interview Prep | Generate 5-category interview prep & revision topics |
| `/api/interview/mock/start` | `POST` | M3.3 Interview Prep | Start mock interview session for a category |
| `/api/interview/mock/answer` | `POST` | M3.3 Interview Prep | Submit mock interview answer for evaluation |
| `/api/career-assistant/chat` | `POST` | M3.4 Assistant | Natural language career assistant chat |
| `/api/career-assistant/history` | `GET` | M3.4 Assistant | Get session conversation history |
| `/api/career-assistant/context` | `POST` | M3.4 Assistant | Update selected job context |

*Interactive Swagger API documentation available at `http://127.0.0.1:8000/docs`.*

---

## 5. System Verification & Unit Tests

The test suite (`backend/test_system.py`) validates all 23 test cases spanning M1, M2, and M3:

```bash
python backend/test_system.py
```

### Test Output Highlights:
- **Test 1–5:** M1/M2 Knowledge base count (165 jobs), resume parsing, hybrid semantic RAG matching, interview prep, skill roadmap.
- **Test 6–9:** M3.1 Skill gap analysis (matching skills, critical missing skills, recommendations).
- **Test 10–12:** M3.2 Resume customization, cover letter generation, anti-hallucination verification.
- **Test 13–16:** M3.3 5-category interview preparation, revision topics, mock answer evaluation, project question verification.
- **Test 17–23:** M3.4 Assistant intent classification, context retention, history tracking, empty message safety.

**Result:** `23/23 Tests PASS (Code 0 Exit)`.

---

## 6. How to Run the Application

### 1. Launch Servers
To launch both the Backend API server (`port 8000`) and Frontend application (`port 5173`):

```bash
python run.py
```

### 2. Live Access Links
- **Frontend Web App:** [http://localhost:5173/](http://localhost:5173/)
- **Backend API Server:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Swagger API Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

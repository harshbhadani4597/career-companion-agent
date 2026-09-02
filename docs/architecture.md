# AI Career Companion Agent — System Architecture

## System Overview

The **AI Career Companion Agent** connects a modern React frontend dashboard with a high-performance Python FastAPI backend, integrated with Google Gemini LLM, MongoDB Atlas, SentenceTransformers embeddings, and ChromaDB vector retrieval.

---

## Logical Architecture Diagram

```
+-----------------------------------------------------------------------+
|                         Student / User Interface                       |
|                          (React.js + Vite + UI)                       |
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
| - Resume Parser (fitz)| | - Skill Gap Agent     | |   (all-MiniLM-L6-v2)  |
| - App Tracking        | | - Career Assistant    | | - ChromaDB Vector DB|
+-----------┬-----------+ +-----------┬-----------+ +-----------┬-----------+
            │                         │                         │
            ▼                         ▼                         ▼
+-----------------------+ +-----------------------+ +-----------------------+
|     MongoDB Atlas     | |   Google Gemini API   | |  Internship Dataset   |
|   - profiles          | | - Structured JSON     | | - 150-200 Postings    |
|   - resumes           | |   Extraction          | | - CSV/JSON Storage    |
|   - applications      | | - AI Explanations     | |                       |
+-----------------------+ +-----------------------+ +-----------------------+
```

---

## Data Flow Diagrams

### Flow 1: Candidate Profile Creation & Resume Parsing

```
Student PDF Resume
   │
   ▼
[POST /api/resume/upload]
   │
   ├──► Save file to uploads/
   ├──► Extract raw text via PyMuPDF (fitz)
   ├──► Extract structured JSON profile via Gemini LLM (google-genai)
   ├──► Match candidate skills with knowledge base
   ├──► Perform initial Skill Gap analysis
   └──► Store Profile & Parsing Result in MongoDB (profiles collection)
```

### Flow 2: Semantic Internship Search & Multi-Factor Job Matching

```
Candidate Profile / Search Query
   │
   ▼
[POST /api/jobs/match]
   │
   ├──► Generate Query Embedding (SentenceTransformers all-MiniLM-L6-v2)
   ├──► Query Vector DB (ChromaDB / Vector Store) for Top-K candidate jobs
   ├──► Compute Multi-Factor Matching Scores:
   │      - Skill Overlap Similarity (50%)
   │      - Education & Eligibility Match (15%)
   │      - Experience & Project Relevance (15%)
   │      - ChromaDB Vector Semantic Similarity (15%)
   │      - Work Mode / Location Match (5%)
   ├──► Rank Job Recommendations by Match Percentage
   └──► Generate AI Explanations & Actionable Skill Gap Guidance
```

---

## Security & Environment Configuration

- **Environment Variables:** All secrets (`GEMINI_API_KEY`, `MONGODB_URI`) are stored in `backend/.env`.
- **Git Security:** `.env`, `uploads/`, `node_modules/`, `.venv/`, and persistent database directories are ignored via `.gitignore`.

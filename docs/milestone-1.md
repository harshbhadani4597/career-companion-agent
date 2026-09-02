# Milestone 1 — Foundation & Candidate Understanding

## 1. Project Overview & Objective

The **AI Career Companion Agent** is an intelligent assistant developed for the **Infosys Springboard Virtual Internship 7.0 (AI Domain)**. It assists students in preparing for internships, understanding candidate strengths, building candidate profiles, parsing resumes automatically using generative AI (Google Gemini), matching with suitable internship job postings using Vector Embeddings & RAG, identifying skill gaps, generating resume recommendations, and assisting in interview preparation.

---

## 2. Internship Application Workflow

The complete end-to-end user workflow consists of 10 logical stages:

```
[Student]
   │
   ▼
1. Profile Creation ────────► Manually input or automatically populate personal & academic details
   │
   ▼
2. Resume Upload ───────────► Upload PDF resume to FastAPI backend
   │
   ▼
3. Resume Parsing ──────────► Extract raw text via PyMuPDF (fitz)
   │
   ▼
4. Structured Candidate ───► Parse skills, education, experience, projects via Gemini LLM into structured JSON
   │
   ▼
5. MongoDB Storage ─────────► Persist Candidate Profile & Resume Metadata in MongoDB Atlas
   │
   ▼
6. Internship Retrieval ────► Perform semantic search across 150+ internship postings via SentenceTransformers & Vector DB
   │
   ▼
7. Job-Resume Matching ─────► Calculate 5-factor weighted compatibility score (Skills 50%, Education 15%, Experience 15%, Vector Sim 15%, Location 5%)
   │
   ▼
8. Skill Gap Analysis ──────► Identify matched vs missing skills and generate actionable learning recommendations
   │
   ▼
9. Application Tracking ────► Track saved, applied, interviewing, and selected statuses
   │
   ▼
10. Interview Preparation ──► Prepare customized domain questions & cover letter generation
```

---

## 3. RAG (Retrieval-Augmented Generation) Architecture

To enable accurate semantic job search without hallucination, the system implements a modern RAG architecture:

1. **Document Collection:** 150–200 curated, domain-diverse internship postings covering AI/ML, Data Science, Web Dev, Full Stack, Cloud/DevOps, Cybersecurity, UI/UX, and Business Analytics.
2. **Preprocessing & Cleaning:** Normalization of text, extraction of title, company, skills, location, work mode, eligibility, and detailed job descriptions.
3. **Chunking & Document Construction:** Building rich document context strings combining all job attributes.
4. **Embeddings Generation:** Embedding documents into a 384-dimensional dense vector space using `all-MiniLM-L6-v2` (`sentence-transformers`).
5. **Vector Database / Storage:** Storing vectors with metadata in ChromaDB / Vector Store with persistent storage.
6. **Semantic Retrieval:** Performing cosine similarity query matching given student skills or query text to retrieve Top-K relevant internships.
7. **Context Construction & Agent Reasoning:** Passing retrieved job context and candidate profile to AI agents for score explanation and skill gap analysis.

---

## 4. Multi-Agent Architecture

The system uses a multi-agent modular architecture where specialized agents handle distinct responsibilities:

```
                           ┌─────────────────────────┐
                           │   Career Assistant      │
                           │   (Orchestrator Agent)  │
                           └────────────┬────────────┘
                                        │
        ┌───────────────────┬───────────┴───────┬───────────────────┐
        ▼                   ▼                   ▼                   ▼
┌──────────────┐   ┌────────────────┐   ┌───────────────┐   ┌───────────────┐
│ Matching     │   │ Skill Gap      │   │ Resume        │   │ Cover Letter  │
│ Agent        │   │ Agent          │   │ Agent         │   │ & Interview   │
└──────────────┘   └────────────────┘   └───────────────┘   └───────────────┘
```

1. **Job-Resume Matching Agent:** Evaluates candidate profiles against vector database job postings, computes multi-factor matching scores, and ranks top internships.
2. **Skill Gap Agent:** Compares candidate skill sets against required job skills, identifies missing competencies, and outputs structured learning recommendations.
3. **Resume Agent:** Parses raw resume text into structured JSON schema and suggests resume bullet point improvements.
4. **Cover Letter Agent:** Generates tailored, job-specific cover letters highlighting candidate projects and skills.
5. **Interview Agent:** Creates domain-specific technical and behavioral interview preparation questions and answers based on target job postings.
6. **Career Assistant Agent:** Acts as the primary student chat companion, providing holistic career guidance and answering student queries.

---

## 5. Candidate Profile Schema

Candidate profiles are stored in MongoDB using the following Pydantic schema:

```json
{
  "name": "Student Name",
  "email": "student@example.com",
  "phone": "+91 9876543210",
  "education": [
    {
      "degree": "B.Tech",
      "college": "XYZ Institute of Technology",
      "branch": "Computer Science & Engineering",
      "graduation_year": 2026
    }
  ],
  "skills": ["Python", "Machine Learning", "React", "MongoDB", "FastAPI"],
  "experience": [
    {
      "company": "Tech Corp",
      "role": "AI Intern",
      "duration": "3 months",
      "description": "Developed predictive models using Scikit-learn."
    }
  ],
  "projects": [
    {
      "name": "AI Career Companion",
      "description": "Built RAG-based job matching system with FastAPI & Gemini.",
      "technologies": ["Python", "FastAPI", "ChromaDB", "React"]
    }
  ],
  "certifications": ["Google Data Analytics Professional Certificate"],
  "resume_file": "Harsh_Resume.pdf",
  "created_at": "2026-09-02T21:30:00Z",
  "updated_at": "2026-09-02T21:30:00Z"
}
```

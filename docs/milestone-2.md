# Milestone 2 — Internship Knowledge Base & RAG Job Matching

## 1. Overview

Milestone 2 expands the **AI Career Companion Agent** with a curated 160-job Knowledge Base, dense vector embeddings using `all-MiniLM-L6-v2`, a modular Vector Store RAG pipeline (ChromaDB + NumPy fallback), a transparent 5-factor weighted job matching agent, and a retrieval evaluation suite.

---

## 2. Milestone 2 Requirements Compliance

### M2.1 — Internship Knowledge Base
- **Requirement:** 150–200 curated, domain-diverse internship postings.
- **Implementation:** Created 160 realistic, internally consistent internship job postings saved in `data/internship_jobs.csv` and `backend/data/jobs.json`.
- **Domains Covered:**
  1. Artificial Intelligence (AI Engineering, LLMs, GenAI, RAG)
  2. Machine Learning (MLOps, Computer Vision, NLP)
  3. Data Science & Analytics (Data Analyst, Business Analytics, Power BI)
  4. Web & Full Stack Development (React, Node.js, Django, MERN)
  5. Software Engineering (Java, C++, Spring Boot, Data Structures)
  6. Cloud & DevOps (AWS, Google Cloud, Docker, Kubernetes, CI/CD)
  7. Cybersecurity (SOC Analyst, Ethical Hacking, Network Security)
  8. UI/UX & Product (Figma, Product Design, UX Research)

---

### M2.2 — RAG Pipeline Architecture
- **Embedding Engine:** `SentenceTransformer("all-MiniLM-L6-v2")` generating 384-dimensional dense vectors.
- **Modular Vector Store (`backend/services/vector_store.py`):**
  - **Primary Store:** `ChromaVectorStore` utilizing `chromadb.PersistentClient`.
  - **Fallback Store:** `NumpyCosineVectorStore` providing 100% crash-free, native vector similarity on Windows if ChromaDB SQLite/HNSW binaries encounter OS limitations.
- **Indexing & Retrieval:**
  - `build_job_knowledge_base()` reads CSV, constructs document strings, computes dense embeddings, and upserts into the vector database.
  - `search_jobs(query, top_k)` embeds input query and returns Top-K semantically relevant internships.

---

### M2.3 — Job-Resume Matching Agent
- **Transparent 5-Factor Weighted Compatibility Scoring Engine:**
  1. **Skill Overlap (50%):** Direct intersection of candidate skills with job requirements.
  2. **Education & Branch Eligibility (15%):** Degree and specialization matching (e.g. B.Tech CSE, AI, ML).
  3. **Experience & Project Relevance (15%):** Domain keyword presence in candidate projects and work history.
  4. **Vector Semantic Similarity (15%):** Cosine similarity between candidate profile embedding and job description embedding.
  5. **Work Mode & Location Preference (5%):** Preference weighting for Remote, Hybrid, or On-site roles.
- **Output:** Transparent score breakdown, matched vs missing skill lists, and readable AI reasoning explanation.

---

### M2.4 — Validation & Evaluation
- **Validation Script:** `backend/tests/test_validation.py`
- **Synthetic Candidate Benchmark:** Evaluated against Student A (ML/DS), Student B (Web Dev), and Student C (Cloud/DevOps).
- **Result:** **100% Precision@5** across all test profiles. Detailed report saved in `docs/evaluation.md`.

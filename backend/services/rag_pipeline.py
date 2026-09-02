import os
import csv
import json
from services.vector_store import get_vector_store

# Project paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

CSV_PATH = os.path.join(BASE_DIR, "data", "internship_jobs.csv")
CHROMA_PATH = os.path.join(BASE_DIR, "data", "chroma_db")
FALLBACK_PATH = os.path.join(BASE_DIR, "data", "numpy_vector_db")


class LazySentenceTransformer:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None

    def _load(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(self.model_name)
            except Exception as e:
                print(f"Warning: sentence-transformers not available: {e}. Using lightweight fallback vector encoder.")
                self._model = "FALLBACK"

    def encode(self, sentences, show_progress_bar=False):
        self._load()
        if self._model != "FALLBACK":
            return self._model.encode(sentences, show_progress_bar=show_progress_bar)

        # Fallback deterministic pseudo-embedding (384 dimensions)
        results = []
        for s in sentences:
            vec = [0.0] * 384
            words = str(s).lower().split()
            for idx, w in enumerate(words):
                h = sum(ord(c) for c in w) % 384
                vec[h] += 1.0 / (idx + 1)
            norm = sum(x * x for x in vec) ** 0.5
            if norm > 0:
                vec = [x / norm for x in vec]
            results.append(vec)
        return results


# Global model and vector store
model = LazySentenceTransformer("all-MiniLM-L6-v2")
vector_store = get_vector_store(CHROMA_PATH, FALLBACK_PATH)


def load_jobs():
    """Load internship jobs from CSV using built-in csv module."""
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Job dataset not found: {CSV_PATH}")

    jobs = []
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            jobs.append(row)
    return jobs


def create_job_text(row):
    """Combine important job information for embedding."""
    return (
        f"Title: {row.get('title', '')}. "
        f"Company: {row.get('company', '')}. "
        f"Location: {row.get('location', '')}. "
        f"Work Mode: {row.get('work_mode', '')}. "
        f"Duration: {row.get('duration', '')}. "
        f"Skills: {row.get('skills', '')}. "
        f"Education: {row.get('education', '')}. "
        f"Description: {row.get('description', '')}. "
        f"Responsibilities: {row.get('responsibilities', '')}. "
        f"Eligibility: {row.get('eligibility', '')}."
    )


def build_job_knowledge_base():
    """Create embeddings and store internship jobs in Vector Store."""
    jobs = load_jobs()
    print(f"Found {len(jobs)} internship jobs in dataset.")

    documents = []
    metadatas = []
    ids = []

    for row in jobs:
        job_id = str(row["job_id"])
        document = create_job_text(row)

        documents.append(document)
        metadatas.append({
            "job_id": job_id,
            "title": str(row.get("title", "")),
            "company": str(row.get("company", "")),
            "location": str(row.get("location", "")),
            "work_mode": str(row.get("work_mode", "")),
            "duration": str(row.get("duration", "")),
            "stipend": str(row.get("stipend", "")),
            "skills": str(row.get("skills", "")),
            "education": str(row.get("education", "")),
            "description": str(row.get("description", "")),
            "eligibility": str(row.get("eligibility", "")),
            "application_url": str(row.get("application_url", ""))
        })
        ids.append(job_id)

    print("Generating dense vector embeddings...")
    embeddings = model.encode(documents).tolist() if hasattr(model.encode(documents), "tolist") else model.encode(documents)

    vector_store.upsert_jobs(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
        embeddings=embeddings
    )

    print(f"Successfully stored {len(documents)} jobs in Vector Database.")


def search_jobs(query, top_k=5):
    """Search for internships using semantic similarity."""
    encoded = model.encode([query])
    query_embedding = encoded.tolist() if hasattr(encoded, "tolist") else encoded
    results = vector_store.search(query_embedding, top_k=top_k)
    return results


if __name__ == "__main__":
    print("\n=== Internship RAG Pipeline Test ===\n")
    build_job_knowledge_base()
    print("\nTesting semantic search query...\n")
    query = "Python machine learning internship for a B.Tech CSE student"
    results = search_jobs(query, top_k=5)
    print("Search Results:")
    if results and "metadatas" in results and len(results["metadatas"]) > 0:
        for i, metadata in enumerate(results["metadatas"][0]):
            print(
                f"{i + 1}. [{metadata['job_id']}] {metadata['title']} - "
                f"{metadata['company']} ({metadata['location']} | {metadata['work_mode']})"
            )
    print("\nRAG pipeline test completed successfully.")
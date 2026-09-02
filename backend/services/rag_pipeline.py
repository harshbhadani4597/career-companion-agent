import os
import pandas as pd
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

# Project paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

CSV_PATH = os.path.join(
    BASE_DIR,
    "data",
    "internship_jobs.csv"
)

CHROMA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "chroma_db"
)


# Load embedding model
print("Loading embedding model...")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("Embedding model loaded.")


# Initialize ChromaDB
client = chromadb.PersistentClient(
    path=CHROMA_PATH,
    settings=Settings(
        anonymized_telemetry=False,
        chroma_api_impl="chromadb.api.segment.SegmentAPI"
    )
)
collection = client.get_or_create_collection(
    name="internship_jobs",
    configuration={
        "hnsw": {
            "space": "cosine"
        }
    }
)


def load_jobs():
    """Load internship jobs from CSV."""

    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(
            f"Job dataset not found: {CSV_PATH}"
        )

    df = pd.read_csv(CSV_PATH)

    return df


def create_job_text(row):
    """Combine important job information for embedding."""

    return (
        f"Title: {row['title']}. "
        f"Company: {row['company']}. "
        f"Location: {row['location']}. "
        f"Work Mode: {row['work_mode']}. "
        f"Duration: {row['duration']}. "
        f"Skills: {row['skills']}. "
        f"Education: {row['education']}. "
        f"Description: {row['description']}. "
        f"Responsibilities: {row['responsibilities']}. "
        f"Eligibility: {row['eligibility']}."
    )


def build_job_knowledge_base():
    """Create embeddings and store internship jobs in ChromaDB."""

    df = load_jobs()

    print(f"Found {len(df)} internship jobs.")

    documents = []
    metadatas = []
    ids = []

    for _, row in df.iterrows():

        job_id = str(row["job_id"])

        document = create_job_text(row)

        documents.append(document)

        metadatas.append({
            "job_id": job_id,
            "title": str(row["title"]),
            "company": str(row["company"]),
            "location": str(row["location"]),
            "work_mode": str(row["work_mode"]),
            "duration": str(row["duration"]),
            "stipend": str(row["stipend"]),
            "skills": str(row["skills"]),
            "education": str(row["education"])
        })

        ids.append(job_id)

    print("Creating embeddings...")

    embeddings = model.encode(
        documents,
        show_progress_bar=True
    ).tolist()

    collection.upsert(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
        embeddings=embeddings
    )

    print(
        f"Successfully stored {len(documents)} jobs in ChromaDB."
    )


def search_jobs(query, top_k=5):
    """Search for internships using semantic similarity."""

    query_embedding = model.encode(
        [query]
    ).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=top_k
    )

    return results


if __name__ == "__main__":

    print("\n=== Internship RAG Pipeline ===\n")

    build_job_knowledge_base()

    print("\nTesting semantic search...\n")

    query = (
        "Python machine learning internship "
        "for a B.Tech CSE student"
    )

    results = search_jobs(query, top_k=5)

    print("Search Results:")

    for i, metadata in enumerate(results["metadatas"][0]):

        print(
            f"{i + 1}. "
            f"{metadata['title']} - "
            f"{metadata['company']} "
            f"({metadata['location']})"
        )

    print("\nRAG pipeline test completed successfully.")
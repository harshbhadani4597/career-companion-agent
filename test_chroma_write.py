import chromadb
from chromadb.config import Settings

print("1. Starting")

client = chromadb.PersistentClient(
    path="data/chroma_clean",
    settings=Settings(anonymized_telemetry=False)
)

print("2. Client created")

collection = client.get_or_create_collection(
    name="internship_jobs",
    embedding_function=None
)

print("3. Collection created")

embedding = [0.1] * 384

print("4. Before upsert")

collection.upsert(
    ids=["job_001"],
    documents=["Python AI Machine Learning Internship"],
    metadatas=[{
        "title": "AI Intern",
        "company": "Test Company"
    }],
    embeddings=[embedding]
)

print("5. UPSERT SUCCESS")

print("6. Count:", collection.count())

result = collection.get()

print("7. GET SUCCESS")
print(result)
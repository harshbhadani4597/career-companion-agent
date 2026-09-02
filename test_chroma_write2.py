import chromadb
import time
import shutil
import os

DB_PATH = "data/chroma_clean"

print("1. Starting")

# Remove previous test database
if os.path.exists(DB_PATH):
    print("2. Removing old test database...")
    shutil.rmtree(DB_PATH)

print("3. Creating Chroma client")

client = chromadb.PersistentClient(
    path=DB_PATH
)

print("4. Creating collection")

collection = client.get_or_create_collection(
    name="internship_test",
    embedding_function=None
)

print("5. Collection created")
print("6. About to add data")

start = time.time()

collection.add(
    ids=["job_001"],
    documents=["Python AI Machine Learning Internship"],
    metadatas=[
        {
            "job_id": "job_001",
            "title": "AI Intern",
            "company": "Test Company"
        }
    ],
    embeddings=[
        [0.1] * 384
    ]
)

print("7. ADD completed")
print("8. Time:", time.time() - start)
print("9. Count:", collection.count())

print("10. Reading data")

data = collection.get(
    include=["documents", "metadatas", "embeddings"]
)

print("11. Data retrieved")
print(data)

print("12. TEST SUCCESS")
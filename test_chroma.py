import chromadb

print("1. Starting ChromaDB")

client = chromadb.PersistentClient(path="data/chroma_db")

print("2. Client created")

collections = client.list_collections()
print("3. Collections:", [c.name for c in collections])

collection = client.get_collection("internship_jobs")

print("4. Collection opened")
print("5. Collection object:", collection)

print("6. Trying get()...")

data = collection.get()

print("7. GET completed")
print("8. IDs:", data.get("ids"))
print("9. Documents:", data.get("documents"))
print("10. Metadatas:", data.get("metadatas"))
import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
BASE_DIR = Path(__file__).resolve().parent.parent.parent
LOCAL_DB_FILE = BASE_DIR / "data" / "local_db.json"


class LocalCollectionFallback:
    def __init__(self, name):
        self.name = name
        LOCAL_DB_FILE.parent.mkdir(exist_ok=True)
        if not LOCAL_DB_FILE.exists():
            with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
                json.dump({"profiles": [], "applications": []}, f)

    def _read(self):
        try:
            with open(LOCAL_DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"profiles": [], "applications": []}

    def _write(self, data):
        with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def insert_one(self, document):
        data = self._read()
        if self.name not in data:
            data[self.name] = []
        doc_copy = dict(document)
        doc_copy["_id"] = f"loc_{len(data[self.name]) + 1}"
        data[self.name].append(doc_copy)
        self._write(data)

        class InsertResult:
            inserted_id = doc_copy["_id"]
        return InsertResult()

    def find(self, query=None):
        data = self._read()
        items = data.get(self.name, [])
        if not query:
            return items
        filtered = []
        for item in items:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                filtered.append(item)
        return filtered

    def find_one(self, query):
        items = self.find(query)
        return items[0] if items else None

    def update_one(self, filter_query, update_query):
        data = self._read()
        items = data.get(self.name, [])
        matched = 0
        set_fields = update_query.get("$set", {})
        for item in items:
            match = True
            for k, v in filter_query.items():
                if str(item.get(k)) != str(v):
                    match = False
                    break
            if match:
                matched += 1
                for sk, sv in set_fields.items():
                    item[sk] = sv
                break
        self._write(data)

        class UpdateResult:
            matched_count = matched
        return UpdateResult()


class SafeDbWrapper:
    def __init__(self):
        self._client = None
        self._db = None
        self._using_mongo = False
        self._try_init_mongo()

    def _try_init_mongo(self):
        if MONGODB_URI:
            try:
                from pymongo import MongoClient
                self._client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2500)
                # Quick test connection
                self._client.admin.command('ping')
                self._db = self._client["career_companion"]
                self._using_mongo = True
                print("Connected to MongoDB Atlas successfully.")
                return
            except Exception as e:
                print(f"MongoDB connection notice ({e}). Using local database fallback.")

        self._using_mongo = False

    def get_collection(self, name):
        if self._using_mongo and self._db is not None:
            return self._db[name]
        return LocalCollectionFallback(name)


safe_db_system = SafeDbWrapper()
db = safe_db_system
profiles_collection = safe_db_system.get_collection("profiles")
applications_collection = safe_db_system.get_collection("applications")
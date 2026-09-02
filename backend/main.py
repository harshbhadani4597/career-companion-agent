import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from routes.profile import router as profile_router
from routes.resume import router as resume_router
from routes.jobs import router as jobs_router
from routes.applications import router as applications_router

app = FastAPI(
    title="AI Career Companion Agent",
    description="AI-powered career companion for internship matching and interview preparation",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from services.rag_pipeline import build_job_knowledge_base

app.include_router(profile_router)
app.include_router(resume_router)
app.include_router(jobs_router)
app.include_router(applications_router)


@app.on_event("startup")
def startup_event():
    try:
        build_job_knowledge_base()
    except Exception as e:
        print(f"Startup knowledge base initialization: {e}")


@app.get("/")
def root():
    return {
        "message": "AI Career Companion Agent API is running"
    }
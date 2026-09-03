import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from routes.profile import router as profile_router
from routes.resume import router as resume_router
from routes.jobs import router as jobs_router
from routes.applications import router as applications_router
from routes.auth import router as auth_router
from routes.assistant import router as assistant_router

app = FastAPI(
    title="AI Career Companion Agent",
    description="AI-powered career companion for internship matching and interview preparation",
    version="1.0.0"
)

# CORS configuration for production deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth_router)
app.include_router(assistant_router)
app.include_router(profile_router)
app.include_router(resume_router)
app.include_router(jobs_router)
app.include_router(applications_router)



# Static file serving for single-URL full-stack Render deployment
ROOT_DIR = BASE_DIR.parent
INDEX_FILE = ROOT_DIR / "index.html"
ASSETS_DIR = ROOT_DIR / "assets"

if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")


@app.on_event("startup")
def startup_event():
    try:
        from services.rag_pipeline import build_job_knowledge_base
        build_job_knowledge_base()
    except Exception as e:
        print(f"Startup knowledge base initialization: {e}")


@app.get("/")
def root():
    if INDEX_FILE.exists():
        return FileResponse(str(INDEX_FILE))
    return {
        "message": "AI Career Companion Agent API is running"
    }
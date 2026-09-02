from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.profile import router as profile_router
from routes.resume import router as resume_router

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

app.include_router(profile_router)
app.include_router(resume_router)


@app.get("/")
def root():
    return {
        "message": "AI Career Companion Agent API is running"
    }
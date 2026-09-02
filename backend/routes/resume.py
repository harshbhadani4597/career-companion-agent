from fastapi import APIRouter, UploadFile, File
from pathlib import Path
import shutil

from services.resume_parser import extract_text_from_pdf
from services.gemini_extractor import extract_resume_information
from services.job_matcher import match_jobs
from services.skill_gap import analyze_skill_gap
from services.database import profiles_collection

router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"]
)

UPLOAD_DIR = Path("../uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):

    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 1. Extract text from resume
    extracted_text = extract_text_from_pdf(str(file_path))

    # 2. Extract structured profile using Gemini
    structured_profile = extract_resume_information(extracted_text)

    # 3. Extract skills
    skills = structured_profile.get("skills", [])

    # 4. Match jobs
    job_matches = match_jobs(skills)

    # 5. Analyze skill gaps
    skill_gap_analysis = analyze_skill_gap(job_matches)

    # 6. Save everything to MongoDB
    profile_document = {
        "filename": file.filename,
        "profile": structured_profile,
        "job_matches": job_matches,
        "skill_gap_analysis": skill_gap_analysis
    }

    result = profiles_collection.insert_one(profile_document)

    return {
        "message": "Resume uploaded and analyzed successfully",
        "filename": file.filename,
        "profile": structured_profile,
        "job_matches": job_matches,
        "skill_gap_analysis": skill_gap_analysis,
        "mongodb_id": str(result.inserted_id)
    }
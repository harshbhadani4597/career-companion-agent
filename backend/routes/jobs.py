from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.rag_pipeline import search_jobs
from services.job_matcher import match_jobs
from services.skill_gap import analyze_skill_gap
from services.database import safe_db_system
from bson import ObjectId

router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs"]
)

class SearchQuery(BaseModel):
    query: str
    top_k: Optional[int] = 5


class MatchRequest(BaseModel):
    profile_id: Optional[str] = None
    skills: Optional[List[str]] = []
    education: Optional[List[dict]] = []
    projects: Optional[List[dict]] = []
    experience: Optional[List[dict]] = []
    top_k: Optional[int] = 10


@router.post("/search")
def search_internships(search_req: SearchQuery):
    try:
        results = search_jobs(search_req.query, top_k=search_req.top_k or 5)
        parsed_results = []
        if results and "metadatas" in results and len(results["metadatas"]) > 0:
            for meta in results["metadatas"][0]:
                parsed_results.append(meta)
        return {
            "query": search_req.query,
            "count": len(parsed_results),
            "jobs": parsed_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/match")
def match_candidate_jobs(req: MatchRequest):
    try:
        candidate_dict = {
            "skills": req.skills or [],
            "education": req.education or [],
            "projects": req.projects or [],
            "experience": req.experience or []
        }

        if req.profile_id:
            try:
                profiles_col = safe_db_system.get_collection("profiles")
                doc = profiles_col.find_one({"_id": ObjectId(req.profile_id)}) or profiles_col.find_one({"_id": req.profile_id})
                if doc and "profile" in doc:
                    candidate_dict = doc["profile"]
            except Exception:
                pass

        job_matches = match_jobs(candidate_dict, top_k=req.top_k or 10)
        return {
            "count": len(job_matches),
            "job_matches": job_matches
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/{profile_id}")
def get_recommendations_for_profile(profile_id: str, top_k: int = 10):
    try:
        profiles_col = safe_db_system.get_collection("profiles")
        try:
            doc = profiles_col.find_one({"_id": ObjectId(profile_id)})
        except Exception:
            doc = profiles_col.find_one({"_id": profile_id})

        if not doc:
            raise HTTPException(status_code=404, detail="Profile not found")

        candidate_profile = doc.get("profile", {})
        job_matches = match_jobs(candidate_profile, top_k=top_k)

        return {
            "profile_id": profile_id,
            "count": len(job_matches),
            "job_matches": job_matches
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/skills/gap/{profile_id}")
def get_skill_gap_for_profile(profile_id: str, top_k: int = 5):
    try:
        profiles_col = safe_db_system.get_collection("profiles")
        try:
            doc = profiles_col.find_one({"_id": ObjectId(profile_id)})
        except Exception:
            doc = profiles_col.find_one({"_id": profile_id})

        if not doc:
            raise HTTPException(status_code=404, detail="Profile not found")

        candidate_profile = doc.get("profile", {})
        job_matches = match_jobs(candidate_profile, top_k=top_k)
        skill_gap_analysis = analyze_skill_gap(job_matches)

        return {
            "profile_id": profile_id,
            "count": len(skill_gap_analysis),
            "skill_gap_analysis": skill_gap_analysis
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

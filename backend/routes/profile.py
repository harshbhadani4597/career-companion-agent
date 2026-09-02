from fastapi import APIRouter, HTTPException
from models.profile import CandidateProfile
from services.database import profiles_collection

router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"]
)


@router.post("/")
def create_profile(profile: CandidateProfile):

    profile_data = profile.model_dump()

    result = profiles_collection.insert_one({
        "profile": profile_data
    })

    return {
        "message": "Profile saved successfully",
        "profile_id": str(result.inserted_id),
        "profile": profile_data
    }


@router.get("/")
def get_profiles():

    profiles = list(profiles_collection.find())

    for profile in profiles:
        profile["_id"] = str(profile["_id"])

    return {
        "count": len(profiles),
        "profiles": profiles
    }
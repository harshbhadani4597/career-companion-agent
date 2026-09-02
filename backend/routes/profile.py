from fastapi import APIRouter, HTTPException
from models.profile import CandidateProfile
from services.database import safe_db_system
from bson import ObjectId

router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"]
)

def get_collection():
    return safe_db_system.get_collection("profiles")


@router.post("/")
def create_profile(profile: CandidateProfile):
    try:
        profile_data = profile.model_dump()
        collection = get_collection()
        result = collection.insert_one({
            "profile": profile_data
        })
        return {
            "message": "Profile saved successfully",
            "profile_id": str(result.inserted_id),
            "profile": profile_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving profile: {str(e)}")


@router.get("/")
def get_profiles():
    try:
        collection = get_collection()
        profiles = list(collection.find())

        for profile in profiles:
            profile["_id"] = str(profile["_id"])

        return {
            "count": len(profiles),
            "profiles": profiles
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving profiles: {str(e)}")


@router.get("/{profile_id}")
def get_profile(profile_id: str):
    collection = get_collection()
    doc = None
    try:
        obj_id = ObjectId(profile_id)
        doc = collection.find_one({"_id": obj_id})
    except Exception:
        doc = collection.find_one({"_id": profile_id})

    if not doc:
        raise HTTPException(status_code=404, detail="Profile not found")

    doc["_id"] = str(doc["_id"])
    return doc


@router.put("/{profile_id}")
def update_profile(profile_id: str, profile: CandidateProfile):
    collection = get_collection()
    profile_data = profile.model_dump()

    try:
        obj_id = ObjectId(profile_id)
        result = collection.update_one({"_id": obj_id}, {"$set": {"profile": profile_data}})
    except Exception:
        result = collection.update_one({"_id": profile_id}, {"$set": {"profile": profile_data}})

    return {
        "message": "Profile updated successfully",
        "profile_id": profile_id,
        "profile": profile_data
    }
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from services.database import safe_db_system
from bson import ObjectId

router = APIRouter(
    prefix="/api/applications",
    tags=["Applications"]
)

def get_col():
    return safe_db_system.get_collection("applications")


class ApplicationCreate(BaseModel):
    profile_id: str
    job_id: str
    title: str
    company: str
    location: Optional[str] = ""
    status: Optional[str] = "Saved"
    applied_at: Optional[str] = None
    notes: Optional[str] = ""


class ApplicationUpdateStatus(BaseModel):
    status: str
    notes: Optional[str] = None


@router.post("/")
def create_application(app_data: ApplicationCreate):
    try:
        col = get_col()
        doc = app_data.model_dump()
        doc["created_at"] = datetime.utcnow().isoformat()
        if not doc["applied_at"] and doc["status"] == "Applied":
            doc["applied_at"] = doc["created_at"]

        result = col.insert_one(doc)
        doc["_id"] = str(getattr(result, "inserted_id", "local_id"))

        return {
            "message": "Application saved successfully",
            "application": doc
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving application: {str(e)}")


@router.get("/{profile_id}")
def get_applications(profile_id: str):
    try:
        col = get_col()
        apps = list(col.find({"profile_id": profile_id}))
        for app in apps:
            app["_id"] = str(app["_id"])

        return {
            "profile_id": profile_id,
            "count": len(apps),
            "applications": apps
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving applications: {str(e)}")


@router.put("/{application_id}/status")
def update_application_status(application_id: str, update: ApplicationUpdateStatus):
    try:
        col = get_col()
        update_fields = {"status": update.status}
        if update.notes is not None:
            update_fields["notes"] = update.notes

        try:
            obj_id = ObjectId(application_id)
            result = col.update_one({"_id": obj_id}, {"$set": update_fields})
        except Exception:
            result = col.update_one({"_id": application_id}, {"$set": update_fields})

        return {
            "message": "Application status updated successfully",
            "application_id": application_id,
            "status": update.status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating application: {str(e)}")

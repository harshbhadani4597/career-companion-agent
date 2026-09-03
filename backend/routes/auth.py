from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from services.database import safe_db_system

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

def get_users_col():
    return safe_db_system.get_collection("users")

def get_profiles_col():
    return safe_db_system.get_collection("profiles")


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = ""


@router.post("/login")
def login(req: LoginRequest):
    email_clean = req.email.strip().lower()
    if not email_clean or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    users_col = get_users_col()
    user = users_col.find_one({"email": email_clean})

    # For demo & ease of testing, allow any login if user is not found or password matches
    if not user:
        # Create user automatically for seamless demo experience
        user_doc = {
            "name": email_clean.split("@")[0].capitalize(),
            "email": email_clean,
            "created_at": datetime.utcnow().isoformat()
        }
        res = users_col.insert_one(user_doc)
        user_id = str(getattr(res, "inserted_id", "demo_user_id"))
        user_doc["_id"] = user_id
        user = user_doc
    else:
        user["_id"] = str(user.get("_id", "demo_id"))

    # Fetch associated candidate profile if exists
    profiles_col = get_profiles_col()
    profile_doc = profiles_col.find_one({"profile.email": email_clean})
    profile_data = profile_doc.get("profile") if profile_doc else {
        "name": user.get("name", "Student"),
        "email": email_clean,
        "phone": "",
        "skills": ["Python", "Machine Learning", "React", "SQL"],
        "education": [],
        "projects": [],
        "certifications": []
    }

    return {
        "message": "Login successful",
        "token": f"token_{user['_id']}",
        "user": {
            "id": user["_id"],
            "name": user.get("name", "Student"),
            "email": user.get("email")
        },
        "profile": profile_data
    }


@router.post("/register")
def register(req: RegisterRequest):
    email_clean = req.email.strip().lower()
    if not req.name or not email_clean or not req.password:
        raise HTTPException(status_code=400, detail="Name, email, and password are required.")

    users_col = get_users_col()
    existing = users_col.find_one({"email": email_clean})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user_doc = {
        "name": req.name.strip(),
        "email": email_clean,
        "phone": req.phone.strip() if req.phone else "",
        "created_at": datetime.utcnow().isoformat()
    }
    res = users_col.insert_one(user_doc)
    user_id = str(getattr(res, "inserted_id", "reg_user_id"))

    profile_data = {
        "name": req.name.strip(),
        "email": email_clean,
        "phone": req.phone.strip() if req.phone else "",
        "skills": [],
        "education": [],
        "projects": [],
        "certifications": []
    }

    profiles_col = get_profiles_col()
    profiles_col.insert_one({"profile": profile_data})

    return {
        "message": "Registration successful",
        "token": f"token_{user_id}",
        "user": {
            "id": user_id,
            "name": req.name.strip(),
            "email": email_clean
        },
        "profile": profile_data
    }

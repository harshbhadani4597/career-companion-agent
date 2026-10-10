import os
import json
import uuid
import time
import hashlib
from typing import Optional, Dict, Any

USERS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "users.json")

def _hash_password(password: str, salt: str) -> str:
    """Hashes password with salt using SHA-256."""
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()

def _load_users() -> Dict[str, Dict[str, Any]]:
    """Loads all users from users.json. Returns dict keyed by normalized email."""
    if not os.path.exists(USERS_FILE):
        return _init_default_users()
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Support list or dict format
            if isinstance(data, list):
                return {u["email"].lower(): u for u in data if "email" in u}
            return data
    except Exception as e:
        print(f"[UserStore] Error loading users: {e}")
        return _init_default_users()

def _save_users(users: Dict[str, Dict[str, Any]]):
    """Saves users to data/users.json atomically."""
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    temp_file = f"{USERS_FILE}.tmp"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)
    os.replace(temp_file, USERS_FILE)

def _init_default_users() -> Dict[str, Dict[str, Any]]:
    """Seeds default demo users if the database is newly initialized."""
    salt = uuid.uuid4().hex[:16]
    demo_users = {
        "candidate@example.com": {
            "id": str(uuid.uuid4()),
            "name": "Candidate Demo",
            "email": "candidate@example.com",
            "password_hash": _hash_password("demo1234", salt),
            "salt": salt,
            "role": "candidate",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=CandidateDemo",
            "provider": "local",
            "emailVerified": True,
            "google_id": None,
            "created_at": time.time(),
            "updated_at": time.time()
        },
        "jeebitsat4597@gmail.com": {
            "id": str(uuid.uuid4()),
            "name": "Harsh Kumar Bhadani",
            "email": "jeebitsat4597@gmail.com",
            "password_hash": _hash_password("demo1234", salt),
            "salt": salt,
            "role": "candidate",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=HarshKumar",
            "provider": "google",
            "emailVerified": True,
            "google_id": "google_sub_jeebitsat4597",
            "created_at": time.time(),
            "updated_at": time.time()
        },
        "recruiter.talent@google.com": {
            "id": str(uuid.uuid4()),
            "name": "Google Tech Talent Partner",
            "email": "recruiter.talent@google.com",
            "password_hash": _hash_password("demo1234", salt),
            "salt": salt,
            "role": "recruiter",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleRecruiter",
            "provider": "local",
            "emailVerified": True,
            "google_id": None,
            "created_at": time.time(),
            "updated_at": time.time()
        }
    }
    _save_users(demo_users)
    return demo_users

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieves a user by email (case-insensitive)."""
    if not email:
        return None
    users = _load_users()
    return users.get(email.strip().lower())

def verify_user_credentials(email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Verifies user email and password.
    If user doesn't exist yet, creates them with the provided password for smooth onboarding.
    """
    if not email:
        return None
    email_key = email.strip().lower()
    users = _load_users()
    user = users.get(email_key)

    if user:
        salt = user.get("salt", "")
        expected_hash = user.get("password_hash")
        # Check password hash (or fallback if empty/demo)
        if expected_hash and _hash_password(password, salt) != expected_hash:
            return None
        return user
    else:
        # Auto-create new user on first email/password login
        name = email.split("@")[0].replace(".", " ").title()
        return create_user(
            name=name,
            email=email_key,
            password=password,
            role="candidate",
            provider="local",
            email_verified=True
        )

_ACTIVE_SESSIONS: Dict[str, str] = {}  # token -> email

def register_session(token: str, email: str):
    """Registers an active session token for quick user lookup."""
    if token and email:
        _ACTIVE_SESSIONS[token] = email.strip().lower()

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a user by unique ID."""
    if not user_id:
        return None
    users = _load_users()
    for u in users.values():
        if u.get("id") == user_id:
            return u
    return None

def get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    """Resolves user by active JWT/session token or header."""
    if not token:
        return None
    if isinstance(token, str) and token.startswith("Bearer "):
        token = token[7:].strip()
    token = str(token).strip()
    if not token:
        return None

    users = _load_users()

    # 1. Check registered memory sessions
    if token in _ACTIVE_SESSIONS:
        email = _ACTIVE_SESSIONS[token]
        if email in users:
            return users[email]

    # 2. Check by user UUID embedded in token
    for u in users.values():
        uid = u.get("id")
        if uid and str(uid) in token:
            return u

    # 3. Check if token itself matches user email
    if token.lower() in users:
        return users[token.lower()]

    return None

def sanitize_user(user: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Returns safe user object without password hashes or salts."""
    if not user:
        return None
    full_name = user.get("fullName") or user.get("name") or ""
    return {
        "id": user.get("id"),
        "name": full_name,
        "fullName": full_name,
        "email": user.get("email"),
        "role": user.get("role", "candidate"),
        "avatar": user.get("avatar") or f"https://api.dicebear.com/7.x/avataaars/svg?seed={full_name}",
        "provider": user.get("provider", "local"),
        "emailVerified": bool(user.get("emailVerified", True)),
        "mobile": user.get("mobile", ""),
        "countryCode": user.get("countryCode", "+91"),
        "university": user.get("university", ""),
        "degree": user.get("degree", ""),
        "graduationYear": user.get("graduationYear", 2026),
        "city": user.get("city", ""),
        "preferredLocation": user.get("preferredLocation", ""),
        "targetRoles": user.get("targetRoles", []),
        "softSkills": user.get("softSkills", []),
        "projects": user.get("projects", []),
        "skills": user.get("skills", []),
        "profileCompleted": bool(user.get("profileCompleted", False))
    }

def update_user_profile(
    email: str,
    full_name: str,
    mobile: str,
    university: str,
    degree: str,
    graduation_year: int,
    city: str,
    skills: list,
    country_code: str = "+91",
    preferred_location: str = "",
    target_roles: list = None,
    soft_skills: list = None,
    projects: list = None
) -> Optional[Dict[str, Any]]:
    """Updates user profile details and sets profileCompleted=True."""
    users = _load_users()
    email_key = email.strip().lower()
    user = users.get(email_key)
    if not user:
        return None

    # Deduplicate and trim skills
    clean_skills = []
    if isinstance(skills, list):
        for s in skills:
            item = str(s).strip()
            if item and item not in clean_skills:
                clean_skills.append(item)
    elif isinstance(skills, str):
        for s in skills.split(","):
            item = s.strip()
            if item and item not in clean_skills:
                clean_skills.append(item)

    user["name"] = full_name.strip()
    user["fullName"] = full_name.strip()
    user["mobile"] = mobile.strip()
    user["countryCode"] = (country_code or "+91").strip()
    user["university"] = university.strip()
    user["degree"] = degree.strip()
    try:
        user["graduationYear"] = int(graduation_year)
    except (ValueError, TypeError):
        user["graduationYear"] = 2026
    user["city"] = city.strip()
    user["skills"] = clean_skills
    if preferred_location is not None:
        user["preferredLocation"] = str(preferred_location).strip()
    if target_roles is not None:
        user["targetRoles"] = [str(r).strip() for r in target_roles if str(r).strip()]
    if soft_skills is not None:
        user["softSkills"] = [str(s).strip() for s in soft_skills if str(s).strip()]
    if projects is not None:
        user["projects"] = projects
    user["profileCompleted"] = True
    user["updated_at"] = time.time()

    users[email_key] = user
    _save_users(users)
    return user

def create_user(
    name: str,
    email: str,
    password: Optional[str] = None,
    role: str = "candidate",
    avatar: Optional[str] = None,
    provider: str = "local",
    google_id: Optional[str] = None,
    email_verified: bool = False,
    profile_completed: bool = False,
    country_code: str = "+91"
) -> Dict[str, Any]:
    """Creates a new user record and persists to data/users.json."""
    users = _load_users()
    email_key = email.strip().lower()
    
    salt = uuid.uuid4().hex[:16]
    pwd_hash = _hash_password(password, salt) if password else None
    display_name = name or email.split("@")[0].title()
    
    user = {
        "id": str(uuid.uuid4()),
        "name": display_name,
        "fullName": display_name,
        "email": email_key,
        "password_hash": pwd_hash,
        "passwordHash": pwd_hash,
        "salt": salt,
        "role": role or "candidate",
        "avatar": avatar or f"https://api.dicebear.com/7.x/avataaars/svg?seed={display_name}",
        "provider": provider,
        "emailVerified": email_verified,
        "google_id": google_id,
        "mobile": "",
        "countryCode": country_code or "+91",
        "university": "",
        "degree": "",
        "graduationYear": 2026,
        "city": "",
        "skills": [],
        "profileCompleted": profile_completed,
        "created_at": time.time(),
        "updated_at": time.time()
    }
    
    users[email_key] = user
    _save_users(users)
    return user

def link_or_create_google_user(
    email: str,
    name: str,
    avatar: Optional[str] = None,
    google_id: Optional[str] = None,
    role: str = "candidate"
) -> Dict[str, Any]:
    """
    Backend OAuth logic:
    - If user exists by email, link Google account (never create duplicate).
    - If user doesn't exist, create new user with provider='google' and emailVerified=True.
    """
    users = _load_users()
    email_key = email.strip().lower()
    existing_user = users.get(email_key)

    if existing_user:
        # Link Google account to existing user
        if google_id:
            existing_user["google_id"] = google_id
        if avatar and not existing_user.get("avatar"):
            existing_user["avatar"] = avatar
        if not existing_user.get("name") and name:
            existing_user["name"] = name
        existing_user["emailVerified"] = True
        
        # Update provider status
        if existing_user.get("provider") == "local":
            existing_user["provider"] = "local+google"
        elif not existing_user.get("provider"):
            existing_user["provider"] = "google"
            
        existing_user["updated_at"] = time.time()
        users[email_key] = existing_user
        _save_users(users)
        return existing_user
    else:
        # Create brand-new user with provider='google'
        return create_user(
            name=name,
            email=email_key,
            password=None,
            role=role,
            avatar=avatar,
            provider="google",
            google_id=google_id,
            email_verified=True
        )

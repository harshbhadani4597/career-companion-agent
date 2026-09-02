from pydantic import BaseModel
from typing import List, Optional


class Education(BaseModel):
    degree: str
    college: str
    branch: Optional[str] = None
    graduation_year: Optional[int] = None


class Experience(BaseModel):
    company: str
    role: str
    duration: Optional[str] = None
    description: Optional[str] = None


class Project(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: List[str] = []


class CandidateProfile(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None

    education: List[Education] = []
    skills: List[str] = []
    experience: List[Experience] = []
    projects: List[Project] = []
    certifications: List[str] = []
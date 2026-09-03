import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict

router = APIRouter(
    prefix="/api/assistant",
    tags=["AI Assistant"]
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    profile: Optional[Dict] = None
    history: Optional[List[ChatMessage]] = []


SYSTEM_PROMPT = """You are the AI Career Companion Assistant, an intelligent, helpful, and encouraging AI assistant built into the AI Career Companion platform.
Your goals:
1. Help candidates navigate the platform (Resume Upload, Profile Management, Internship Matching, Skill Gap Analysis, Application Tracker).
2. Explain how the platform's transparent 5-factor weighted job matching works:
   - Skill Overlap (50%)
   - Education Eligibility (15%)
   - Project & Work Relevance (15%)
   - Dense Vector Semantic Similarity (15%)
   - Work Mode & Location Preference (5%)
3. Provide actionable, concise career guidance, resume tips, and learning roadmaps for students seeking top technical internships.
Be polite, professional, concise, and direct in markdown format. Keep answers brief (2-4 sentences or short bullet points)."""


@router.post("/chat")
def assistant_chat(req: ChatRequest):
    user_msg = req.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Try Google Gemini API if key is available
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            prompt_content = f"{SYSTEM_PROMPT}\n\nCandidate Question: {user_msg}"
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt_content
            )
            if response and hasattr(response, "text") and response.text:
                return {"reply": response.text.strip()}
        except Exception as e:
            print(f"Gemini API assistant fallback: {e}")

    # Knowledge-based smart rule response engine fallback
    msg_lower = user_msg.lower()

    if "match" in msg_lower or "score" in msg_lower or "factor" in msg_lower:
        reply = (
            "🎯 **How Job Matching Works:**\n"
            "Our transparent 5-factor weighted engine calculates your compatibility score:\n"
            "- **50%** Skill Overlap (Matched vs Required skills)\n"
            "- **15%** Education Eligibility (Degree & Branch fit)\n"
            "- **15%** Project & Experience Relevance\n"
            "- **15%** Vector Semantic Similarity (`all-MiniLM-L6-v2` embeddings)\n"
            "- **5%** Work Mode & Location Preference"
        )
    elif "resume" in msg_lower or "upload" in msg_lower or "pdf" in msg_lower:
        reply = (
            "📄 **Resume Upload Help:**\n"
            "Go to the **Resume Upload** tab, drag and drop your PDF resume, and click **Upload & Extract Profile**.\n"
            "Our PyMuPDF and Gemini LLM parser will automatically extract your technical skills, projects, education, and certifications into your candidate profile!"
        )
    elif "skill" in msg_lower or "gap" in msg_lower or "learn" in msg_lower:
        reply = (
            "💡 **Skill Gap Analysis:**\n"
            "Click on **Skill Gap Analysis** in the top navigation bar!\n"
            "The AI agent identifies missing competencies for your target internship roles and provides step-by-step learning roadmaps with recommended mini-projects."
        )
    elif "application" in msg_lower or "track" in msg_lower or "saved" in msg_lower:
        reply = (
            "📌 **Application Tracker:**\n"
            "When viewing jobs under **Internship Matching**, click **+ Track / Save Application** on any role.\n"
            "All saved, applied, interviewing, and selected internships appear in your **Applications Tracker** pipeline."
        )
    elif "hello" in msg_lower or "hi" in msg_lower or "hey" in msg_lower:
        reply = "Hello! 👋 I am your AI Career Companion Assistant. How can I help you with internship matching, resume parsing, or skill gap roadmaps today?"
    else:
        reply = (
            f"I'm here to assist you with '{user_msg}'! You can upload your PDF resume to generate tailored 5-factor job matches, explore 160+ internship postings, or check your step-by-step Skill Gap learning roadmaps."
        )

    return {"reply": reply}

import os
import json
import re
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

MODELS_TO_TRY = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-3.6-flash"
]


def extract_resume_information(resume_text: str):

    prompt = f"""
You are an expert AI resume parser.

Extract the candidate's details from the resume text below and return ONLY valid JSON matching this exact structure:

{{
    "name": "Candidate Full Name",
    "email": "Email Address",
    "phone": "Phone Number",
    "skills": ["Skill 1", "Skill 2"],
    "education": [
        {{
            "degree": "Degree Name",
            "institution": "University/College",
            "start_date": "Year/Month",
            "end_date": "Year/Month",
            "gpa": "GPA/Score if present"
        }}
    ],
    "experience": [
        {{
            "company": "Company Name",
            "role": "Job Title",
            "start_date": "Start Date",
            "end_date": "End Date",
            "description": ["Responsibility or accomplishment bullet"]
        }}
    ],
    "projects": [
        {{
            "name": "Project Title",
            "description": "Project summary and key technologies used"
        }}
    ],
    "certifications": ["Certification Name"]
}}

Resume Text:
{resume_text}
"""

    response_text = ""
    last_exception = None

    for model_name in MODELS_TO_TRY:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            if response and response.text:
                response_text = response.text.strip()
                break
        except Exception as e:
            last_exception = e
            continue

    if not response_text and last_exception:
        raise RuntimeError(f"Gemini API call failed across models: {last_exception}")

    # Clean markdown formatting if present
    if "```" in response_text:
        response_text = re.sub(r"^```[a-zA-Z]*\n?", "", response_text, flags=re.MULTILINE)
        response_text = response_text.replace("```", "").strip()

    # Extract JSON object substring
    json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
    if json_match:
        response_text = json_match.group(0)

    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        return {
            "name": "",
            "email": "",
            "phone": "",
            "skills": [],
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": []
        }
import re
import json
from typing import Dict, List, Any

# Dictionary of technical skills to match against resume text
SKILL_DICTIONARY = [
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c", "c#", "go", "golang", "rust", "kotlin", "swift", "dart", "html", "css", "sql", "r", "php",
    # Frontend
    "react", "react.js", "next.js", "vue", "vue.js", "angular", "tailwind css", "tailwind", "bootstrap", "redux", "html5", "css3", "vite", "webpack", "framer motion",
    # Backend & Web Frameworks
    "node.js", "node", "express", "express.js", "flask", "django", "fastapi", "spring boot", "rails", "asp.net", "graphql", "rest apis", "rest api", "websockets", "gRPC",
    # Databases
    "mongodb", "postgresql", "postgres", "mysql", "sqlite", "redis", "dynamodb", "firebase", "cassandra", "prisma",
    # AI / ML / CV / NLP
    "machine learning", "deep learning", "ai", "artificial intelligence", "opencv", "mediapipe", "tensorflow", "pytorch", "scikit-learn", "numpy", "pandas", "matplotlib", "seaborn", "hugging face", "gemini ai", "openai api", "langchain", "watsonx.ai", "spacy", "nltk", "transformers", "bert",
    # DevOps, Cloud & Tools
    "docker", "kubernetes", "aws", "gcp", "azure", "ibm cloud", "git", "github", "gitlab", "ci/cd", "terraform", "linux", "bash", "jenkins", "github actions", "unit testing"
]

class ResumeParser:
    def __init__(self):
        pass

    def extract_skills_from_text(self, text: str) -> List[str]:
        text_lower = text.lower()
        found_skills = set()
        
        for skill in SKILL_DICTIONARY:
            # Word boundary matching to avoid partial word mismatches
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                # Standardize casing
                if skill == "python": found_skills.add("Python")
                elif skill in ["react", "react.js"]: found_skills.add("React")
                elif skill == "typescript": found_skills.add("TypeScript")
                elif skill in ["javascript", "js"]: found_skills.add("JavaScript")
                elif skill in ["node.js", "node"]: found_skills.add("Node.js")
                elif skill in ["express", "express.js"]: found_skills.add("Express")
                elif skill == "tailwind css" or skill == "tailwind": found_skills.add("Tailwind CSS")
                elif skill == "flask": found_skills.add("Flask")
                elif skill == "docker": found_skills.add("Docker")
                elif skill == "opencv": found_skills.add("OpenCV")
                elif skill == "mediapipe": found_skills.add("MediaPipe")
                elif skill == "gemini ai": found_skills.add("Gemini AI")
                elif skill in ["ibm cloud", "watsonx.ai"]: found_skills.add("IBM Cloud")
                elif skill == "machine learning": found_skills.add("Machine Learning")
                elif skill == "rest apis" or skill == "rest api": found_skills.add("REST APIs")
                elif skill == "websockets": found_skills.add("WebSockets")
                elif skill in ["git", "github"]: found_skills.add("Git & GitHub")
                else:
                    found_skills.add(skill.capitalize())
                    
        return sorted(list(found_skills))

    def parse_resume_text(self, text: str) -> Dict[str, Any]:
        """
        Parses raw text or JSON string into structured candidate profile.
        """
        text_str = text.strip()
        
        # Check if text is valid JSON profile format
        if text_str.startswith("{") and text_str.endswith("}"):
            try:
                parsed_json = json.loads(text_str)
                if "name" in parsed_json or "technical_skills" in parsed_json:
                    return parsed_json
            except Exception:
                pass

        # Extract name (first line or regex)
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        name = lines[0] if lines else "Candidate Profile"
        if len(name) > 40:
            name = "Candidate Profile"

        # Extract Email
        email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
        email = email_match.group(0) if email_match else "candidate@example.com"

        # Extract Phone
        phone_match = re.search(r'(\+?\d{1,3}[\s-]?)?\(?\d{3,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}', text)
        phone = phone_match.group(0) if phone_match else "+91 9876543210"

        # Extract Skills
        skills = self.extract_skills_from_text(text)

        # Extract Projects (heuristic)
        projects = []
        project_blocks = re.findall(r'(?:Project|Built|Developed|Designed)[:\s]+([^\n]+)', text, re.IGNORECASE)
        for p in project_blocks[:3]:
            projects.append({
                "title": p.strip(),
                "tech_stack": [s for s in skills if s.lower() in p.lower()][:4] or skills[:3],
                "description": p.strip()
            })

        return {
            "name": name,
            "email": email,
            "phone": phone,
            "location": "India",
            "education": [
                {
                  "degree": "B.Tech / Higher Education",
                  "institution": "University / College",
                  "year": "2026",
                  "score": "Pursuing"
                }
            ],
            "technical_skills": skills if skills else ["Python", "JavaScript", "Git & GitHub"],
            "soft_skills": ["Problem Solving", "Professional Communication", "Teamwork"],
            "projects": projects if projects else [
                {
                    "title": "Software Engineering Project",
                    "tech_stack": skills[:3],
                    "description": "Developed web/software applications using modern programming tools."
                }
            ],
            "certifications_internships": [],
            "preferred_domains": ["Full-Stack Web Development", "AI & Machine Learning"],
            "preferred_locations": ["Remote", "Bangalore", "Hyderabad"],
            "target_roles": ["Software Engineering Intern", "Full Stack Developer Intern", "AI/ML Intern"]
        }

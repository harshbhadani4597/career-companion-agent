"""
Dataset Generator for AI Career Companion Agent
Generates 160 realistic, domain-diverse internship job postings for Milestone 2.1
"""

import os
import csv
import json

DOMAINS = [
    {
        "domain": "Artificial Intelligence",
        "titles": ["AI Engineering Intern", "Applied AI Intern", "Generative AI Intern", "LLM Research Intern", "AI Solutions Intern"],
        "skills": ["Python", "PyTorch", "TensorFlow", "LangChain", "LLMs", "RAG", "Transformers", "Prompt Engineering", "Git"],
        "education": "B.Tech CSE/AI/ML or M.Tech AI",
        "companies": ["Brainwave AI", "NeuralTech Labs", "DeepVision Systems", "CognitiveCloud", "OmniAI Labs"]
    },
    {
        "domain": "Machine Learning",
        "titles": ["Machine Learning Intern", "MLOps Intern", "Computer Vision Intern", "NLP Engineering Intern", "Predictive Analytics Intern"],
        "skills": ["Python", "Machine Learning", "Scikit-learn", "Pandas", "NumPy", "OpenCV", "MLflow", "SQL"],
        "education": "B.Tech CSE/IT/Data Science",
        "companies": ["DataMind Analytics", "PredictiveScale", "Visionary Tech", "AlgoMetrics", "Turing Insights"]
    },
    {
        "domain": "Data Science & Analytics",
        "titles": ["Data Science Intern", "Data Analyst Intern", "Business Analytics Intern", "Statistical Modeling Intern", "BI Engineering Intern"],
        "skills": ["Python", "R", "SQL", "Pandas", "Power BI", "Tableau", "Statistics", "Excel", "Data Visualization"],
        "education": "B.Tech/B.Sc Statistics/Data Science/Math",
        "companies": ["InsightEdge", "StatPulse Solutions", "MetricFlow", "DataVista", "AnalyticsHQ"]
    },
    {
        "domain": "Web & Full Stack Development",
        "titles": ["Full Stack Developer Intern", "Frontend React Intern", "Backend Node.js Intern", "Python Django Intern", "MERN Stack Intern"],
        "skills": ["JavaScript", "TypeScript", "React", "Node.js", "Express", "Python", "FastAPI", "MongoDB", "HTML/CSS", "Tailwind CSS"],
        "education": "B.Tech CSE/IT/BCA/MCA",
        "companies": ["WebCraft Media", "StackNexus", "DevPulse Studio", "CodeHorizon", "AppSphere Solutions"]
    },
    {
        "domain": "Software Development (Java/C++)",
        "titles": ["Software Engineering Intern (Java)", "C++ Systems Development Intern", "Backend Java Developer Intern", "Core Software Engineering Intern"],
        "skills": ["Java", "Spring Boot", "C++", "Data Structures", "Algorithms", "Object-Oriented Programming", "MySQL", "Git"],
        "education": "B.Tech CSE/ECE/IT",
        "companies": ["SystemsCore Tech", "EnterpriseCode", "ApexSoft Systems", "VirtuaSoftware", "OmniSystems"]
    },
    {
        "domain": "Cloud & DevOps",
        "titles": ["Cloud Engineering Intern (AWS)", "DevOps Engineering Intern", "Google Cloud Intern", "Infrastructure & Automation Intern"],
        "skills": ["AWS", "Google Cloud", "Docker", "Kubernetes", "Linux", "CI/CD", "Terraform", "Python", "Bash"],
        "education": "B.Tech CSE/IT/ECE",
        "companies": ["CloudScale Innovations", "SkyInfra Tech", "DevOpsEngine", "KubernetesHub", "Nimbus Systems"]
    },
    {
        "domain": "Cybersecurity",
        "titles": ["Cybersecurity Analyst Intern", "Ethical Hacking Intern", "Information Security Intern", "SOC Analyst Intern"],
        "skills": ["Cybersecurity", "Network Security", "Linux", "Python", "Penetration Testing", "Wireshark", "Cryptography", "SIEM"],
        "education": "B.Tech CSE/IT/Cybersecurity",
        "companies": ["SecureGuard Cyber", "ShieldSec Labs", "CyberDefend", "Infosec Armor", "SentinelSec"]
    },
    {
        "domain": "UI/UX & Product",
        "titles": ["UI/UX Design Intern", "Product Design Intern", "Product Management Intern", "UX Research Intern"],
        "skills": ["Figma", "Adobe XD", "Wireframing", "Prototyping", "User Research", "UI Design", "Design Systems"],
        "education": "B.Des/B.Tech/Any Graduation with Portfolio",
        "companies": ["DesignMatrix", "PixelCraft Studio", "UserFirst Labs", "ProductScale", "CreativeUi"]
    }
]

LOCATIONS = [
    ("Bangalore", "Hybrid"),
    ("Remote", "Remote"),
    ("Hyderabad", "On-site"),
    ("Pune", "Hybrid"),
    ("Gurgaon", "Hybrid"),
    ("Noida", "On-site"),
    ("Mumbai", "Hybrid"),
    ("Chennai", "On-site")
]

STIPENDS = [
    "₹15,000 / month",
    "₹20,000 / month",
    "₹25,000 / month",
    "₹30,000 / month",
    "₹35,000 / month",
    "₹40,000 / month"
]

DURATIONS = ["3 Months", "6 Months"]


def generate_jobs():
    jobs = []
    job_counter = 1

    for domain_info in DOMAINS:
        domain = domain_info["domain"]
        titles = domain_info["titles"]
        skills = domain_info["skills"]
        education = domain_info["education"]
        companies = domain_info["companies"]

        # Generate ~20 postings per domain
        for i in range(20):
            title = titles[i % len(titles)]
            company = companies[i % len(companies)]
            location, work_mode = LOCATIONS[(job_counter + i) % len(LOCATIONS)]
            stipend = STIPENDS[(job_counter + i) % len(STIPENDS)]
            duration = DURATIONS[i % len(DURATIONS)]

            # Pick a subset of skills
            job_skills = list(dict.fromkeys([skills[0], skills[1], skills[(i + 2) % len(skills)], skills[(i + 3) % len(skills)], skills[(i + 4) % len(skills)]]))

            job_id = f"JOB{job_counter:03d}"

            desc = f"Work as a {title} at {company}. You will collaborate with cross-functional teams to design, develop, test, and deploy software solutions in {domain}."
            resp = f"Design and implement software components; write clean code; write unit tests; document features and collaborate with senior engineers."
            elig = f"{education} with proficiency in {', '.join(job_skills[:3])}."
            app_url = f"https://internships.example.com/apply/{job_id.lower()}"

            job = {
                "job_id": job_id,
                "title": title,
                "company": company,
                "location": location,
                "work_mode": work_mode,
                "duration": duration,
                "stipend": stipend,
                "skills": ", ".join(job_skills),
                "education": education,
                "description": desc,
                "responsibilities": resp,
                "eligibility": elig,
                "application_url": app_url
            }
            jobs.append(job)
            job_counter += 1

    return jobs


def save_dataset(jobs):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, "internship_jobs.csv")

    fieldnames = [
        "job_id", "title", "company", "location", "work_mode", "duration",
        "stipend", "skills", "education", "description", "responsibilities",
        "eligibility", "application_url"
    ]

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(jobs)

    print(f"Saved {len(jobs)} jobs to CSV: {csv_path}")

    # Also update backend/data/jobs.json
    backend_data_dir = os.path.join(os.path.dirname(base_dir), "backend", "data")
    os.makedirs(backend_data_dir, exist_ok=True)
    json_path = os.path.join(backend_data_dir, "jobs.json")

    json_jobs = []
    for j in jobs:
        json_jobs.append({
            "id": j["job_id"],
            "job_id": j["job_id"],
            "title": j["title"],
            "company": j["company"],
            "location": j["location"],
            "work_mode": j["work_mode"],
            "duration": j["duration"],
            "stipend": j["stipend"],
            "skills": [s.strip() for s in j["skills"].split(",")],
            "education": j["education"],
            "description": j["description"],
            "responsibilities": j["responsibilities"],
            "eligibility": j["eligibility"],
            "application_url": j["application_url"]
        })

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_jobs, f, indent=2)

    print(f"Saved {len(json_jobs)} jobs to JSON: {json_path}")


if __name__ == "__main__":
    jobs = generate_jobs()
    save_dataset(jobs)

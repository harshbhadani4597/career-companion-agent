import json
import os

def create_job_postings():
    domains = {
        "AI & Machine Learning": [
            ("AI/ML Research Intern", "DeepMind Labs", ["Python", "PyTorch", "TensorFlow", "NumPy", "OpenCV", "Scikit-Learn"], "Develop & evaluate deep learning models, computer vision algorithms, and neural networks."),
            ("Generative AI Engineer Intern", "Anthropic Technologies", ["Python", "LangChain", "Gemini AI", "OpenAI API", "Vector Databases", "FastAPI"], "Build LLM applications, RAG pipelines, prompt templates, and AI agents."),
            ("Computer Vision Intern", "VisionTech Robotics", ["Python", "OpenCV", "MediaPipe", "PyTorch", "C++", "CUDA"], "Implement real-time object tracking, person segmentation, and gesture recognition algorithms."),
            ("NLP & LLM Intern", "Cognitive Systems", ["Python", "Hugging Face", "Transformers", "BERT", "Spacy", "NLTK"], "Fine-tune open-weight language models and implement intent classification pipelines."),
            ("Machine Learning Operations (MLOps) Intern", "DataOps AI", ["Python", "Docker", "Kubeflow", "MLflow", "Git & GitHub", "CI/CD"], "Automate model deployment, tracking experiment runs, and monitoring feature drift.")
        ],
        "Full-Stack Web Development": [
            ("Full-Stack Developer Intern", "Vercel Innovation Labs", ["React", "TypeScript", "Node.js", "Express", "Tailwind CSS", "MongoDB"], "Build responsive web applications, RESTful APIs, and UI components."),
            ("MERN Stack Intern", "TechWave Solutions", ["React", "Node.js", "Express", "MongoDB", "Redux", "Tailwind CSS"], "Develop frontend React components and backend Node.js APIs for enterprise portals."),
            ("Next.js & TypeScript Intern", "CloudCraft Apps", ["Next.js", "TypeScript", "React", "PostgreSQL", "Tailwind CSS", "Prisma"], "Construct server-rendered React applications, micro-frontends, and database schemas."),
            ("Real-Time Web Application Intern", "SocketStream Systems", ["React", "TypeScript", "Node.js", "WebSockets", "Redis", "Docker"], "Engineered real-time collaboration platforms and event-driven WebSocket servers."),
            ("Python Full-Stack Intern", "DjangoCraft Studios", ["Python", "Django", "Flask", "React", "PostgreSQL", "REST APIs"], "Build robust Django/Flask backends paired with modern single-page frontend apps.")
        ],
        "Frontend Web Development": [
            ("Frontend React Intern", "UI Craft Labs", ["React", "JavaScript", "HTML/CSS", "Tailwind CSS", "Redux Toolkit", "Vite"], "Translate Figma UI wireframes into modular, high-performance React components."),
            ("UI/UX Frontend Developer Intern", "Pixel Perfect Studio", ["React", "TypeScript", "Tailwind CSS", "Figma", "Framer Motion"], "Design user workflows, design tokens, and smooth UI animations."),
            ("Vue.js Developer Intern", "Modern Web Systems", ["Vue.js", "JavaScript", "HTML/CSS", "Pinia", "Tailwind CSS"], "Maintain and build Vue 3 interactive web interfaces and state stores.")
        ],
        "Backend & API Engineering": [
            ("Backend Python Intern", "PyEnterprise Networks", ["Python", "Flask", "FastAPI", "PostgreSQL", "Redis", "REST APIs"], "Architect scalable REST APIs, database models, and background task queues."),
            ("Node.js Backend Intern", "API Cloud Services", ["Node.js", "Express", "TypeScript", "MongoDB", "GraphQL", "Docker"], "Develop API microservices, JWT authentication, and database query optimizations."),
            ("Go & Microservices Intern", "ScalableCore", ["Go", "Docker", "Kubernetes", "gRPC", "PostgreSQL"], "Build low-latency microservices, gRPC handlers, and high-concurrency systems.")
        ],
        "Data Science & Analytics": [
            ("Data Analyst Intern", "Insight Analytics Co.", ["Python", "Pandas", "NumPy", "SQL", "Tableau", "Matplotlib"], "Perform exploratory data analysis, data cleaning, dashboard generation, and ETL."),
            ("Data Engineer Intern", "DataPipeline Inc.", ["Python", "SQL", "Apache Spark", "Airflow", "PostgreSQL", "Docker"], "Construct robust data ingestion pipelines and maintain data warehouses.")
        ],
        "DevOps & Cloud Engineering": [
            ("Cloud Infrastructure Intern", "AWS ScaleWorks", ["Docker", "Kubernetes", "AWS", "Terraform", "Linux", "Git & GitHub"], "Deploy containerized microservices and write Infrastructure-as-Code scripts."),
            ("DevOps & CI/CD Intern", "DeployFlow Labs", ["Git & GitHub", "Docker", "Jenkins", "GitHub Actions", "Python", "Linux"], "Manage automated build pipelines, code quality gates, and deployment scripts.")
        ],
        "Mobile App Development": [
            ("Android App Developer Intern", "MobileEdge Apps", ["Kotlin", "Android SDK", "Java", "Jetpack Compose", "REST APIs"], "Build native Android mobile apps, custom UI views, and background services."),
            ("Flutter Mobile Intern", "CrossPlatform Tech", ["Flutter", "Dart", "Firebase", "REST APIs", "Git & GitHub"], "Develop cross-platform iOS & Android mobile applications.")
        ],
        "Cybersecurity & Security": [
            ("Cybersecurity Analyst Intern", "CyberShield Global", ["Python", "Linux", "Networking", "Wireshark", "OWASP", "Metasploit"], "Perform vulnerability assessments, pen-testing, and security audit reports.")
        ],
        "UI/UX Design & Product": [
            ("Product Management Intern", "Innovate Product Hub", ["Product Strategy", "Figma", "User Research", "Agile/Scrum", "Data Analytics"], "Draft Product Requirement Documents (PRDs), user personas, and feature roadmaps.")
        ],
        "Systems & Embedded Engineering": [
            ("Embedded Systems & IoT Intern", "SmartHardware Labs", ["C/C++", "Python", "Raspberry Pi", "Arduino", "Linux", "IoT"], "Develop firmware and Python controller interfaces for IoT edge devices.")
        ]
    }

    companies = [
        "TechCorp Labs", "InnoWave Solutions", "Nexus Technologies", "Vertex AI", "ByteCraft Systems",
        "Apex Digital", "Quantum Innovations", "CyberPulse", "CloudMatrix", "BlueSky Tech",
        "CodeSphere", "DataDrive", "OmniSoft", "Prime Logic", "AlphaTech", "Synergy Software",
        "Velocity Media", "CoreStack", "Echo Systems", "InfraCloud", "NextGen Digital",
        "Zenith Labs", "Starlight AI", "Pinnacle Tech", "Hyperion Systems"
    ]

    locations = ["Remote", "Bangalore, India", "Hyderabad, India", "Pune, India", "Gurgaon, India", "Noida, India", "Mumbai, India", "Chennai, India"]
    work_modes = ["Remote", "Hybrid", "On-site"]
    stipends = ["₹20,000 - ₹35,000 / month", "₹25,000 - ₹45,000 / month", "₹30,000 - ₹50,000 / month", "₹35,000 - ₹60,000 / month", "₹15,000 - ₹30,000 / month"]
    durations = ["3 Months", "6 Months"]

    soft_skills_pool = [
        "Problem Solving", "Professional Communication", "Teamwork", "Agile Methodology",
        "Adaptability", "Time Management", "Critical Thinking", "Analytical Mindset"
    ]

    postings = []
    job_id = 101

    # Generate 165 diverse postings
    for target_count in range(165):
        domain_name = list(domains.keys())[target_count % len(domains)]
        template = domains[domain_name][target_count % len(domains[domain_name])]
        
        role_title, company_preset, base_skills, resp_desc = template
        company = companies[(target_count * 7) % len(companies)] if target_count % 2 == 0 else company_preset
        location = locations[target_count % len(locations)]
        work_mode = work_modes[target_count % len(work_modes)]
        stipend = stipends[target_count % len(stipends)]
        duration = durations[target_count % len(durations)]

        # Add domain-specific variations
        skills = list(set(base_skills + ["Git & GitHub", "REST APIs"]))
        if "AI" in domain_name or "Machine Learning" in domain_name:
            if "Python" not in skills: skills.append("Python")
        elif "Web" in domain_name:
            if "JavaScript" not in skills and "TypeScript" not in skills: skills.append("JavaScript")

        posting = {
            "id": f"JOB-{job_id}",
            "title": f"{role_title} ({'Remote' if work_mode == 'Remote' else location.split(',')[0]})",
            "company": company,
            "domain": domain_name,
            "location": location,
            "work_mode": work_mode,
            "stipend": stipend,
            "duration": duration,
            "technical_skills": skills,
            "soft_skills": soft_skills_pool[:4],
            "min_qualification": "Pursuing B.Tech / B.E. / M.Tech in CS / IT / AI / Data Science (2024-2026 Batch)",
            "responsibilities": [
                resp_desc,
                "Collaborate with senior developers and mentors in agile sprint cycles.",
                "Participate in code reviews, testing, and writing documentation.",
                "Implement scalable software features and fix bugs."
            ],
            "interview_rounds": [
                "Round 1: Resume Screening & Skill Assessment",
                "Round 2: Technical Coding & System Design Interview",
                "Round 3: Techno-HR & Managerial Discussion"
            ],
            "description": f"{company} is looking for a passionate {role_title} to join our engineering team. You will work on real-world projects involving {', '.join(skills[:3])}."
        }
        postings.append(posting)
        job_id += 1

    os.makedirs("data", exist_ok=True)
    with open("data/job_postings.json", "w", encoding="utf-8") as f:
        json.dump(postings, f, indent=2)
    
    print(f"Successfully generated {len(postings)} job postings in data/job_postings.json")

if __name__ == "__main__":
    create_job_postings()

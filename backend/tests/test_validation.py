"""
Validation & Evaluation Suite for Milestone 2.4
Evaluates Retrieval Quality & Job Matching Accuracy on Synthetic Student Profiles.
"""

import sys
import os
import json
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from services.job_matcher import match_jobs

STUDENT_A = {
    "name": "Student A (ML/DS)",
    "skills": ["Python", "Machine Learning", "Pandas", "NumPy", "Scikit-learn", "SQL"],
    "education": [{"degree": "B.Tech", "branch": "Computer Science & Engineering", "college": "IIT"}],
    "projects": [{"name": "Fraud Detection System", "description": "Machine learning model predicting transaction fraud using Scikit-learn."}],
    "expected_domains": ["Artificial Intelligence", "Machine Learning", "Data Science & Analytics"]
}

STUDENT_B = {
    "name": "Student B (Web Dev)",
    "skills": ["React", "JavaScript", "HTML", "CSS", "Node.js", "Express", "MongoDB"],
    "education": [{"degree": "B.Tech", "branch": "Information Technology", "college": "NIT"}],
    "projects": [{"name": "E-Commerce Web Portal", "description": "Full stack MERN web application with React and Node.js."}],
    "expected_domains": ["Web & Full Stack Development"]
}

STUDENT_C = {
    "name": "Student C (Cloud/DevOps)",
    "skills": ["AWS", "Linux", "Docker", "Kubernetes", "CI/CD", "Python", "Bash"],
    "education": [{"degree": "B.Tech", "branch": "Computer Science", "college": "BITS"}],
    "projects": [{"name": "Cloud Infrastructure Automation", "description": "Automated deployment pipeline using Docker, AWS, and CI/CD."}],
    "expected_domains": ["Cloud & DevOps"]
}


def evaluate_student(student, top_k=5):
    print(f"\n==========================================")
    print(f"Evaluating Candidate: {student['name']}")
    print(f"Skills: {', '.join(student['skills'])}")
    print(f"Expected Domains: {', '.join(student['expected_domains'])}")
    print(f"==========================================")

    matches = match_jobs(student, top_k=top_k)

    relevant_count = 0

    for i, m in enumerate(matches, 1):
        title = m["title"]
        company = m["company"]
        score = m["match_percentage"]
        matched_sk = ", ".join(m["matched_skills"])

        # Check domain relevance
        title_lower = title.lower()
        is_relevant = any(dom.lower() in title_lower or any(sk.lower() in title_lower for sk in student['skills'][:3]) for dom in student['expected_domains'])

        if is_relevant:
            relevant_count += 1
            rel_str = "✓ Relevant"
        else:
            rel_str = "⚠ Low Relevance"

        print(f"{i}. [{score}%] {title} at {company} | Matched: ({matched_sk}) | {rel_str}")

    precision_at_k = round(relevant_count / len(matches), 2) if matches else 0.0
    print(f"\nPrecision@{top_k}: {precision_at_k * 100}% ({relevant_count}/{top_k} relevant)")
    return {
        "candidate": student["name"],
        "precision_at_5": precision_at_k,
        "matches": matches
    }


def run_evaluation():
    print("Running Milestone 2.4 Validation & Retrieval Accuracy Benchmarks...")

    res_a = evaluate_student(STUDENT_A)
    res_b = evaluate_student(STUDENT_B)
    res_c = evaluate_student(STUDENT_C)

    avg_precision = round((res_a["precision_at_5"] + res_b["precision_at_5"] + res_c["precision_at_5"]) / 3.0, 2)
    print(f"\n==========================================")
    print(f"OVERALL EVALUATION SUMMARY")
    print(f"Average Precision@5: {avg_precision * 100}%")
    print(f"==========================================\n")


if __name__ == "__main__":
    run_evaluation()

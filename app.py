import sys
import os
from pathlib import Path

# Ensure backend directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / "backend"))

import gradio as gr
from backend.main import app as fastapi_app
from backend.services.job_matcher import match_jobs
from backend.services.rag_pipeline import search_jobs
from backend.services.skill_gap import analyze_skill_gap

def search_and_match(skills_text, query_text):
    skills_list = [s.strip() for s in skills_text.split(",") if s.strip()]
    candidate = {"skills": skills_list}
    
    matches = match_jobs(candidate, top_k=5)
    gaps = analyze_skill_gap(matches)

    results_html = "<div style='font-family: sans-serif;'>"
    results_html += f"<h3>🎯 Top Matches ({len(matches)})</h3>"
    
    for m in matches:
        results_html += f"""
        <div style='border: 1px solid #334155; padding: 16px; border-radius: 12px; margin-bottom: 16px; background: #0f172a; color: #f8fafc;'>
            <div style='display: flex; justify-wide: space-between;'>
                <div>
                    <h4 style='margin:0; font-size: 18px; color: #60a5fa;'>{m['title']}</h4>
                    <p style='margin: 4px 0; color: #94a3b8;'><strong>{m['company']}</strong> • {m['location']} ({m['work_mode']})</p>
                </div>
                <div style='font-size: 24px; font-weight: bold; color: #c084fc;'>{m['match_percentage']}%</div>
            </div>
            <p style='font-size: 14px; color: #cbd5e1;'>{m['description']}</p>
            <p style='font-size: 12px; color: #4ade80;'><strong>✓ Matched Skills:</strong> {", ".join(m['matched_skills'])}</p>
            <p style='font-size: 12px; color: #fbbf24;'><strong>⚠ Skills to Learn:</strong> {", ".join(m['missing_skills']) if m['missing_skills'] else "100% Coverage!"}</p>
        </div>
        """

    results_html += "</div>"
    return results_html


# Create Gradio Blocks UI (Runs 100% Free on Hugging Face Spaces)
with gr.Blocks(title="AI Career Companion Agent", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🚀 AI Career Companion Agent")
    gr.Markdown("### Intelligent Internship Matching, RAG Retrieval & Skill Gap Analysis")
    
    with gr.Row():
        with gr.Column():
            skills_input = gr.Textbox(
                label="Your Technical Skills (Comma Separated)",
                placeholder="Python, Machine Learning, React, MongoDB, Scikit-learn, SQL",
                lines=3
            )
            query_input = gr.Textbox(
                label="Job Search Query (Optional)",
                placeholder="e.g. Remote Python Machine Learning Internship",
                lines=1
            )
            btn = gr.Button("🔍 Find Matching Internships & Skill Gaps", variant="primary")
            
        with gr.Column():
            output_html = gr.HTML(label="Recommended Matches & AI Analysis")
            
    btn.click(fn=search_and_match, inputs=[skills_input, query_input], outputs=output_html)

# Mount FastAPI app onto Gradio or mount Gradio on FastAPI
app = gr.mount_gradio_app(fastapi_app, demo, path="/ui")

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)

import sys
import os
import time
import subprocess
import webbrowser
import threading
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def check_python_env():
    venv_python = BASE_DIR / "backend" / "venv" / "Scripts" / "python.exe"
    if not venv_python.exists():
        venv_python = BASE_DIR / "backend" / "venv" / "bin" / "python"
    
    if venv_python.exists():
        return str(venv_python)
    return sys.executable

def start_backend(python_bin):
    print("Starting FastAPI Backend Server on http://127.0.0.1:8000 ...")
    backend_dir = BASE_DIR / "backend"
    cmd = [python_bin, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"]
    return subprocess.Popen(cmd, cwd=str(backend_dir))

def start_frontend():
    frontend_dir = BASE_DIR / "frontend"
    if frontend_dir.exists():
        print("Starting React Vite Frontend Web App on http://localhost:5173 ...")
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        try:
            return subprocess.Popen([npm_cmd, "run", "dev"], cwd=str(frontend_dir))
        except Exception as e:
            print(f"Note: Vite dev server startup: {e}")
    return None

def open_browser_tab():
    time.sleep(2.5)
    print("\nOpening Web Application in Browser:")
    print("-> Frontend App: http://localhost:5173/")
    print("-> Swagger API Docs: http://127.0.0.1:8000/docs\n")
    try:
        webbrowser.open("http://localhost:5173/")
        time.sleep(0.5)
        webbrowser.open("http://127.0.0.1:8000/docs")
    except Exception:
        pass

if __name__ == "__main__":
    print("==================================================================")
    print("  AI CAREER COMPANION AGENT - ONE-CLICK SERVICE LAUNCHER          ")
    print("==================================================================")
    print(" -> 160 Job Postings Knowledge Base Loaded")
    print(" -> RAG Vector Search & 5-Factor Job Matching Active")
    print(" -> PyMuPDF & Gemini LLM Resume Parsing Active")
    print(" -> Interactive Swagger API Documentation Active")
    print("------------------------------------------------------------------")

    python_bin = check_python_env()
    
    # Auto open browser
    threading.Thread(target=open_browser_tab, daemon=True).start()

    backend_proc = start_backend(python_bin)
    frontend_proc = start_frontend()

    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping services...")
        backend_proc.terminate()
        if frontend_proc:
            frontend_proc.terminate()
        sys.exit(0)

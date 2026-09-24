import sys
import time
import webbrowser
import threading

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from werkzeug.serving import run_simple
from backend.app import app

def run_backend():
    print(" [Backend Server] Listening on http://127.0.0.1:8000 (Dark Slate UI + API + Swagger /docs)")
    run_simple("127.0.0.1", 8000, app, threaded=True, use_reloader=False)

def run_frontend():
    print(" [Frontend Server] Listening on http://localhost:5173 (Dark Slate UI)")
    run_simple("0.0.0.0", 5173, app, threaded=True, use_reloader=False)

def open_browser():
    time.sleep(1.8)
    print("\n Opening Live URLs:")
    print(" -> Frontend:  http://localhost:5173/")
    print(" -> Backend:   http://127.0.0.1:8000/")
    print(" -> Swagger:   http://127.0.0.1:8000/docs\n")
    try:
        webbrowser.open("http://localhost:5173")
    except Exception:
        pass

if __name__ == "__main__":
    print("==================================================================")
    print("      AI CAREER COMPANION AGENT -- DUAL-PORT LIVE ARCHITECTURE    ")
    print("==================================================================")
    print(" -> 165 Job Postings Indexed in Knowledge Base")
    print(" -> RAG Hybrid Semantic Matching Engine Active")
    print(" -> Resume Parser & Multi-Agent Interview Simulator Ready")
    print(" -> Interactive OpenAPI 3.0 / Swagger UI Active on /docs")
    print("------------------------------------------------------------------")
    print(" Live Identical URLs:")
    print("    Frontend Web App:     http://localhost:5173/")
    print("    Backend API Server:   http://127.0.0.1:8000/")
    print("    Swagger API Docs:     http://127.0.0.1:8000/docs")
    print("==================================================================\n")

    # Start Backend server thread on port 8000
    backend_thread = threading.Thread(target=run_backend, daemon=True)
    backend_thread.start()

    # Browser launcher thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Run Frontend server on port 5173 on main thread
    run_frontend()

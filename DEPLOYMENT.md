# 🚀 Deployment Guide - AI Career Companion Agent

This guide covers how to deploy the **AI Career Companion Agent** web application to production. Since the backend Flask server serves both the REST API and the frontend UI, the entire application deploys as a single web service.

---

## ⚡ Option 1: Deploy on Render (Recommended & Free Tier Available)

Render automatically detects the repository configuration and deploys it in minutes.

### Steps:
1. Push your latest code to your GitHub repository:
   ```bash
   git add -A
   git commit -m "Configure deployment files"
   git push origin main
   ```
2. Go to [Render.com](https://render.com/) and sign in with GitHub.
3. Click **"New +"** -> **"Web Service"**.
4. Select your repository: `harshbhadani4597/career-companion-agent`.
5. Configure the service settings:
   - **Name**: `career-companion-agent`
   - **Region**: Choose the closest region (e.g., Singapore, Oregon, Frankfurt)
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT backend.app:app`
   - **Instance Type**: `Free`
6. (Optional) In **Environment Variables**, add:
   - `AUTH_SECRET`: Any random secure secret key string (e.g. `your-random-jwt-secret-key-2026`)
   - `PYTHON_VERSION`: `3.11.9`
7. Click **"Deploy Web Service"**.
8. Once finished, Render will provide a live HTTPS URL (e.g. `https://career-companion-agent.onrender.com`).

---

## 🚂 Option 2: Deploy on Railway

Railway offers one-click zero-configuration deployment:

1. Go to [Railway.app](https://railway.app/) and sign in with GitHub.
2. Click **"New Project"** -> **"Deploy from GitHub repo"**.
3. Select `harshbhadani4597/career-companion-agent`.
4. Railway will automatically detect the `Procfile` and `requirements.txt`.
5. Go to **Settings** -> **Networking** -> **Generate Domain** to get your public live URL.

---

## 🐳 Option 3: Deploy with Docker (AWS EC2, DigitalOcean, VPS, Google Cloud Run)

### Using Docker Compose (Local or VPS):
```bash
docker compose up -d --build
```
Access the application at `http://localhost:8000`.

### Manual Docker Build & Run:
```bash
docker build -t career-companion-agent .
docker run -d -p 8000:8000 --name career-companion career-companion-agent
```

### Google Cloud Run:
```bash
gcloud run deploy career-companion-agent \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## ⚙️ Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `PORT` | Web server listening port (automatically set by Render/Railway) | `8000` |
| `AUTH_SECRET` | Secret key for JWT session hashing | Built-in default |
| `GOOGLE_CLIENT_ID` | (Optional) Google OAuth Client ID | `""` |
| `GOOGLE_CLIENT_SECRET` | (Optional) Google OAuth Client Secret | `""` |

---

## ✅ Verifying Your Deployment
After deployment, verify that these URLs are responsive:
- **Web App**: `https://<your-app-url>/`
- **Health Check**: `https://<your-app-url>/api/status`
- **Swagger API Docs**: `https://<your-app-url>/docs`

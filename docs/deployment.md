# 🚀 Step-by-Step Deployment Guide

This guide provides instructions to deploy your **AI Career Companion Agent** live to production:
- **Backend:** Deployed to [Render](https://render.com)
- **Frontend:** Deployed to [Vercel](https://vercel.com)

---

## Step 1: Push Code to GitHub

Open your terminal in `C:\Users\kumar\career-companion-agent` and run:

```bash
# Add all changes to git
git add .

# Commit changes
git commit -m "Prepare deployment manifests for Render and Vercel"

# Push to your GitHub repository
git push origin main
```

---

## Step 2: Deploy Backend to Render

1. Log in to **[Render.com](https://render.com)**.
2. Click **New +** -> **Web Service**.
3. Select **Build and deploy from a Git repository** and connect `harshbhadani4597/career-companion-agent`.
4. Configure the Web Service details:
   - **Name:** `career-companion-backend`
   - **Region:** Singapore / Oregon (or closest region)
   - **Branch:** `main`
   - **Root Directory:** *(Leave blank)*
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, click **Add Environment Variable**:
   - Key: `GEMINI_API_KEY` | Value: `(Your Gemini API key)`
   - Key: `MONGODB_URI` | Value: `(Your MongoDB Atlas connection string)`
6. Click **Create Web Service**. Render will build and deploy your backend.
7. Once deployment finishes, copy your live Render backend URL (e.g., `https://career-companion-backend.onrender.com`).

---

## Step 3: Deploy Frontend to Vercel

1. Log in to **[Vercel.com](https://vercel.com)**.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository `harshbhadani4597/career-companion-agent`.
4. Configure Project Settings:
   - **Framework Preset:** Vite
   - **Root Directory:** Click Edit and select `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand **Environment Variables**:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://career-companion-backend.onrender.com/api` *(replace with your actual Render URL)*
6. Click **Deploy**.
7. Vercel will build your React application and give you a live production URL (e.g., `https://career-companion-agent.vercel.app`).

---

## Verification & Testing

1. Open your live Vercel URL in your browser.
2. Test uploading a PDF resume to verify frontend-to-backend communication.
3. Test RAG Internship Search and Skill Gap recommendations.

# BrandTrace Deployment & Hosting Guide

BrandTrace is designed to run completely free without requiring paid subscriptions or credit card entry. It functions in standalone deterministic mode out of the box (zero external API keys needed) and seamlessly connects to Google Gemini (or OpenAI-compatible providers) when an API key is configured.

---

## 1. Storage Architecture & Free-Tier SQLite Limitations

BrandTrace stores approved sources, dynamic brand rules, review history, and audit records in an embedded **SQLite database** (via native `node:sqlite`).

### Critical Understanding of Free Ephemeral Storage:
- **Free Container Hosting (Render, Railway, Fly.io, Hugging Face)**: Free instances run on **ephemeral virtual filesystems**. When the service sleeps due to inactivity, restarts, or deploys a new build, any SQLite `.db` file stored on local container disk (e.g., `/tmp/brandtrace.db`) is **reset to default seed data**.
- **In-App Transparency**: When `STORAGE_MODE=ephemeral`, BrandTrace displays a clear indicator informing visitors that custom reviews and rules are temporary.
- **For Persistent Production Storage**:
  - Attach a persistent volume/disk on your cloud host (e.g. Render Persistent Disk, Railway Volume) and point `BRANDTRACE_DB` to the mounted volume path (e.g. `/var/data/brandtrace.db`).

---

## 2. Zero-Cost Full-Stack Deployment on Render

Render provides free Node.js web services with automatic TLS and Git deployment.

### Step-by-Step Instructions:
1. **Push your repository** to GitHub or GitLab.
2. Log into [Render.com](https://render.com) and click **New +** > **Web Service**.
3. Select your repository.
4. Configure the service settings:
   - **Name**: `brandtrace`
   - **Region**: Choose closest to your audience (e.g. Ohio, Frankfurt, Singapore)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. **Environment Variables**:
   | Variable | Recommended Free Value | Note |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables optimized Vite bundle serving |
   | `PORT` | `3000` (or leave default) | Automatically set by Render |
   | `STORAGE_MODE` | `ephemeral` | Warns user of temporary storage on free host |
   | `BRANDTRACE_DB` | `/tmp/brandtrace.db` | Writable directory on container |
   | `LLM_PROVIDER` | `none` (or `openai_compatible`) | Set to `none` for deterministic-only mode |
   | `LLM_MODEL` | `gemini-3.8-flash` | Free-tier model identifier |
   | `LLM_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai/` | Google Gemini OpenAI-compatible base URL |
   | `GEMINI_API_KEY` | *(Your Secret Key)* | Keep private in Render secrets; never commit to Git |
6. Click **Create Web Service**. Once built, Render provisions your live URL: `https://brandtrace-<id>.onrender.com`.

---

## 3. Deployment on Railway or Koyeb (Alternative Free Runtimes)

1. Connect your repository on [Railway.app](https://railway.app).
2. Set Build Command: `npm run build`.
3. Set Start Command: `npm start`.
4. Configure the same environment variables as above.

---

## 4. Privacy, Security & Multi-Tenancy Notice

- **Demo Isolation**: Client-controlled workspace IDs (`x-workspace-id`) provide demonstration separation so multiple users can test custom brand rules simultaneously without collision. It is not cryptographic multi-tenant access control.
- **Data Protection**: Sensitive API keys and full drafts are never logged to public standard output or sent in error responses.
- **Delete My Data**: Users can erase their workspace rules, sources, and review history at any time using the "Delete My Data" feature.

# DCIP — Digital Creative Infrastructure Platform

> An AI-powered online learning platform for Rwandan secondary school students (ages 14–18) to develop creative skills in Visual Arts, Graphic Design, Guitar, Piano, and Voice.

**Live Application:** [https://dcip-rw.online](https://dcip-rw.online)

**Demo Video:** [Watch on YouTube] 

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local Installation](#local-installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Testing Strategies](#testing-strategies)

---

## Overview

DCIP addresses the lack of structured creative arts education in Rwandan secondary schools by delivering a browser-based platform that works on low-end devices and unreliable internet connections. Students progress through three levels in their chosen discipline, completing Learn, Practise, and Demonstrate stages to earn badges. An AI assistant provides real-time hints, image analysis, and artwork critique throughout.

---

## Core Features

### Learning System
- **5 disciplines:** Visual Arts, Graphic Design, Guitar, Piano, Voice
- **3 levels per discipline**, each with three stages:
  - **Learn** — theory content with an interactive canvas or instrument
  - **Practise** — guided exercises with real-time feedback
  - **Demonstrate** — submit final work to earn a badge
- **Badge system** — Beginner, Intermediate, and Advanced badges awarded on level completion

### AI Integration
- **Ask AI Assistant** — persistent chat panel on every course page; students can type questions, highlight confusing text to ask about it directly, or upload an image for analysis
- **AI Artwork Critique** — on Demonstrate submission, AI grades VA and GD work using computer vision and blends an AI quality score (40%) with an engagement score (60%) into a final grade
- **Two-step critique** — if the AI cannot assess intent from the image alone, it asks the student to explain their work before completing the assessment
- **Model chain:** Gemini 3.1 Flash Lite (primary, 500 RPD, vision-capable) → OpenRouter fallback chain (google/gemma-4-31b-it, nvidia/nemotron, meta-llama, qwen)

### Creative Studios
- **Visual Arts Studio** — freehand drawing canvas with brush, pencil, eraser, shapes, colour picker, layer support
- **Graphic Design Studio** — poster design canvas with text tool, typography hierarchy tools
- **Guitar Studio** — interactive fretboard with note playback and recording
- **Piano Studio** — keyboard with chord validation and recording
- **Voice Studio** — microphone recording with playback
- **My Studio Works** — personal library with folder organisation; files stored on Cloudinary, URLs saved in MongoDB

### Engagement Scoring
- Tracks time on canvas, tool clicks, and interactions (Perusall-inspired model)
- Engagement score (0–100) blended with AI quality score to produce the final grade
- Score formula: `finalScore = engagement × 0.6 + aiScore × 0.4`

### Offline Support (PWA)
- Service Worker with Cache-First strategy for the app shell and assets
- Network-First strategy for API GET requests with automatic cache fallback
- IndexedDB queue (`pendingRequests` store) for failed POST/PATCH — replayed automatically on reconnect
- Offline banner shown to students when connection is lost; sync toast on reconnect

### User Management
- Student, Supervisor, and Admin roles with separate dashboards
- School-based registration with email verification
- Password reset via email (Nodemailer + Gmail App Password)
- JWT authentication with HTTP-only tokens

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| PWA | vite-plugin-pwa, Service Worker, IndexedDB (idb) |
| Backend | Node.js 20, Express, TypeScript |
| Database | MongoDB Atlas (Mongoose ODM) |
| File Storage | Cloudinary (images and audio) |
| AI — Primary | Google Gemini 3.1 Flash Lite (direct API) |
| AI — Fallback | OpenRouter (Gemma 4 31B, NVIDIA Nemotron, Meta Llama, Qwen) |
| Deployment | DigitalOcean VPS, PM2, Nginx, Certbot (HTTPS) |
| Email | Nodemailer with Gmail App Password |

---

## Architecture

```
Browser (React PWA)
      │
      │  HTTPS
      ▼
Nginx (dcip-rw.online)
  ├── /* → /var/www/dcip/ (static React build)
  └── /api/* → localhost:5000 (proxied to Express)
                    │
                    ├── MongoDB Atlas (user data, progress, studio works)
                    ├── Cloudinary (images, audio files)
                    ├── Google Gemini API (AI hints + artwork critique)
                    └── OpenRouter API (AI fallback chain)
```

Both frontend and backend run on a single DigitalOcean Droplet (Ubuntu 22.04, 1 GB RAM). The backend is managed by PM2 and survives reboots. Nginx handles all incoming requests and proxies `/api/*` to Express on port 5000.

---

## Prerequisites

Make sure the following are installed on your machine before running locally:

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **npm 9+** — included with Node.js
- **Git** — [git-scm.com](https://git-scm.com)
- A **MongoDB Atlas** account with a free cluster — [mongodb.com/atlas](https://www.mongodb.com/atlas)
- A **Cloudinary** account (free tier) — [cloudinary.com](https://cloudinary.com)
- A **Google AI Studio** account for the Gemini API key — [aistudio.google.com](https://aistudio.google.com)
- An **OpenRouter** account for the fallback AI key — [openrouter.ai](https://openrouter.ai)

---

## Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/Uchantal/Capstone.git
cd Capstone/dcip-project
```

### 2. Install backend dependencies

```bash
cd Backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../Frontend
npm install
```

---

## Environment Variables

### Backend — `dcip-project/Backend/.env`

Create this file and fill in your own values:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dcip

# JWT secret — any long random string (minimum 32 characters)
JWT_SECRET=your_jwt_secret_here

# Frontend URL (used in CORS and password-reset emails)
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Gmail credentials for email verification and password reset
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password

# Cloudinary — from your Cloudinary dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI — primary model (Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key

# AI — fallback chain (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemma-4-31b-it:free
```

> **Note:** The `.env` file is listed in `.gitignore` and is never committed to the repository.

### Frontend — no `.env` file required for local development

The frontend points to `http://localhost:5000` for API calls in development. This is configured in `Frontend/src/services/api.ts`.

---

## Running Locally

Open **two terminal windows** from `dcip-project/`:

**Terminal 1 — Backend:**
```bash
cd Backend
npm run dev
```
The backend starts on `http://localhost:5000`.

**Terminal 2 — Frontend:**
```bash
cd Frontend
npm run dev
```
The frontend starts on `http://localhost:5173`. Open this URL in your browser.

**Seed initial data (first run only):**
```bash
cd Backend
npm run seed
npm run seed:curriculum
```

---

## Deployment

The platform is deployed on a DigitalOcean Droplet running Ubuntu 22.04. The full setup guide is in [DEPLOY.md](dcip-project/DEPLOY.md).

### Quick update after pushing changes to GitHub

SSH into the server and run:

```bash
cd /var/www/Capstone/dcip-project
bash deploy.sh
```

This script:
1. Pulls the latest code from GitHub (`main` branch)
2. Installs backend dependencies and compiles TypeScript (`npm run build`)
3. Restarts the backend process with PM2
4. Installs frontend dependencies and builds the React app (`npm run build`)
5. Copies the production build to `/var/www/dcip/` (Nginx web root)

### Verify the deployment

```bash
pm2 status                              # Backend should show "online"
curl http://localhost:5000/api/health   # Should return { "status": "ok" }
```

Live site: [https://dcip-rw.online](https://dcip-rw.online)

---

## Testing Strategies

### 1. Functional Testing — Happy Path

| Scenario | Steps |
|---|---|
| Student completes a level | Register → select discipline → complete Learn → Practise → Demonstrate → verify badge awarded |
| AI hint on course page | Open any lesson → highlight a sentence → click Ask AI → verify contextual answer |
| AI artwork critique | Submit a VA or GD Demonstrate → verify AI score and feedback appear in result modal |
| Studio save with folder | Open a studio → create work → save to a new folder → verify it appears in My Studio Works under that folder |
| Offline mode | Open the app → disconnect internet → navigate between pages → verify offline banner appears and pages still load |

### 2. Edge Case Testing — Invalid Inputs

| Scenario | Expected behaviour |
|---|---|
| Submit blank canvas on Demonstrate | Check My Work button blocks submission with a validation message |
| Ask AI with no text and no image | Ask AI button is disabled — cannot submit |
| Register with a duplicate email | Backend returns 400 with "email already in use" |
| Wrong password on login | Returns 401 with "invalid credentials" — no token issued |
| Upload oversized image to AI | FileReader converts to base64; Gemini API handles up to 20 MB inline data |

### 3. Performance Testing — Different Hardware

| Environment | Result |
|---|---|
| Desktop Chrome (Windows 11, 16 GB RAM) | All features load under 1.5 s; canvas interaction at 60 fps |
| Mobile Chrome (Android, mid-range device) | App loads; touch drawing works; AI panel responds correctly |
| Slow 3G (Chrome DevTools throttling) | App shell loads from Service Worker cache; offline banner shown; API calls queue in IndexedDB |
| Incognito / no cache | First load fetches from server; subsequent navigations served from cache |

### 4. AI Model Fallback Testing

| Scenario | Expected behaviour |
|---|---|
| Gemini API key valid | Gemini 3.1 Flash Lite responds within 3 s |
| Gemini unavailable | Automatically falls back to google/gemma-4-31b-it via OpenRouter |
| All models rate-limited | Returns "AI is currently unavailable. Please try again shortly." — no crash |

---

### 5. Offline Functionality Testing (Step by Step)

DCIP is a Progressive Web App (PWA). It caches its pages and assets so students can keep studying even when their internet cuts out, and queues any saved work to sync automatically when the connection returns.

#### Step 1 — Open DevTools

Open the app in **Google Chrome**, then press **F12** (or right-click anywhere → **Inspect**) to open DevTools.

#### Step 2 — Verify the Service Worker is registered

1. Click the **Application** tab in DevTools.
2. In the left sidebar click **Service Workers**.
3. You should see `sw.js` listed with status **activated and running**.
   - If it shows "waiting to activate", click **skipWaiting**.
4. Still in the Application tab, click **Cache Storage** in the left sidebar — you will see cached entries for the app shell, pages, and assets.

#### Step 3 — Simulate slow bandwidth

1. Click the **Network** tab in DevTools.
2. In the throttling dropdown (default shows **No throttling**), select **Slow 3G**.
   - Slow 3G simulates a bandwidth of approximately **400 Kbps download / 400 Kbps upload**, which is realistic for rural Rwanda.
3. Reload the page — it should still load fully because the Service Worker serves the app shell from cache.
4. Navigate between pages — all previously visited pages load instantly from cache despite the slow connection.

#### Step 4 — Go fully offline

1. Still in the **Network** tab, change the throttling dropdown to **Offline**.
   - Alternatively tick the **Offline** checkbox just above the network log.
2. Reload the page — the app still loads (served from cache, no server needed).
3. Navigate to any lesson page — content loads normally.
4. A **gold banner** appears at the top of the screen reading something like "You are offline. Your work will sync when you reconnect."

#### Step 5 — Test the sync queue

1. While still offline, save a studio work or complete an action that writes to the backend (e.g. save a drawing).
2. Open the **Application** tab → **IndexedDB** → **dcip-offline** → **pendingRequests**.
3. You will see the queued POST request stored there, waiting to be replayed.

#### Step 6 — Reconnect and verify sync

1. Change the throttling dropdown back to **No throttling** (online).
2. Within a few seconds the app detects the reconnection, replays the queued request automatically, and shows a **"Your work has been synced."** toast notification at the bottom of the screen.
3. Check the **pendingRequests** store in IndexedDB — it is now empty.

#### Bandwidth reference

| Chrome DevTools preset | Download speed | Equivalent scenario |
|---|---|---|
| No throttling | Full speed | Good Wi-Fi or fibre |
| Fast 3G | ~1.5 Mbps | Standard mobile data |
| **Slow 3G** | **~400 Kbps** | **Rural Rwanda (recommended for testing DCIP)** |
| Offline | 0 Kbps | No connection at all |

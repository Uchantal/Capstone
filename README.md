# DCIP: Digital Creative Infrastructure Platform

**Live Application:** [https://dcip-rw.online](https://dcip-rw.online)  
**Demo Video:** [https://youtu.be/xHSAcLsjey0](https://youtu.be/xHSAcLsjey0)



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

## Overview

DCIP is a self-directed digital learning platform built for identified talented youth in Rwandan secondary schools. It gives students structured access to creative skill development in Music, Visual Arts, and Graphic Design using the computer laboratories their schools already have. Students follow a guided journey through three progressive skill levels, each built around Learn, Practise, and Demonstrate stages that build real competency before unlocking the next level. An embedded AI assistant provides real-time hints, answers student questions, and analyses submitted artwork to give honest feedback on composition and technique. Students who complete all three levels unlock an open Production studio where they can create freely and build a personal portfolio at their own pace.

## Core Features

### Learning System

- 5 disciplines: Visual Arts, Graphic Design, Guitar, Piano, Voice
- 3 levels per discipline, each with three stages:
  - **Learn**: theory content with an interactive canvas or instrument
  - **Practise**: guided exercises with real-time feedback
  - **Demonstrate**: submit final work to earn a level badge
- Badge system: Beginner, Intermediate, and Advanced badges awarded on level completion

### AI Integration

- **Ask AI Assistant**: persistent chat panel on every course page; students can type questions, highlight confusing text to ask about it directly, or upload an image for analysis
- **AI Artwork Critique**: on Demonstrate submission, AI grades Visual Arts and Graphic Design work using computer vision and combines an AI quality score with an engagement score into a final grade
- **Two-step critique**: if the AI cannot assess intent from the image alone, it asks the student to explain their work before completing the assessment
- **AI Coach's Note**: after Guitar, Piano, and Voice results, AI generates a personalised coaching message with encouragement if the student passed or specific practice advice if they did not
- **Model chain:** Gemini 3.1 Flash Lite (primary, vision-capable) → OpenRouter fallback chain (Gemma 4 31B, NVIDIA Nemotron, Meta Llama, Qwen)

### Creative Studios

- **Visual Arts Studio**: freehand drawing canvas with brush, pencil, eraser, shapes, colour picker, and layer support
- **Graphic Design Studio**: poster design canvas with text tool and typography hierarchy tools
- **Guitar Studio**: interactive fretboard with note playback and recording
- **Piano Studio**: keyboard with chord validation and recording
- **Voice Studio**: microphone recording with playback
- **My Studio Works**: personal library with folder organisation; files stored on Cloudinary, URLs saved in MongoDB

### Engagement Scoring

- Tracks time on canvas, tool clicks, and interactions
- Engagement score (0–100) is blended with the AI quality score to produce the final grade
- AI quality is the dominant factor; engagement prevents passing on zero interaction alone

### Offline Support (PWA)

- Service Worker with Cache-First strategy for the app shell and static assets
- Network-First strategy for API GET requests with automatic cache fallback
- IndexedDB queue for failed POST/PATCH requests: replayed automatically on reconnect
- Offline banner shown when connection is lost; sync toast shown on reconnect

### User Management

- Student and Admin roles with separate dashboards
- School-based registration
- Password reset via email (Nodemailer + Gmail App Password)
- JWT authentication

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| PWA | vite-plugin-pwa, Service Worker, IndexedDB (idb) |
| Backend | Node.js 20, Express, TypeScript |
| Database | MongoDB Atlas (Mongoose ODM) |
| File Storage | Cloudinary (images and audio) |
| AI: Primary | Google Gemini 3.1 Flash Lite (direct API) |
| AI: Fallback | OpenRouter (Gemma 4 31B, NVIDIA Nemotron, Meta Llama, Qwen) |
| Deployment | DigitalOcean VPS, PM2, Nginx, Certbot (HTTPS) |
| Email | Nodemailer with Gmail App Password |

## Architecture

```
+--------------------------------------------------+
|              Student Browser (React PWA)         |
|                                                  |
|  +------------+  +------------+  +------------+ |
|  | Learning   |  | Studios    |  | Portfolio  | |
|  | System     |  | (VA, GD,   |  | Dashboard  | |
|  | (5 skills) |  |  Music)    |  |            | |
|  +------------+  +------------+  +------------+ |
|                                                  |
|  Service Worker  +  IndexedDB (Offline / PWA)    |
+---------------------------+----------------------+
                            |
                         HTTPS
                            |
+---------------------------v----------------------+
|         DigitalOcean VPS  (Ubuntu 22.04)         |
|                                                  |
|  +--------------------------------------------+ |
|  |              Nginx (Reverse Proxy)          | |
|  |                                            | |
|  |  /* -----> /var/www/dcip  (React build)    | |
|  |  /api/* -> localhost:5000 (Express API)    | |
|  +--------------------------------------------+ |
|                       |                          |
|  +--------------------v-----------------------+ |
|  |         Express + Node.js (PM2)            | |
|  |                                            | |
|  |  Auth    Curriculum    Studios    AI        | |
|  |  Routes  Routes        Routes     Routes   | |
|  +----+----------+----------+----------+-----+ |
|       |          |          |          |        |
+-------|----------|----------|----------|--------+
        |          |          |          |
+-------v--+  +----v-----+  +-v--------+ +-------v--------+
| MongoDB  |  | Cloudinary|  | Google  | | OpenRouter     |
| Atlas    |  |           |  | Gemini  | | (Fallback AI)  |
|          |  | Images    |  | Flash   | |                |
| Users    |  | Audio     |  | Lite    | | Gemma 4 31B    |
| Progress |  | Files     |  |         | | NVIDIA Nemotron|
| Works    |  |           |  | Primary | | Meta Llama     |
+----------+  +-----------+  +---------+ | Qwen           |
                                         +----------------+
```

**Request flow:**

1. The student opens `https://dcip-rw.online` in a browser.
2. Nginx serves the React build for all non-API routes.
3. API calls (`/api/*`) are proxied by Nginx to Express on port 5000.
4. Express connects to MongoDB Atlas for user data and learning progress.
5. Studio file uploads go to Cloudinary; the returned URL is saved in MongoDB.
6. AI requests go to Google Gemini first. If that fails, OpenRouter tries the fallback chain.
7. The Service Worker caches the app shell and queues offline writes in IndexedDB for replay on reconnect.

Both the React build and the Express server run on the same DigitalOcean Droplet. PM2 keeps the backend alive across reboots.

## Prerequisites

- **Node.js 20+**: [nodejs.org](https://nodejs.org)
- **npm 9+**: included with Node.js
- **Git**: [git-scm.com](https://git-scm.com)
- A **MongoDB Atlas** account with a free cluster: [mongodb.com/atlas](https://www.mongodb.com/atlas)
- A **Cloudinary** account (free tier): [cloudinary.com](https://cloudinary.com)
- A **Google AI Studio** account for the Gemini API key: [aistudio.google.com](https://aistudio.google.com)
- An **OpenRouter** account for the fallback AI key: [openrouter.ai](https://openrouter.ai)

## Local Installation

**1. Clone the repository**

```bash
git clone https://github.com/Uchantal/Capstone.git
cd Capstone/dcip-project
```

**2. Install backend dependencies**

```bash
cd Backend
npm install
```

**3. Install frontend dependencies**

```bash
cd ../Frontend
npm install
```

## Environment Variables

Create `dcip-project/Backend/.env` and fill in your own values:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dcip
JWT_SECRET=your_jwt_secret_here

CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GEMINI_API_KEY=your_gemini_api_key

OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemma-4-31b-it:free
```

The `.env` file is listed in `.gitignore` and is never committed to the repository. The frontend requires no `.env` file for local development: API calls point to `http://localhost:5000` by default, configured in `Frontend/src/services/api.ts`.

## Running Locally

Open two terminal windows from `dcip-project/`:

**Terminal 1: Backend:**
```bash
cd Backend
npm run dev
```

**Terminal 2: Frontend:**
```bash
cd Frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

**Seed initial data (first run only):**
```bash
cd Backend
npm run seed
npm run seed:curriculum
```

## Deployment

The platform is deployed on a DigitalOcean Droplet running Ubuntu 22.04. The full setup guide is in [DEPLOY.md](dcip-project/DEPLOY.md).

**Quick update after pushing changes to GitHub:**

SSH into the server and run:

```bash
cd /var/www/Capstone/dcip-project
bash deploy.sh
```

This script pulls the latest code from GitHub, builds the backend and frontend, restarts the PM2 process, and copies the frontend build to the Nginx web root.

**Verify the deployment:**

```bash
pm2 status
curl http://localhost:5000/api/health
```

Live site: [https://dcip-rw.online](https://dcip-rw.online)

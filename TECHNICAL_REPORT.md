# DCIP — Technical Report

**Project Title:** Digital Creative Infrastructure Platform  
**Live Application:** https://dcip-rw.online  
**Repository:** https://github.com/Uchantal/Capstone  
**Technical Walkthrough:** https://www.youtube.com/watch?v=lvIOg2AYKYU

---

## 1. Introduction

Rwanda has a real gap when it comes to creative education at secondary school level. Schools have computer labs but very little software that puts those labs to productive use for students who are gifted in music, art, or design. The talented youth identification programme exists, but once students are identified, there is not much of a structured environment for them to actually develop their skills.

DCIP was built to close that gap. It is a web-based learning platform that gives identified students a structured path through three skill levels in their chosen discipline — Visual Arts, Graphic Design, Guitar, Piano, or Voice — and then opens up a free studio space once they graduate all three levels. The idea was to build something that works in the conditions Rwandan schools actually have: shared computers, inconsistent internet, and no specialist teachers to guide every student individually. That last point is where the AI comes in.

---

## 2. Problem Statement

Rwanda's creative talent is geographically widespread, but the infrastructure through which that talent can be developed into demonstrable skill remains concentrated in Kigali and a small number of urban centres. A feasibility study commissioned by the African Development Bank Group confirms that Rwanda's creative sector lacks the developmental infrastructure needed to translate existing talent into economic opportunity, identifying human capital development, infrastructure, financing, and enabling environment as four critical gaps requiring national intervention (African Development Bank Group, 2024). The concentration of creative infrastructure in urban areas continues despite recent investments: Rwanda's first dedicated contemporary art centre, the Gihanga Institute of Contemporary Art (GICA), opened in Kigali's Kimihurura neighbourhood in December 2025, further illustrating that major creative facilities remain anchored in the capital rather than distributed across underserved districts (The Art Newspaper, 2025). The government's National Youth Strategic Plan 2024/2025–2028/2029 acknowledges that the Rwanda School of Creative Arts and Music in Nyundo is the country's only dedicated public creative education institution, that creative facilities nationwide are scarce and often inaccessible, and that geographically distributed creative infrastructure is a future target rather than an existing reality (Ministry of Youth and Arts, 2024). The talent is present across all 30 districts; the infrastructure to develop it is not.

Existing national talent programmes do not resolve this inequality because they are designed to evaluate skills that have already been developed, not to build it. ArtRwanda-Ubuhanzi, Rwanda's most prominent talent search programme, conducts physical auditions at only six locations across 30 districts with no remote or digital participation option, structurally excluding any student who cannot travel. The Ministry of Youth and Arts confirms that the current talent detection scheme shows a documented imbalance, and the government's five-year target of supporting only 812 talented youth in the creative sector by 2029 reflects the limited reach of existing infrastructure rather than the scale of available talent (Ministry of Youth and Arts, 2024). Students who have demonstrated visible creative potential through school performances, art competitions, or community activities but who have never accessed a studio or structured practice environment cannot present the developed skill these competitive formats require.

Rwanda's school system holds infrastructure that has never been directed toward creative skill development. According to the Ministry of Education's Education Statistical Yearbook 2023/2024, 97.4% of schools have at least one computer, 28.2% operate computer laboratories, 61.8% are connected to the internet, and 84.2% are connected to the national electricity grid (Ministry of Education, 2025). This infrastructure is already distributed across all districts, including the most rural, and is supervised by ICT coordinators capable of facilitating structured access without specialist creative knowledge. No platform has been designed to use this existing school infrastructure for structured creative practice in music, visual arts, or graphic design. The computers, the connectivity, and the supervisory environment exist. The software system to use them for creative development does not.

This study therefore proposes a school-based Digital Creative Infrastructure Platform: a browser-accessible, offline-first web application deployable on school computer laboratory infrastructure, providing structured digital practice environments in music, visual arts, and graphic design for identified talented youth in rural Rwandan secondary schools. Rather than building new physical facilities or assuming household device availability, the platform redirects infrastructure Rwanda has already deployed toward the structured creative development that is currently accessible only to young people in urban centres, directly addressing the access gap documented above.

---

## 3. Proposed Solution

As stated in the problem statement, the platform was built to run on school computer laboratories that already exist across all 30 districts — 97.4% of schools have at least one computer and 28.2% have a dedicated lab (Ministry of Education, 2025). No new physical infrastructure was needed.

DCIP is a browser-based web application. Students open it in Chrome, log in with their school credentials, and start learning — no software to install, no device to own. The platform is structured around five disciplines (Visual Arts, Graphic Design, Guitar, Piano, and Voice) with three skill levels each. Every level has three stages: Courses (theory and practice), Practise (guided exercises with real-time feedback), and Demonstrate (a submitted assessment). Passing Demonstrate earns a badge and unlocks the next level. Once a student completes all three levels, they unlock a personal studio where they can create freely and build a portfolio.

Because only 61.8% of schools have internet access, the platform is built to work offline. After the first visit, all pages load from the browser cache. If a student saves work while offline, the request is stored locally and sent to the server automatically when the connection comes back.

The AI assistant addresses the teacher gap. Rural schools do not have specialist music or art teachers. The AI is available on every course page — students can ask questions, highlight text they do not understand, or upload an image for feedback. For Visual Arts and Graphic Design assessments, the AI also grades the submitted work using computer vision. For music, it generates a personalised coaching note after each result.

Measuring whether a student is actually learning — and not just clicking through — was also part of the design. The platform tracks how a student works during a session: how long they spend on the canvas, how many tools they use, how many strokes they make. This produces an engagement score that is combined with the AI quality score to decide whether the student passes a level. A student who submits a genuine piece of work they put effort into will pass. A student who submits a blank or rushed image will not, even if the AI cannot tell the difference from the image alone.

The portfolio solves the access problem that existing talent programmes create. ArtRwanda-Ubuhanzi requires students to show up in person with already-developed skill. DCIP gives students a way to build that skill and document it, so they have something concrete to present.

---

## 4. System Architecture

The platform follows a standard client-server architecture with a React frontend served as a static build and a Node.js/Express backend handling the API.

```
Browser (React PWA)
      │
      │  HTTPS
      ▼
Nginx (dcip-rw.online:443)
  ├── /* → /var/www/dcip/  (static React build)
  └── /api/* → localhost:5000  (proxied to Express)
                    │
                    ├── MongoDB Atlas  (users, progress, studio metadata)
                    ├── Cloudinary     (images and audio files)
                    ├── Google Gemini  (AI hints and artwork critique)
                    └── OpenRouter     (AI fallback chain)
```

Both the frontend and backend are hosted on a single DigitalOcean Droplet (Ubuntu 22.04, 1 GB RAM). Nginx listens on ports 80 and 443, redirects all HTTP traffic to HTTPS, and proxies any request starting with `/api/` to the Express server running on port 5000. The backend is kept alive by PM2, which restarts it automatically if it crashes or the server reboots.

SSL certificates are managed by Certbot and auto-renew every 90 days.

---

## 5. Technology Stack

| Layer | Technology | Reason for Choice |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Component model suits the level/stage structure; TypeScript caught many bugs early |
| Styling | Tailwind CSS | Responsive design without writing separate CSS files |
| PWA | vite-plugin-pwa + Service Worker | Offline support with minimal boilerplate |
| Offline queue | IndexedDB (idb library) | Browser-native, persistent storage for queuing failed requests |
| Backend | Node.js 20 + Express + TypeScript | Same language on both sides reduces context switching |
| Database | MongoDB Atlas | Flexible schema suited the evolving progress tracking models |
| File storage | Cloudinary | Handles image and audio CDN; free tier was sufficient |
| AI — Primary | Google Gemini 3.1 Flash Lite | Vision-capable, fast, and had a free daily quota |
| AI — Fallback | OpenRouter | Multi-model fallback when Gemini is unavailable or rate-limited |
| Deployment | DigitalOcean + PM2 + Nginx | Affordable VPS with full control over the server environment |
| Email | Nodemailer + Gmail App Password | Password reset emails without a paid mail service |

---

## 6. Core Features and Implementation

### 6.1 Learning Journey

Every discipline follows the same three-level structure: Beginner, Intermediate, and Advanced. Within each level there are three stages — Learn, Practise, and Demonstrate.

- **Courses** gives the student theory content alongside an interactive tool (a drawing canvas, a piano keyboard, a guitar fretboard, or a microphone). They can read and experiment at the same time.
- **Practise** sets a guided exercise. For piano and guitar, this means playing the right chords or notes in sequence. For visual arts and graphic design, it means applying specific techniques to a canvas. Feedback is given in real time.
- **Demonstrate** is the assessment. The student submits their final work — a drawing, a poster, or a recorded performance — and the result determines whether they pass the level and earn a badge.

Progress is tracked per user per discipline in MongoDB, so students can close the browser and come back exactly where they left off.

### 6.2 AI Integration

The AI assistant has two distinct roles on the platform.

The first is student support. On every course page there is a persistent Ask AI panel. Students can type a question, highlight text they do not understand and send it directly to the AI, or upload an image to ask about it. This was important because there is no teacher available to answer individual questions, and students working alone on creative tasks often get stuck. The AI fills that gap.

The second role is assessment. When a student submits a Visual Arts or Graphic Design Demonstrate, the AI uses computer vision to assess the image. It analyses composition, use of colour, and technique, then combines that quality score with an engagement score (which tracks how actively the student used the tools during the session) to produce a final grade. If the image alone is not enough to judge intent, the AI asks the student a follow-up question before completing the assessment. For Guitar, Piano, and Voice — where results are assessed programmatically by checking note accuracy — the AI generates a personalised coaching message after the result: encouragement if the student passed, or specific practice advice if they did not.

The primary model is Google Gemini 3.1 Flash Lite, which was chosen because it is vision-capable, fast enough for real-time chat, and has a free daily quota that covers development and moderate production traffic. If Gemini is unavailable or rate-limited, requests fall through to a chain of models via OpenRouter: Gemma 4 31B, NVIDIA Nemotron, Meta Llama, and Qwen. The fallback chain means the AI features stay functional even if the primary model has an outage.

### 6.3 Creative Studios

Once a student passes all three levels in a discipline, they unlock the Production studio for that discipline. The studios are open-ended creative environments:

- **Visual Arts Studio** — freehand canvas with brush, pencil, eraser, shapes, colour picker, and layer support
- **Graphic Design Studio** — poster design canvas with text tools and typography controls
- **Guitar and Piano Studios** — instruments with recording and note playback
- **Voice Studio** — microphone recording with playback

Completed works are uploaded to Cloudinary and the URLs are saved in MongoDB under the student's account. Students can organise their works into folders and access them from My Studio Works at any time.

### 6.4 Engagement Scoring

To assess how genuinely a student engaged with the canvas — rather than just submitting any image — the platform tracks interactions during a Demonstrate session: time spent on the canvas, number of tool switches, brush strokes, colour changes, and other recorded events. This produces an engagement score from 0 to 100, which is blended with the AI quality score to form the final grade. The AI quality component is weighted as the dominant factor, but the engagement score prevents a student from passing by submitting a blank or trivially simple image with zero real effort.

### 6.5 Admin Dashboard

The admin role is held by the developer and is accessed through a separate dashboard at `/admin`. It was designed so that the admin can manage the entire platform from the browser without needing to run any code locally or access a database directly.

Key capabilities include:

- **Platform preview** — the admin can browse the full student-facing platform (every discipline, every level, every stage) from within the admin dashboard, exactly as a student would see it, without needing to create a student account or run the project locally
- **School management** — the admin can view all registered schools, add new ones, and update their details
- **Student management** — the admin can view all students across all schools, see their registered discipline and progress, and activate or deactivate individual accounts. A deactivated student cannot log in until the admin reactivates them
- **Module management** — individual course modules can be toggled on or off from the dashboard
- **Reports** — the admin can generate activity reports filtered by date range, covering session data and student engagement across the platform
- **Feedback review** — all feedback submitted by students through the in-app feedback form is visible to the admin in one place

### 6.6 Offline Support (PWA)

Connectivity in many Rwandan schools is unreliable, so offline support was a core requirement rather than a bonus feature.

The Service Worker uses a Cache-First strategy for the app shell and all static assets. Once a student has visited the app, all pages and assets are cached, so the app loads even with no connection. For API GET requests (fetching progress, curriculum content, portfolio), a Network-First strategy is used: the app tries the server first and falls back to cached responses if the request fails.

For write operations (saving studio work, submitting results), failed requests are stored in an IndexedDB queue under the key store `pendingRequests`. A background sync listener watches for the connection to return and replays all queued requests automatically. When sync completes, a toast notification confirms to the student that their work has been saved.

The offline banner — a gold bar at the top of the screen — appears whenever the connection is lost, so students are never left wondering why something did not save.

---

## 7. Deployment

The platform is deployed on a DigitalOcean Droplet running Ubuntu 22.04 LTS with 1 GB of RAM. The setup process involved:

1. Provisioning the Droplet and pointing the domain `dcip-rw.online` to its IP via DNS A records
2. Installing Node.js 20, PM2, and Nginx on the server
3. Obtaining an SSL certificate via Certbot (Let's Encrypt) for HTTPS
4. Configuring Nginx to serve the React build from `/var/www/dcip/` and proxy `/api/*` to Express on port 5000
5. Setting up PM2 to manage the backend process and restart it on server reboots

Deployments after the initial setup are handled by a `deploy.sh` script in the repository root. SSHing into the server and running the script:

- Pulls the latest code from the `main` branch on GitHub
- Installs backend dependencies and compiles the TypeScript source
- Restarts the backend via PM2
- Installs frontend dependencies and runs the Vite production build
- Copies the output to `/var/www/dcip/` so Nginx picks up the new version

**Verification after each deployment:**

```bash
pm2 status                             # confirms backend process is online
curl http://localhost:5000/api/health  # returns { "status": "ok" }
```

The live site is then verified manually by opening the browser, logging in, navigating through a lesson, and confirming no console errors appear.

---

## 8. Testing Strategies

### 8.1 Functional Testing — Happy Path

The first round of testing covered the main student journey from start to finish.

| Scenario | Steps | Result |
|---|---|---|
| Student completes a full level | Register → select discipline → Learn → Practise → Demonstrate → verify badge | Pass |
| AI hint during a lesson | Highlight text → click Ask AI → verify contextual response | Pass |
| AI artwork critique | Submit VA or GD Demonstrate → verify score and written feedback appear | Pass |
| Studio save with folder | Create work → save to new folder → verify it appears in My Studio Works | Pass |
| Password reset | Request reset email → click link → set new password → log in | Pass |
| Admin adds a school | Log in as admin → Schools → add new school → verify it appears in registration dropdown | Pass |

### 8.2 Edge Case Testing — Invalid Inputs

After the happy path was confirmed, the next step was checking how the system handles bad inputs and boundary conditions.

| Scenario | Expected Behaviour | Result |
|---|---|---|
| Submit blank canvas on Demonstrate | Submission blocked with validation message | Pass |
| Ask AI with no text and no image | Ask AI button is disabled — cannot submit | Pass |
| Register with a duplicate email | Backend returns 400: "An account with this email already exists" | Pass |
| Wrong password on login | Returns 400: "Invalid username or password" — no token issued | Pass |
| Deactivated account tries to log in | Returns 403: "Account is deactivated. Contact your administrator." | Pass |
| Upload oversized image to AI | FileReader converts to base64; Gemini API handles up to 20 MB inline | Pass |

### 8.3 Performance Testing — Different Environments

The platform needed to work on shared school computers and on slower connections, not just on a fast laptop.

| Environment | Observation |
|---|---|
| Desktop Chrome (Windows 11, 16 GB RAM) | All features loaded under 1.5 s; canvas ran smoothly at 60 fps |
| Mobile Chrome (Android, mid-range device) | App loaded correctly; touch drawing worked; AI panel responded |
| Slow 3G (Chrome DevTools throttle at ~400 Kbps) | App shell loaded from Service Worker cache; repeat navigation was instant |
| Incognito mode (no cache) | First load fetched from server; subsequent navigations served from cache |

The Slow 3G result was particularly relevant to the target environment. After an initial visit, students on slow connections see cached content immediately rather than waiting for network responses.

### 8.4 AI Model Fallback Testing

The fallback chain was tested by deliberately making the primary model unavailable.

| Scenario | Expected Behaviour | Result |
|---|---|---|
| Gemini API key valid and within quota | Gemini 3.1 Flash Lite responds within 3 s | Pass |
| Gemini key revoked (simulated) | Request falls through to OpenRouter → Gemma 4 31B responds | Pass |
| All OpenRouter models rate-limited | Returns "AI is currently unavailable. Please try again shortly." — no crash | Pass |

### 8.5 Offline Functionality Testing

This was tested using Chrome DevTools in the Application and Network tabs.

1. Open the app in Chrome → DevTools (F12) → **Application** → **Service Workers** — confirm `sw.js` is **activated and running**. Check **Cache Storage** to confirm the app shell and assets are cached.
2. **Network** tab → throttle dropdown → **Slow 3G** (~400 Kbps). Reload — the page loads from cache. Navigate between pages — all previously visited pages open instantly.
3. Change throttle to **Offline**. Reload — the app still loads. The gold offline banner appears at the top of the screen.
4. Save a studio work while offline. Go to **Application** → **IndexedDB** → **dcip-offline** → **pendingRequests** — the queued POST request is visible.
5. Change throttle back to **No throttling**. Within seconds the app replays the queued request, shows a sync toast, and the **pendingRequests** store empties.

| Chrome DevTools Preset | Speed | Equivalent Scenario |
|---|---|---|
| No throttling | Full speed | Good Wi-Fi or fibre |
| Fast 3G | ~1.5 Mbps | Standard mobile data |
| Slow 3G | ~400 Kbps | Rural Rwanda school connection |
| Offline | 0 Kbps | No connection at all |

---

## 9. Challenges and How They Were Resolved

**AI assessment for visual subjects.** Judging whether a student's drawing is genuinely good is harder than checking whether they played the right notes. A student could submit any image and technically "pass." To address this, two things were combined: the AI quality score from Gemini's vision analysis, and the engagement score that tracks actual tool usage during the session. Neither score alone is sufficient — you need both real effort and a real result to pass.

**Gemini's rate limits.** The free tier of the Gemini API has a daily request limit. During development this was hit regularly. The solution was the OpenRouter fallback chain, which routes to alternative models when Gemini is unavailable or exhausted. From the student's perspective, the AI just keeps working.

**Offline writes.** Caching static pages was straightforward. The harder problem was what happens when a student tries to save their work while offline. A standard Service Worker cannot intercept and queue failed POST requests on its own. The solution was an IndexedDB queue managed by the Service Worker, combined with a `message` listener that watches for the connection to come back and replays each queued request in order.

**Getting all Rwandan secondary schools into the system.** There is no publicly available digital database of all secondary schools in Rwanda that could be imported automatically. Early on, the plan was to seed a complete school list from an official source, but no such source exists in a usable format. The decision was made to have the admin — in this case the developer — add schools manually through the admin dashboard as they are needed. This means the school dropdown on the registration page only shows schools that have been added, which keeps the list clean and verified, but it does require the admin to stay on top of additions as new schools join the programme.

**Connectivity detection on the server.** The initial offline banner relied solely on the browser's `navigator.onLine` flag, which can be misleading — the browser may report "online" while the actual server is unreachable. The implementation was updated to attempt a lightweight fetch to the health endpoint before confirming connectivity, giving students a more accurate status.

---

## 10. Scope Alignment

The original proposal set out to build a digital creative learning platform for Rwandan secondary school students with the following requirements:

| Proposed Requirement | Delivered |
|---|---|
| Multi-discipline learning (Visual Arts, Graphic Design, Music) | 5 disciplines: Visual Arts, Graphic Design, Guitar, Piano, Voice |
| Three progressive skill levels per discipline | Beginner, Intermediate, Advanced — each with Learn, Practise, Demonstrate |
| Badge and progression system | Badges awarded on level completion; next level locked until current is passed |
| AI-assisted feedback | Ask AI panel on every page; AI artwork critique on Demonstrate submission; AI coaching notes for music |
| Student engagement tracking | Engagement score (tool usage, time on canvas, brush strokes) blended with AI quality score to determine pass/fail on visual assessments |
| Portfolio and studio space | Production studio unlocked after all three levels; My Studio Works with folder organisation |
| Offline functionality | Service Worker caching + IndexedDB sync queue |
| School-based registration and admin management | School dropdown on register; Admin dashboard for managing schools, students, modules, and reports |
| Deployment to a live environment | Deployed at https://dcip-rw.online on DigitalOcean with HTTPS |

All core requirements from the proposal were implemented and are live on the deployed platform.

---

## 11. Conclusion

DCIP started from a straightforward observation: the schools have the computers, the students have the talent, but there is nothing connecting the two in a structured way. Building this platform meant making a lot of small decisions — about how to structure the learning journey, how to make the AI useful without being intrusive, how to handle offline scenarios that most web apps simply ignore, and how to keep the whole thing running on a minimal server budget.

The result is a platform that is genuinely usable in the conditions it was designed for. It runs in a browser with no installation, works on slow connections, keeps students moving through a structured curriculum, and gives them real feedback at every stage — even when there is no teacher in the room.

One thing that shaped how the platform works is that passing a level is not just about submitting something. The engagement score means that a student has to actually put in the work — spend time on the canvas, try different tools, make real decisions. That was intentional. The goal was never to let students click through and collect badges. It was to give them a record of genuine creative development that they can take outside the platform and use.

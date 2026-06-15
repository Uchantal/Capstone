# DCIP Technical Implementation Report

**Digital Creative Infrastructure Platform**
Prepared for supervisor meeting discussion.

---

## 1. Platform Overview

DCIP is a browser-based creative practice platform built for students in Rwandan secondary schools. It gives students access to guided sessions in Music (Guitar, Piano, Voice and Singing), Visual Arts, and Graphic Design using the computers already available in their school labs. Each session is structured into five steps, requires no installation, and works fully offline. Work is saved locally when there is no internet connection and synced automatically when connectivity returns.

**Who it is for:** Secondary school students in five pilot schools across Nyamagabe, Muhanga, and Ruhango districts. Each school has an assigned supervisor account. A single administrator account manages the platform.

**Why browser-based:** The school computers already have browsers. A native app would require installation rights, IT support, and platform-specific builds. A web app removes every one of those barriers.

**Why offline-first:** School internet connections are unreliable. If the platform only worked online, a student mid-session would lose their work. Offline-first means the session completes and saves locally regardless of connectivity.

---

## 2. Technology Stack and Why Each Was Chosen

| Technology | Role in this project | Why chosen |
|---|---|---|
| **React 18 + TypeScript** | UI components, state, routing | React's component model fits the step-by-step session structure. TypeScript catches type errors at build time, important when working with complex Web Audio API objects. |
| **Tailwind CSS** | All styling | Utility-first classes allow consistent design without writing custom CSS. JIT mode generates only what is used, keeping the bundle small. |
| **Vite** | Build tool and dev server | Significantly faster than Webpack in development. The `vite-plugin-pwa` integration generates the Service Worker and manifest automatically. |
| **React Router** | Client-side navigation | Handles protected routes and role-based redirects cleanly. All navigation stays within one HTML page, which is required for offline PWA behavior. |
| **Node.js + Express.js** | REST API backend | Lightweight and fast. Express gives full control over route structure, middleware, and error handling without the overhead of a framework. |
| **MongoDB Atlas** | Cloud database | Flexible document schema fits portfolio items (base64 audio/image data stored alongside metadata). Atlas provides a free hosted cluster suitable for a pilot. |
| **Mongoose** | ODM for MongoDB | Adds schema validation, virtuals, and typed models. Reduces the risk of saving malformed documents. |
| **JWT (jsonwebtoken)** | Authentication tokens | Stateless. No server-side session storage needed. A 7-day token keeps students logged in across lab visits without re-entering credentials. |
| **bcryptjs** | Password hashing | Passwords are hashed with cost factor 10 before storage. bcryptjs is a pure JavaScript implementation with no native dependencies. |
| **IndexedDB** | Offline portfolio storage | Browser-native key-value store that persists across page reloads. Used to queue portfolio saves when offline. Accessed through a small custom wrapper in `services/db.ts`. |
| **Service Workers (Workbox via vite-plugin-pwa)** | Asset caching and offline shell | Caches all JS, CSS, HTML, images, and fonts at install time. The app shell loads instantly even with no network. Workbox is auto-generated at build time from the Vite config. |
| **Web Audio API** | Sound synthesis for Piano and Guitar | No library needed. The browser's built-in audio engine creates oscillators, applies effects, and routes audio to a recording destination. Full control over every aspect of the sound. |
| **MediaRecorder API** | Audio recording | Works on the same stream the Web Audio API produces (Piano, Guitar) or directly on the microphone stream (Voice). No third-party library required. |
| **Canvas API** | Live voice waveform | Draws `getByteTimeDomainData` output in real time during voice recording so students can see their voice visually. |

---

## 3. System Architecture

### Frontend to Backend Communication

The frontend is a React SPA served from the Vite dev server (or Vercel/Netlify in production). It communicates with the Express backend over HTTPS via a REST API at `/api/*`. All authenticated requests send a `Bearer` JWT in the `Authorization` header. The backend is hosted separately (port 5000 in development, cloud in production) with CORS configured to allow only `localhost` origins and the configured `CLIENT_URL`.

### Authentication Flow (JWT)

1. Student submits username and password to `POST /api/auth/login`.
2. Backend verifies the password with `bcrypt.compare`, checks `isActive`, then signs a JWT containing `{ id, role }` with a 7-day expiry.
3. The token is returned to the frontend and stored in React context (in memory, not `localStorage`).
4. Every subsequent API request includes the token as `Authorization: Bearer <token>`.
5. The `protect` middleware on the backend verifies the token with `jwt.verify`. If valid, it attaches `req.userId` and `req.userRole` to the request and calls `next()`.
6. Role-specific routes additionally call `requireRole('admin')` or `requireRole('supervisor')`, which checks `req.userRole` and returns 403 if the role does not match.

### Offline-First Flow (IndexedDB and Sync)

1. When a student completes a session and saves their work, the frontend first tries to call `POST /api/portfolio`.
2. If offline (or the call fails), the item is saved to IndexedDB via `savePendingItem()` in `services/db.ts` with a `localId` key for later deletion.
3. The `useSync` hook listens for the browser's `online` event. When the device reconnects, it reads all pending items from IndexedDB and posts them to the API one by one.
4. Each successfully synced item is removed from IndexedDB via `removePendingItem(localId)`.
5. The Service Worker (generated by Workbox via `vite-plugin-pwa`) caches the app shell, JS bundles, CSS, and static assets so the UI loads completely even with no network.

### Role-Based Access

| Role | What they can access |
|---|---|
| **Student** | Dashboard, discipline selection, session steps, portfolio, profile |
| **Supervisor** | Their own school's students, active sessions in the past 2 hours, student progress report |
| **Administrator** | All students, all supervisors, all schools (activate/deactivate), all modules (activate/deactivate), platform stats and reports |

---

## 4. API Endpoints

### Auth Routes (`/api/auth`)

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a new student account (requires a valid schoolId from the seeded list) |
| POST | `/api/auth/login` | Public | Log in and receive a JWT token |
| GET | `/api/auth/schools` | Public | Fetch all schools (used to populate the registration dropdown) |
| PATCH | `/api/auth/discipline` | Student | Set or update the student's chosen discipline after login |

### Session Routes (`/api/sessions`)

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/sessions` | Student | Create a practice session record (created automatically when a portfolio item is saved) |
| GET | `/api/sessions` | Student | Fetch all of the authenticated student's sessions |
| GET | `/api/sessions/stats` | Student | Fetch aggregate stats (session count, discipline breakdown) |

### Portfolio Routes (`/api/portfolio`)

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/portfolio` | Student | Save a portfolio item (base64 audio or image) and auto-create a session record |
| GET | `/api/portfolio` | Student | Fetch all portfolio items for the authenticated student (fileData excluded for performance) |
| GET | `/api/portfolio/:id` | Student | Fetch a single portfolio item including full fileData |
| DELETE | `/api/portfolio/:id` | Student | Delete a portfolio item |

### Admin Routes (`/api/admin`)

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/admin/students` | Admin | List all student accounts with school and discipline |
| PATCH | `/api/admin/students/:id/toggle` | Admin | Toggle a student's active status |
| PATCH | `/api/admin/students/:id/activate` | Admin | Activate a specific student account |
| PATCH | `/api/admin/students/:id/deactivate` | Admin | Deactivate a specific student account |
| GET | `/api/admin/modules` | Admin | List all creative modules |
| PATCH | `/api/admin/modules/:id/toggle` | Admin | Toggle a module's active status |
| PATCH | `/api/admin/modules/:id/activate` | Admin | Activate a module |
| PATCH | `/api/admin/modules/:id/deactivate` | Admin | Deactivate a module |
| POST | `/api/admin/modules` | Admin | Create a new module |
| GET | `/api/admin/supervisors` | Admin | List all supervisor accounts with assigned school |
| POST | `/api/admin/supervisors` | Admin | Create a new supervisor account |
| GET | `/api/admin/schools` | Admin | List all schools with active status |
| PATCH | `/api/admin/schools/:id/activate` | Admin | Mark a school as active in the pilot |
| PATCH | `/api/admin/schools/:id/deactivate` | Admin | Remove a school from the active pilot |
| GET | `/api/admin/stats` | Admin | Overview counters: active students, total sessions, portfolio items, active schools |
| GET | `/api/admin/reports` | Admin | Detailed report including session breakdown by discipline |

### Supervisor Routes (`/api/supervisor`)

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/supervisor/sessions/active` | Supervisor | Sessions created in the last 2 hours for students at the supervisor's school |
| GET | `/api/supervisor/students` | Supervisor | All students registered at the supervisor's school |
| GET | `/api/supervisor/progress` | Supervisor | Per-student session count and portfolio item count for the supervisor's school |

### Health Check

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Returns `{ status: "ok" }` — used for uptime monitoring |

---

## 5. Web Audio API Implementation

### 5.1 How Web Audio API Works in This Project

The Web Audio API is the browser's built-in audio engine. Everything goes through an `AudioContext`, which acts as the processing graph. Nodes are created from this context (oscillators, gain controls, effects), connected together, and ultimately routed to the context's `destination` (the speakers).

**Why `useRef` for AudioContext, not `useState`:** An `AudioContext` is not a value to be rendered. Changing it should not trigger a re-render. `useRef` holds a mutable reference that persists across renders without causing them.

**Why AudioContext is created inside a user gesture, not on mount:** Browsers block audio playback unless triggered by a direct user action (a click, a tap). Creating the `AudioContext` on component mount would cause it to be suspended immediately. The `ensureCtx()` helper in both Piano and Guitar creates the context lazily on the first key press or button click, which satisfies the browser's autoplay policy.

### 5.2 Piano Implementation

**Keyboard layout:** The `WHITE_KEYS` array in `PianoModule.tsx` defines 14 white keys from C4 to B5. Each white key optionally includes a `sharp` object for its corresponding black key. Black keys are rendered as `absolute`-positioned buttons overlapping the gap between white keys.

**Frequency table and equal temperament:** Each note's frequency is a fixed value in Hz derived from equal temperament tuning. In equal temperament, the octave is divided into 12 equal semitones. Each semitone is the previous frequency multiplied by the 12th root of 2 (approximately 1.05946). Starting from A4 = 440 Hz, every other note follows from this formula. For example: A#4 = 440 * 2^(1/12) = 466.16 Hz, B4 = 440 * 2^(2/12) = 493.88 Hz. The values are hardcoded rather than calculated at runtime to avoid floating-point drift.

**Why sine oscillator for piano:** A sine wave is a pure tone with no harmonics. A piano's fundamental tone is relatively clean, so sine is a reasonable approximation, especially for a teaching context where the priority is pitch accuracy over timbre realism.

**Overtone:** A second `sine` oscillator is created at exactly twice the fundamental frequency (one octave up) and mixed in at 10% volume (`g2.gain.value = 0.1`). This adds a small amount of upper harmonic content, which makes the tone sound slightly more like a real piano string.

**ADSR envelope (applied to the master gain node):**
```
Attack:  0 → 0.5  over 10ms   (quick onset — finger strikes key)
Decay:   0.5 → 0.2 over 300ms (energy falls off — string loses initial impact)
Sustain: 0.2 held until ~400ms (key held down — string still vibrating)
Release: 0.2 → 0.001 over 900ms (note fades — string dampened)
```
Total note duration: 1.3 seconds. The fast attack and slow release produce a recognisable piano-like envelope.

**Chords:** Multiple calls to `playNote()` in quick succession (one per frequency). The Web Audio API supports any number of simultaneous oscillators. Three chords are implemented: C major (C4, E4, G4), F major (F4, A4, C5), G major (G4, B4, D5).

### 5.3 Guitar Implementation

**Fret frequency formula:**
```javascript
freq = STRING_DATA[stringIdx].open * Math.pow(2, fret / 12)
```
Each fret raises the pitch by one semitone. Twelve frets up from any open string is exactly one octave (the frequency doubles). This formula is the standard calculation used in all equal-tempered stringed instruments.

**Why sawtooth oscillator:** A sawtooth wave contains both odd and even harmonics at decreasing amplitude. This gives it a buzzy, rich quality that is closer to a plucked string than a sine wave. It is the closest a simple oscillator type gets to a guitar's harmonic series.

**WaveShaperNode (distortion):** The `makeDistortionCurve(amount)` function creates a Float32Array that maps input signal values to output signal values. The formula used is a soft-clipping sigmoid curve:
```javascript
curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x))
```
With `amount = 30`, this adds gentle saturation to the signal, rounding off sharp peaks. The `2x` oversample setting reduces aliasing artifacts at higher frequencies. The effect adds warmth and presence to the raw sawtooth tone.

**Six open string frequencies (standard guitar tuning):**
```
e4  (high E):  329.63 Hz
B3:            246.94 Hz
G3:            196.00 Hz
D3:            146.83 Hz
A2:            110.00 Hz
E2  (low E):   82.41 Hz
```

**Strumming simulation:** The `strumChord()` function iterates over the chord's fret positions and calls `playFret()` with a `setTimeout` that staggers each string by 30ms. This produces the slight sequential onset of a real strum rather than all strings sounding at exactly the same moment.

**Four chords implemented (fret positions per string: e4, B3, G3, D3, A2, E2):**
```
Em:  [0, 0, 0, 2, 2, 0]
Am:  [0, 1, 2, 2, 0, -1]  (-1 = muted string)
G:   [3, 0, 0, 0, 2, 3]
C:   [0, 1, 0, 2, 3, -1]
```
These four chords form one of the most common progressions in popular music (Em, Am, G, C).

### 5.4 Voice and Singing Implementation

**Microphone capture:** `navigator.mediaDevices.getUserMedia({ audio: true, video: false })` requests access to the microphone. The resulting `MediaStream` is passed to an `AudioContext` as a `MediaStreamSource`, and then connected to an `AnalyserNode`.

**Live waveform:** During recording, `requestAnimationFrame` calls `analyser.getByteTimeDomainData(data)` on every frame and draws the resulting waveform onto a `<canvas>` element using Canvas 2D API. The waveform is drawn in the platform's primary gold colour (`#C8960C`).

**Pitch detection:** `detectPitch()` calls `analyser.getByteFrequencyData(data)`, which returns the frequency spectrum. The function searches for the frequency bin with the highest amplitude between 60 Hz and 1000 Hz (the human vocal range). If the peak amplitude is below 25 (silence threshold), it returns `null`. Otherwise it returns the estimated fundamental frequency. This is compared to the reference tone using:
```javascript
const cents = 1200 * Math.log2(detectedFreq / referenceFreq)
```
Within 50 cents of the reference is "on pitch." Outside that range is "too low" or "too high."

**Breathing exercise timer:** The `startBreathing()` function runs a `setInterval` at 1-second intervals. It cycles through three phases: inhale (4 counts), hold (4 counts), exhale (4 counts). A CSS transition on the circular element grows and shrinks to match the phase, giving a visual breathing guide.

**Recordings:** Each recording is stored in the `recordings` state array as a blob URL. Multiple takes are kept so students can listen back and compare across recordings in a single session. The most recent recording is also passed to the parent `SessionPage` via `onAudioReady(base64Data)` for portfolio saving.

### 5.5 Recording: The Key Difference Between Instruments and Voice

**Piano and Guitar:** These use `AudioContext.createMediaStreamDestination()` to create a `MediaStreamAudioDestinationNode`. Every oscillator and effect node in the audio graph is connected to this destination node in addition to the speakers. `MediaRecorder` is then created from `destNode.stream`. This means the recording captures exactly what the synthesiser produces, not the room, not ambient noise, not what the microphone picks up.

**Voice:** There is no synthesiser. `getUserMedia()` captures the microphone directly. `MediaRecorder` records from that microphone stream.

**Why this distinction matters:** For Piano and Guitar, the recording is a clean capture of the student's musical output, suitable for comparing pitch accuracy and note choices across sessions. For Voice, the recording is the student's actual vocal performance. Each approach records what is meaningful for that discipline: synthesised instrument output versus live vocal capture.

---

## 6. Database and Seeding

### 6.1 Data Models

**User**
```
fullName, username (unique), email (unique), password (hashed),
role: 'student' | 'supervisor' | 'admin',
isActive: Boolean,
school: ObjectId ref School (null for admin),
discipline: 'music' | 'visual-arts' | 'graphic-design' | null
```

**School**
```
name (unique), district, province, isActive: Boolean (default false)
```
Schools default to `isActive: false`. The admin must explicitly activate a school in the Schools dashboard before students at that school can access the platform.

**PracticeSession**
```
user: ObjectId ref User,
discipline: String,
durationMinutes: Number,
syncStatus: 'synced' | 'pending',
createdAt: Date
```
A session record is auto-created every time a portfolio item is saved, so the session log reflects actual creative output, not just logins.

**PortfolioItem**
```
user: ObjectId ref User,
session: ObjectId ref PracticeSession,
discipline: String,
title: String,
fileType: String (e.g. 'image/png', 'audio/webm'),
fileData: String (base64 encoded),
syncStatus: 'synced' | 'pending',
createdAt: Date
```

**Module**
```
key: String (unique slug, e.g. 'music'),
name: String,
description: String,
isActive: Boolean (default true)
```

### 6.2 Why We Seed the Database

Registration requires selecting a verified school from the dropdown. If no schools exist in the database, registration is impossible for everyone. Seeding the school list controls exactly who can participate in the pilot: only students who attend one of the five listed schools can register. This protects the integrity of the pilot evaluation data.

Admin and supervisor accounts cannot be created through the public registration form (the form hardcodes `role: 'student'`). They must be created directly in the database. Seeding is the correct and secure way to do this for a pilot where the set of supervisors is known in advance.

### 6.3 What the Seed Creates

**Five pilot schools:**

| School | District |
|---|---|
| G.S Kigeme-A | Nyamagabe |
| G.S Kigeme-B | Nyamagabe |
| G.S Mushubi | Nyamagabe |
| E.S Groupe Scolaire Gitarama | Muhanga |
| E.S Groupe Scolaire Ruhango | Ruhango |

These schools were selected as the pilot cohort. All are government secondary schools with existing computer lab infrastructure in the Southern Province.

**Admin account:**
- Username: `admin`
- Email: `admin@dcip.rw`
- Role: `admin`, no school assignment

**Supervisor accounts (one per school):**

| Username | School |
|---|---|
| sup.kigeme.a | G.S Kigeme-A |
| sup.kigeme.b | G.S Kigeme-B |
| sup.mushubi | G.S Mushubi |
| sup.gitarama | E.S Groupe Scolaire Gitarama |
| sup.ruhango | E.S Groupe Scolaire Ruhango |

**Three modules:**
- `music` — Guitar, piano, and vocal practice
- `visual-arts` — Drawing, painting, and digital illustration
- `graphic-design` — Layout, typography, and digital design

### 6.4 How to Re-run the Seed

```bash
cd Backend
npx ts-node src/seed.ts
```

**What happens if run twice:** The seed script calls `School.deleteMany({})`, `User.deleteMany({ role: { $in: ['admin', 'supervisor'] } })`, and `Module.deleteMany({})` before inserting. This means:
- All schools, admin, and supervisor accounts are deleted and recreated fresh.
- Student accounts are NOT deleted (they are not matched by the delete filter).
- Student session and portfolio data is NOT deleted.
- It is safe to re-run during the pilot to reset supervisor passwords or update the school list.

---

## 7. Key Features Summary

- **Offline-first architecture:** The app shell and all assets are cached by the Service Worker. Portfolio saves queue in IndexedDB and sync automatically on reconnection.
- **Session-based portfolio saving:** Every completed creative session produces a portfolio item (audio or image, base64 encoded) stored against the student's account and linked to a session record.
- **Three creative modules:** Music, Visual Arts, and Graphic Design. Each module has five structured guided steps.
- **Music sub-paths:** Within Music, students choose Guitar, Piano, or Voice and Singing. Each sub-path has its own step sequence and audio interface.
- **Student progress dashboard:** Shows session count, portfolio items, discipline, and school. Progress data comes from the `/api/sessions/stats` endpoint.
- **Role-based access:** Students, Supervisors, and Admins each see a completely different UI. Route guards in React Router redirect users to the correct dashboard based on their JWT role.
- **JWT authentication:** Stateless 7-day tokens. No server-side sessions. Tokens are verified on every protected API call.
- **School-verified registration:** Registration rejects any `schoolId` that does not exist in the database. Students cannot self-register without a valid seeded school.

---

## 8. How to Make Changes

### 8.1 How to Change Piano Notes or Frequencies

Open `Frontend/src/components/modules/music/PianoModule.tsx`.

The `WHITE_KEYS` array at the top defines every key. Each entry has `note`, `freq`, and an optional `sharp` object:

```typescript
{ note: 'C4', freq: 261.63, sharp: { note: 'C#4', freq: 277.18 } }
```

To add a key, append a new object to the array following the same shape. To remove a key, delete its entry. To change a frequency, update the `freq` value. Frequencies must follow equal temperament: `440 * Math.pow(2, semitoneOffset / 12)` where A4 = 440 Hz and `semitoneOffset` is the number of semitones from A4.

### 8.2 How to Change Guitar Tuning or Add Chords

Open `Frontend/src/components/modules/music/GuitarModule.tsx`.

**Tuning:** The `STRING_DATA` array holds each string's open frequency. Change the `open` value to retune a string.

**Chords:** The `CHORD_DATA` array defines each chord. Each entry is:
```typescript
{ id: 'Em', fullName: 'E minor', positions: [0, 0, 0, 2, 2, 0] }
```
`positions` has one entry per string in order `[e4, B3, G3, D3, A2, E2]`. A value of `0` is open, a positive integer is a fret number, and `-1` mutes the string. Add a new object to the array to add a chord.

### 8.3 How to Change Oscillator Type for Any Instrument

The four options are `'sine'`, `'square'`, `'sawtooth'`, `'triangle'`.

- `sine`: pure tone, smooth, almost no harmonics
- `triangle`: slightly brighter than sine, soft
- `square`: hollow, reedy sound (similar to a clarinet)
- `sawtooth`: bright, buzzy, rich in harmonics (closest to guitar or brass)

**Piano** (`PianoModule.tsx`, `playNote()` function): Change `osc1.type = 'sine'` and/or `osc2.type = 'sine'`.

**Guitar** (`GuitarModule.tsx`, `playFret()` function): Change `osc.type = 'sawtooth'`.

### 8.4 How to Adjust the ADSR Envelope

Open `PianoModule.tsx`, find the `playNote()` function. The four lines that control the envelope are:

```javascript
master.gain.setValueAtTime(0, now)                        // start at zero
master.gain.linearRampToValueAtTime(0.5, now + 0.01)     // attack: reach 0.5 in 10ms
master.gain.linearRampToValueAtTime(0.2, now + 0.31)     // decay: fall to 0.2 by 310ms
master.gain.setValueAtTime(0.2, now + 0.4)               // sustain: hold at 0.2 until 400ms
master.gain.linearRampToValueAtTime(0.001, now + 1.3)    // release: fade to silence by 1.3s
```

Increase the attack time (`now + 0.01`) for a softer onset. Decrease the release time (`now + 1.3`) for a more staccato feel. Raise the sustain level (`0.2`) for a longer-sustained tone.

### 8.5 How to Add a New School to the Seed

Open `Backend/src/seed.ts`. Add an entry to the `SCHOOL_SUPERVISORS` array:

```typescript
{
  name: 'G.S Example School',
  district: 'Huye',
  supUsername: 'sup.example',
  supFullName: 'Supervisor Example',
  supEmail: 'sup.example@dcip.rw'
}
```

Then re-run `npx ts-node src/seed.ts`. The seed will delete and recreate all schools and supervisor accounts with the new school included.

### 8.6 How to Add a New API Endpoint

Choose the appropriate route file under `Backend/src/routes/`. For a student-accessible endpoint, add a handler and protect it:

```typescript
import { protect } from '../middleware/authMiddleware'
router.get('/my-new-route', protect, async (req: AuthRequest, res: Response) => {
  // handler logic
})
```

For an admin-only endpoint, add `requireRole('admin')` after `protect`:

```typescript
import { requireRole } from '../middleware/requireRole'
router.get('/admin-only', protect, requireRole('admin'), async (req, res) => {
  // handler logic
})
```

The route file is already mounted in `index.ts`. Any new route added to an existing file is immediately available.

---

## 9. Potential Supervisor Questions and Answers

**Q1: Why did you choose Web Audio API instead of a music library?**

Libraries like Tone.js abstract the Web Audio API but add bundle size and limit control. For this project, we needed direct control over the signal chain (oscillator type, distortion curve, ADSR envelope, routing to a recording destination). The Web Audio API is built into every modern browser, requires no download, and gave us exactly the level of control we needed without any dependency.

**Q2: How does the offline-first architecture actually work in practice during a school session?**

When a student arrives at the school, the app loads from the Service Worker cache instantly, even if the internet is down. They complete their session entirely in the browser. When they save their work, the system tries to POST to the API. If that fails, the item goes into IndexedDB with a `pending` status. The `useSync` hook in the app listens for the browser's `online` event. The moment connectivity returns, whether mid-session or when they next open the browser, all pending items are uploaded and removed from the local queue.

**Q3: How do you ensure students cannot register without a verified school?**

The registration endpoint validates the submitted `schoolId` by calling `School.findById(schoolId)`. If no document is found, registration is rejected with a 400 response. The school dropdown on the registration form is populated by `GET /api/auth/schools`, which returns only schools that exist in the database. Since only the seeded schools exist, only students who select a seeded school can complete registration.

**Q4: Why MongoDB instead of a relational database like PostgreSQL?**

Portfolio items store base64-encoded audio and image files as strings alongside their metadata. MongoDB's flexible document model suits this well because there is no fixed schema for the file content. The data relationships in this project (user has sessions, sessions have portfolio items) are shallow enough that joins are not needed. MongoDB Atlas also provides a free hosted tier which is appropriate for a pilot deployment.

**Q5: How does a student's progress get measured over time?**

Progress is measured through two counts: the number of `PracticeSession` documents linked to the student, and the number of `PortfolioItem` documents saved by the student. A session record is created automatically every time a portfolio item is saved, so the session count directly reflects creative output. Supervisors can view per-student session and portfolio counts through the progress endpoint. The student sees their own counts on the dashboard.

**Q6: Why JWT and not session-based authentication?**

Session-based auth requires the server to store and look up session records on every request. JWT is stateless: the server validates the token cryptographically without any database call. For a small pilot with a simple role structure (three roles, no fine-grained permissions), JWT is simpler to implement and scales better. The 7-day expiry means students do not need to log in every lab visit.

**Q7: How does the piano frequency table relate to real music theory?**

The frequency table uses equal temperament, which is the standard tuning system used in virtually all modern instruments. Each semitone is the previous one multiplied by 2^(1/12), approximately 1.05946. This ensures that every interval (major third, perfect fifth, octave) sounds consistent regardless of which key the music is in. The values in the `WHITE_KEYS` array are the internationally standardised frequencies for each note, with A4 defined as exactly 440 Hz.

**Q8: What happens to student work if the internet goes down mid-session?**

The session continues uninterrupted because the platform is fully functional offline. When the student saves at the end of the session, the save is written to IndexedDB instead of the server. The student sees a visual sync status indicator. Their work is not lost. It uploads automatically the next time their device has a connection, even if that is during a different session or a different day.

**Q9: Why did you choose to seed the database instead of having an admin create schools through the UI?**

The UI exists and works for creating supervisors. Schools are different because they are a fixed pilot list determined before the platform goes live. Seeding them ensures the list is consistent across environments (development, staging, production) and can be recreated from source code. It also means a fresh deployment is fully functional immediately after running one command, without requiring manual data entry through the UI.

**Q10: How does the platform ensure that recording on Piano and Guitar captures instrument output and not microphone noise?**

Piano and Guitar use `AudioContext.createMediaStreamDestination()`. This creates a virtual audio output node inside the Web Audio graph. Every oscillator is connected to this node in addition to the speakers. `MediaRecorder` records from this node's stream, not from the microphone. The microphone is never accessed for Piano or Guitar. Only the Voice module requests microphone access via `getUserMedia`.

**Q11: How does equal temperament tuning relate to the frequency values used?**

Starting from A4 = 440 Hz, every semitone up multiplies by 2^(1/12). Going up 12 semitones doubles the frequency (one octave). Going down 12 halves it. A4 = 440, A#4 = 466.16, B4 = 493.88, C5 = 523.25, and so on. The values in the frequency table are these calculations rounded to two decimal places and hardcoded, so they are stable and do not drift due to floating-point arithmetic at runtime.

**Q12: What is the difference between the Supervisor role and the Administrator role?**

A Supervisor is tied to one specific school. They can only see data for students registered at their school: who is currently active, how many sessions each student has completed, and how many portfolio items they have saved. They cannot see or affect data from other schools. The Administrator has no school assignment and sees the entire platform: all students across all schools, all supervisors, all schools (with the ability to activate or deactivate them), all modules, and aggregate statistics. Only the Administrator can create supervisor accounts or change module availability.

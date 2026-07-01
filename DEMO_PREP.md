# DCIP — Demo Preparation Notes

---

## Analysis of Results

The analysis below maps directly to the three specific objectives stated in the project proposal.

---

### Objective 1 — Requirements specification and contextual review

**Proposed:** Review literature on Rwanda's creative infrastructure gap, collect evidence on geographic concentration of creative facilities and school digital infrastructure limitations, and produce a documented requirements specification validated through field interviews at the pilot school (G.S Kigeme-A, Nyamagabe District).

**Achieved:** The literature review was completed, establishing the design rationale — specifically the 38.2% of Rwandan schools without consistent internet connectivity that motivated the offline-first architecture, and the UNICEF Rwanda (2024) finding on Nyamagabe District's youth disconnection rates. The pilot school was identified and the school registration system was built to restrict sign-up to verified participating institutions, consistent with the requirements specification.

**Limitation:** Formal field interviews at G.S Kigeme-A were constrained by access logistics during development. The ICT supervisor consultation was conducted remotely rather than on-site, which means some context-specific requirements (exact device specifications, lab session length, actual student digital literacy baseline) were estimated rather than directly observed. This did not materially affect the technical build but would strengthen a future formal evaluation phase.

---

### Objective 2 — Design and develop the platform

**Proposed:** A functional browser-based platform with structured creative practice modules for music, visual arts, and graphic design, session-based portfolio saving, offline-first capability, deployable on school laboratory infrastructure without requiring specialist teacher facilitation, passing integration tests across all three creative discipline modules.

**Achieved — fully or exceeded:**

| Proposed requirement | What was delivered |
|---|---|
| Music module | Expanded to three sub-disciplines: Guitar, Piano, and Voice — each with virtual instruments, guided levels, and a studio for saving and replaying recordings |
| Visual Arts module | Fully implemented with a freehand canvas, brush, eraser, shapes, colour picker, and three progressive levels (Learn → Practise → Demonstrate) |
| Graphic Design module | Fully implemented with a poster design canvas, text tool, and three progressive levels |
| Session-based portfolio saving | Implemented via Cloudinary (file storage) and MongoDB (metadata). Works are saved to a personal library with folder organisation and persist across sessions and devices |
| Offline-first capability | Service Worker with Cache-First strategy for the app shell, Network-First for API reads, IndexedDB queue for failed POST/PATCH operations, automatic sync on reconnect |
| No specialist teacher facilitation required | Each level includes self-contained theory content, guided practise exercises, and a canvas or instrument — students work independently |
| School laboratory deployability | Live at https://dcip-rw.online, accessible from any Chromium-based browser, no installation required. Tested on devices matching the REB smart classroom specification (4 GB RAM, 1024×768 minimum resolution) |
| AI-driven feedback | **Not in the proposal — exceeded scope.** The proposal explicitly deferred AI. An AI assistant (Google Gemini 3.1 Flash Lite) was added for real-time course hints, image upload analysis, and automated artwork critique on VA and GD Demonstrate submissions. AI grades are blended with engagement scores: `finalScore = engagement × 0.6 + aiScore × 0.4` |

**Technical scope exceeded — additional services adopted:**

The original technical scope specified MongoDB Atlas as the storage layer for all content, including creative files produced by students. During development, storing images and audio recordings directly in MongoDB caused a critical performance problem: loading a student's saved portfolio took as long as eight minutes in some cases because MongoDB is a document database, not a file delivery system. Binary files stored inside it must be retrieved through the backend server, decoded, and sent to the browser — a slow, resource-heavy path for large files.

To resolve this, **Cloudinary** was adopted as a dedicated cloud media storage and delivery service. Images and audio recordings are now uploaded directly to Cloudinary on save; MongoDB only stores the resulting URL reference and metadata. Cloudinary serves files through a global CDN (Content Delivery Network), meaning a student's saved work loads in under a second from anywhere with an internet connection. This was not a feature addition — it was a necessary correction to make the portfolio system practically usable at the speed a school environment requires.

**Google Gemini API** was adopted as the primary AI model provider, also outside the original technical scope. The proposal explicitly excluded AI-driven feedback. As described in the Discussion section, the decision to add AI grading came from the supervisor's challenge on how to measure whether a student had genuinely done good creative work. Gemini 3.1 Flash Lite was selected because it is vision-capable (can analyse images), free on the available tier (500 requests per day), and responds within 3 seconds — fast enough to not disrupt the student submission experience. OpenRouter was added as a fallback chain to ensure the AI remains available if Gemini hits its daily request limit.

Both additions — Cloudinary and Gemini — were not in the original proposal but were adopted specifically to ensure the platform is fast, reliable, and genuinely serves its purpose without causing the kind of failures (eight-minute load times, unverifiable student work) that would undermine the platform's credibility in a school environment.

The proposal scoped three discipline modules. Five were delivered, broadening access to creative development beyond what was originally planned.

---

### Objective 3 — Evaluate the platform

**Proposed:** Measure whether the platform demonstrably improves access to structured creative practice for identified talented youth at G.S Kigeme-A, using the System Usability Scale (SUS) and qualitative participant feedback, to determine whether it meaningfully addresses the creative development access gap.

**Achieved (partial):** The platform was built to a deployable state and is live at https://dcip-rw.online. The technical evaluation criteria are met — the platform functions across all five discipline modules, handles offline conditions, and has been verified across different hardware and bandwidth environments using Chrome DevTools.

**Limitation:** The formal SUS evaluation with 20–30 pilot students at G.S Kigeme-A has not yet been conducted at the time of this submission. The platform is ready for pilot deployment but the structured participant feedback loop that would generate SUS scores and qualitative data is the immediate next step following this demo. This is the primary gap between what the proposal promised and what this submission delivers — the technical system is complete, but the human evaluation of whether it closes the access gap requires the planned school pilot to proceed.

---

## Discussion

### How the platform evolved through supervisor guidance

The original implementation was straightforward: a student enters the platform, practises on a canvas, and saves their work to a portfolio. That was the initial design — entry, practice, save, done.

The supervisor challenged this with two questions that changed the direction of the entire platform.

**Question 1: "Does your solution really address the gap you identified?"**

The problem statement identified that talented youth in rural Rwanda have no access to structured creative development infrastructure. But a platform where a student simply opens a canvas, draws something, and saves it to a portfolio does not meaningfully close that gap. It gives students a tool but not a path. The supervisor pushed for clarity: what do we actually offer? What does a student walk away with that they did not have before?

This question led to a fundamental redesign. The platform could not just be a canvas with a save button. It needed to offer structured progression — a way for students to start from zero digital creative experience and genuinely develop.

**Question 2: "Are you sure students even have these digital skills?"**

This was a critical observation. Students in rural Rwandan secondary schools are familiar with physical instruments and physical art materials. A virtual piano looks nothing like the piano they may have seen in church or at school. A drawing canvas on a screen behaves differently from paper and pencil. Assuming students could simply sit down and use these tools without preparation would mean the platform fails the moment a student opens it and does not know where to begin.

This led to the decision to add **courses before levels** — structured introductory content that teaches students how to use the virtual tools themselves before any creative assessment begins. A student learning Guitar first reads about the fretboard and understands the digital interface before they attempt Level 1. A Visual Arts student first works through Course 1 and Course 2 before they are asked to produce assessed work on the canvas.

**The design that emerged from these two questions:**

The platform now follows a deliberate progression:

1. **Courses** — build digital tool literacy (reading the fretboard, understanding the virtual piano, working with the canvas)
2. **Levels 1, 2, 3** — structured creative practice with increasing complexity, each ending in a Demonstrate submission that is assessed and graded
3. **Badges** — Beginner, Intermediate, and Advanced, earned by completing each level, giving students a tangible and documented measure of where they are
4. **Studio** — unlocked as a full professional creative space once a student has proven foundational skills through the level system

The Studio is the culmination of the journey, not an isolated feature. A student who reaches the Studio has already demonstrated through assessed work that they can use the tools, understand the principles, and produce work at a recognised level. The Studio then gives them a free, professional-grade creative space — a digital recording studio, art room, and design lab — that does not physically exist in rural schools like G.S Kigeme-A. Everything they produce there is saved to their personal library, organised in folders, and backed up to the cloud.

When that student graduates, they leave with a portfolio of documented creative work that is entirely their own — proof of skills they can show to a community organisation, a creative employer, or a client. They do not need to depend on anyone else's facility or anyone else's validation. The supervisor's direction — "make sure the student gets something" — shaped the whole architecture: courses give skills, levels measure them, badges certify them, and the Studio puts them to independent use.

### The platform as a self-directed creative space — not a classroom

DCIP is not a school subject and does not sit inside the national curriculum. A student enters the platform, follows the structured progression at their own pace, receives feedback from the AI, and produces work in the Studio — entirely independently. No specialist teacher is required and none is assumed to exist, because in most rural schools the platform targets, one does not.

The AI takes the role that a teacher or mentor would otherwise fill. A student who is confused about a concept asks the AI. A student who submits work receives AI critique with a score, written feedback, and specific suggestions. The platform is designed so that the creative development journey is between the student and the platform — not mediated by whoever happens to be in the room.

The school's own supervisor has a different and narrower role: organising when and how students access the school's computer laboratory. That is a logistical responsibility the school manages using its own facilities and its own schedule. It is not a role within DCIP itself. The platform's administration — accounts, school registration, system maintenance — is managed by the developer. The school does not own the platform infrastructure and does not need to in order for students to benefit from it.

### Why each milestone mattered

1. **Authentication and school management** — Foundation for all personalised progress tracking. Without it, no feature could know which student was working or accumulate work to the correct portfolio.
2. **Curriculum and level system** — Defining the three-level, three-stage structure early meant all five disciplines followed the same pattern, keeping the platform consistent and self-directed — no specialist teacher required.
3. **Canvas tools (VA and GD)** — The most technically complex component. Completing it before AI integration meant the AI critique had a reliable image source to assess at submission time.
4. **AI integration** — Added after the supervisor challenged the engagement-only grading model. The two-step critique flow (AI asks for explanation if it cannot assess intent from the image alone) was specifically important for Visual Arts, where student intention matters as much as technical execution.
5. **Studio with folder organisation** — Reframed by the supervisor from a convenience feature to a core outcome of the platform. Students build a real portfolio, not just a history log.
6. **Offline PWA** — Added once the core platform was stable. Without offline capability, the platform would fail exactly in the environments — rural schools with unreliable connectivity — that it was built to serve.

### Impact of results

- Students in schools with unreliable internet can continue studying during outages and have their work synced automatically on reconnect — the platform never loses a session's output due to a dropped connection.
- AI grading gives students immediate, specific written feedback on their VA and GD work at the moment of submission, something a single supervisor managing multiple schools across Rwanda cannot realistically provide manually for every student.
- The Studio creates lasting digital creative infrastructure where none previously existed. A student who completes DCIP leaves with a personal library of documented creative work — a portfolio that travels with them beyond the school gate.
- The engagement scoring model rewards genuine interaction with the canvas rather than time alone, making passive gaming of the system harder.
- The 30-minute inactivity logout and 2-hour JWT token expiry protect student accounts in shared school computer laboratories — a practical concern raised directly by the supervisor given the shared-laptop environment of Rwandan school labs.

---

## Recommendations

### To schools and the education community

- **Integrate DCIP into the existing ICT laboratory schedule.** The platform requires no software installation and no specialist teacher. Schools already equipped under the REB smart classroom programme can begin using it immediately by booking computer lab sessions and pointing students to https://dcip-rw.online.
- **Use DCIP alongside, not instead of, cultural and artistic activities.** The platform develops digital creative skills — it works best when students bring ideas from school performances, art competitions, and community events into their studio work. Supervisors should actively encourage this connection.
- **Treat the studio portfolio as a school achievement record.** Schools can reference a student's DCIP portfolio — the badges earned and the creative works saved — when identifying students for talent development programmes, scholarships, or community creative opportunities.
- **Share access broadly but register students individually.** Every student should have their own account so their portfolio is personal and protected. Sharing accounts undermines the integrity of the progress record.

### To schools and supervisors

The school supervisor's role in relation to DCIP is logistical — organising when students have access to the computer laboratory and ensuring the sessions happen regularly. That is where the school's responsibility ends. The platform itself handles everything else: the curriculum, the assessment, the feedback, and the progression.

- **Arrange consistent laboratory access.** Students need to return to the platform across multiple sessions to progress through the levels and build their studio portfolio. A student who only accesses the platform once gains very little. Regular, scheduled sessions — even one hour per week — make the difference.
- **Let students navigate independently.** The platform is designed to be self-directed. Students should be allowed to explore, make mistakes, ask the AI, and find their own way through the content without being directed or corrected by whoever is in the room. Interfering with that process undermines the independence the platform is built to develop.
- **Do not treat DCIP as a classroom subject.** The school does not own the platform infrastructure and does not need to assign grades, set tasks, or evaluate student work. The AI provides assessment. The school's contribution is access — nothing more is required.

### To students

- **Build your studio portfolio deliberately.** Every piece of work you save is yours permanently. Think of each studio session as building a record of what you can do — not just practice that disappears when you close the browser.
- **Use the AI chat as a teacher that is always available.** You can type any question, highlight confusing text from a lesson, or upload a photo of anything you want to understand better — a musical instrument, a painting, a design you saw somewhere. The AI is there to help you learn, not just to grade you.
- **Progress through the levels in order.** The courses and levels are designed so that each one builds on the last. Rushing to the studio without completing the levels means missing foundational skills that will limit what you can create there.

### Future implementations

These are the directions in which DCIP should grow beyond this version:

**Expand AI across all disciplines**
Audio AI is not implemented. The platform records student performances for Guitar, Piano, and Voice but sends them nowhere for analysis. A future version would pipe those recordings to a speech/audio model and return a score the same way the image critique works today.

**Mobile application**
The current platform is browser-based and optimised for laptop screens. Many Rwandan secondary school students have access to a smartphone but not always to a school laptop outside of scheduled lab sessions. An Android application would allow students to continue learning, review course content, and access their studio portfolio from their own device at any time — extending the platform's reach beyond the school gate and the laboratory timetable.

**Kinyarwanda language support**
Delivering course content and AI responses in Kinyarwanda would remove the language barrier for students whose English literacy is limited. This is particularly relevant for the rural schools the platform targets, where English is the medium of instruction but not the primary language of thought. A Kinyarwanda interface would make the platform genuinely accessible rather than technically accessible.

**Community and alumni network**
Once a student completes the full level system and builds a studio portfolio, there is currently no pathway within the platform to connect them with opportunities outside it — creative jobs, community projects, youth programmes, or other students working in the same discipline. A future version could include a community layer where graduates share selected works publicly, connect with peers across schools, and attract the attention of organisations looking for young creative talent in Rwanda.

**Formal integration with Rwanda's national curriculum**
The platform was designed to be deployable in schools but is not yet formally recognised within Rwanda's Basic Education Board curriculum. Working with REB to align DCIP's discipline modules with the national creative arts syllabus, and to have the badges recognised as supplementary academic records, would give the platform institutional legitimacy and create a pathway for wider adoption across Rwanda's 30 districts.

---

## Demo Video — Shot List (5 minutes)

> Record a screen recording of the live site at https://dcip-rw.online using Chrome.
> You do NOT need to turn off your Wi-Fi to show offline mode — use Chrome DevTools Network throttling instead.

### Minute 1 — First impression (already logged in as student)
- Open the live site — it redirects straight to the disciplines page (not the homepage) because JWT keeps the student logged in across tabs
- Show the student dashboard with progress summary and any badges earned
- Show the discipline selection page with all five disciplines visible

### Minute 2 — Learning with AI
- Open a Visual Arts or Graphic Design Level Learn page
- Highlight a sentence on the page → show the Ask AI bubble appearing above the selection → click it → show AI answering in the chat panel
- Type a follow-up question → show the full conversation history staying visible as a proper chat
- Briefly show the canvas and drawing tools (brush, eraser, colour picker, shapes)

### Minute 3 — AI grading on Demonstrate
- Go to a Visual Arts or Graphic Design Demonstrate page
- Draw or design something on the canvas
- Click Submit and Continue
- Show the AI loading overlay ("AI is analysing your work...")
- Show the result modal with the AI score, written feedback, and improvement suggestions

### Minute 4 — Studio and security
- Open My Studio Works (studio page)
- Show saved works organised inside folders
- Open a new browser tab and navigate to the site — show it goes straight to the disciplines page, not the homepage, proving JWT recognition across tabs
- Briefly mention the inactivity logout (30 min → warning → auto logout) to address the shared lab security concern

### Minute 5 — Offline mode via Chrome DevTools (no Wi-Fi needed)
- Press F12 to open DevTools → click the Network tab
- Change throttling dropdown from No throttling to **Slow 3G**
- Reload the page → show it loads fully from Service Worker cache despite the slow connection
- Change throttling to **Offline**
- Navigate between course pages → show pages still load
- Point out the offline banner appearing at the top of the screen
- Change back to **No throttling** → show the sync toast "Your work has been synced" appearing

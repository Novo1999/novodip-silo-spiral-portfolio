# Master Prompt for Antigravity — 3D Exterior Cutaway Silo Pipe Portfolio

Copy and paste the prompt below directly into **Antigravity**:

---

Build and run a modern, high-performance 3D interactive portfolio for **Novodip** (`Frontend Developer / React & Next.js Specialist`) using **Next.js (App Router)**, **React Three Fiber (`@react-three/fiber`)**, **`@react-three/drei`**, **`@react-three/postprocessing`**, **GSAP**, **Zustand**, and **Tailwind CSS**.

### 1. VISUAL FRAMING & 3D SCENE: "THE EXTERIOR CUTAWAY SILO PIPE"
- **Exterior Viewpoint (Outside Looking In):**
  - The camera is positioned **outside** a massive, wide vertical cylindrical industrial/brutalist silo pipe (`camera.position = [0, currentFloorY, 17.5]`, `fov = 42`).
  - On the user's monitor, the vertical silo pipe occupies the **center ~55%–65% of the screen width**, leaving clean dark atmospheric margin space on both the **left and right sides** of the cylinder so the user clearly sees the **outside structure of the silo pipe** (heavy horizontal concrete collar rings, vertical steel buttress columns on the left/right flanks, neon floor indicator rings, and rim lighting grazing the outer edges of the cylinder).
- **Front Cutaway Cross-Section Window:**
  - The front-facing wall of the silo cylinder has a wide vertical **cutaway opening** (created via `cylinderGeometry` with `thetaStart = 0.58` and `thetaLength = Math.PI * 2 - 1.16`, framed by heavy vertical steel jambs on the left and right edges of the opening).
  - Through this front cutaway window, the user looks directly **inside the silo chamber** where a **3D helical spiral staircase** winds around a central structural spine column from bottom to top.
- **6 Floor Levels (Bottom to Top):**
  - `Floor 00 (Level 0)`: Intro / Hero (`+0.0m`)
  - `Floor 01 (Level 1)`: Experience (`+8.0m`)
  - `Floor 02 (Level 2)`: Featured & Selected Work (`+16.0m`)
  - `Floor 03 (Level 3)`: Capabilities & Skills (`+24.0m`)
  - `Floor 04 (Level 4)`: About Me (`+32.0m`)
  - `Floor 05 (Level 5)`: Contact (`+40.0m`)

### 2. SYNCHRONIZED TWO-STAGE ANIMATION (STAIR ASCENT + "BLACK OPENING UP" REVEAL)
Whenever the user presses the **Up Arrow** button (or **Down Arrow** button, scrolls the wheel, or uses the right-hand floor selector):
1. **Stage 1 — Black Shutter Closes & 3D Stairs Animate Up/Down:**
   - The currently open section overlay smoothly collapses/closes (`isPanelOpen = false`, `isTransitioning = true`) so the user has an unobstructed view of the 3D silo pipe.
   - Simultaneously, **GSAP** (`power3.inOut`, `duration: 1.35s`) tweens the camera vertically along the outside of the silo pipe to the target floor (`y = floorIndex * floorHeight`) while **rotating the interior 3D spiral staircase** (`stairGroupRef.current.rotation.y = -floorProgress * Math.PI * 2`) so the stairs visibly wind upward/downward inside the pipe and bring the target floor's landing platform to face the front cutaway window.
2. **Stage 2 — "Black Opening Up" Section Reveal (`onComplete`):**
   - The moment the camera arrives at the target floor landing, a **sleek matte-black architectural shutter / portal opens up** from the center (`scale-y-0` to `scale-y-100` with glowing top and bottom accent seam lines) over the cutaway window, revealing that floor's portfolio content with polished dark editorial cards, crisp typography, and interactive controls.
   - Include a `"PEEK INSIDE SILO"` toggle button in the top bar so the user can collapse/re-open the black section portal at any time to admire the 3D interior staircase.

### 3. EXACT PORTFOLIO DATA (`data/portfolio.ts`)
Use Novodip's exact portfolio data:
- **Profile:** Name: `Novodip`, Title: `Frontend Developer / React & Next.js Specialist`, Tagline: `Building fast, scalable, and elegant web applications with modern technologies.`, Location: `Dhaka, BD / 2026`, Email: `neptune.navo@gmail.com`, Status: `Available for work`, Socials: GitHub (`https://github.com`), LinkedIn (`https://linkedin.com`), Resume (`/resume.pdf`).
- **Experience:**
  1. `2025 — 2026` — `Junior Software Engineer (Frontend)` at `Dhrubok Infotech Services Ltd.` (TaskaTask Admin Panel in Next.js, TaskaTask mobile app in Expo & React Native, Redux state management).
  2. `2024 — 2025` — `Junior Frontend Developer (Remote)` at `Wensyve` (Scalable web apps with Next.js & React, performance optimization & clean architecture, responsive UX).
- **Projects (with category filter tabs):**
  1. `Docuflash` (`Featured`, `https://docuflash-frontend.vercel.app`) — `["Next.js 16", "React 19", "Tailwind v4", "HeroUI", "UploadThing", "TypeScript"]`
  2. `Docuflash Mobile` (`Mobile / Expo`) — `["Expo SDK 56", "React Native", "React 19", "Expo Router", "UploadThing", "TypeScript"]`
  3. `Moneymate` (`Featured`, `https://moneymatefinance.vercel.app`) — `["Next.js", "React", "Tailwind CSS", "Express.js", "PostgreSQL"]`
  4. `MoneyMate Mobile` (`Mobile / Expo`) — `["Expo SDK 56", "React Native", "React 19", "Expo Router", "Jotai", "TypeScript"]`
  5. `TaskaTask` (`Enterprise Mobile`) — `["React Native", "Expo", "Redux Toolkit", "TypeScript"]`
  6. `ResumeFeed` (`Fullstack`, `https://resumefeed-web.vercel.app`) — `["Next.js 16", "React 19", "Turborepo", "Supabase Auth", "Express", "PostgreSQL"]`
  7. `Chesspacito` (`Realtime Game`, `https://chesspacito.web.app`) — `["React 18", "TypeScript", "Vite", "Firebase RTDB", "chess.js", "Base UI"]`
- **Capabilities:**
  - `frontendAndMobile`: `["React", "Next.js", "React Native", "Expo", "TypeScript", "Tailwind CSS", "Redux Toolkit"]`
  - `backend`: `["Node.js", "Express.js", "MongoDB", "REST APIs", "PostgreSQL"]`
  - `tools`: `["Git", "Docker", "Vercel"]`
- **About:**
  - `headline`: `"Crafting digital experiences with precision."`
  - `bio`: `"I'm a frontend developer focused on building modern web and mobile applications that are fast, accessible, and thoughtfully designed. I primarily work with Next.js, React, React Native, TypeScript, and Tailwind CSS to create responsive interfaces and smooth user experiences across platforms. Beyond the interface, I also have experience with Node.js and PostgreSQL, valuing clean architecture, performance, and maintainable code."`

### 4. EXECUTION STEPS FOR ANTIGRAVITY
1. Install dependencies with `npm install --legacy-peer-deps`.
2. Verify TypeScript compilation via `npx tsc --noEmit`.
3. Start the Next.js dev server with `npm run dev` and verify the exterior cutaway silo pipe, rotating spiral staircase animation, and the black shutter opening transition across all 6 floors.

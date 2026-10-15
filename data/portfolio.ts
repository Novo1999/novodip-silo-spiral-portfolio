export interface ExperienceItem {
  period: string;
  role: string;
  company: string;
  highlights: string[];
}

export type ProjectCategory = "Featured" | "Mobile" | "Web Apps" | "Client Work";

/**
 * Hover preview for the Selected Work floor:
 * - "web": a single desktop screenshot
 * - "mobile": three phone screens fanned out
 */
export interface ProjectPreview {
  kind: "web" | "mobile";
  images: { src: string; alt: string }[];
}

export interface ProjectItem {
  id: string;
  title: string;
  /** Short label shown beside the title */
  tag: string;
  /** Filter tab the project belongs to */
  category: ProjectCategory;
  description: string;
  stack: string[];
  preview: ProjectPreview;
  liveUrl?: string;
  frontendUrl?: string;
  backendUrl?: string;
  /** Demo video for projects without a public live URL */
  demoUrl?: string;
}

export const PROJECT_CATEGORIES: ("All" | ProjectCategory)[] = [
  "All",
  "Featured",
  "Mobile",
  "Web Apps",
  "Client Work"
];

const web = (id: string, title: string): ProjectPreview => ({
  kind: "web",
  images: [{ src: `/projects/${id}.webp`, alt: `${title} website screenshot` }]
});

const mobile = (id: string, alts: [string, string, string]): ProjectPreview => ({
  kind: "mobile",
  images: alts.map((alt, i) => ({ src: `/projects/${id}-${i + 1}.webp`, alt }))
});

export interface SiloLevelConfig {
  index: number;
  id: string;
  code: string;
  floorNumber: string;
  label: string;
  shortTitle: string;
  subtitle: string;
  elevationMeters: number;
  accentColor: string;
}

export const SILO_LEVELS: SiloLevelConfig[] = [
  {
    index: 0,
    id: "hero",
    code: "FLR // 00",
    floorNumber: "00",
    label: "Level 0: Intro / Hero",
    shortTitle: "Intro / Hero",
    subtitle: "Ground Foundation — Silo Entry Chamber",
    elevationMeters: 0.0,
    accentColor: "#ffb24a"
  },
  {
    index: 1,
    id: "experience",
    code: "FLR // 01",
    floorNumber: "01",
    label: "Level 1: Experience",
    shortTitle: "Experience",
    subtitle: "Production Engineering & Frontend Architecture",
    elevationMeters: 8.0,
    accentColor: "#ff8c1f"
  },
  {
    index: 2,
    id: "projects",
    code: "FLR // 02",
    floorNumber: "02",
    label: "Level 2: Featured & Selected Work",
    shortTitle: "Selected Work",
    subtitle: "Shipped Web & Mobile Platforms",
    elevationMeters: 16.0,
    accentColor: "#ffc966"
  },
  {
    index: 3,
    id: "capabilities",
    code: "FLR // 03",
    floorNumber: "03",
    label: "Level 3: Capabilities & Skills",
    shortTitle: "Capabilities & Skills",
    subtitle: "Frontend, Mobile, Backend & Infrastructure",
    elevationMeters: 24.0,
    accentColor: "#f26b0f"
  },
  {
    index: 4,
    id: "about",
    code: "FLR // 04",
    floorNumber: "04",
    label: "Level 4: About Me",
    shortTitle: "About Me",
    subtitle: "Engineering Philosophy & Craft",
    elevationMeters: 32.0,
    accentColor: "#ffd98a"
  },
  {
    index: 5,
    id: "contact",
    code: "FLR // 05",
    floorNumber: "05",
    label: "Level 5: Contact",
    shortTitle: "Contact",
    subtitle: "Upper Silo Crown — Direct Transmission",
    elevationMeters: 40.0,
    accentColor: "#ff9a3c"
  }
];

/**
 * Exterior Cutaway Silo Pipe & Interior Helical Staircase Constants
 * - The user views the massive vertical silo pipe from the OUTSIDE.
 * - The pipe fills the central ~60% of the viewport width with clean dark architectural space on the left and right.
 * - A front cutaway opening reveals the interior spiral staircase and floor landings inside the pipe.
 */
export const SILO_GEOMETRY = {
  outerPipeRadius: 6.4,      // Wide central cylindrical silo pipe (~58% of a 16:9 viewport at z = 17.5 / fov 42)
  innerWallRadius: 5.95,      // Inner concrete liner radius
  coreColumnRadius: 1.35,     // Central structural spine inside the silo
  stairRadius: 3.8,          // Radius of the helical spiral steps inside the pipe
  floorHeight: 8.0,          // Vertical distance between major floor landings (+8.0m per floor)
  stepsPerFloor: 20,         // 20 spiral steps per floor (one full helix turn per floor)
  totalSteps: 100,           // 5 floor intervals x 20 steps
  cameraDistanceZ: 17.5,     // Exterior camera distance looking straight at the silo pipe
  cameraFov: 42,
  cutawayHalfAngle: 0.58     // thetaStart = 0.58, thetaLength = 2PI - 1.16 -> front cutaway window
} as const;

export const portfolioData = {
  profile: {
    name: "Novodip",
    title: "Frontend Developer / React & Next.js Specialist",
    tagline:
      "Building fast, scalable, and elegant web applications with modern technologies.",
    location: "Dhaka, BD / 2026",
    email: "neptune.navo@gmail.com",
    status: "Available for work",
    socials: {
      github: "https://github.com/Novo1999",
      linkedin: "https://www.linkedin.com/in/novodip/",
      resume: "/resume.pdf"
    }
  },
  experience: [
    {
      period: "2025 — 2026",
      role: "Junior Software Engineer (Frontend)",
      company: "Dhrubok Infotech Services Ltd.",
      highlights: [
        "Designed and developed the TaskaTask Admin Panel using Next.js.",
        "Built the TaskaTask mobile application using Expo and React Native.",
        "Implemented state management with Redux for scalable mobile architecture."
      ]
    },
    {
      period: "2024 — 2025",
      role: "Junior Frontend Developer (Remote)",
      company: "Wensyve",
      highlights: [
        "Built scalable web applications with Next.js and React.",
        "Focused on performance optimization and clean architecture.",
        "Delivered polished and responsive user experiences for clients."
      ]
    }
  ] as ExperienceItem[],
  projects: [
    {
      id: "docuflash",
      title: "Docuflash",
      tag: "Featured",
      category: "Featured",
      description:
        "Instant, no-signup file sharing — upload PDFs, docs, and archives to get shareable links in seconds, with password protection and auto-expiry.",
      stack: [
        "Next.js 16",
        "React 19",
        "Tailwind v4",
        "HeroUI",
        "UploadThing",
        "TypeScript"
      ],
      preview: web("docuflash", "Docuflash"),
      liveUrl: "https://docuflash-frontend.vercel.app/",
      frontendUrl: "https://github.com/Novo1999/docuflash-frontend",
      backendUrl: "https://github.com/Novo1999/Docuflash-Backend"
    },
    {
      id: "docuflash-mobile",
      title: "Docuflash Mobile",
      tag: "Mobile / Expo",
      category: "Mobile",
      description:
        "The React Native companion to Docuflash — pick up to 5 files, lock them behind a password, and hand out encrypted links that self-delete after 1 hour to 30 days. Native Google Sign-In, secure session storage, and light/dark theming.",
      stack: [
        "Expo SDK 56",
        "React Native",
        "React 19",
        "Expo Router",
        "UploadThing",
        "TypeScript"
      ],
      preview: mobile("docuflash-mobile", [
        "Docuflash Mobile upload screen",
        "Docuflash Mobile uploads list",
        "Docuflash Mobile profile screen"
      ]),
      frontendUrl: "https://github.com/Novo1999/docuflash-mobile",
      backendUrl: "https://github.com/Novo1999/Docuflash-Backend"
    },
    {
      id: "moneymate",
      title: "Moneymate",
      tag: "Featured",
      category: "Featured",
      description:
        "A modern finance platform built with Next.js, Tailwind, PostgreSQL and Express to manage your personal financial transaction history.",
      stack: ["Next.js", "React", "Tailwind", "Express.js", "PostgreSQL"],
      preview: web("moneymate", "Moneymate"),
      liveUrl: "https://moneymatefinance.vercel.app/",
      frontendUrl: "https://github.com/Novo1999/moneymate-frontend",
      backendUrl: "https://github.com/Novo1999/moneymate-backend"
    },
    {
      id: "moneymate-mobile",
      title: "MoneyMate Mobile",
      tag: "Mobile / Expo",
      category: "Mobile",
      description:
        "The native client for MoneyMate, sharing the web app's backend and API contracts. Balance hero and category spending donut, day-grouped transactions with filters, account cards with transfers, and native Google sign-in with tokens in secure storage.",
      stack: [
        "Expo SDK 56",
        "React Native",
        "React 19",
        "Expo Router",
        "Jotai",
        "TypeScript"
      ],
      preview: mobile("moneymate-mobile", [
        "MoneyMate Mobile transactions list, filtered and grouped by day",
        "MoneyMate Mobile dashboard with balance hero and spending donut",
        "MoneyMate Mobile accounts screen showing net worth"
      ]),
      frontendUrl: "https://github.com/Novo1999/moneymate-mobile",
      backendUrl: "https://github.com/Novo1999/moneymate-backend"
    },
    {
      id: "taskatask",
      title: "TaskaTask",
      tag: "Enterprise Mobile",
      category: "Mobile",
      description:
        "A field-service mobile app built at Dhrubok Infotech — in-app chat, live maps & geolocation, and task scheduling. Shipped with Expo & React Native, state managed with Redux.",
      stack: ["React Native", "Expo", "Redux Toolkit", "TypeScript"],
      preview: mobile("taskatask", [
        "TaskaTask in-app chat",
        "TaskaTask live map",
        "TaskaTask create task screen"
      ]),
      demoUrl: "https://www.youtube.com/watch?v=K2l2Umhyirk"
    },
    {
      id: "resumefeed",
      title: "ResumeFeed",
      tag: "Fullstack",
      category: "Web Apps",
      description:
        "A resume feedback network — post a resume to a shared feed and get a 1–5 star rating, quick reactions, and Reddit-style threaded comments. A Turborepo monorepo pairing a Next.js app with an Express/TypeORM API on Supabase Auth and Postgres.",
      stack: [
        "Next.js 16",
        "React 19",
        "Turborepo",
        "Supabase Auth",
        "Express",
        "PostgreSQL"
      ],
      preview: web("resumefeed", "ResumeFeed"),
      liveUrl: "https://resumefeed-web.vercel.app/",
      frontendUrl: "https://github.com/Novo1999/resume-feed"
    },
    {
      id: "chesspacito",
      title: "Chesspacito",
      tag: "Realtime Game",
      category: "Web Apps",
      description:
        "Realtime 2v2 chess — two players per side command one army, alternating turns. No backend at all: Firebase security rules referee every move, alongside seat claiming, team clocks, and a 3,800-position openings database.",
      stack: [
        "React 18",
        "TypeScript",
        "Vite",
        "Firebase RTDB",
        "chess.js",
        "Base UI"
      ],
      preview: web("chesspacito", "Chesspacito"),
      liveUrl: "https://chesspacito.web.app/",
      frontendUrl: "https://github.com/Novo1999/2v2-chess"
    },
    {
      id: "flowboard",
      title: "Flowboard",
      tag: "Fullstack",
      category: "Web Apps",
      description:
        "A Kanban-style task management system with drag-and-drop workflow management and a full-stack architecture.",
      stack: ["React", "Tailwind", "Node.js", "MongoDB"],
      preview: web("flowboard", "Flowboard"),
      liveUrl: "https://kanban-novo-frontend.vercel.app/",
      frontendUrl: "https://github.com/Novo1999/Kanban-Frontend",
      backendUrl: "https://github.com/Novo1999/Kanban-Backend"
    },
    {
      id: "kartigo",
      title: "Kartigo",
      tag: "E-commerce",
      category: "Web Apps",
      description:
        "A full-stack e-commerce platform with product browsing, shopping workflows, and backend services powered by MongoDB.",
      stack: ["Next.js", "React", "Tailwind", "MongoDB"],
      preview: web("kartigo", "Kartigo"),
      liveUrl: "https://kartigo.vercel.app/",
      frontendUrl: "https://github.com/Novo1999/kartigo-nextt"
    },
    {
      id: "remotejumbo",
      title: "RemoteJumbo",
      tag: "Fullstack",
      category: "Web Apps",
      description:
        "A remote job listing platform built with a full-stack architecture enabling job discovery and posting workflows.",
      stack: ["Next.js", "React", "Tailwind", "Node.js", "MongoDB"],
      preview: web("remotejumbo", "RemoteJumbo"),
      liveUrl: "https://remotejumbo.vercel.app/",
      frontendUrl: "https://github.com/Novo1999/Remote-Job",
      backendUrl: "https://github.com/Novo1999/RemoteJumbo---Backend"
    },
    {
      id: "upliftt",
      title: "Upliftt",
      tag: "Client Work",
      category: "Client Work",
      description:
        "A modern web platform built with Next.js and Tailwind focused on clean UI and performance-driven frontend architecture.",
      stack: ["Next.js", "React", "Tailwind"],
      preview: web("upliftt", "Upliftt"),
      liveUrl: "https://novodip.vercel.app/projects/uplift"
    },
    {
      id: "clinician",
      title: "The Clinician",
      tag: "Client Work",
      category: "Client Work",
      description:
        "A healthcare-focused web platform delivering medical resources and information with a fast and responsive Next.js frontend.",
      stack: ["Next.js", "React", "Tailwind"],
      preview: web("clinician", "The Clinician"),
      liveUrl: "https://theclinician.org/en"
    },
    {
      id: "bin-mahmud",
      title: "Bin Mahmud",
      tag: "Client Work",
      category: "Client Work",
      description:
        "E-commerce website built with Next.js featuring multilingual support and a modern responsive UI.",
      stack: ["Next.js", "React", "Tailwind"],
      preview: web("bin-mahmud", "Bin Mahmud"),
      liveUrl: "https://binmahmud.com/en"
    },
    {
      id: "mediverse",
      title: "Mediverse",
      tag: "Client Work",
      category: "Client Work",
      description:
        "Medical services platform built with Next.js emphasizing responsive design, usability, and optimized frontend performance.",
      stack: ["Next.js", "React", "Tailwind"],
      preview: web("mediverse", "Mediverse"),
      liveUrl: "https://mediversebd.com/"
    }
  ] as ProjectItem[],
  capabilities: {
    frontendAndMobile: [
      "React",
      "Next.js",
      "React Native",
      "Expo",
      "TypeScript",
      "Tailwind CSS",
      "Redux Toolkit"
    ],
    backend: ["Node.js", "Express.js", "MongoDB", "REST APIs", "PostgreSQL"],
    tools: ["Git", "Docker", "Vercel"]
  },
  about: {
    headline: "Crafting digital experiences with precision.",
    bio: "I'm a frontend developer focused on building modern web and mobile applications that are fast, accessible, and thoughtfully designed. I primarily work with Next.js, React, React Native, TypeScript, and Tailwind CSS to create responsive interfaces and smooth user experiences across platforms. Beyond the interface, I also have experience with Node.js and PostgreSQL, valuing clean architecture, performance, and maintainable code."
  }
};

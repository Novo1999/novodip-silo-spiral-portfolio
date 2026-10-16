/**
 * Portfolio content lives in the JSON files next to this module — edit those,
 * not this file:
 *
 *   profile.json     name, title, tagline, location, status, email, socials
 *   experience.json  jobs (role, company, period, description bullets)
 *   projects.json    filter categories + projects (links, stack, preview images)
 *   skills.json      skill groups shown on the Capabilities floor
 *   about.json       About floor heading, paragraphs and facts
 *   contact.json     Contact floor blurb
 *   seo.json         page title, description, keywords, structured data
 *
 * Everything is validated at build time, so a typo in the JSON fails
 * `next build` with a message naming the file and field instead of
 * shipping a broken page.
 */
import profileJson from "./profile.json";
import experienceJson from "./experience.json";
import projectsJson from "./projects.json";
import skillsJson from "./skills.json";
import aboutJson from "./about.json";
import contactJson from "./contact.json";
import seoJson from "./seo.json";

export interface Profile {
  name: string;
  title: string;
  tagline: string;
  location: string;
  status: string;
  email: string;
  socials: { github: string; linkedin: string; resume: string };
}

export interface ExperienceItem {
  period: string;
  role: string;
  company: string;
  highlights: string[];
}

export type ProjectCategory = string;

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

export interface SkillGroup {
  title: string;
  skills: string[];
}

export interface AboutContent {
  heading: string;
  paragraphs: string[];
  facts: { label: string; value: string }[];
}

export interface SeoContent {
  siteUrl: string;
  siteName: string;
  title: string;
  description: string;
  keywords: string[];
  person: {
    jobTitle: string;
    image: string;
    locality: string;
    country: string;
    knowsAbout: string[];
  };
}

/* ------------------------------------------------------------------ */
/* JSON validation                                                     */
/* ------------------------------------------------------------------ */

type Json = Record<string, unknown>;

function fail(where: string, message: string): never {
  throw new Error(`[data] ${where}: ${message}`);
}

function obj(value: unknown, where: string): Json {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(where, "must be an object");
  }
  return value as Json;
}

function str(value: unknown, where: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    fail(where, "must be a non-empty string");
  }
  return value;
}

/** Optional links may be "" or missing in the JSON */
function optionalUrl(value: unknown, where: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return str(value, where);
}

function list<T>(
  value: unknown,
  where: string,
  item: (v: unknown, w: string) => T
): T[] {
  if (!Array.isArray(value)) fail(where, "must be an array");
  return value.map((v, i) => item(v, `${where}[${i}]`));
}

function parseProfile(raw: unknown): Profile {
  const f = "profile.json";
  const p = obj(raw, f);
  const socials = obj(p.socials, `${f} socials`);
  return {
    name: str(p.name, `${f} name`),
    title: str(p.title, `${f} title`),
    tagline: str(p.tagline, `${f} tagline`),
    location: str(p.location, `${f} location`),
    status: str(p.status, `${f} status`),
    email: str(p.email, `${f} email`),
    socials: {
      github: str(socials.github, `${f} socials.github`),
      linkedin: str(socials.linkedin, `${f} socials.linkedin`),
      resume: str(socials.resume, `${f} socials.resume`)
    }
  };
}

function parseExperience(raw: unknown): ExperienceItem[] {
  const f = "experience.json";
  return list(obj(raw, f).experiences, `${f} experiences`, (v, w) => {
    const e = obj(v, w);
    return {
      role: str(e.role, `${w}.role`),
      company: str(e.company, `${w}.company`),
      period: str(e.period, `${w}.period`),
      highlights: list(e.description, `${w}.description`, str)
    };
  });
}

function parseProjects(raw: unknown): {
  categories: string[];
  projects: ProjectItem[];
} {
  const f = "projects.json";
  const root = obj(raw, f);
  const categories = list(root.categories, `${f} categories`, str);
  const seen = new Set<string>();

  const projects = list(root.projects, `${f} projects`, (v, w) => {
    const p = obj(v, w);
    const id = str(p.id, `${w}.id`);
    if (seen.has(id)) fail(f, `duplicate project id "${id}"`);
    seen.add(id);

    const category = str(p.category, `${w}.category`);
    if (!categories.includes(category)) {
      fail(
        w,
        `(${id}) has category "${category}" — add it to "categories" or use one of: ${categories.join(", ")}`
      );
    }

    const preview = obj(p.preview, `${w}.preview`);
    const kind = preview.kind;
    if (kind !== "web" && kind !== "mobile") {
      fail(`${w}.preview.kind`, `(${id}) must be "web" or "mobile"`);
    }
    const images = list(preview.images, `${w}.preview.images`, (img, iw) => {
      const o = obj(img, iw);
      return { src: str(o.src, `${iw}.src`), alt: str(o.alt, `${iw}.alt`) };
    });
    if (kind === "web" && images.length < 1) {
      fail(`${w}.preview`, `(${id}) needs at least 1 image for a web preview`);
    }
    if (kind === "mobile" && images.length !== 3) {
      fail(`${w}.preview`, `(${id}) needs exactly 3 phone screens for a mobile preview`);
    }

    return {
      id,
      title: str(p.title, `${w}.title`),
      tag: str(p.tag, `${w}.tag`),
      category,
      description: str(p.description, `${w}.description`),
      stack: list(p.stack, `${w}.stack`, str),
      preview: { kind: kind as ProjectPreview["kind"], images },
      liveUrl: optionalUrl(p.live, `${w}.live`),
      frontendUrl: optionalUrl(p.frontend, `${w}.frontend`),
      backendUrl: optionalUrl(p.backend, `${w}.backend`),
      demoUrl: optionalUrl(p.demo, `${w}.demo`)
    };
  });

  return { categories, projects };
}

function parseSkills(raw: unknown): SkillGroup[] {
  const f = "skills.json";
  return list(obj(raw, f).groups, `${f} groups`, (v, w) => {
    const g = obj(v, w);
    return {
      title: str(g.title, `${w}.title`),
      skills: list(g.skills, `${w}.skills`, str)
    };
  });
}

function parseAbout(raw: unknown): AboutContent {
  const f = "about.json";
  const a = obj(raw, f);
  return {
    heading: str(a.heading, `${f} heading`),
    paragraphs: list(a.paragraphs, `${f} paragraphs`, str),
    facts: list(a.facts, `${f} facts`, (v, w) => {
      const o = obj(v, w);
      return { label: str(o.label, `${w}.label`), value: str(o.value, `${w}.value`) };
    })
  };
}

function parseSeo(raw: unknown): SeoContent {
  const f = "seo.json";
  const s = obj(raw, f);
  const person = obj(s.person, `${f} person`);
  return {
    siteUrl: str(s.siteUrl, `${f} siteUrl`),
    siteName: str(s.siteName, `${f} siteName`),
    title: str(s.title, `${f} title`),
    description: str(s.description, `${f} description`),
    keywords: list(s.keywords, `${f} keywords`, str),
    person: {
      jobTitle: str(person.jobTitle, `${f} person.jobTitle`),
      image: str(person.image, `${f} person.image`),
      locality: str(person.locality, `${f} person.locality`),
      country: str(person.country, `${f} person.country`),
      knowsAbout: list(person.knowsAbout, `${f} person.knowsAbout`, str)
    }
  };
}

const parsedProjects = parseProjects(projectsJson);

/** Filter tabs on the Selected Work floor */
export const PROJECT_CATEGORIES: string[] = ["All", ...parsedProjects.categories];

export const seoData: SeoContent = parseSeo(seoJson);

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
  profile: parseProfile(profileJson),
  experience: parseExperience(experienceJson),
  projects: parsedProjects.projects,
  skills: parseSkills(skillsJson),
  about: parseAbout(aboutJson),
  contact: {
    description: str(
      obj(contactJson, "contact.json").description,
      "contact.json description"
    )
  }
};

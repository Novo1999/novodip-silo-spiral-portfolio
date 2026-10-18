"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Repeat,
  Volume2,
  VolumeX
} from "lucide-react";
import {
  portfolioData,
  PROJECT_CATEGORIES,
  SILO_LEVELS,
  type ProjectItem
} from "@/data/portfolio";
import { useSiloStore } from "@/store/useSiloStore";
import ProjectHoverPreview from "@/components/ui/ProjectHoverPreview";

const eyebrow =
  "font-mono text-[11px] uppercase tracking-[0.28em] sm:text-[13px] text-zinc-400";

export default function Overlay() {
  const {
    currentStepIndex,
    previousStepIndex,
    displayedStepIndex,
    isTransitioning,
    isPanelOpen,
    loopNavigation,
    soundEnabled,
    activeProjectFilter,
    nextStep,
    prevStep,
    goToStep,
    setIsPanelOpen,
    toggleLoopNavigation,
    toggleSound,
    setActiveProjectFilter
  } = useSiloStore();

  const wheelLockRef = useRef<number>(0);
  const touchStartYRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [hoveredProject, setHoveredProject] = useState<ProjectItem | null>(null);
  // pointer over the section panel: dims the silo behind it
  const [panelHovered, setPanelHovered] = useState(false);

  const currentLevel = SILO_LEVELS[currentStepIndex];
  // the portal's section only switches after the camera arrives
  const sectionIndex = displayedStepIndex;
  const sectionLevel = SILO_LEVELS[sectionIndex];
  const sectionAccent = sectionLevel.accentColor;
  // Stage 2: the black portal only opens once the camera has arrived at the floor
  const shutterOpen = isPanelOpen && !isTransitioning;
  const last = SILO_LEVELS.length - 1;
  const nextLevel =
    currentStepIndex < last
      ? SILO_LEVELS[currentStepIndex + 1]
      : loopNavigation
      ? SILO_LEVELS[0]
      : null;
  const prevLevel =
    currentStepIndex > 0
      ? SILO_LEVELS[currentStepIndex - 1]
      : loopNavigation
      ? SILO_LEVELS[last]
      : null;

  // Warm the cache for the hover previews once the Selected Work floor is reached
  const preloadedRef = useRef(false);
  useEffect(() => {
    if (sectionIndex !== 2 || preloadedRef.current) return;
    preloadedRef.current = true;
    portfolioData.projects.forEach((p) =>
      p.preview.images.forEach(({ src }) => {
        const img = new Image();
        img.src = src;
      })
    );
  }, [sectionIndex]);

  useEffect(() => {
    if (!shutterOpen || sectionIndex !== 2) setHoveredProject(null);
    if (!shutterOpen) setPanelHovered(false);
  }, [shutterOpen, sectionIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        prevStep();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextStep, prevStep]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".scrollable-area")) return;
    const now = Date.now();
    if (now - wheelLockRef.current < 1100) return;
    if (Math.abs(e.deltaY) < 30) return;
    wheelLockRef.current = now;
    if (e.deltaY > 0) nextStep();
    else prevStep();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".scrollable-area")) return;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartYRef.current = null;
    if (Math.abs(deltaY) > 45) {
      if (deltaY < 0) nextStep();
      else prevStep();
    }
  };

  const filteredProjects =
    activeProjectFilter === "All"
      ? portfolioData.projects
      : portfolioData.projects.filter((p) => p.category === activeProjectFilter);

  const accent = currentLevel.accentColor;

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="pointer-events-auto fixed inset-0 z-20 select-none overflow-hidden"
    >
      {/* ---- Dims the silo while the section panel is hovered ---- */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-[#0e0804] transition-opacity duration-500 ease-out ${
          panelHovered ? "opacity-40" : "opacity-0"
        }`}
      />

      {/* ---- Top-left: identity ---- */}
      <div className="absolute left-6 top-6 sm:left-9 sm:top-8">
        <p className={eyebrow}>
          {currentLevel.code}
          <span className="hidden sm:inline">
            <span className="mx-2 text-zinc-600">/</span>+
            {currentLevel.elevationMeters.toFixed(1)}m
          </span>
        </p>
        <p className="mt-2 text-base font-medium tracking-tight text-white">
          {portfolioData.profile.name}
        </p>
        <p className="text-[13px] text-zinc-400">{portfolioData.profile.title}</p>
      </div>

      {/* ---- Top-right: toggles (plain text) ---- */}
      <div className="absolute right-6 top-6 flex items-center gap-5 sm:right-9 sm:top-8">
        <button
          type="button"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className={`${eyebrow} hidden transition hover:text-white sm:inline`}
        >
          {isPanelOpen ? "Peek inside silo" : "Open floor section"}
        </button>
        <button
          type="button"
          onClick={toggleLoopNavigation}
          aria-label="Toggle loop navigation"
          title="Loop navigation"
          className={`transition ${
            loopNavigation ? "text-amber-400" : "text-zinc-600 hover:text-zinc-300"
          }`}
        >
          <Repeat className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={toggleSound}
          aria-label="Toggle sound"
          className="text-zinc-400 transition hover:text-white"
        >
          {soundEnabled ? (
            <Volume2 className="h-3.5 w-3.5" />
          ) : (
            <VolumeX className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* ---- Top-center: ascend ---- */}
      <button
        type="button"
        onClick={prevStep}
        disabled={!prevLevel || isTransitioning}
        aria-label={prevLevel ? `Ascend to ${prevLevel.shortTitle}` : "Top floor"}
        className="group absolute left-1/2 top-5 flex -translate-x-1/2 flex-col items-center gap-1 text-zinc-400 transition hover:text-white disabled:opacity-25"
      >
        <ChevronUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
        <span className={`${eyebrow} hidden sm:inline`}>
          {prevLevel ? `Ascend · ${prevLevel.shortTitle}` : "Top of silo"}
        </span>
      </button>

      {/* ---- Bottom-center: descend ---- */}
      <button
        type="button"
        onClick={nextStep}
        disabled={!nextLevel || isTransitioning}
        aria-label={nextLevel ? `Descend to ${nextLevel.shortTitle}` : "Ground floor"}
        className="group absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-zinc-400 transition hover:text-white disabled:opacity-25"
      >
        <span className={`${eyebrow} hidden sm:inline`}>
          {nextLevel ? `Descend · ${nextLevel.shortTitle}` : "Ground floor"}
        </span>
        <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
      </button>

      {/* ---- Left edge: vertical elevation readout ---- */}
      <div className="absolute left-7 top-1/2 hidden -translate-y-1/2 lg:block">
        <p
          className={`${eyebrow} origin-center -rotate-90 whitespace-nowrap`}
          style={{ transform: "translateX(-50%) rotate(-90deg)" }}
        >
          {isTransitioning
            ? currentStepIndex > previousStepIndex
              ? "Descending"
              : "Ascending"
            : "Elevation"}{" "}
          · +
          {currentLevel.elevationMeters.toFixed(1)}m
        </p>
      </div>

      {/* ---- Right edge: hairline floor rail ---- */}
      <nav
        aria-label="Floors"
        className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-3 sm:right-9 md:flex"
      >
        {SILO_LEVELS.map((lvl) => {
          const active = lvl.index === currentStepIndex;
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => goToStep(lvl.index)}
              aria-label={`Floor ${lvl.floorNumber} ${lvl.shortTitle}`}
              className="group flex items-center gap-3 text-right"
            >
              <span
                className={`font-mono text-[12px] tracking-[0.22em] transition ${
                  active
                    ? "text-white"
                    : "text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:text-zinc-300"
                }`}
              >
                {lvl.shortTitle}
              </span>
              <span
                className={`font-mono text-[13px] transition ${
                  active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                {lvl.floorNumber}
              </span>
              <span
                className="h-px transition-all duration-500"
                style={{
                  width: active ? 28 : 12,
                  backgroundColor: active ? accent : "#5a3f22"
                }}
              />
            </button>
          );
        })}
      </nav>

      {/* ---- Centre: the black shutter portal over the cutaway ---- */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-6 sm:px-12">
        <div
          ref={panelRef}
          data-shutter={shutterOpen ? "open" : "closed"}
          onMouseEnter={() => setPanelHovered(true)}
          onMouseLeave={() => setPanelHovered(false)}
          className={`relative w-full max-w-3xl origin-center overflow-hidden border border-zinc-700/50 bg-[#0d0703]/95 px-7 py-7 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-10 sm:py-9 ${
            shutterOpen
              ? "pointer-events-auto scale-y-100 opacity-100"
              : "pointer-events-none scale-y-0 opacity-0"
          }`}
        >
          {/* glowing top / bottom seam lines */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${sectionAccent}, transparent)`,
              boxShadow: `0 0 14px ${sectionAccent}`
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${sectionAccent}, transparent)`,
              boxShadow: `0 0 14px ${sectionAccent}`
            }}
          />

          {/* section eyebrow */}
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <p className={`${eyebrow} whitespace-nowrap`}>
              <span style={{ color: sectionAccent }}>{sectionLevel.label}</span>
            </p>
            <p className="hidden min-w-0 text-right font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-400 md:block">
              {sectionLevel.subtitle}
            </p>
          </div>

          {/* 00 · Intro / Hero */}
          {sectionIndex === 0 && (
            <div>
              <p className={eyebrow}>
                {portfolioData.profile.location}
                <span className="mx-2 text-zinc-600">/</span>
                <span style={{ color: sectionAccent }}>{portfolioData.profile.status}</span>
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                {portfolioData.profile.name}
              </h2>
              <p className="mt-2 text-lg text-zinc-200 sm:text-xl">
                {portfolioData.profile.title}
              </p>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-zinc-400">
                {portfolioData.profile.tagline}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <button
                  type="button"
                  onClick={nextStep}
                  className={`${eyebrow} border-b border-current pb-1 text-white transition hover:text-amber-300`}
                >
                  Descend to Experience
                </button>
                <TextLink href={portfolioData.profile.socials.github}>GitHub</TextLink>
                <TextLink href={portfolioData.profile.socials.linkedin}>LinkedIn</TextLink>
                <TextLink href={portfolioData.profile.socials.resume} newTab={false}>
                  Resume
                </TextLink>
              </div>
            </div>
          )}

          {/* 01 · Experience */}
          {sectionIndex === 1 && (
            <div className="divide-y divide-zinc-800">
              {portfolioData.experience.map((exp) => (
                <div
                  key={exp.company}
                  className="grid grid-cols-1 gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[9.5rem_1fr]"
                >
                  <p className={`${eyebrow} whitespace-nowrap pt-1`}>{exp.period}</p>
                  <div>
                    <h3 className="text-lg font-medium text-white">{exp.role}</h3>
                    <p className="mt-0.5 text-base text-zinc-400">{exp.company}</p>
                    <ul className="mt-3 space-y-1.5 text-base leading-relaxed text-zinc-300">
                      {exp.highlights.map((h) => (
                        <li key={h} className="flex gap-3">
                          <span className="text-zinc-600">—</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 02 · Featured & Selected Work */}
          {sectionIndex === 2 && (
            <div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-800 pb-3 sm:gap-x-5">
                {PROJECT_CATEGORIES.map((tag) => {
                  const active = activeProjectFilter === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveProjectFilter(tag)}
                      className={`font-mono text-[11px] uppercase tracking-[0.2em] sm:text-[12px] text-zinc-400 border-b pb-1 transition sm:-mb-[13px] sm:pb-3 ${
                        active
                          ? "border-current text-white"
                          : "border-transparent hover:text-zinc-200"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div
                className="scrollable-area mt-1 max-h-[50vh] overflow-y-auto pr-2"
                onMouseLeave={() => setHoveredProject(null)}
              >
                <div className="divide-y divide-zinc-800">
                  {filteredProjects.map((project) => (
                    <article
                      key={project.id}
                      className="py-4"
                      onMouseEnter={() => setHoveredProject(project)}
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="text-lg font-medium text-white">
                          {project.title}
                        </h3>
                        <span className={`${eyebrow} shrink-0 whitespace-nowrap`}>
                          {project.tag}
                        </span>
                      </div>
                      <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-zinc-300">
                        {project.description}
                      </p>
                      <div className="mt-2.5 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <p className="font-mono text-[12px] tracking-wider text-zinc-400">
                          {project.stack.join(" · ")}
                        </p>
                        <div className="flex shrink-0 items-center gap-4">
                          {project.liveUrl && (
                            <TextLink href={project.liveUrl}>Live</TextLink>
                          )}
                          {project.demoUrl && (
                            <TextLink href={project.demoUrl}>Demo</TextLink>
                          )}
                          {project.frontendUrl && (
                            <TextLink href={project.frontendUrl}>Code</TextLink>
                          )}
                          {project.backendUrl && (
                            <TextLink href={project.backendUrl}>API</TextLink>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 03 · Capabilities & Skills */}
          {sectionIndex === 3 && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
              {portfolioData.skills.map((group) => (
                <SkillColumn key={group.title} title={group.title} items={group.skills} />
              ))}
            </div>
          )}

          {/* 04 · About Me */}
          {sectionIndex === 4 && (
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {portfolioData.about.heading}
              </h2>
              <div className="mt-5 max-w-2xl space-y-3 text-base leading-relaxed text-zinc-300">
                {portfolioData.about.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <dl className="mt-8 grid grid-cols-1 gap-5 border-t border-zinc-800 pt-5 sm:grid-cols-3">
                {portfolioData.about.facts.map((fact) => (
                  <Fact key={fact.label} label={fact.label} value={fact.value} />
                ))}
              </dl>
            </div>
          )}

          {/* 05 · Contact */}
          {sectionIndex === 5 && (
            <div>
              <p className="max-w-lg text-base leading-relaxed text-zinc-400">
                {portfolioData.contact.description}
              </p>
              <a
                href={`mailto:${portfolioData.profile.email}`}
                className="mt-6 block w-fit text-2xl font-medium tracking-tight text-white underline decoration-zinc-700 underline-offset-8 transition hover:decoration-current sm:text-4xl"
              >
                {portfolioData.profile.email}
              </a>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-zinc-800 pt-5">
                <span className={eyebrow}>{portfolioData.profile.location}</span>
                <TextLink href={portfolioData.profile.socials.github}>GitHub</TextLink>
                <TextLink href={portfolioData.profile.socials.linkedin}>LinkedIn</TextLink>
                <TextLink href={portfolioData.profile.socials.resume} newTab={false}>
                  Resume
                </TextLink>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProjectHoverPreview
        project={hoveredProject}
        accent={sectionAccent}
        anchorRef={panelRef}
      />
    </div>
  );
}

function TextLink({
  href,
  children,
  newTab = true
}: {
  href: string;
  children: React.ReactNode;
  newTab?: boolean;
}) {
  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
      className={`${eyebrow} inline-flex items-center gap-1 transition hover:text-white`}
    >
      {children}
      <ArrowUpRight className="h-3 w-3" />
    </a>
  );
}

function SkillColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className={`${eyebrow} border-b border-zinc-800 pb-2`}>{title}</p>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-base text-zinc-200">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className={eyebrow}>{label}</dt>
      <dd className="mt-1.5 text-base text-white">{value}</dd>
    </div>
  );
}

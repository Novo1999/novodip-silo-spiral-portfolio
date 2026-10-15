"use client";

import React, { useEffect, useRef, useState } from "react";
import { portfolioData, type ProjectItem } from "@/data/portfolio";

/**
 * Floating screenshot that appears while a project row on the Selected Work
 * floor is hovered. It opens like the section shutter (scaleY from the
 * centre, glowing seams), parks in the dark gutter beside the portal when
 * there is room (otherwise it trails the cursor), and sways with the
 * pointer's vertical velocity.
 */

const GAP = 40; // space between preview and portal edge
const EDGE = 24; // minimum distance from the viewport edge
const MIN_ANCHORED = 240; // narrower gutters fall back to cursor-follow
const MAX_WIDTH = { web: 400, mobile: 340 } as const;
const FOLLOW_WIDTH = { web: 300, mobile: 260 } as const;

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

const domainOf = (url?: string) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

export default function ProjectHoverPreview({
  project,
  accent,
  anchorRef
}: {
  project: ProjectItem | null;
  accent: string;
  /** The portal the preview parks beside */
  anchorRef: React.RefObject<HTMLElement>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const openRef = useRef(false);
  const kindRef = useRef<"web" | "mobile">("web");

  // Keep the last project mounted while the shutter closes
  const lastRef = useRef<ProjectItem | null>(null);
  if (project) lastRef.current = project;
  const shown = lastRef.current;

  // Replay the reveal whenever the preview opens or switches project
  const revealRef = useRef({ id: "", open: false, key: 0 });
  const open = project !== null;
  if (project && (!revealRef.current.open || revealRef.current.id !== project.id)) {
    revealRef.current.key += 1;
    revealRef.current.id = project.id;
  }
  revealRef.current.open = open;
  const revealKey = revealRef.current.key;

  const [enabled, setEnabled] = useState(false);
  openRef.current = open;
  if (shown) kindRef.current = shown.preview.kind;

  // Hover previews only make sense with a fine pointer
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const cur = { x: 0, y: 0, tilt: 0, width: 0 };
    let wasOpen = false;
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = rootRef.current;
      const panel = anchorRef.current;
      if (!el || !panel) return;
      if (!openRef.current) {
        wasOpen = false;
        return;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const r = panel.getBoundingClientRect();
      const kind = kindRef.current;
      const room = r.left - GAP - EDGE;
      const anchored = room >= MIN_ANCHORED;

      const width = Math.round(
        anchored ? Math.min(MAX_WIDTH[kind], room) : FOLLOW_WIDTH[kind]
      );
      if (width !== cur.width) {
        cur.width = width;
        el.style.width = `${width}px`;
      }
      const h = el.offsetHeight;
      const p = pointer.current;

      let tx: number;
      if (anchored) {
        tx = r.left - GAP - width;
      } else {
        tx = p.x + 32;
        if (tx + width > vw - EDGE) tx = p.x - 32 - width;
      }
      const ty = clamp(p.y - h / 2, EDGE, vh - h - EDGE);

      if (!wasOpen || reduceMotion) {
        // snap into place on open instead of flying in from the last spot
        cur.x = tx;
        cur.y = ty;
        cur.tilt = 0;
        wasOpen = true;
      } else {
        const prevY = cur.y;
        cur.x += (tx - cur.x) * 0.14;
        cur.y += (ty - cur.y) * 0.14;
        const vy = cur.y - prevY;
        cur.tilt += (clamp(vy * 0.7, -9, 9) - cur.tilt) * 0.12;
      }

      // anchored previews turn slightly toward the portal, like a projection
      const turn = anchored && !reduceMotion ? 10 : 0;
      el.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0) perspective(900px) rotateY(${turn}deg) rotateX(${-cur.tilt}deg) rotate(${cur.tilt * 0.25}deg)`;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [enabled, anchorRef]);

  if (!enabled || !shown) return null;

  const isMobile = shown.preview.kind === "mobile";
  const index = portfolioData.projects.indexOf(shown);
  const caption = domainOf(shown.liveUrl) ?? shown.tag;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-30 will-change-transform"
      // parked off-screen until the first animation frame positions it
      style={{ transform: "translate3d(-200vw, 0, 0)" }}
    >
      <div
        data-open={open ? "true" : "false"}
        className="project-preview-shell relative overflow-hidden bg-[#0d0703]/95"
        style={{
          border: `1px solid ${accent}8c`,
          boxShadow: `0 0 0 1px ${accent}1a, 0 0 22px ${accent}59, 0 0 70px -12px ${accent}80, inset 0 0 28px ${accent}1f`
        }}
      >
        {/* glowing seams, same as the portal */}
        <span
          className="absolute inset-x-0 top-0 z-20 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            boxShadow: `0 0 14px ${accent}`
          }}
        />
        <span
          className="absolute inset-x-0 bottom-0 z-20 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            boxShadow: `0 0 14px ${accent}`
          }}
        />

        <div key={revealKey} className="project-preview-reveal relative">
          {isMobile ? (
            <div
              className="flex items-center justify-center px-4 pb-4 pt-6"
              style={{
                background: `radial-gradient(120% 90% at 50% 0%, ${accent}24, transparent 70%)`
              }}
            >
              {shown.preview.images.map((img, i) => (
                <div
                  key={img.src}
                  className="project-preview-phone relative overflow-hidden rounded-[12px] bg-black"
                  style={
                    {
                      width: i === 1 ? "34%" : "30%",
                      margin: i === 1 ? "0 -3%" : undefined,
                      zIndex: i === 1 ? 2 : 1,
                      border: `1px solid ${accent}73`,
                      boxShadow: `0 0 16px ${accent}40, 0 14px 30px rgba(0,0,0,0.6)`,
                      "--tilt": `${(i - 1) * 7}deg`,
                      "--lift": i === 1 ? "-6px" : "8px",
                      animationDelay: `${80 + i * 70}ms`
                    } as React.CSSProperties
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt=""
                    draggable={false}
                    className="block aspect-[9/19.5] w-full object-cover object-top"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative aspect-[16/10] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shown.preview.images[0].src}
                alt=""
                draggable={false}
                className="project-preview-image block h-full w-full object-cover object-top"
              />
              {/* warm grade so screenshots sit inside the amber palette */}
              <span
                className="absolute inset-0 mix-blend-multiply"
                style={{
                  background: `linear-gradient(180deg, transparent 55%, #0e0804cc)`
                }}
              />
            </div>
          )}

          {/* one-shot scan line sweeping down on reveal */}
          <span
            className="project-preview-scan absolute inset-x-0 top-0 z-10 h-16"
            style={{
              background: `linear-gradient(180deg, transparent, ${accent}33 70%, ${accent}aa 98%, transparent)`
            }}
          />

          <div className="flex items-center justify-between gap-3 border-t border-zinc-800 px-3.5 py-2">
            <span className="min-w-0 truncate whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-400">
              <span style={{ color: accent }}>
                PRJ // {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mx-2 text-zinc-600">/</span>
              {shown.title}
            </span>
            {caption && (
              <span className="min-w-0 shrink-[4] truncate font-mono text-[9px] tracking-[0.15em] text-zinc-500">
                {caption}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

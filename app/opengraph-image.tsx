import { ImageResponse } from "next/og";
import { portfolioData, SILO_LEVELS } from "@/data/portfolio";
import { SITE_URL } from "@/lib/site";

export const runtime = "edge";

export const alt = "Novodip — Frontend Developer (React & Next.js)";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const AMBER = "#ffb24a";
const CREAM = "#f6e8d0";
const MUTED = "#a9834f";
const BG = "#0e0804";

export default function OpengraphImage() {
  const { profile } = portfolioData;
  const host = SITE_URL.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: `radial-gradient(90% 120% at 78% 50%, #2a1708 0%, ${BG} 62%)`,
          color: CREAM,
          fontFamily: "sans-serif",
          padding: "72px 80px",
          position: "relative"
        }}
      >
        {/* left: identity */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 700
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: 6,
              color: MUTED,
              textTransform: "uppercase"
            }}
          >
            <span style={{ color: AMBER }}>FLR // 00</span>
            <span style={{ margin: "0 16px" }}>/</span>
            <span>{profile.location}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 128,
                fontWeight: 700,
                letterSpacing: -4,
                lineHeight: 1
              }}
            >
              {profile.name}
            </div>
            <div style={{ fontSize: 34, marginTop: 20, color: CREAM }}>
              {profile.title}
            </div>
            <div
              style={{
                fontSize: 24,
                marginTop: 24,
                color: MUTED,
                lineHeight: 1.45,
                maxWidth: 620
              }}
            >
              {profile.tagline}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: 4,
              color: MUTED
            }}
          >
            {host}
          </div>
        </div>

        {/* right: silo cross-section with floor ticks */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column-reverse",
              justifyContent: "space-between",
              width: 210,
              height: 470,
              borderLeft: `2px solid ${AMBER}`,
              borderRight: `2px solid ${AMBER}`,
              boxShadow: `0 0 40px ${AMBER}55, inset 0 0 40px ${AMBER}22`,
              padding: "18px 0"
            }}
          >
            {SILO_LEVELS.map((lvl) => (
              <div
                key={lvl.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 16px",
                  fontSize: 16,
                  letterSpacing: 3,
                  color: lvl.index === 0 ? AMBER : MUTED
                }}
              >
                <span>{lvl.floorNumber}</span>
                <span
                  style={{
                    width: lvl.index === 0 ? 90 : 46,
                    height: 2,
                    background: lvl.index === 0 ? AMBER : "#553c20"
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* glowing seams */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${AMBER}, transparent)`
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${AMBER}, transparent)`
          }}
        />
      </div>
    ),
    size
  );
}

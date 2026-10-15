import { portfolioData } from "@/data/portfolio";

/**
 * Canonical origin used for metadata, sitemap, robots and JSON-LD.
 * Set NEXT_PUBLIC_SITE_URL on the host if the site moves off the default domain.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://novodip.netlify.app"
).replace(/\/$/, "");

export const SITE_NAME = "Novodip";

export const SITE_TITLE = "Novodip — Frontend Developer (React & Next.js)";

export const SITE_DESCRIPTION =
  "Novodip is a frontend developer in Dhaka, Bangladesh specializing in React, Next.js, and React Native — building fast, scalable web and mobile applications.";

export const SITE_KEYWORDS = [
  "Novodip",
  "Frontend Developer",
  "React Developer",
  "Next.js Developer",
  "React Native Developer",
  "Expo",
  "TypeScript",
  "Tailwind CSS",
  "Web Performance",
  "Dhaka",
  "Bangladesh",
  "Portfolio"
];

/** Person / ProfilePage structured data, carried over from the previous site */
export const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  url: `${SITE_URL}/`,
  mainEntity: {
    "@type": "Person",
    name: SITE_NAME,
    jobTitle: "Frontend Developer",
    description: SITE_DESCRIPTION,
    image: `${SITE_URL}/portfolio-avatar.png`,
    url: SITE_URL,
    email: `mailto:${portfolioData.profile.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dhaka",
      addressCountry: "BD"
    },
    sameAs: [
      portfolioData.profile.socials.github,
      portfolioData.profile.socials.linkedin
    ],
    knowsAbout: [
      "Frontend Development",
      "React",
      "Next.js",
      "React Native",
      "TypeScript",
      "Web Performance"
    ]
  }
};

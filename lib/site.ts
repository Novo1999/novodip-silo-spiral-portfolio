import { portfolioData, seoData } from "@/data/portfolio";

/**
 * SEO values come from data/seo.json. NEXT_PUBLIC_SITE_URL, when set on the
 * host, overrides the canonical origin from the JSON.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || seoData.siteUrl
).replace(/\/$/, "");

export const SITE_NAME = seoData.siteName;
export const SITE_TITLE = seoData.title;
export const SITE_DESCRIPTION = seoData.description;
export const SITE_KEYWORDS = seoData.keywords;

const absolute = (src: string) =>
  /^https?:\/\//.test(src) ? src : `${SITE_URL}${src.startsWith("/") ? "" : "/"}${src}`;

/** Person / ProfilePage structured data */
export const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  url: `${SITE_URL}/`,
  mainEntity: {
    "@type": "Person",
    name: portfolioData.profile.name,
    jobTitle: seoData.person.jobTitle,
    description: SITE_DESCRIPTION,
    image: absolute(seoData.person.image),
    url: SITE_URL,
    email: `mailto:${portfolioData.profile.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: seoData.person.locality,
      addressCountry: seoData.person.country
    },
    sameAs: [
      portfolioData.profile.socials.github,
      portfolioData.profile.socials.linkedin
    ],
    knowsAbout: seoData.person.knowsAbout
  }
};

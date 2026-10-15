# Novodip — Silo Spiral Portfolio

A 3D portfolio for Novodip, frontend developer (React, Next.js, React Native). You view a cutaway silo pipe from outside and climb a spiral staircase floor by floor: Intro, Experience, Selected Work, Skills, About, Contact.

Built with Next.js 14 (App Router), React Three Fiber, GSAP, Zustand and Tailwind CSS.

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm start       # serve the production build
```

## Content

All copy, projects and links live in [`data/portfolio.ts`](data/portfolio.ts). Project preview images are in `public/projects/` (WebP): one desktop screenshot for web projects and three phone screens for mobile projects.

## Deploy

Works on Vercel or Netlify with no extra config. Set `NEXT_PUBLIC_SITE_URL` to the production origin (see `.env.example`) so canonical URLs, the sitemap, robots.txt and the Open Graph image point to the right domain.

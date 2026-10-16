# Novodip — Silo Spiral Portfolio

A 3D portfolio for Novodip, frontend developer (React, Next.js, React Native). You view a cutaway silo pipe from outside and descend a spiral staircase floor by floor, from Intro at the top through Experience, Selected Work, Skills and About to Contact at the bottom.

Built with Next.js 14 (App Router), React Three Fiber, GSAP, Zustand and Tailwind CSS.

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm start       # serve the production build
```

## Content

All copy lives in JSON files in [`data/`](data/). Edit them and rebuild; no code changes needed.

| File | What it controls |
| --- | --- |
| `profile.json` | Name, title, tagline, location, status, email, GitHub/LinkedIn/resume links |
| `experience.json` | Jobs: `role`, `company`, `period`, `description` bullets |
| `projects.json` | Filter `categories` and `projects` (see below) |
| `skills.json` | Skill groups on the Capabilities floor |
| `about.json` | About floor `heading`, `paragraphs` and `facts` |
| `contact.json` | Contact floor blurb |
| `seo.json` | Page title, description, keywords, structured data |

Each project needs `id`, `title`, `tag` (label beside the title), `category` (one of `categories`), `description`, `stack` and a `preview`. Links `live`, `frontend`, `backend` and `demo` are optional; leave them as `""` to hide them. For the hover preview, put images in `public/projects/` and use `"kind": "web"` with one screenshot or `"kind": "mobile"` with exactly three phone screens.

The JSON is validated at build time. A mistake fails `npm run build` with a message naming the file and field, e.g. `[data] projects.json projects[1]: (docuflash-mobile) has category "Mobil"`.

## Deploy

Works on Vercel or Netlify with no extra config. Set `NEXT_PUBLIC_SITE_URL` to the production origin (see `.env.example`) so canonical URLs, the sitemap, robots.txt and the Open Graph image point to the right domain.

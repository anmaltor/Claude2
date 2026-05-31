# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

## Project Overview

This is a personal portfolio website for **Antonio Mallol Torralbo**, a Rail
Operations Executive. It is a single-page-app-style marketing site built with
Next.js (App Router) and Tailwind CSS, written in TypeScript. The site presents
a professional summary, CV/experience, featured projects, and contact details.

There is no backend, database, or API layer — all content is static and sourced
from a single TypeScript data file. The site is purely a read-only showcase.

## Tech Stack

- **Framework:** Next.js 13.5.6 (App Router, `src/app`)
- **UI:** React 18.2.0
- **Styling:** Tailwind CSS 3.4.x (utility-first, configured in `tailwind.config.ts`)
- **Language:** TypeScript 5 (strict mode enabled)
- **Linting:** ESLint with `eslint-config-next`

Versions are pinned deliberately (Next 13.5.6 / React 18.2.0) for compatibility —
do not upgrade them without a clear reason, as earlier upgrade attempts to Next 14
were intentionally reverted (see git history).

## Commands

```bash
npm install      # install dependencies
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint     # run ESLint (next lint)
```

There is no test suite. Verification is done via `npm run build` and `npm run lint`.

## Directory Structure

```
.
├── src/
│   ├── app/                 # Next.js App Router pages & layout
│   │   ├── layout.tsx       # Root layout: <html>, metadata, Navigation + Footer wrapper
│   │   ├── page.tsx         # Home page (/) — Hero + Key Expertise + Featured Projects
│   │   ├── globals.css      # Tailwind directives + base element styles
│   │   ├── about/page.tsx   # /about — full CV (summary, experience, skills, education)
│   │   ├── projects/page.tsx# /projects — all projects + key achievements
│   │   └── contact/page.tsx # /contact — contact information
│   ├── components/          # Reusable presentational React components
│   │   ├── Navigation.tsx   # Sticky top nav (client component, mobile menu)
│   │   ├── Footer.tsx       # Site footer with quick links and contact
│   │   ├── Hero.tsx         # Home page hero banner
│   │   └── ProjectCard.tsx  # Card used to render a single project
│   └── data/
│       └── resume.ts        # SINGLE SOURCE OF TRUTH for all site content
├── next.config.js           # Next config (reactStrictMode: true)
├── tailwind.config.ts       # Tailwind config (custom colors, Inter font)
├── tsconfig.json            # TS config — strict, path alias "@/*" -> "./src/*"
├── postcss.config.js        # PostCSS (tailwindcss + autoprefixer)
└── CV Antonio Mallol_Dec2025_FLOW_.docx  # Source CV document (reference only)
```

## Key Conventions

### Content lives in `src/data/resume.ts`
This is the **single source of truth** for all displayed content: name, title,
contact info, professional summary, experience, education, skills, interests, and
projects. **To update site content (job titles, achievements, projects, contact
details), edit `resume.ts` — not the page/component files.** Pages import
`resumeData` and map over its arrays to render.

> Note: a few sections contain content hardcoded in the pages rather than driven
> by `resume.ts` — notably the "Key Project Achievements" block in
> `src/app/projects/page.tsx` (e.g. Bechtel cost-savings figures). When updating
> figures, check both `resume.ts` and that page.

### Imports use the `@/` path alias
Import from `src` with the `@/` alias, e.g. `import Hero from '@/components/Hero'`
and `import { resumeData } from '@/data/resume'`. This is configured in
`tsconfig.json` (`paths: { "@/*": ["./src/*"] }`).

### Server vs. Client components
Components are server components by default. Only add `'use client'` when a
component needs interactivity/state — currently only `Navigation.tsx` (uses
`useState` for the mobile menu). Keep new components as server components unless
client-side state or browser APIs are required.

### Styling
- Tailwind utility classes are used directly in JSX `className` attributes. There
  are no CSS modules or styled-components.
- The recurring layout container pattern is:
  `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8` (use `max-w-4xl` for narrower text pages
  like About/Contact).
- Primary brand color is blue: `blue-600` for links/CTAs/accents, `blue-700`/
  `blue-800` for hover. The Hero uses a `from-blue-600 to-blue-800` gradient.
- Cards use `bg-white rounded-lg shadow-md` (with `hover:shadow-lg transition-shadow`
  where interactive).
- Custom theme tokens in `tailwind.config.ts`: `primary` (#1e40af),
  `secondary` (#64748b), and the Inter `sans` font family. Base element styles
  (`a`, `h1`–`h3`, smooth scroll) live in `globals.css`.
- Mobile-first responsive design: use `sm:`, `md:`, `lg:` breakpoint prefixes.

### TypeScript
- Strict mode is on (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`,
  etc.). Clean up unused imports/variables or the build will fail.
- Component props are typed via an explicit `interface` (see `ProjectCardProps` in
  `ProjectCard.tsx`).

### External links
External `<a>` tags use `target="_blank" rel="noopener noreferrer"`. `ProjectCard`
only renders its link when `link` is present and not the `'#'` placeholder.

## Adding a New Page

1. Create `src/app/<route>/page.tsx` exporting a default React component.
2. Reuse the container pattern and pull any content from `resume.ts`.
3. Add a link to the new route in both `Navigation.tsx` (desktop + mobile lists)
   and `Footer.tsx` quick links if it should be navigable.

## Development Workflow & Git Conventions

- Active development branch for this work: `claude/claude-md-docs-eixCE`.
- Default/integration branch is `main`. Changes reach `main` via pull requests
  (see merged PR #1 in history).
- Make changes on a feature branch, commit with clear, descriptive messages, push
  with `git push -u origin <branch>`, then open a pull request.
- Before pushing, run `npm run lint` and `npm run build` to confirm the project
  compiles cleanly (there are no automated tests).

## Notes

- The `.docx` CV file in the repo root is the original source document used to
  generate `resume.ts` content; it is not consumed by the app at build/runtime.
- No environment variables are required to run the site locally.

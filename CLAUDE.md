# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal portfolio / CV website for Antonio Mallol (Rail Operations Executive). Static, content-driven single-purpose site — there is no backend, database, or API.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Serve the production build
npm run lint     # ESLint (next lint)
```

There is no test suite configured. Type checking happens through `tsc` during `next build`; `tsconfig.json` enables `strict`, `noUnusedLocals`, and `noUnusedParameters`, so unused imports/vars will fail the build.

## Architecture

Next.js 13.5 **App Router** (`src/app/`) with React 18 and Tailwind CSS. Path alias `@/*` maps to `src/*`.

The key design point: **all site content lives in a single source of truth, `src/data/resume.ts`** (the exported `resumeData` object — experience, education, skills, projects, contact info). Pages and components import from it rather than hardcoding content. To change what the site says, edit `resume.ts`, not the JSX. The homepage, for example, derives its featured projects and skills by slicing arrays from `resumeData`.

Structure:
- `src/app/layout.tsx` — root layout; wraps every page with `<Navigation>` and `<Footer>` and sets `metadata` (SEO title/description/keywords).
- `src/app/page.tsx` + `about/`, `projects/`, `contact/` — one folder per route, each with a `page.tsx`.
- `src/components/` — presentational components. `Navigation` and any component using hooks/interactivity are Client Components (`'use client'`); the rest are Server Components by default.
- `ProjectCard` treats a `link` value of `'#'` as "no link" and hides the link element accordingly — keep that convention when adding projects.

Tailwind theme (`tailwind.config.ts`) defines custom `primary`/`secondary` colors and the Inter font; content globs cover `src/pages`, `src/components`, and `src/app`.

## Workflow notes

- The repo also contains the source CV (`CV Antonio Mallol_Dec2025_FLOW_.docx`) used as the content reference for `resume.ts`.
- Active development branch for this work is `claude/trusting-cray-NUvMM`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A bilingual (English default / Hebrew with RTL) portfolio site for product designer Tamar Finkel, built with Vite + vanilla TypeScript and GSAP. No framework — all DOM rendering is done by hand from a typed content model.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — typecheck (`tsc -b`) then production build to `dist/`
- `npm run preview` — serve the built `dist/` output

There is no test suite or linter configured.

## Architecture

- `src/content.ts` — single source of truth for all copy. Every string is a `LocalizedText` (`{ en, he }`); projects, education/experience timelines, skills, and UI strings (`ui.en` / `ui.he`) all live here. To add or edit copy, edit this file only — nothing is hardcoded in HTML except a handful of static labels used as fallback text.
- `src/i18n.ts` — `applyLanguage(lang)` is the only entry point that touches the DOM for text. It sets `<html lang/dir>`, walks `[data-i18n]` elements to fill static text, and renders every dynamic list (capabilities pills, hero gallery, work cards, about timelines/skills, contact links) from `content.ts`. Language choice persists to `localStorage`.
- `src/animations.ts` — all GSAP/ScrollTrigger setup. Notably `initWorkScroll(dir)` implements the pinned horizontal-scroll project gallery (classic ScrollTrigger pin + scrub pattern, no paid GSAP plugins), and flips its scroll direction for RTL. This must be re-run (via `render()` in `main.ts`) whenever the DOM it targets is regenerated (language switch, resize).
- `src/main.ts` — bootstraps the page: calls `applyLanguage`, then re-initializes scroll-driven animations on the next frame, wires the language toggle, project modal, and contact form.
- `index.html` — structural shell only. Contains a single hidden `<svg><symbol id="logo-tamar">` reused via `<use>` for both header and footer logos. Dynamic sections (`#workTrack`, `#capabilitiesList`, `#educationList`, etc.) are empty containers populated by `i18n.ts`.

### Adding a project

Add an entry to the `projects` array in `src/content.ts` (bilingual title/category/summary/description + `cover` + `images[]`), and drop the corresponding images in `public/images/<slug>/`. Everything else (work card, horizontal scroll gallery, modal gallery) renders automatically.

### RTL considerations

- Layout mirroring relies on CSS logical properties (`inset-inline-*`, `margin-inline-*`, `padding-inline-*`) plus `[dir="rtl"]` overrides for things logical properties don't cover (icon mirroring, transform-origins, the horizontal scroll direction).
- Numeric ranges with an en dash (e.g. `"2022–2024"`) reorder visually under RTL bidi and need `direction: ltr; unicode-bidi: isolate` (see `.timeline li span:first-child` in `src/style.css`) — keep this in mind if adding more mixed numeric/Hebrew strings.
- Google Sans Text (loaded from Google Fonts) has no Hebrew glyphs; Hebrew text falls back to Heebo per the `--font-sans` stack in `src/style.css`. This is intentional, not a bug.

### Images

Source images are scraped from Tamar Finkel's Wix portfolio and were re-encoded to `.webp` (resized, quality 80) to keep the repo and page weight small — see git history if the optimization script is needed again (it used `sharp` as a one-off devDependency, not committed).

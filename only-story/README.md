# ONLY STORY — school for web & motion

A static, dependency-free site. Hebrew first (RTL), with an English switch and light/dark themes. One typeface: Google Sans (+ Google Sans Code for labels).

- `index.html` — four views routed by hash: `#home`, `#learn` (lesson player), `#studio`, `#system` (design system)
- `styles.css` — tokens, 12-column editorial grid, ink/paper sections, scroll-driven motion, the 47° "cut"
- `engine.js` — the motion engine: every template is `draw(ctx, W, H, t, opts)`, a pure function of time,
  used by the showreel, lesson videos, previews, the studio and the in-browser export
- `app.js` — language, theme, routing (ink curtain along the cut), scroll effects, curriculum, lesson player, studio, system page
- `brand-paths.js`, `assets/` — the logo symbol and wordmark exported from the brand Figma file

Run it with any static server, e.g. `python3 -m http.server` inside this folder, then open `/index.html`.

## Brand → Site builder (`#maker`)
- `builder.js` — reads a logo (PNG/SVG/JPG, removes a white background), a brand book (PDF via pdf.js from cdnjs),
  design tokens (JSON/CSS) or images in the browser; extracts colors, fonts (with free substitutes for paid ones) and radius,
  assigns color roles, and drives the live preview, device sizes and export.
- `sitegen.js` — generates a standalone HTML site from the brand: four directions (fluid, kinetic, system, collage) and
  effects (preloader, split-letter headline, logo zoom on scroll, word-fill manifesto, stacking cards, pinned horizontal
  gallery, bento, counters, velocity marquee, custom cursor, magnetic buttons, smooth scroll, grain).

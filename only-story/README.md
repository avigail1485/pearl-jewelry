# ONLY STORY — school for web & motion

A static, dependency-free site. Hebrew first (RTL), with an English switch and light/dark themes. One typeface: Google Sans (+ Google Sans Code for labels).

- `index.html` — four views routed by hash: `#home`, `#learn` (lesson player), `#studio`, `#system` (design system)
- `styles.css` — tokens, 12-column editorial grid, ink/paper sections, scroll-driven motion, the 47° "cut"
- `engine.js` — the motion engine: every template is `draw(ctx, W, H, t, opts)`, a pure function of time,
  used by the showreel, lesson videos, previews, the studio and the in-browser export
- `app.js` — language, theme, routing (ink curtain along the cut), scroll effects, curriculum, lesson player, studio, system page
- `brand-paths.js`, `assets/` — the logo symbol and wordmark exported from the brand Figma file

Run it with any static server, e.g. `python3 -m http.server` inside this folder, then open `/index.html`.

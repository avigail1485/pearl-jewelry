# ONLY STORY — design system site

A static, dependency-free site: the ONLY STORY landing page plus its design system.

- `index.html` — four views routed by hash: `#home`, `#foundations`, `#components`, `#studio`
- `styles.css` — tokens (light + warm-graphite dark), glass, the 47° "cut", RTL via logical properties
- `engine.js` — the motion engine: every template is `draw(ctx, W, H, t, opts)`, a pure function of time,
  shared by the hero phone, gallery, studio preview and the in-browser export
- `app.js` — language (Hebrew default, EN switch), theme, routing with the diagonal wipe, specimens, studio
- `brand-paths.js`, `assets/` — the logo symbol and wordmark exported from the brand Figma file

Run it with any static server, e.g. `python3 -m http.server` inside this folder, then open `/index.html`.

# אגורה · לתת זה לקבל

Mobile-first, RTL community board for giving things away for free. React 18 + TypeScript + Vite, Tailwind (design tokens only), React Router, Zustand, lucide-react.

```bash
npm install
npm run dev            # local dev (data is kept in localStorage)
npm run build          # static PWA build → dist/
npm run build:artifact         # version A (item cutouts + background removal) → artifact/index.html
npm run build:artifact:photos  # version B (real photos, Agora logo removed; AI recognition only) → artifact-photos/index.html
```

- `src/design/tokens.ts` — the 6 colours, type scale, shadows (feeds `tailwind.config.ts`).
- `src/api/` — data layer. `platform.ts` talks to the host's database/identity, with a local mock for development; swap it for a real server without touching screens.
- `src/data/items.json` — demo catalogue. Items people publish live in the database.
- `design-handoff/` — the original design-system package (tokens, prompt, HTML spec).

## Two versions

`src/lib/variant.ts` switches between them (`VITE_VARIANT=photos`):

- **A · cutouts** — catalogue photos without background (`assets/items`); uploads get on-device background removal (RMBG-1.4).
- **B · real photos** — catalogue photos with the Agora watermark removed by LaMa inpainting, nothing cropped (`assets/items-photo`); uploads keep their background. AI names the item, judges its condition and writes the description.

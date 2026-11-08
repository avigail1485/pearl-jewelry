import { useNavigate } from "react-router-dom";
import { useFilters } from "../store/filters";
import { useUI } from "../store/ui";
import { recognize } from "./ai";
import { compress } from "./image";
import { withTimeout } from "./ml";
import { visualMatch } from "./visual";

/**
 * Camera in the search field: find items that look like the photo.
 * On-device visual similarity ranks the board; when Claude can also name the item,
 * matching category and name move up.
 */
export function useImageSearch() {
  const nav = useNavigate();
  const set = useFilters((s) => s.set);
  const { showToast, setBusy } = useUI();
  return async (f: File) => {
    setBusy({ title: "מחפשים חפצים דומים…", text: "בודקים מה יש בתמונה ומשווים לחפצים בלוח" });
    try {
      const photo = await compress(f, 640, 0.85);
      const thumb = await compress(f, 160, 0.8);
      const [vis, ai] = await Promise.all([
        visualMatch(photo),
        withTimeout(recognize(photo), 25000).catch(() => null),
      ]);
      if (!vis?.similar.length) { showToast("לא הצלחנו לעבד את התמונה. נסו שוב או חפשו במילים."); return; }
      const guessCat = ai?.ok ? ai.guess.category : vis.guess && vis.guess.confidence > 0.5 ? vis.guess.category : null;
      const words = ai?.ok ? ai.guess.title.split(/\s+/).filter((w) => w.length > 1) : [];
      const { useItems } = await import("../store/items");
      const live = useItems.getState().live;
      const { demoItems } = await import("../api/items");
      const meta = new Map([...demoItems, ...live].map((i) => [i.id, i]));
      const ranked = vis.similar
        .map(({ id, score }) => {
          const it = meta.get(id);
          let s = score;
          if (it && guessCat && it.category === guessCat) s += 0.08;
          if (it && words.some((w) => it.title.includes(w))) s += 0.15;
          return { id, s };
        })
        .sort((a, b) => b.s - a.s);
      const best = ranked[0]?.s ?? 0;
      const ids = ranked.filter((r, n) => n < 6 || r.s >= best - 0.18).slice(0, 18).map((r) => r.id);
      set({ q: "", categories: [], conditions: [], maxKm: null, cities: [], sort: "new", similar: { thumb, ids, label: ai?.ok ? ai.guess.title : null } });
      nav("/results");
    } finally {
      setBusy(null);
    }
  };
}

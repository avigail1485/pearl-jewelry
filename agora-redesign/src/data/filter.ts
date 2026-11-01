import type { Filters } from "../nav"
import type { Item } from "./types"
import { items } from "./items"
import { conditions } from "./meta"

/** Photo search score: same keyword in the title beats same sub-category beats same category. */
function photoScore(i: Item, f: Filters) {
  const kw = f.keywords ?? []
  let s = 0
  if (kw.some((k) => i.title.includes(k) || i.description.includes(k))) s += 4
  if (f.sub && i.sub === f.sub) s += 2
  if (f.category && i.category === f.category) s += 1
  return s
}

export function filterItems(f: Filters) {
  const q = f.query.trim()
  const base = items.filter(
    (i) => (f.city === "כל הארץ" || i.city === f.city) && (!f.conditions.length || f.conditions.includes(i.condition)),
  )

  let list: Item[]
  if (f.photo) {
    // Similar items, best match first; anything with no relation is dropped
    const scored = base.map((i) => [i, photoScore(i, f)] as const).filter(([, s]) => s > 0)
    // Prefer close matches (same kind of item); fall back to the whole category only when there are too few
    const close = scored.filter(([, s]) => s >= 2)
    list = (close.length >= 2 ? close : scored).sort((a, b) => b[1] - a[1]).map(([i]) => i)
  } else {
    list = base.filter(
      (i) =>
        (!q || i.title.includes(q) || i.sub.includes(q) || i.category.includes(q) || i.description.includes(q)) &&
        (!f.category || i.category === f.category) &&
        (!f.sub || i.sub === f.sub),
    )
  }
  if (f.sort === "condition") list = [...list].sort((a, b) => conditions.indexOf(a.condition) - conditions.indexOf(b.condition))
  return list
}

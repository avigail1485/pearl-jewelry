import type { Filters, MyLocation } from "../nav"
import type { Item } from "./types"
import { items } from "./items"
import { conditions } from "./meta"
import { kmTo } from "./location"

/** Photo search score: same keyword in the title beats same sub-category beats same category. */
function photoScore(i: Item, f: Filters) {
  const kw = f.keywords ?? []
  let s = 0
  if (kw.some((k) => i.title.includes(k) || i.description.includes(k))) s += 4
  if (f.sub && i.sub === f.sub) s += 2
  if (f.category && i.category === f.category) s += 1
  return s
}

function inPlace(i: Item, f: Filters, loc: MyLocation | null) {
  const p = f.place
  if (p.kind === "all") return true
  if (p.kind === "town") return i.city === p.town
  if (!loc) return true // "near me" without a location can't narrow anything yet
  const km = kmTo(loc.point, i.city)
  return km !== null && km <= p.km
}

export function filterItems(f: Filters, loc: MyLocation | null = null, extra: Item[] = []) {
  const q = f.query.trim()
  const base = [...extra, ...items].filter((i) => inPlace(i, f, loc) && (!f.conditions.length || f.conditions.includes(i.condition)))

  let list: Item[]
  if (f.photo) {
    // Similar items, best match first. Prefer close matches; fall back to the category only when there are too few.
    const scored = base.map((i) => [i, photoScore(i, f)] as const).filter(([, s]) => s > 0)
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
  if (f.sort === "near" && loc) list = [...list].sort((a, b) => (kmTo(loc.point, a.city) ?? 999) - (kmTo(loc.point, b.city) ?? 999))
  return list
}

/** Items around the viewer, nearest first; used for the home "near you" row. */
export function nearby(loc: MyLocation, maxKm = 30, list: Item[] = items) {
  return list
    .map((i) => [i, kmTo(loc.point, i.city)] as const)
    .filter(([, km]) => km !== null && km <= maxKm)
    .sort((a, b) => a[1]! - b[1]!)
    .map(([i]) => i)
}

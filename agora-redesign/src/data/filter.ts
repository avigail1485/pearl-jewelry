import type { Filters } from "../nav"
import { items } from "./items"
import { conditions } from "./meta"

export function filterItems(f: Filters) {
  const q = f.query.trim()
  let list = items.filter(
    (i) =>
      (!q || i.title.includes(q) || i.sub.includes(q) || i.category.includes(q) || i.description.includes(q)) &&
      (!f.category || i.category === f.category) &&
      (!f.sub || i.sub === f.sub) &&
      (f.city === "כל הארץ" || i.city === f.city) &&
      (!f.conditions.length || f.conditions.includes(i.condition)),
  )
  if (f.sort === "condition") list = [...list].sort((a, b) => conditions.indexOf(a.condition) - conditions.indexOf(b.condition))
  return list
}

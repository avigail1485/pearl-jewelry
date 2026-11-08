import { create } from "zustand";
import type { Item } from "../api/types";

export type Sort = "new" | "near";
export interface Filters {
  q: string;
  categories: string[];
  cities: string[];
  maxKm: number | null;
  conditions: string[];
  sort: Sort;
  /** results of a search by photo: the photo and the matching item ids, best first */
  similar: { thumb: string; ids: string[]; label: string | null } | null;
}
const empty: Filters = { q: "", categories: [], cities: [], maxKm: null, conditions: [], sort: "new", similar: null };

interface FilterState extends Filters {
  recent: string[];
  set(p: Partial<Filters>): void;
  toggle(key: "categories" | "cities" | "conditions", v: string): void;
  clear(): void;
  pushRecent(q: string): void;
}

export const useFilters = create<FilterState>((set, get) => ({
  ...empty,
  recent: ["ספה", "מקרר"],
  set: (p) => set("q" in p && p.q !== undefined && !("similar" in p) ? { ...p, similar: null } : p),
  toggle: (key, v) => {
    const cur = get()[key];
    set({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } as Partial<Filters>);
  },
  clear: () => set({ ...empty }),
  pushRecent: (q) => { const t = q.trim(); if (t) set({ recent: [t, ...get().recent.filter((r) => r !== t)].slice(0, 5) }); },
}));

export function activeCount(f: Filters) {
  return f.categories.length + f.cities.length + f.conditions.length + (f.maxKm ? 1 : 0) + (f.sort !== "new" ? 1 : 0);
}

export function applyFilters(items: Item[], f: Filters): Item[] {
  if (f.similar) {
    const byId = new Map(items.map((i) => [i.id, i]));
    let r = f.similar.ids.map((id) => byId.get(id)).filter((i): i is Item => !!i && i.status === "active");
    if (f.categories.length) r = r.filter((i) => f.categories.includes(i.category));
    if (f.conditions.length) r = r.filter((i) => f.conditions.includes(i.condition));
    if (f.maxKm) r = r.filter((i) => i.distanceKm <= f.maxKm!);
    return r;
  }
  const q = f.q.trim();
  let r = items.filter((i) => i.status === "active");
  if (q) r = r.filter((i) => `${i.title} ${i.category} ${i.description} ${i.city}`.includes(q));
  if (f.categories.length) r = r.filter((i) => f.categories.includes(i.category));
  if (f.cities.length) r = r.filter((i) => f.cities.includes(i.city));
  if (f.conditions.length) r = r.filter((i) => f.conditions.includes(i.condition));
  if (f.maxKm) r = r.filter((i) => i.distanceKm <= f.maxKm!);
  return [...r].sort((a, b) => (f.sort === "near" ? a.distanceKm - b.distanceKm : b.createdAt - a.createdAt));
}

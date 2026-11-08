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
}
const empty: Filters = { q: "", categories: [], cities: [], maxKm: null, conditions: [], sort: "new" };

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
  set: (p) => set(p),
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
  const q = f.q.trim();
  let r = items.filter((i) => i.status === "active");
  if (q) r = r.filter((i) => `${i.title} ${i.category} ${i.description} ${i.city}`.includes(q));
  if (f.categories.length) r = r.filter((i) => f.categories.includes(i.category));
  if (f.cities.length) r = r.filter((i) => f.cities.includes(i.city));
  if (f.conditions.length) r = r.filter((i) => f.conditions.includes(i.condition));
  if (f.maxKm) r = r.filter((i) => i.distanceKm <= f.maxKm!);
  return [...r].sort((a, b) => (f.sort === "near" ? a.distanceKm - b.distanceKm : b.createdAt - a.createdAt));
}

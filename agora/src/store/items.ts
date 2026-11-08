import { useMemo } from "react";
import { create } from "zustand";
import { demoItems, subscribeItems } from "../api/items";
import type { Item } from "../api/types";
import { distanceKm } from "../lib/cities";
import { ls } from "../lib/storage";
import { useUser } from "./user";

interface ItemsState {
  live: Item[];
  loaded: boolean;
  viewed: string[];
  markViewed(id: string): void;
  init(): void;
}

let started = false;
export const useItems = create<ItemsState>((set, get) => ({
  live: [],
  loaded: false,
  viewed: ls.get<string[]>("agora.viewed", []),
  markViewed(id) {
    const viewed = [id, ...get().viewed.filter((x) => x !== id)].slice(0, 12);
    set({ viewed }); ls.set("agora.viewed", viewed);
  },
  init() {
    if (started) return;
    started = true;
    const timer = setTimeout(() => set({ loaded: true }), 10000);
    void subscribeItems((live) => { clearTimeout(timer); set({ live, loaded: true }); });
  },
}));

const withDistance = (i: Item, city: string): Item => ({ ...i, distanceKm: distanceKm(i.city, city) ?? i.distanceKm ?? 0 });

/** Every item on the board, newest first, with distance from the viewer's area. */
export function useAllItems(): Item[] {
  const live = useItems((s) => s.live);
  const city = useUser((s) => s.city);
  return useMemo(() => [...live, ...demoItems].map((i) => withDistance(i, city)).sort((a, b) => b.createdAt - a.createdAt), [live, city]);
}

export function useItem(id: string): Item | undefined {
  const all = useAllItems();
  return all.find((i) => i.id === id);
}

export const isNew = (i: Item) => Date.now() - i.createdAt < 60 * 60_000;

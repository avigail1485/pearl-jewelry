import { create } from "zustand";
import { demoItems, subscribeItems } from "../api/items";
import type { Item } from "../api/types";

interface ItemsState {
  live: Item[];
  loaded: boolean;
  all(): Item[];
  byId(id: string): Item | undefined;
  init(): void;
}

let started = false;
export const useItems = create<ItemsState>((set, get) => ({
  live: [],
  loaded: false,
  all: () => [...get().live, ...demoItems].sort((a, b) => b.createdAt - a.createdAt),
  byId: (id) => get().live.find((i) => i.id === id) ?? demoItems.find((i) => i.id === id),
  init() {
    if (started) return;
    started = true;
    const timer = setTimeout(() => set({ loaded: true }), 10000);
    void subscribeItems((live) => { clearTimeout(timer); set({ live, loaded: true }); });
  },
}));

export const isNew = (i: Item) => Date.now() - i.createdAt < 60 * 60_000;

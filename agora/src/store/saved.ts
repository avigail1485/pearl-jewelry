import { create } from "zustand";
import { ls } from "../lib/storage";
import { persistSaved } from "./user";

interface SavedState {
  ids: string[];
  toggle(id: string): void;
  has(id: string): boolean;
  hydrate(remote: string[]): void;
}

export const useSaved = create<SavedState>((set, get) => ({
  ids: ls.get<string[]>("agora.saved", []),
  toggle(id) {
    const ids = get().ids.includes(id) ? get().ids.filter((x) => x !== id) : [id, ...get().ids];
    set({ ids });
    void persistSaved(ids);
  },
  has: (id) => get().ids.includes(id),
  hydrate(remote) {
    const merged = Array.from(new Set([...remote, ...get().ids]));
    set({ ids: merged });
  },
}));

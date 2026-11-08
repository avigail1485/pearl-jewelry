import { create } from "zustand";

export interface Draft {
  photos: string[];
  title: string;
  category: string;
  condition: string;
  description: string;
  city: string;
  size: string;
  times: string[];
  stairs: boolean;
}
const blank = (): Draft => ({ photos: [], title: "", category: "", condition: "", description: "", city: "", size: "", times: [], stairs: false });

interface DraftState extends Draft {
  set(p: Partial<Draft>): void;
  reset(): void;
}
export const useDraft = create<DraftState>((set) => ({ ...blank(), set: (p) => set(p), reset: () => set(blank()) }));

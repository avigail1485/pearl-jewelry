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
  /** first photo with the background removed */
  /** high-quality copy of the main photo, used only for background removal */
  mainHQ: string | null;
  cutout: string | null;
  useCutout: boolean;
  bg: "idle" | "working" | "done" | "failed";
}
const blank = (): Draft => ({ photos: [], title: "", category: "", condition: "", description: "", city: "", size: "", times: [], stairs: false, mainHQ: null, cutout: null, useCutout: true, bg: "idle" });

interface DraftState extends Draft {
  set(p: Partial<Draft>): void;
  reset(): void;
}
export const useDraft = create<DraftState>((set) => ({ ...blank(), set: (p) => set(p), reset: () => set(blank()) }));

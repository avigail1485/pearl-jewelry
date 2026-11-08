import { create } from "zustand";

interface UIState {
  login: { open: boolean; onDone?: () => void };
  toast: string | null;
  askLogin(onDone?: () => void): void;
  closeLogin(): void;
  showToast(t: string): void;
}
export const useUI = create<UIState>((set) => ({
  login: { open: false },
  toast: null,
  askLogin: (onDone) => set({ login: { open: true, onDone } }),
  closeLogin: () => set({ login: { open: false } }),
  showToast: (t) => { set({ toast: t }); setTimeout(() => set({ toast: null }), 2600); },
}));

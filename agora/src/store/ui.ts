import { create } from "zustand";

interface UIState {
  login: { open: boolean; onDone?: () => void };
  toast: string | null;
  busy: { title: string; text: string } | null;
  setBusy(b: { title: string; text: string } | null): void;
  askLogin(onDone?: () => void): void;
  closeLogin(): void;
  showToast(t: string): void;
}
export const useUI = create<UIState>((set) => ({
  login: { open: false },
  toast: null,
  busy: null,
  setBusy: (busy) => set({ busy }),
  askLogin: (onDone) => set({ login: { open: true, onDone } }),
  closeLogin: () => set({ login: { open: false } }),
  showToast: (t) => { set({ toast: t }); setTimeout(() => set({ toast: null }), 2600); },
}));

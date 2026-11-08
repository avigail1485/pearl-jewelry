export const ls = {
  get<T>(k: string, fallback: T): T {
    try { const v = localStorage.getItem(k); return v == null ? fallback : (JSON.parse(v) as T); } catch { return fallback; }
  },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* unavailable */ } },
};

// Thin bridge to the hosting platform's runtime capabilities (db + user).
// When the app runs outside the host (local dev / tests), a localStorage-backed
// mock with the same shape is used so every flow works end to end.
/* eslint-disable @typescript-eslint/no-explicit-any */

export type Snap = { id: string; exists: boolean; data(): any };
export type QSnap = { docs: Snap[] };
export interface DocRef {
  id: string;
  get(): Promise<Snap>;
  set(d: Record<string, unknown>): Promise<void>;
  update(d: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
  onSnapshot(next: (s: Snap) => void, err?: (e: any) => void): () => void;
  collection(path: string): ColRef;
}
export interface Query {
  where(f: string, op: string, v: unknown): Query;
  orderBy(f: string, dir?: "asc" | "desc"): Query;
  limit(n: number): Query;
  get(): Promise<QSnap>;
  onSnapshot(next: (s: QSnap) => void, err?: (e: any) => void): () => void;
}
export interface ColRef extends Query { doc(id?: string): DocRef }
export interface DB { doc(p: string): DocRef; collection(p: string): ColRef }
export interface Viewer { id: string | null; name: string; avatarUrl: string }
export interface UserCap {
  me(): Promise<Viewer>;
  profiles?(ids: string[]): Promise<Record<string, { id: string; name: string; avatarUrl: string }>>;
}

declare global {
  interface Window { claude?: { use(name: string): Promise<any> } }
}

const framed = () => { try { return window.top !== window.self; } catch { return true; } };
/** Running inside the private host frame (the runtime bridge may attach a moment after load). */
const hosted = () => typeof window !== "undefined" && (!!window.claude?.use || framed());

/** Resolves the host bridge, waiting briefly for it to attach; null when absent. */
function bridge(): Promise<{ use(name: string): Promise<any> } | null> {
  return new Promise((res) => {
    const t0 = Date.now();
    const tick = () => {
      if (window.claude?.use) return res(window.claude);
      if (Date.now() - t0 > 5000) return res(null);
      setTimeout(tick, 50);
    };
    tick();
  });
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);
}

let dbP: Promise<DB | null> | null = null;
let userP: Promise<UserCap | null> | null = null;

export function getDB(): Promise<DB | null> {
  if (!dbP) {
    dbP = hosted()
      ? bridge().then((c) => (c ? withTimeout(c.use("db").catch(() => null), 10000) : null))
      : Promise.resolve(mockDB());
  }
  return dbP;
}

export function getUserCap(): Promise<UserCap | null> {
  if (!userP) {
    userP = hosted()
      ? bridge().then((c) => (c ? withTimeout(c.use("user").catch(() => null), 10000) : null))
      : Promise.resolve(mockUser());
  }
  return userP;
}

export const isHosted = hosted;
export const getBridge = bridge;

/* ---------------- local mock (dev only) ---------------- */
const LS_KEY = "agora.mockdb";
type Store = Record<string, Record<string, any>>; // collectionPath -> id -> data
const listeners = new Set<() => void>();
function load(): Store { try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; } }
function save(s: Store) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* full */ } listeners.forEach((l) => setTimeout(l)); }
const split = (p: string) => { const i = p.lastIndexOf("/"); return [p.slice(0, i), p.slice(i + 1)]; };
const rid = () => Math.random().toString(36).slice(2, 12);

function mockDoc(path: string): DocRef {
  const [col, id] = split(path);
  const snap = (): Snap => { const d = load()[col]?.[id]; return { id, exists: !!d, data: () => d }; };
  return {
    id,
    get: async () => snap(),
    set: async (d) => { const s = load(); (s[col] ||= {})[id] = JSON.parse(JSON.stringify(d)); save(s); },
    update: async (d) => { const s = load(); (s[col] ||= {})[id] = { ...(s[col][id] || {}), ...JSON.parse(JSON.stringify(d)) }; save(s); },
    delete: async () => { const s = load(); if (s[col]) delete s[col][id]; save(s); },
    onSnapshot: (next) => { const f = () => next(snap()); listeners.add(f); setTimeout(f); return () => listeners.delete(f); },
    collection: (p) => mockCol(`${path}/${p}`),
  };
}
function mockCol(path: string, filters: [string, string, any][] = [], order?: [string, string], lim?: number): ColRef {
  const run = (): QSnap => {
    let rows = Object.entries(load()[path] || {}).map(([id, d]) => ({ id, d }));
    for (const [f, op, v] of filters) {
      rows = rows.filter(({ d }) => op === "==" ? d[f] === v : op === "array-contains" ? (d[f] || []).includes(v) : op === "in" ? v.includes(d[f]) : true);
    }
    if (order) rows.sort((a, b) => (a.d[order[0]] > b.d[order[0]] ? 1 : -1) * (order[1] === "desc" ? -1 : 1));
    if (lim) rows = rows.slice(0, lim);
    return { docs: rows.map(({ id, d }) => ({ id, exists: true, data: () => d })) };
  };
  return {
    where: (f, op, v) => mockCol(path, [...filters, [f, op, v]], order, lim),
    orderBy: (f, dir = "asc") => mockCol(path, filters, [f, dir], lim),
    limit: (n) => mockCol(path, filters, order, n),
    get: async () => run(),
    onSnapshot: (next) => { const f = () => next(run()); listeners.add(f); setTimeout(f); return () => listeners.delete(f); },
    doc: (id = rid()) => mockDoc(`${path}/${id}`),
  };
}
function mockDB(): DB { return { doc: mockDoc, collection: (p) => mockCol(p) }; }
function mockUser(): UserCap {
  const avatar = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#CFFFB0"/><text x="20" y="26" font-size="16" text-anchor="middle" fill="#1E1E1E" font-family="sans-serif">א</text></svg>`);
  return { me: async () => ({ id: "u_local", name: "משתמש הדגמה", avatarUrl: avatar }) };
}

// Shared on-device ML plumbing: onnxruntime-web (single-threaded WASM) and model files served
// next to the page in ≤12.5 MB parts, cached by the browser after the first download.
type Ort = typeof import("onnxruntime-web");
type Session = import("onnxruntime-web").InferenceSession;

let ortP: Promise<Ort> | null = null;
export const mlBase = () => new URL("./assets/ml/", document.baseURI).href;

export function getOrt() {
  if (!ortP) {
    ortP = import("onnxruntime-web").then((ort) => {
      ort.env.wasm.wasmPaths = mlBase();
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.proxy = false;
      return ort;
    });
  }
  return ortP;
}

export async function fetchCached(file: string): Promise<Response> {
  const url = mlBase() + file;
  try {
    const c = await caches.open("agora-ml");
    const hit = await c.match(url);
    if (hit) return hit;
    const res = await fetch(url);
    if (res.ok) await c.put(url, res.clone());
    return res;
  } catch {
    return fetch(url);
  }
}

async function fetchModel(files: string[]): Promise<Uint8Array> {
  const parts = await Promise.all(files.map(async (f) => {
    const res = await fetchCached(f);
    if (!res.ok) throw new Error("model " + f);
    return new Uint8Array(await res.arrayBuffer());
  }));
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

const sessions = new Map<string, Promise<Session>>();
export function loadSession(key: string, files: string[]): Promise<Session> {
  let s = sessions.get(key);
  if (!s) {
    s = (async () => {
      const ort = await getOrt();
      return ort.InferenceSession.create(await fetchModel(files), { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
    })();
    sessions.set(key, s);
    s.catch(() => sessions.delete(key));
  }
  return s;
}

export const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);

export const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

// On-device visual search: DINOv2-small (int8) turns a photo into a 768-number fingerprint;
// the board's photos were fingerprinted ahead of time (assets/ml/visual-index.json, built from
// ~360 real listings). Nearest fingerprints = items that look alike. No credits, no upload.
import { fetchCached, getOrt, loadImage, loadSession, withTimeout } from "./ml";

const FILES = ["dino-part0.wasm", "dino-part1.wasm"];
const MEAN = [0.485, 0.456, 0.406], STD = [0.229, 0.224, 0.225];

interface Entry { t: string; c: string; s: string; i: string | null }
interface Index { dim: number; entries: Entry[]; vecs: Float32Array }
let indexP: Promise<Index> | null = null;

function b64(s: string) { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }

function loadIndex() {
  if (!indexP) {
    indexP = (async () => {
      const raw = await (await fetchCached("visual-index.json")).json();
      const q = new Int8Array(b64(raw.vec).buffer), scale = new Float32Array(b64(raw.scale).buffer);
      const n = raw.entries.length, d = raw.dim, vecs = new Float32Array(n * d);
      for (let r = 0; r < n; r++) {
        let norm = 0;
        for (let k = 0; k < d; k++) { const v = q[r * d + k] * scale[r]; vecs[r * d + k] = v; norm += v * v; }
        norm = Math.sqrt(norm) || 1;
        for (let k = 0; k < d; k++) vecs[r * d + k] /= norm;
      }
      return { dim: d, entries: raw.entries, vecs };
    })();
    indexP.catch(() => { indexP = null; });
  }
  return indexP;
}

export function preloadVisual() { loadIndex().catch(() => {}); loadSession("dino", FILES).catch(() => {}); }

/** Resize the short edge to 256, centre-crop 224, normalise — as DINOv2 was trained. */
async function embed(photo: string): Promise<Float32Array> {
  const [ort, sess, img] = await Promise.all([getOrt(), loadSession("dino", FILES), loadImage(photo)]);
  const w = img.naturalWidth, h = img.naturalHeight, k = 256 / Math.min(w, h);
  const W = Math.round(w * k), H = Math.round(h * k);
  const c = document.createElement("canvas"); c.width = 224; c.height = 224;
  const cx = c.getContext("2d", { willReadFrequently: true })!;
  cx.imageSmoothingQuality = "high";
  cx.drawImage(img, -Math.round((W - 224) / 2), -Math.round((H - 224) / 2), W, H);
  const px = cx.getImageData(0, 0, 224, 224).data, N = 224 * 224;
  const x = new Float32Array(3 * N);
  for (let i = 0; i < N; i++) for (let ch = 0; ch < 3; ch++) x[ch * N + i] = (px[i * 4 + ch] / 255 - MEAN[ch]) / STD[ch];
  const out = await sess.run({ pixel_values: new ort.Tensor("float32", x, [1, 3, 224, 224]) });
  const hs = out[sess.outputNames[0]].data as Float32Array; // [1, 257, 384]
  const D = 384, v = new Float32Array(2 * D);
  for (let k2 = 0; k2 < D; k2++) v[k2] = hs[k2];
  for (let t = 1; t < 257; t++) for (let k2 = 0; k2 < D; k2++) v[D + k2] += hs[t * D + k2] / 256;
  let n = 0; for (const a of v) n += a * a; n = Math.sqrt(n) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= n;
  return v;
}

export interface VisualMatch {
  /** board items that look like the photo, best first */
  similar: { id: string; score: number }[];
  /** a soft guess of what the item is, from the most similar listings */
  guess: { category: string; title: string | null; confidence: number } | null;
}

/** A neighbour's title, without sizes, model numbers or punctuation: "ספת רביצה 2.80" → "ספת רביצה". */
function cleanTitle(t: string) {
  const words = t.replace(/["'׳״()\-–,.:/]/g, " ").split(/\s+/).filter((w) => w && !/\d/.test(w) && !/^[A-Za-z]+$/.test(w));
  return words.slice(0, 3).join(" ") || null;
}

export async function visualMatch(photo: string): Promise<VisualMatch | null> {
  try {
    const [idx, v] = await withTimeout(Promise.all([loadIndex(), embed(photo)]), 90000);
    const n = idx.entries.length, d = idx.dim, scores = new Float32Array(n);
    for (let r = 0; r < n; r++) { let s = 0; for (let k = 0; k < d; k++) s += idx.vecs[r * d + k] * v[k]; scores[r] = s; }
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
    const similar = order.filter((r) => idx.entries[r].i).map((r) => ({ id: idx.entries[r].i!, score: scores[r] }));
    // category vote among the 7 nearest listings, weighted by similarity²
    const votes = new Map<string, number>(); let total = 0;
    for (const r of order.slice(0, 7)) { const w = Math.max(0, scores[r]) ** 2; votes.set(idx.entries[r].c, (votes.get(idx.entries[r].c) ?? 0) + w); total += w; }
    const [category, w] = [...votes.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["שונות", 0];
    const top = order[0];
    return {
      similar,
      guess: { category, title: scores[top] > 0.68 ? cleanTitle(idx.entries[top].t) : null, confidence: total ? w / total : 0 },
    };
  } catch {
    return null;
  }
}

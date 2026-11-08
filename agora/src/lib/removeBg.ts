// On-device background removal for photos people upload — the photo never leaves the device,
// and there is no per-use cost.
// Main model: BRIA RMBG-1.4 (IS-Net architecture trained for product photos), int8-compressed
// to 44 MB and served in four parts. Edges are then refined against the photo itself with a
// guided filter. Backup: U²-Net small (4.6 MB) if the main model cannot load on this device.
// Any failure returns null and the original photo is kept.
import { compress } from "./image";

type Ort = typeof import("onnxruntime-web");
interface ModelSpec { files: string[]; size: number; mean: number[]; std: number[]; byMax: boolean; firm: boolean }
const MODELS: Record<"rmbg" | "u2netp", ModelSpec> = {
  rmbg: { files: ["rmbg-part0.wasm", "rmbg-part1.wasm", "rmbg-part2.wasm", "rmbg-part3.wasm"], size: 1024, mean: [0.5, 0.5, 0.5], std: [1, 1, 1], byMax: false, firm: false },
  u2netp: { files: ["u2netp-model.wasm"], size: 320, mean: [0.485, 0.456, 0.406], std: [0.229, 0.224, 0.225], byMax: true, firm: true },
};

let ortP: Promise<Ort> | null = null;
const base = () => new URL("./assets/ml/", document.baseURI).href;
function getOrt() {
  if (!ortP) {
    ortP = import("onnxruntime-web").then((ort) => {
      ort.env.wasm.wasmPaths = base();
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.proxy = false;
      return ort;
    });
  }
  return ortP;
}

async function fetchModel(files: string[]): Promise<Uint8Array> {
  const parts = await Promise.all(files.map(async (f) => {
    const url = base() + f;
    let res: Response | undefined;
    try { const c = await caches.open("agora-ml"); res = await c.match(url); if (!res) { res = await fetch(url); if (res.ok) await c.put(url, res.clone()); } }
    catch { res = await fetch(url); }
    if (!res.ok) throw new Error("model " + f);
    return new Uint8Array(await res.arrayBuffer());
  }));
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

const sessions: Partial<Record<keyof typeof MODELS, Promise<import("onnxruntime-web").InferenceSession>>> = {};
function session(name: keyof typeof MODELS) {
  if (!sessions[name]) {
    sessions[name] = (async () => {
      const ort = await getOrt();
      return ort.InferenceSession.create(await fetchModel(MODELS[name].files), { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
    })();
    sessions[name]!.catch(() => { delete sessions[name]; });
  }
  return sessions[name]!;
}

/** Start downloading the model early (when the give flow opens). */
export function preloadRemoveBg() { session("rmbg").catch(() => session("u2netp").catch(() => {})); }

const timeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);
const loadImage = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

/** Predicted foreground mask (0..1) at the model's size. */
async function predict(name: keyof typeof MODELS, img: HTMLImageElement): Promise<Float32Array> {
  const spec = MODELS[name], S = spec.size;
  const [ort, sess] = await Promise.all([getOrt(), session(name)]);
  const c = document.createElement("canvas"); c.width = S; c.height = S;
  const cx = c.getContext("2d", { willReadFrequently: true })!;
  cx.imageSmoothingQuality = "high";
  cx.drawImage(img, 0, 0, S, S);
  const px = cx.getImageData(0, 0, S, S).data;
  let maxPx = 255;
  if (spec.byMax) { maxPx = 1; for (let i = 0; i < px.length; i += 4) maxPx = Math.max(maxPx, px[i], px[i + 1], px[i + 2]); }
  const input = new Float32Array(3 * S * S);
  for (let i = 0; i < S * S; i++) for (let k = 0; k < 3; k++) input[k * S * S + i] = (px[i * 4 + k] / maxPx - spec.mean[k]) / spec.std[k];
  const out = await sess.run({ [sess.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, S, S]) });
  const pred = out[sess.outputNames[0]].data as Float32Array;
  let lo = Infinity, hi = -Infinity;
  for (const v of pred) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const span = hi - lo || 1, m = new Float32Array(S * S);
  // normalise; the small backup model also gets its soft edges firmed up
  for (let i = 0; i < S * S; i++) { const v = (pred[i] - lo) / span; m[i] = spec.firm ? Math.min(1, Math.max(0, (v - 0.2) / 0.6)) : v; }
  return m;
}

/** Keep only the large connected pieces of the mask (drops stray specks). */
function keepMainParts(m: Float32Array, S: number) {
  const lab = new Int32Array(S * S), sizes: number[] = [0];
  const stack: number[] = [];
  for (let i = 0; i < S * S; i++) {
    if (m[i] < 0.1 || lab[i]) continue;
    const id = sizes.length; let n = 0; stack.push(i); lab[i] = id;
    while (stack.length) {
      const p = stack.pop()!; n++;
      const x = p % S, y = (p / S) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < S - 1 ? p + 1 : -1, y > 0 ? p - S : -1, y < S - 1 ? p + S : -1]) {
        if (q >= 0 && !lab[q] && m[q] >= 0.1) { lab[q] = id; stack.push(q); }
      }
    }
    sizes.push(n);
  }
  const big = Math.max(...sizes);
  for (let i = 0; i < S * S; i++) if (lab[i] && sizes[lab[i]] < big * 0.04) m[i] = 0;
  return big / (S * S);
}

/** Box filter (mean over a (2r+1)² window) via an integral image. */
function boxMean(src: Float32Array, W: number, H: number, r: number) {
  const I = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) { let row = 0; for (let x = 0; x < W; x++) { row += src[y * W + x]; I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + row; } }
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(H, y + r + 1);
    for (let x = 0; x < W; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(W, x + r + 1);
      out[y * W + x] = (I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0]) / ((y1 - y0) * (x1 - x0));
    }
  }
  return out;
}

/**
 * Guided filter (He et al.): snaps the upscaled mask to the edges of the photo itself, so
 * outlines follow the real object instead of the model's coarser grid.
 */
function guidedRefine(alpha: Float32Array, gray: Float32Array, W: number, H: number, r: number, eps: number) {
  const N = W * H, Ip = new Float32Array(N), II = new Float32Array(N);
  for (let i = 0; i < N; i++) { Ip[i] = gray[i] * alpha[i]; II[i] = gray[i] * gray[i]; }
  const mI = boxMean(gray, W, H, r), mp = boxMean(alpha, W, H, r), mIp = boxMean(Ip, W, H, r), mII = boxMean(II, W, H, r);
  const a = new Float32Array(N), b = new Float32Array(N);
  for (let i = 0; i < N; i++) { const cov = mIp[i] - mI[i] * mp[i], v = mII[i] - mI[i] * mI[i]; a[i] = cov / (v + eps); b[i] = mp[i] - a[i] * mI[i]; }
  const ma = boxMean(a, W, H, r), mb = boxMean(b, W, H, r);
  const q = new Float32Array(N);
  for (let i = 0; i < N; i++) q[i] = Math.min(1, Math.max(0, ma[i] * gray[i] + mb[i]));
  return q;
}

/** Returns a transparent-background WebP/PNG data URL, cropped and centred on a square, or null. */
export async function removeBackground(photo: string): Promise<string | null> {
  try {
    const img = await loadImage(photo);
    let name: keyof typeof MODELS = "rmbg";
    let mask: Float32Array;
    try { mask = await timeout(predict("rmbg", img), 120000); }
    catch { name = "u2netp"; mask = await timeout(predict("u2netp", img), 60000); }
    const S = MODELS[name].size;
    const share = keepMainParts(mask, S);
    if (share < 0.02 || share > 0.97) return null; // nothing clear to cut out

    const W = img.naturalWidth, H = img.naturalHeight;
    const m = document.createElement("canvas"); m.width = S; m.height = S;
    const mx = m.getContext("2d")!; const md = mx.createImageData(S, S);
    for (let i = 0; i < S * S; i++) md.data[i * 4 + 3] = Math.round(mask[i] * 255);
    mx.putImageData(md, 0, 0);
    // upscale the mask to the photo, then refine its edges against the photo
    const o = document.createElement("canvas"); o.width = W; o.height = H;
    const ox = o.getContext("2d", { willReadFrequently: true })!;
    ox.imageSmoothingQuality = "high";
    ox.drawImage(m, 0, 0, W, H);
    const up = ox.getImageData(0, 0, W, H).data;
    ox.clearRect(0, 0, W, H);
    ox.drawImage(img, 0, 0, W, H);
    const photoPx = ox.getImageData(0, 0, W, H);
    const pd = photoPx.data, N = W * H;
    const alpha = new Float32Array(N), gray = new Float32Array(N);
    for (let i = 0; i < N; i++) { alpha[i] = up[i * 4 + 3] / 255; gray[i] = (0.299 * pd[i * 4] + 0.587 * pd[i * 4 + 1] + 0.114 * pd[i * 4 + 2]) / 255; }
    const refined = guidedRefine(alpha, gray, W, H, Math.max(2, Math.round(Math.max(W, H) / 400)), 1e-4);
    for (let i = 0; i < N; i++) {
      // trust the model far from edges, the refined value near them
      const a0 = alpha[i], edge = a0 > 0.02 && a0 < 0.98;
      const a = edge ? refined[i] : a0;
      pd[i * 4 + 3] = Math.round((a < 0.04 ? 0 : a > 0.96 ? 1 : a) * 255);
    }
    ox.putImageData(photoPx, 0, 0);

    const d = pd;
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0 || y1 <= y0) return null;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, side = Math.round(Math.max(bw, bh) * 1.12);
    const sq = document.createElement("canvas"); sq.width = side; sq.height = side;
    sq.getContext("2d")!.drawImage(o, x0, y0, bw, bh, Math.round((side - bw) / 2), Math.round((side - bh) / 2), bw, bh);
    const blob = await new Promise<Blob | null>((r) => sq.toBlob(r, "image/png"));
    if (!blob) return null;
    let url = await compress(blob, 640, 0.85, "image/webp");
    if (url.length > 180_000) url = await compress(blob, 420, 0.8, "image/webp");
    return url.length > 240_000 ? null : url;
  } catch {
    return null;
  }
}

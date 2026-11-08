// On-device background removal for photos people upload.
// Model: U²-Net (small, "u2netp", the same family remove-bg tools use), run with onnxruntime-web
// in the browser — the photo never leaves the device. Any failure returns null and the
// original photo is kept.
import { compress } from "./image";

const SIZE = 320;
let sessionP: Promise<{ ort: typeof import("onnxruntime-web"); session: import("onnxruntime-web").InferenceSession }> | null = null;

function load() {
  if (!sessionP) {
    sessionP = (async () => {
      const ort = await import("onnxruntime-web");
      const base = new URL("./assets/ml/", document.baseURI).href;
      ort.env.wasm.wasmPaths = base;
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.proxy = false;
      const model = await (await fetch(base + "u2netp-model.wasm" /* the ONNX model, under a name the host serves */)).arrayBuffer();
      const session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
      return { ort, session };
    })();
    sessionP.catch(() => { sessionP = null; });
  }
  return sessionP;
}

/** Warm the model up early (e.g. when the give flow opens). */
export function preloadRemoveBg() { load().catch(() => {}); }

const timeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

/** Returns a transparent-background WebP/PNG data URL, cropped and centred on a square, or null. */
export async function removeBackground(photo: string): Promise<string | null> {
  try {
    const { ort, session } = await timeout(load(), 45000);
    const img = await loadImage(photo);
    const W = img.naturalWidth, H = img.naturalHeight;

    // 1 · model input: 320×320, ImageNet normalisation, NCHW
    const c = document.createElement("canvas");
    c.width = SIZE; c.height = SIZE;
    const cx = c.getContext("2d", { willReadFrequently: true })!;
    cx.drawImage(img, 0, 0, SIZE, SIZE);
    const px = cx.getImageData(0, 0, SIZE, SIZE).data;
    const input = new Float32Array(3 * SIZE * SIZE);
    const mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225];
    let maxPx = 0;
    for (let i = 0; i < SIZE * SIZE; i++) for (let k = 0; k < 3; k++) maxPx = Math.max(maxPx, px[i * 4 + k]);
    maxPx = maxPx || 255;
    for (let i = 0; i < SIZE * SIZE; i++) for (let k = 0; k < 3; k++) input[k * SIZE * SIZE + i] = (px[i * 4 + k] / maxPx - mean[k]) / std[k];

    // 2 · run
    const out = await timeout(session.run({ [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, SIZE, SIZE]) }), 45000);
    const pred = out[session.outputNames[0]].data as Float32Array;
    let lo = Infinity, hi = -Infinity;
    for (const v of pred) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const span = hi - lo || 1;

    // 3 · mask → alpha at full resolution
    const m = document.createElement("canvas");
    m.width = SIZE; m.height = SIZE;
    const mx = m.getContext("2d")!;
    const md = mx.createImageData(SIZE, SIZE);
    let fg = 0;
    for (let i = 0; i < SIZE * SIZE; i++) {
      const a = Math.round(((pred[i] - lo) / span) * 255);
      md.data[i * 4 + 3] = a;
      if (a > 128) fg++;
    }
    mx.putImageData(md, 0, 0);
    const share = fg / (SIZE * SIZE);
    if (share < 0.03 || share > 0.97) return null; // nothing clear to cut out

    const o = document.createElement("canvas");
    o.width = W; o.height = H;
    const ox = o.getContext("2d", { willReadFrequently: true })!;
    ox.drawImage(m, 0, 0, W, H);                       // scaled mask (smooth edges)
    ox.globalCompositeOperation = "source-in";
    ox.drawImage(img, 0, 0, W, H);                      // keep the photo only where the mask is
    ox.globalCompositeOperation = "source-over";

    // 4 · crop to the object, centre on a square with a little air around it
    const d = ox.getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0 || y1 <= y0) return null;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, side = Math.round(Math.max(bw, bh) * 1.12);
    const sq = document.createElement("canvas");
    sq.width = side; sq.height = side;
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

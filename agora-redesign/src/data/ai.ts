import { categories, conditions } from "./meta"
import type { Condition } from "./types"

/*
  AI recognition for Agora, built on Claude's `sample` capability (vision).
  Every path ends in one of: a validated result, or a typed error the UI knows how to explain.
  Nothing is invented: where no AI is reachable the caller gets "unavailable", never a sample answer.
*/

export type AiResult = {
  isItem: boolean
  title: string
  category: string
  sub: string
  condition: Condition
  description: string
  confidence: number
}

export type AiError = "unavailable" | "not_granted" | "rate_limited" | "bad_image" | "cancelled" | "failed"

type SampleFn = ((input: string, opts?: object) => Promise<{ text: string }>) & {
  json: <T>(input: string, opts?: object) => Promise<T>
  limits: () => Promise<{ images?: { maxCount?: number; maxInputBytes?: number; mediaTypes?: string[] } }>
}

class AiFailure extends Error {
  constructor(public code: AiError) {
    super(code)
  }
}

let visionPromise: Promise<{ fn: SampleFn; maxCount: number } | null> | null = null

/** Resolves Claude's `sample` capability when this view can send images; otherwise null. Cached. */
export function getVision() {
  const claude = (window as unknown as { claude?: { use: (n: string) => Promise<unknown> } }).claude
  if (!claude?.use) return Promise.resolve(null)
  visionPromise ??= claude
    .use("sample")
    .then(async (s) => {
      if (!s) return null
      const fn = s as SampleFn
      const lim = await fn.limits().catch(() => null)
      return lim?.images ? { fn, maxCount: Math.max(1, Math.min(3, lim.images.maxCount ?? 3)) } : null
    })
    .catch(() => null)
  return visionPromise
}

/** True when recognition can actually run here (used to label the AI option honestly). */
export async function visionAvailable() {
  return (await getVision()) !== null
}

/**
 * Re-encode a picked file as a JPEG of at most 1600px: fixes HEIC/odd formats the model can't read,
 * strips metadata (incl. GPS) and keeps uploads small. Throws bad_image if the browser can't decode it.
 */
export async function prepareImage(file: Blob): Promise<Blob> {
  if (file.type && !file.type.startsWith("image/")) throw new AiFailure("bad_image")
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions)
  } catch {
    throw new AiFailure("bad_image")
  }
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new AiFailure("bad_image")
  ctx.fillStyle = "#fff" // transparent PNGs become white, not black
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85))
  if (!blob) throw new AiFailure("bad_image")
  return blob
}

function abortable(signal: AbortSignal) {
  if (signal.aborted) throw new AiFailure("cancelled")
}

/** Map anything thrown (sample errors, our own failures) to one code the UI handles. */
export function errorCode(e: unknown): AiError {
  if (e instanceof AiFailure) return e.code
  const code = (e as { code?: string })?.code
  switch (code) {
    case "cancelled":
      return "cancelled"
    case "not_granted":
    case "sampling_disabled":
    case "not_declared":
    case "capability_disabled":
    case "capability_removed":
    case "session_expired":
      return "not_granted"
    case "images_unavailable":
      return "unavailable"
    case "image_rejected":
      return "bad_image"
    case "rate_limited":
      return "rate_limited"
    default:
      return "failed" // invalid_json, refused, empty_completion, upstream_error, network, unknown
  }
}

const catalog = categories.map((c) => `- ${c.label}: ${c.subs.join(", ")}`).join("\n")
const categoryLabels = categories.map((c) => c.label)

const recognizePrompt = `אתה מזהה חפצים למסירה בחינם בלוח "אגורה". מצורפות תמונות של חפץ אחד שמישהו רוצה למסור.
החזר אובייקט JSON אחד בלבד, בעברית, בדיוק במבנה הזה ובלי טקסט נוסף:
{"isItem": true, "title": "...", "category": "...", "sub": "...", "condition": "...", "description": "...", "confidence": 0.0}

כללים:
- isItem: false אם הנושא המרכזי אינו חפץ שאפשר למסור (אדם, בעל חיים, נוף, צילום מסך, מסמך). אז שאר השדות ריקים.
- title: שם קצר וברור, 2 עד 5 מילים, כמו בלוח מודעות (למשל "שידת מגירות מעץ"). בלי סימני פיסוק בסוף.
- category: בדיוק אחת מ: ${categoryLabels.join(" / ")}.
- sub: בדיוק אחת מתתי-הקטגוריות של הקטגוריה שבחרת, או "" אם אין מתאימה.
- condition: בדיוק אחד מ: ${conditions.join(" / ")}. לפי מה שנראה בתמונה בלבד. אם לא ברור, "מצב טוב".
- description: משפט או שניים על מה שרואים: חומר, צבע, גודל משוער, פגמים נראים. בלי להמציא, בלי מחירים ובלי פרטי קשר.
- confidence: מספר בין 0 ל-1.

הקטגוריות ותתי-הקטגוריות:
${catalog}`

const searchPrompt = `משתמש בלוח "אגורה" (חפצים למסירה בחינם) צילם חפץ ורוצה למצוא חפצים דומים.
זהה את החפץ המרכזי והחזר אובייקט JSON אחד בלבד, בעברית, בלי טקסט נוסף:
{"isItem": true, "label": "...", "category": "...", "sub": "...", "keywords": ["..."]}

- isItem: false אם אין בתמונה חפץ (אדם, בעל חיים, נוף, צילום מסך).
- label: שם קצר, 1 עד 3 מילים (למשל "שידת מגירות").
- category: בדיוק אחת מ: ${categoryLabels.join(" / ")}. sub: בדיוק אחת מתתי-הקטגוריות שלה, או "".
- keywords: 2 עד 4 מילות חיפוש קצרות ביחיד, כמו שכותבים בלוח (למשל ["שידה", "מגירות"]).

הקטגוריות ותתי-הקטגוריות:
${catalog}`

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "")

function validRecognition(raw: unknown): AiResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new AiFailure("failed")
  const r = raw as Record<string, unknown>
  const cat = categories.find((c) => c.label === str(r.category, 40))
  const sub = cat && cat.subs.includes(str(r.sub, 60)) ? str(r.sub, 60) : ""
  const title = str(r.title, 60).replace(/[.,!?]+$/, "") || sub || ""
  const isItem = r.isItem !== false && title.length > 1
  const conf = Number(r.confidence)
  return {
    isItem,
    title,
    category: cat?.label ?? "שונות",
    sub,
    condition: conditions.includes(str(r.condition, 20) as Condition) ? (str(r.condition, 20) as Condition) : "מצב טוב",
    description: str(r.description, 400),
    // Missing category lowers trust: the giver should look before publishing
    confidence: Number.isFinite(conf) ? Math.max(0, Math.min(1, cat ? conf : Math.min(conf, 0.45))) : 0.5,
  }
}

export type PhotoQuery = { isItem: boolean; label: string; category: string; sub: string; keywords: string[] }

function validQuery(raw: unknown): PhotoQuery {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new AiFailure("failed")
  const r = raw as Record<string, unknown>
  const cat = categories.find((c) => c.label === str(r.category, 40))
  const sub = cat && cat.subs.includes(str(r.sub, 60)) ? str(r.sub, 60) : ""
  const keywords = Array.isArray(r.keywords) ? r.keywords.map((k) => str(k, 24)).filter((k) => k.length > 1).slice(0, 4) : []
  const label = str(r.label, 40) || keywords[0] || sub || ""
  return { isItem: r.isItem !== false && (!!cat || keywords.length > 0), label, category: cat?.label ?? "", sub, keywords }
}

/** Recognise the item in up to 3 photos. Throws an error mapped by errorCode(). */
export async function recognize(files: Blob[], signal: AbortSignal, fresh = false): Promise<AiResult> {
  const vision = await getVision()
  if (!vision) throw new AiFailure("unavailable")
  abortable(signal)
  const images = await Promise.all(files.slice(0, vision.maxCount).map(prepareImage))
  abortable(signal)
  // `fresh` skips the 5-minute answer cache so "recognise again" really asks again
  const raw = await vision.fn.json<unknown>(recognizePrompt, { images, modelTier: "quick", signal, ...(fresh ? { cache: false } : {}) })
  return validRecognition(raw)
}

/** Turn a photo into a search: label, category and keywords. Throws an error mapped by errorCode(). */
export async function photoQuery(file: Blob, signal: AbortSignal): Promise<PhotoQuery> {
  const vision = await getVision()
  if (!vision) throw new AiFailure("unavailable")
  abortable(signal)
  const image = await prepareImage(file)
  abortable(signal)
  const raw = await vision.fn.json<unknown>(searchPrompt, { images: [image], modelTier: "quick", signal })
  return validQuery(raw)
}

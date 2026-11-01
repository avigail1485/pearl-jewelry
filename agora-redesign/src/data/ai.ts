import { categories, conditions } from "./meta"
import type { Condition } from "./types"

export type AiResult = {
  isItem: boolean
  title: string
  category: string
  sub: string
  condition: Condition
  description: string
  confidence: number
  /** true when no AI was reachable and this is a labeled sample result */
  demo?: boolean
}

export type AiError = "not_granted" | "rate_limited" | "cancelled" | "failed"

type SampleFn = ((input: string, opts?: object) => Promise<{ text: string }>) & {
  json: <T>(input: string, opts?: object) => Promise<T>
  limits: () => Promise<{ images?: object }>
}

let samplePromise: Promise<SampleFn | null> | null = null

/** Resolves Claude's `sample` capability when the page runs inside a Claude viewer with image support; otherwise null. */
export function getVision(): Promise<SampleFn | null> {
  const claude = (window as unknown as { claude?: { use: (n: string) => Promise<unknown> } }).claude
  if (!claude?.use) return Promise.resolve(null)
  samplePromise ??= claude
    .use("sample")
    .then(async (s) => {
      if (!s) return null
      const fn = s as SampleFn
      const lim = await fn.limits().catch(() => null)
      return lim?.images ? fn : null
    })
    .catch(() => null)
  return samplePromise
}

const catalog = categories.map((c) => `- ${c.label}: ${c.subs.join(", ")}`).join("\n")

const prompt = `אתה מזהה חפצים למסירה בחינם בלוח "אגורה". מצורפות תמונות של חפץ אחד שמישהו רוצה למסור.
החזר אובייקט JSON אחד בלבד, בעברית, במבנה:
{"isItem": boolean, "title": string, "category": string, "sub": string, "condition": string, "description": string, "confidence": number}

כללים:
- isItem: false אם הנושא המרכזי בתמונה אינו חפץ שאפשר למסור (למשל אדם, נוף, צילום מסך).
- title: שם קצר וברור לחפץ, 2-5 מילים, כמו שהיו כותבים בלוח (למשל "שידת מגירות מעץ").
- category: בדיוק אחת מהקטגוריות שברשימה. sub: בדיוק אחת מתתי-הקטגוריות שלה, או "" אם אין מתאימה.
- condition: בדיוק אחד מ: ${conditions.join(" / ")}. הערך לפי מה שנראה בתמונה בלבד.
- description: משפט או שניים על מה שרואים בתמונה (חומר, צבע, גודל משוער, פגמים נראים). בלי להמציא פרטים שלא רואים.
- confidence: מספר בין 0 ל-1, כמה אתה בטוח בזיהוי.

הקטגוריות:
${catalog}`

function clean(raw: Partial<AiResult>): AiResult {
  const cat = categories.find((c) => c.label === raw.category) ?? categories.find((c) => c.label === "שונות")!
  return {
    isItem: raw.isItem !== false,
    title: String(raw.title ?? "").slice(0, 60),
    category: cat.label,
    sub: cat.subs.includes(String(raw.sub)) ? String(raw.sub) : "",
    condition: conditions.includes(raw.condition as Condition) ? (raw.condition as Condition) : "מצב טוב",
    description: String(raw.description ?? "").slice(0, 400),
    confidence: Math.max(0, Math.min(1, Number(raw.confidence) || 0)),
  }
}

/** Sample result for environments without AI (Figma Make, local dev). Always flagged `demo`. */
const demoResult: AiResult = {
  isItem: true,
  title: "שידת מגירות מעץ",
  category: "ריהוט וכלי בית",
  sub: "שידות וכונניות",
  condition: "מצב טוב",
  description: "שידה מעץ בגוון חום עם ארבע מגירות וידיות מתכת. נראים סימני שימוש קלים בחלק העליון.",
  confidence: 0.86,
  demo: true,
}

export async function recognize(files: File[], signal: AbortSignal): Promise<AiResult> {
  const vision = await getVision()
  if (!vision) {
    await new Promise((r, j) => {
      const t = setTimeout(r, 1800)
      signal.addEventListener("abort", () => (clearTimeout(t), j({ code: "cancelled" })))
    })
    return demoResult
  }
  const raw = await vision.json<Partial<AiResult>>(prompt, { images: files.slice(0, 3), modelTier: "quick", signal })
  return clean(raw)
}

export function errorCode(e: unknown): AiError {
  const code = (e as { code?: string })?.code
  if (code === "cancelled") return "cancelled"
  if (code === "not_granted" || code === "sampling_disabled" || code === "images_unavailable" || code === "not_declared") return "not_granted"
  if (code === "rate_limited") return "rate_limited"
  return "failed"
}

// ── Search by photo ──────────────────────────────────────────────

export type PhotoQuery = { isItem: boolean; label: string; category: string; sub: string; keywords: string[]; demo?: boolean }

const searchPrompt = `משתמש בלוח "אגורה" (חפצים למסירה בחינם) צילם חפץ ורוצה למצוא חפצים דומים.
זהה את החפץ המרכזי בתמונה והחזר אובייקט JSON אחד בלבד, בעברית:
{"isItem": boolean, "label": string, "category": string, "sub": string, "keywords": string[]}

- isItem: false אם אין בתמונה חפץ (אדם, נוף, צילום מסך).
- label: שם קצר לחפץ, 1-3 מילים (למשל "שידת מגירות").
- category: בדיוק אחת מהקטגוריות ברשימה. sub: בדיוק אחת מתתי-הקטגוריות שלה, או "".
- keywords: 2-4 מילות חיפוש קצרות בצורת יחיד, כמו שאנשים כותבים בלוח (למשל ["שידה", "מגירות"]).

הקטגוריות:
${catalog}`

export async function photoQuery(file: File, signal: AbortSignal): Promise<PhotoQuery> {
  const vision = await getVision()
  if (!vision) {
    await new Promise((r, j) => {
      const t = setTimeout(r, 1600)
      signal.addEventListener("abort", () => (clearTimeout(t), j({ code: "cancelled" })))
    })
    return { isItem: true, label: "שידת מגירות", category: "ריהוט וכלי בית", sub: "שידות וכונניות", keywords: ["שידה", "מגירות"], demo: true }
  }
  const raw = await vision.json<Partial<PhotoQuery>>(searchPrompt, { images: [file], modelTier: "quick", signal })
  const cat = categories.find((c) => c.label === raw.category)
  return {
    isItem: raw.isItem !== false,
    label: String(raw.label ?? "").slice(0, 40),
    category: cat?.label ?? "",
    sub: cat && cat.subs.includes(String(raw.sub)) ? String(raw.sub) : "",
    keywords: Array.isArray(raw.keywords) ? raw.keywords.map(String).filter(Boolean).slice(0, 4) : [],
  }
}

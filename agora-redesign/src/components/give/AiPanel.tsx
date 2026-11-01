import { useEffect, useRef } from "react"
import { AlertTriangle, RotateCcw, Sparkles } from "lucide-react"
import type { AiError, AiResult } from "../../data/ai"
import Button from "../ui/Button"

export type AiState = { status: "idle" } | { status: "scanning" } | { status: "done"; result: AiResult } | { status: "error"; error: AiError }

const errorCopy: Record<AiError, string> = {
  not_granted: "זיהוי AI לא אושר בתצוגה הזו. אפשר למלא את הפרטים ידנית.",
  rate_limited: "יותר מדי ניסיונות ברגע זה. נסו שוב בעוד דקה, או מלאו ידנית.",
  failed: "לא הצלחנו לזהות את החפץ. אפשר לנסות שוב או למלא ידנית.",
  cancelled: "הזיהוי בוטל.",
}

const confidenceLabel = (c: number) => (c >= 0.75 ? "ביטחון גבוה" : c >= 0.5 ? "ביטחון בינוני" : "ביטחון נמוך")

/** Scan overlay drawn on top of the cover photo while recognition runs. */
export function ScanOverlay({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end overflow-hidden bg-blue/10 p-3">
      <span className="ai-scanline pointer-events-none absolute inset-x-0 h-16" aria-hidden="true" />
      <div className="relative flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold shadow-md" role="status" aria-live="polite">
        <Sparkles size={15} className="animate-pulse text-blue" />
        מזהים את החפץ…
        <button type="button" onClick={onCancel} className="mr-1 text-[13px] font-medium text-mute underline underline-offset-2 hover:text-ink">
          ביטול
        </button>
      </div>
    </div>
  )
}

export default function AiPanel({ state, onAccept, onEdit, onRetry, onManual }: { state: AiState; onAccept: () => void; onEdit: () => void; onRetry: () => void; onManual: () => void }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (state.status === "done") ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [state.status])
  if (state.status === "error") {
    if (state.error === "cancelled") return null
    return (
      <div className="mt-4 flex flex-col gap-3 rounded-2xl p-4 ring-1 ring-inset ring-line">
        <p className="flex items-start gap-2 text-[14px] text-ink-2">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#c2410c]" />
          {errorCopy[state.error]}
        </p>
        <div className="flex gap-2">
          {state.error !== "not_granted" && (
            <Button size="md" variant="outline" icon={<RotateCcw size={16} />} onClick={onRetry}>
              לנסות שוב
            </Button>
          )}
          <Button size="md" variant="soft" onClick={onManual}>
            מילוי ידני
          </Button>
        </div>
      </div>
    )
  }
  if (state.status !== "done") return null

  const r = state.result
  const unsure = !r.isItem || r.confidence < 0.5
  return (
    <section ref={ref} className="screen-in mt-4 scroll-mb-4 overflow-hidden rounded-3xl bg-lavender" aria-label="תוצאת זיהוי AI">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-blue-ink">
            <Sparkles size={15} />
            {r.demo ? "זיהוי AI · תוצאה לדוגמה" : "זוהה ב-AI"}
          </span>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[12px] font-medium text-ink-2">{confidenceLabel(r.confidence)}</span>
        </div>

        {r.isItem ? (
          <>
            <h3 className="text-[22px] font-bold leading-tight">{r.title}</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[14px]">
              <dt className="text-mute">קטגוריה</dt>
              <dd className="font-medium">
                {r.category}
                {r.sub && ` › ${r.sub}`}
              </dd>
              <dt className="text-mute">מצב</dt>
              <dd className="font-medium">{r.condition}</dd>
            </dl>
            {r.description && <p className="rounded-2xl bg-white p-3 text-[14px] leading-relaxed text-ink-2">{r.description}</p>}
          </>
        ) : (
          <p className="text-[15px] font-medium">לא נראה שבתמונה יש חפץ למסירה. נסו תמונה אחרת שבה החפץ במרכז.</p>
        )}

        {unsure && r.isItem && <p className="text-[13px] text-[#9a3412]">לא בטוחים בזיהוי. כדאי לעבור על הפרטים לפני הפרסום.</p>}
        {r.demo && <p className="text-[12px] text-mute">AI לא זמין בתצוגה הזו, ולכן מוצגת תוצאה לדוגמה. בקישור החי מתבצע זיהוי אמיתי של התמונה.</p>}
      </div>

      <div className="flex flex-col gap-2 border-t border-lavender-2 bg-white/60 p-4">
        {r.isItem ? (
          <>
            <Button block onClick={unsure ? onEdit : onAccept}>
              {unsure ? "לבדוק ולתקן פרטים" : "נראה טוב, להמשך"}
            </Button>
            <div className="flex justify-center gap-5">
              {!unsure && (
                <button type="button" onClick={onEdit} className="text-[14px] font-medium text-ink-2 underline underline-offset-4 hover:text-ink">
                  לתקן פרטים
                </button>
              )}
              <button type="button" onClick={onRetry} className="text-[14px] font-medium text-ink-2 underline underline-offset-4 hover:text-ink">
                לזהות שוב
              </button>
            </div>
          </>
        ) : (
          <Button block variant="soft" onClick={onManual}>
            מילוי ידני
          </Button>
        )}
      </div>
    </section>
  )
}

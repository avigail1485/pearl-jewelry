import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Camera, Sparkles } from "lucide-react"
import { errorCode, photoQuery } from "../../data/ai"
import { emptyFilters, useNav } from "../../nav"
import Sheet from "../ui/Sheet"
import Button from "../ui/Button"

type State = { status: "idle" } | { status: "scanning"; url: string } | { status: "error"; url: string; message: string }

const messages = {
  not_granted: "חיפוש לפי תמונה לא אושר בתצוגה הזו. אפשר לחפש במילים.",
  rate_limited: "יותר מדי ניסיונות ברגע זה. נסו שוב בעוד דקה.",
  failed: "לא הצלחנו לזהות את החפץ בתמונה. נסו תמונה אחרת, כשהחפץ במרכז.",
  notItem: "לא מצאנו חפץ בתמונה. צלמו את החפץ עצמו, במרכז הפריים.",
}

/**
 * Search by photo: pick or shoot a photo → AI names the item → results of similar items.
 * Returns a trigger to put on any button, plus the sheet to render.
 */
export function usePhotoSearch() {
  const nav = useNav()
  const input = useRef<HTMLInputElement>(null)
  const ctl = useRef<AbortController | null>(null)
  const [state, setState] = useState<State>({ status: "idle" })

  useEffect(() => () => ctl.current?.abort(), [])

  const run = (file: File) => {
    const url = URL.createObjectURL(file)
    ctl.current?.abort()
    const c = new AbortController()
    ctl.current = c
    setState({ status: "scanning", url })
    photoQuery(file, c.signal).then(
      (r) => {
        if (c.signal.aborted) return
        if (!r.isItem || (!r.category && !r.keywords.length)) return setState({ status: "error", url, message: messages.notItem })
        setState({ status: "idle" })
        nav.push({
          name: "results",
          filters: { ...emptyFilters, category: r.category || undefined, sub: r.sub || undefined, keywords: r.keywords, photo: { url, label: r.label || r.keywords[0] || "החפץ", demo: r.demo } },
        })
      },
      (e) => {
        const code = errorCode(e)
        if (code === "cancelled") return
        setState({ status: "error", url, message: messages[code] })
      },
    )
  }

  const close = () => {
    ctl.current?.abort()
    setState({ status: "idle" })
  }

  const element = (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ""
          if (f) run(f)
        }}
      />
      {state.status !== "idle" && (
        <Sheet title="חיפוש לפי תמונה" onClose={close}>
          <div className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-3xl bg-photo">
              <img src={state.url} alt="התמונה שנבחרה" className="aspect-[4/3] w-full object-cover" />
              {state.status === "scanning" && (
                <div className="absolute inset-0 flex items-end justify-center bg-blue/10 p-3">
                  <span className="ai-scanline pointer-events-none absolute inset-x-0 h-16" aria-hidden="true" />
                  <span className="relative flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold shadow-md" role="status">
                    <Sparkles size={15} className="animate-pulse text-blue" />
                    מחפשים חפצים דומים…
                  </span>
                </div>
              )}
            </div>
            {state.status === "error" && (
              <>
                <p className="flex items-start gap-2 text-[14px] text-ink-2">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#c2410c]" />
                  {state.message}
                </p>
                <Button block icon={<Camera size={18} />} onClick={() => input.current?.click()}>
                  תמונה אחרת
                </Button>
                <Button
                  block
                  variant="ghost"
                  onClick={() => {
                    close()
                    nav.push({ name: "search" })
                  }}
                >
                  חיפוש במילים
                </Button>
              </>
            )}
            {state.status === "scanning" && (
              <Button block variant="outline" onClick={close}>
                ביטול
              </Button>
            )}
          </div>
        </Sheet>
      )}
    </>
  )

  return { open: () => input.current?.click(), element }
}

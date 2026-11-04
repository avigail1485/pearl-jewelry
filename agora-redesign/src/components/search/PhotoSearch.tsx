import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Camera, Loader2 } from "lucide-react"
import { errorCode, photoQuery } from "../../data/ai"
import { emptyFilters, useNav } from "../../nav"
import Sheet from "../ui/Sheet"
import Button from "../ui/Button"

type State = { status: "idle" } | { status: "scanning" } | { status: "error"; message: string }

const messages = {
  unavailable: "חיפוש לפי תמונה לא זמין בגרסה הזו. אפשר לחפש במילים.",
  not_granted: "לא ניתן אישור לחיפוש לפי תמונה. אפשר לחפש במילים.",
  rate_limited: "יותר מדי ניסיונות ברגע זה. נסו שוב בעוד דקה.",
  bad_image: "לא הצלחנו לקרוא את התמונה. נסו תמונה בפורמט JPG או PNG.",
  failed: "לא הצלחנו למצוא חפצים לפי התמונה. נסו תמונה אחרת, כשהחפץ במרכז.",
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
    ctl.current?.abort()
    const c = new AbortController()
    ctl.current = c
    setState({ status: "scanning" })
    photoQuery(file, c.signal).then(
      (r) => {
        if (ctl.current !== c) return
        if (!r.isItem || (!r.category && !r.keywords.length)) return setState({ status: "error", message: messages.notItem })
        setState({ status: "idle" })
        nav.push({
          name: "results",
          filters: { ...emptyFilters, category: r.category || undefined, sub: r.sub || undefined, keywords: r.keywords, photo: { label: r.label || r.keywords[0] || "החפץ" } },
        })
      },
      (e) => {
        if (ctl.current !== c) return
        const code = errorCode(e)
        if (code === "cancelled") return
        setState({ status: "error", message: messages[code] })
      },
    )
  }

  const close = () => {
    ctl.current?.abort()
    ctl.current = null
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
            {state.status === "scanning" && (
              <p className="flex items-center justify-center gap-2 py-6 text-[15px] font-medium text-ink-2" role="status">
                <Loader2 size={20} className="animate-spin text-blue" />
                מחפשים חפצים דומים…
              </p>
            )}
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

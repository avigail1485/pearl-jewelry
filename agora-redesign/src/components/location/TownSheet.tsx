import { useState } from "react"
import { Check, Loader2, LocateFixed, Search } from "lucide-react"
import { locateErrorCopy, townNames, type LocateError } from "../../data/location"
import { useNav } from "../../nav"
import Sheet from "../ui/Sheet"

/**
 * Pick an area: "my current location" first (device position → nearest town), then a searchable town list.
 * onPick receives the town and how it was chosen.
 */
export default function TownSheet({
  title = "בחירת אזור",
  current,
  onPick,
  onClose,
}: {
  title?: string
  current?: string
  onPick: (town: string, source: "gps" | "manual") => void
  onClose: () => void
}) {
  const nav = useNav()
  const [q, setQ] = useState("")
  const [error, setError] = useState<LocateError | null>(null)
  const list = townNames.filter((t) => t.includes(q.trim()))

  const useMine = async () => {
    setError(null)
    const res = await nav.locate()
    if (res.ok) onPick(res.town, "gps")
    else setError(res.error)
  }

  return (
    <Sheet title={title} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={useMine}
          disabled={nav.locating}
          className="flex min-h-14 items-center gap-3 rounded-2xl bg-lavender px-4 text-right font-semibold text-blue-ink hover:bg-lavender-2 disabled:opacity-70"
        >
          {nav.locating ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : <LocateFixed size={20} aria-hidden="true" />}
          <span className="flex-1">{nav.locating ? "מזהים את המיקום שלך…" : "המיקום הנוכחי שלי"}</span>
        </button>
        {error && (
          <p role="alert" className="text-[14px] text-ink-2">
            {locateErrorCopy[error]}
          </p>
        )}

        <label className="flex h-12 items-center gap-2 rounded-2xl bg-white px-4 ring-1 ring-inset ring-line focus-within:ring-2 focus-within:ring-blue">
          <Search size={18} className="text-ink-2" aria-hidden="true" />
          <span className="sr-only">חיפוש עיר</span>
          <input
            type="search"
            name="town"
            autoComplete="address-level2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="הקלידו עיר…"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-mute"
          />
        </label>

        <ul className="-mx-1 flex flex-col">
          {list.map((t) => (
            <li key={t}>
              <button
                type="button"
                onClick={() => onPick(t, "manual")}
                aria-pressed={current === t}
                className="flex min-h-12 w-full items-center justify-between rounded-xl px-3 text-right text-[15px] hover:bg-lavender"
              >
                {t}
                {current === t && <Check size={18} className="text-blue" aria-hidden="true" />}
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="px-3 py-4 text-[14px] text-ink-2">לא מצאנו עיר בשם הזה. נסו שם אחר או חלק ממנו.</li>}
        </ul>
      </div>
    </Sheet>
  )
}

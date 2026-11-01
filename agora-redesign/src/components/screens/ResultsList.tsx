import { useMemo, useState } from "react"
import { SearchX } from "lucide-react"
import type { Condition, FeedItem } from "../../data/mock"
import { useNav } from "../../nav"
import ItemGrid from "../home/ItemGrid"
import Chip from "../ui/Chip"
import Button from "../ui/Button"

const conditionFilters: (Condition | "הכל")[] = ["הכל", "כמו חדש", "במצב טוב", "דורש תיקון"]

/** Shared filtered grid: condition filter, "available only" and sort — all live. */
export default function ResultsList({ items }: { items: FeedItem[] }) {
  const nav = useNav()
  const [cond, setCond] = useState<Condition | "הכל">("הכל")
  const [availableOnly, setAvailableOnly] = useState(true)
  const [sort, setSort] = useState<"new" | "near">("new")

  const shown = useMemo(() => {
    let list = items.filter((i) => (cond === "הכל" || i.condition === cond) && (!availableOnly || i.status === "available"))
    if (sort === "near") list = [...list].sort((a, b) => a.distanceKm - b.distanceKm)
    return list
  }, [items, cond, availableOnly, sort])

  return (
    <div className="flex flex-col gap-4">
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {conditionFilters.map((c) => (
          <Chip key={c} selected={cond === c} onClick={() => setCond(c)}>
            {c}
          </Chip>
        ))}
      </div>
      <div className="flex items-center justify-between text-[13px]">
        <label className="flex cursor-pointer items-center gap-2 font-medium text-deep">
          <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="h-4 w-4 accent-[#00b46e]" />
          רק זמינים
        </label>
        <div className="flex items-center gap-1 rounded-full bg-paper p-1" style={{ boxShadow: "var(--shadow-raised)" }}>
          {(["new", "near"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className={`rounded-full px-3 py-1 font-semibold ${sort === s ? "bg-brand text-paper" : "text-ink-soft"}`}
            >
              {s === "new" ? "חדשים" : "קרובים"}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[13px] text-mute">{shown.length} פריטים</p>
      {shown.length > 0 ? (
        <ItemGrid items={shown} />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[24px] bg-paper px-6 py-10 text-center" style={{ boxShadow: "var(--shadow-raised)" }}>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-tint text-accent-ink">
            <SearchX size={26} />
          </span>
          <h3 className="text-[17px] font-bold text-deep">לא מצאנו כרגע</h3>
          <p className="text-[14px] text-mute">פרסמו בקשה ונודיע לכם כשמשהו מתאים יעלה.</p>
          <Button onClick={() => nav.push({ name: "request" })}>פרסום בקשה</Button>
        </div>
      )}
    </div>
  )
}

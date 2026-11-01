import { useMemo, useState } from "react"
import { Search, X, Clock } from "lucide-react"
import { previewFeed, searchChips } from "../../data/mock"
import ScreenHeader from "../ui/ScreenHeader"
import ResultsList from "./ResultsList"

const recent = ["שידה", "מיטת תינוק", "ספרים"]

export default function SearchScreen({ initial = "" }: { initial?: string }) {
  const [q, setQ] = useState(initial)
  const results = useMemo(() => {
    const t = q.trim()
    if (!t) return []
    return previewFeed.filter((i) => i.title.includes(t) || i.category.includes(t) || i.city.includes(t))
  }, [q])

  return (
    <div className="flex flex-col">
      <ScreenHeader
        end={
          <div className="flex h-12 min-w-0 flex-[6] items-center gap-2 rounded-full bg-paper px-4 focus-within:ring-2 focus-within:ring-brand" style={{ boxShadow: "var(--shadow-float)" }}>
            <Search size={18} className="shrink-0 text-brand-strong" />
            <input
              autoFocus
              type="search"
              aria-label="חיפוש חפצים"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="מה אתם מחפשים?"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-deep placeholder:text-mute focus:outline-none"
            />
            {q && (
              <button type="button" aria-label="ניקוי" onClick={() => setQ("")} className="text-mute hover:text-deep">
                <X size={18} />
              </button>
            )}
          </div>
        }
      />
      <div className="flex flex-col gap-6 px-5 pt-2 pb-6">
        {!q.trim() ? (
          <>
            <section>
              <h2 className="mb-3 text-[15px] font-bold text-deep">חיפושים פופולריים</h2>
              <div className="flex flex-wrap gap-2">
                {searchChips.map((c) => (
                  <button key={c} type="button" onClick={() => setQ(c)} className="rounded-full bg-paper px-4 py-2 text-[14px] font-medium text-deep hover:bg-brand-tint" style={{ boxShadow: "var(--shadow-raised)" }}>
                    {c}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-2 text-[15px] font-bold text-deep">חיפושים אחרונים</h2>
              <div className="flex flex-col">
                {recent.map((r) => (
                  <button key={r} type="button" onClick={() => setQ(r)} className="flex items-center gap-3 border-b border-line py-3 text-right text-[15px] text-deep hover:text-brand-strong">
                    <Clock size={16} className="text-mute" />
                    {r}
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <ResultsList items={results} />
        )}
      </div>
    </div>
  )
}

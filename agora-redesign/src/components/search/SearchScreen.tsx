import { useMemo, useState } from "react"
import { Camera, ChevronDown, ChevronLeft, Clock, Search, X } from "lucide-react"
import { usePhotoSearch } from "./PhotoSearch"
import { categories, popularSearches } from "../../data/meta"
import { items } from "../../data/items"
import { emptyFilters, useNav, type Filters } from "../../nav"
import TopBar from "../ui/TopBar"

export default function SearchScreen({ initial = "" }: { initial?: string }) {
  const nav = useNav()
  const photo = usePhotoSearch()
  const [q, setQ] = useState(initial)
  const [open, setOpen] = useState<string | null>(null)

  const go = (f: Partial<Filters>) => {
    if (f.query) nav.addRecent(f.query)
    nav.push({ name: "results", filters: { ...emptyFilters, ...f } })
  }

  const suggestions = useMemo(() => {
    const t = q.trim()
    if (!t) return null
    const titles = [...new Set(items.filter((i) => i.title.includes(t)).map((i) => i.title))].slice(0, 5)
    const subs = categories.flatMap((c) => c.subs.filter((s) => s.includes(t)).map((s) => ({ sub: s, category: c.label }))).slice(0, 3)
    return { titles, subs }
  }, [q])

  return (
    <div className="flex min-h-full flex-col bg-white">
      <TopBar>
        <form
          className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-4 shadow-search ring-1 ring-inset ring-line focus-within:ring-2 focus-within:ring-blue"
          onSubmit={(e) => {
            e.preventDefault()
            go({ query: q.trim() })
          }}
        >
          <Search size={18} className="shrink-0 text-ink-2" />
          <input
            autoFocus
            type="search"
            enterKeyHint="search"
            aria-label="חיפוש חפץ"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="למשל: ספה, מיטת תינוק, מקרר"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-mute [&::-webkit-search-cancel-button]:hidden"
          />
          {q ? (
            <button type="button" aria-label="ניקוי" onClick={() => setQ("")} className="text-mute hover:text-ink">
              <X size={18} />
            </button>
          ) : (
            <button type="button" aria-label="חיפוש לפי תמונה" onClick={photo.open} className="text-ink-2 hover:text-ink">
              <Camera size={19} />
            </button>
          )}
        </form>
      </TopBar>

      {suggestions ? (
        <ul className="flex flex-col px-5">
          <li>
            <button type="button" onClick={() => go({ query: q.trim() })} className="flex w-full items-center gap-3 border-b border-line py-3.5 text-right">
              <Search size={18} className="text-blue" />
              <span className="flex-1 text-[15px]">
                חיפוש <b>"{q.trim()}"</b> בכל הקטגוריות
              </span>
            </button>
          </li>
          {suggestions.subs.map((s) => (
            <li key={s.sub}>
              <button type="button" onClick={() => go({ category: s.category, sub: s.sub })} className="flex w-full items-center gap-3 border-b border-line py-3.5 text-right">
                <ChevronLeft size={18} className="text-mute" />
                <span className="flex-1 text-[15px]">
                  {s.sub} <span className="text-mute">ב{s.category}</span>
                </span>
              </button>
            </li>
          ))}
          {suggestions.titles.map((t) => (
            <li key={t}>
              <button type="button" onClick={() => go({ query: t })} className="flex w-full items-center gap-3 border-b border-line py-3.5 text-right">
                <Search size={16} className="text-mute" />
                <span className="flex-1 text-[15px]">{t}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-7 px-5 pb-8 pt-2">
          <button type="button" onClick={photo.open} className="-mb-3 flex items-center gap-3 border-b border-line pb-4 text-right">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lavender">
              <Camera size={17} />
            </span>
            <span className="flex-1 text-[15px]">חיפוש לפי תמונה</span>
            <ChevronLeft size={18} className="text-mute" />
          </button>

          {nav.recent.length > 0 && (
            <section>
              <h2 className="mb-1 text-[15px] font-bold">חיפושים אחרונים</h2>
              {nav.recent.map((r) => (
                <button key={r} type="button" onClick={() => go({ query: r })} className="flex w-full items-center gap-3 border-b border-line py-3 text-right text-[15px] last:border-b-0">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lavender">
                    <Clock size={16} />
                  </span>
                  {r}
                </button>
              ))}
            </section>
          )}

          <section>
            <h2 className="mb-3 text-[15px] font-bold">מה מחפשים הכי הרבה</h2>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((p) => (
                <button key={p} type="button" onClick={() => go({ query: p })} className="h-9 rounded-full px-4 text-[14px] font-medium ring-1 ring-inset ring-line hover:ring-ink/30">
                  {p}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-1 text-[15px] font-bold">לפי קטגוריה</h2>
            <ul>
              {categories.map((c) => {
                const isOpen = open === c.label
                return (
                  <li key={c.label} className="border-b border-line last:border-b-0">
                    <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : c.label)} className="flex w-full items-center justify-between py-3.5 text-right text-[15px] font-medium">
                      {c.label}
                      <ChevronDown size={18} className={`text-mute transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="flex flex-wrap gap-2 pb-4">
                        <button type="button" onClick={() => go({ category: c.label })} className="h-9 rounded-full bg-ink px-4 text-[14px] font-medium text-white">
                          הכל ב{c.label}
                        </button>
                        {c.subs.map((s) => (
                          <button key={s} type="button" onClick={() => go({ category: c.label, sub: s })} className="h-9 rounded-full px-4 text-[14px] ring-1 ring-inset ring-line hover:ring-ink/30">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      )}
      {photo.element}
    </div>
  )
}

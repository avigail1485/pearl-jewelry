import { useMemo, useState, type ReactNode } from "react"
import { Camera, ChevronDown, Clock, Loader2, LocateFixed, MapPin, Search, X } from "lucide-react"
import { categories, conditions, popularSearches } from "../../data/meta"
import { items } from "../../data/items"
import { filterItems } from "../../data/filter"
import { locateErrorCopy, type LocateError } from "../../data/location"
import { emptyFilters, placeLabel, useNav, type Filters, type SearchSection } from "../../nav"
import TopBar from "../ui/TopBar"
import Button from "../ui/Button"
import Chip from "../ui/Chip"
import OptionCard from "../ui/OptionCard"
import TownSheet from "../location/TownSheet"
import { usePhotoSearch } from "./PhotoSearch"

const radii = [5, 10, 25, 50]
const sortLabels: Record<Filters["sort"], string> = { new: "החדשים ביותר", near: "הקרובים אליי", condition: "המצב הטוב ביותר" }

/** One collapsible search card. Closed it shows a one-line summary; only one card is open at a time. */
function Card({ id, title, summary, open, onOpen, children }: { id: SearchSection; title: string; summary: string; open: boolean; onOpen: (id: SearchSection) => void; children: ReactNode }) {
  return (
    <section className={`rounded-3xl bg-white transition-shadow duration-200 ${open ? "shadow-card ring-1 ring-inset ring-line" : "ring-1 ring-inset ring-line"}`}>
      {open ? (
        <div className="flex flex-col gap-4 p-5">
          <h2 className="text-[22px] font-bold leading-tight">{title}</h2>
          {children}
        </div>
      ) : (
        <button type="button" onClick={() => onOpen(id)} aria-expanded={false} className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-4 text-right">
          <span className="text-[14px] text-ink-2">{title}</span>
          <span className="flex min-w-0 items-center gap-1.5 text-[15px] font-semibold">
            <span className="truncate">{summary}</span>
            <ChevronDown size={16} className="shrink-0 text-ink-2" aria-hidden="true" />
          </span>
        </button>
      )}
    </section>
  )
}

export default function SearchScreen({ filters: initial, open: initialOpen, from }: { filters?: Filters; open?: SearchSection; from?: "results" }) {
  const nav = useNav()
  const photo = usePhotoSearch()
  const [f, setF] = useState<Filters>(() => ({ ...(initial ?? emptyFilters), photo: undefined, keywords: undefined }))
  const [open, setOpen] = useState<SearchSection>(initialOpen ?? "what")
  const [catOpen, setCatOpen] = useState<string | null>(initial?.category ?? null)
  const [townSheet, setTownSheet] = useState(false)
  const [locError, setLocError] = useState<LocateError | null>(null)
  const up = (p: Partial<Filters>) => setF((x) => ({ ...x, ...p }))

  const count = filterItems(f, nav.location, nav.myItems.filter((i) => !i.given)).length
  const q = f.query.trim()

  const suggestions = useMemo(() => {
    if (!q) return null
    const titles = [...new Set(items.filter((i) => i.title.includes(q)).map((i) => i.title))].slice(0, 4)
    const subs = categories.flatMap((c) => c.subs.filter((s) => s.includes(q)).map((s) => ({ sub: s, category: c.label }))).slice(0, 3)
    return { titles, subs }
  }, [q])

  const show = (next: Filters = f) => {
    if (next.query.trim()) nav.addRecent(next.query.trim())
    const route = { name: "results" as const, filters: next }
    if (from === "results") {
      nav.back()
      nav.replace(route)
    } else nav.push(route)
  }

  const whatSummary = f.query || f.sub || f.category || "כל החפצים"
  const whereSummary = placeLabel(f.place, nav.location)
  const condSummary = f.conditions.length ? f.conditions.join(", ") : "כל מצב"

  const pickNear = async (km: number) => {
    up({ place: { kind: "near", km } })
    if (!nav.location) {
      setLocError(null)
      const res = await nav.locate()
      if (!res.ok) setLocError(res.error)
    }
  }

  return (
    <div className="relative flex h-full flex-col bg-canvas">
      <TopBar title="חיפוש" />

      <div className="no-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-8 pt-3">
        <Card id="what" title="מה מחפשים?" summary={whatSummary} open={open === "what"} onOpen={setOpen}>
          <form
            role="search"
            className="flex h-14 items-center gap-2 rounded-2xl bg-white px-4 shadow-search ring-1 ring-inset ring-line focus-within:ring-2 focus-within:ring-blue"
            onSubmit={(e) => {
              e.preventDefault()
              show()
            }}
          >
            <Search size={20} className="shrink-0 text-ink-2" aria-hidden="true" />
            <input
              type="search"
              name="q"
              autoComplete="off"
              enterKeyHint="search"
              aria-label="מה מחפשים"
              value={f.query}
              onChange={(e) => up({ query: e.target.value })}
              placeholder="ספה, מיטת תינוק, מקרר…"
              className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-mute [&::-webkit-search-cancel-button]:hidden"
            />
            {f.query ? (
              <button type="button" aria-label="ניקוי" onClick={() => up({ query: "" })} className="flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:bg-lavender">
                <X size={18} />
              </button>
            ) : (
              <button type="button" aria-label="חיפוש לפי תמונה" onClick={photo.open} className="flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:bg-lavender">
                <Camera size={19} />
              </button>
            )}
          </form>

          {suggestions ? (
            <ul className="-mx-1 flex flex-col">
              {suggestions.subs.map((s) => (
                <li key={s.sub}>
                  <button type="button" onClick={() => show({ ...f, query: "", category: s.category, sub: s.sub })} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-right hover:bg-lavender">
                    <Search size={16} className="text-ink-2" aria-hidden="true" />
                    <span className="flex-1 text-[15px]">
                      {s.sub} <span className="text-ink-2">ב{s.category}</span>
                    </span>
                  </button>
                </li>
              ))}
              {suggestions.titles.map((t) => (
                <li key={t}>
                  <button type="button" onClick={() => show({ ...f, query: t })} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-right hover:bg-lavender">
                    <Search size={16} className="text-ink-2" aria-hidden="true" />
                    <span className="flex-1 text-[15px]">{t}</span>
                  </button>
                </li>
              ))}
              {!suggestions.subs.length && !suggestions.titles.length && <li className="px-2 py-2 text-[14px] text-ink-2">אין הצעות. אפשר לחפש את המילה כמו שהיא.</li>}
            </ul>
          ) : (
            <>
              <button type="button" onClick={photo.open} className="flex min-h-12 items-center gap-3 rounded-2xl bg-lavender px-4 text-right hover:bg-lavender-2">
                <Camera size={18} aria-hidden="true" />
                <span className="flex-1 text-[15px] font-medium">חיפוש לפי תמונה</span>
              </button>

              {nav.recent.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-[14px] font-semibold text-ink-2">חיפשתם לאחרונה</h3>
                  <div className="flex flex-wrap gap-2">
                    {nav.recent.map((r) => (
                      <Chip key={r} icon={<Clock size={14} aria-hidden="true" />} onClick={() => show({ ...f, query: r })}>
                        {r}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <h3 className="text-[14px] font-semibold text-ink-2">מחפשים הרבה</h3>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((p) => (
                    <Chip key={p} onClick={() => show({ ...f, query: p })}>
                      {p}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="flex flex-col">
                <h3 className="mb-1 text-[14px] font-semibold text-ink-2">קטגוריה</h3>
                {categories.map((c) => {
                  const expanded = catOpen === c.label
                  const selected = f.category === c.label
                  return (
                    <div key={c.label} className="border-b border-line last:border-b-0">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setCatOpen(expanded ? null : c.label)}
                        className="flex min-h-12 w-full items-center justify-between text-right text-[15px]"
                      >
                        <span className={selected ? "font-semibold text-blue-ink" : ""}>{c.label}</span>
                        <ChevronDown size={18} className={`text-ink-2 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
                      </button>
                      {expanded && (
                        <div className="flex flex-wrap gap-2 pb-3">
                          <Chip selected={selected && !f.sub} onClick={() => up(selected && !f.sub ? { category: undefined, sub: undefined } : { category: c.label, sub: undefined })}>
                            הכל ב{c.label}
                          </Chip>
                          {c.subs.map((s) => (
                            <Chip key={s} selected={f.sub === s} onClick={() => up(f.sub === s ? { sub: undefined } : { category: c.label, sub: s })}>
                              {s}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </Card>

        <Card id="where" title="איפה?" summary={whereSummary} open={open === "where"} onOpen={setOpen}>
          <div role="radiogroup" aria-label="אזור" className="grid grid-cols-3 gap-1 rounded-2xl bg-lavender p-1">
            {[
              { k: "all", label: "כל הארץ" },
              { k: "near", label: "קרוב אליי" },
              { k: "town", label: "עיר מסוימת" },
            ].map((o) => (
              <button
                key={o.k}
                type="button"
                role="radio"
                aria-checked={f.place.kind === o.k}
                onClick={() => {
                  if (o.k === "all") up({ place: { kind: "all" } })
                  if (o.k === "near") pickNear(f.place.kind === "near" ? f.place.km : 10)
                  if (o.k === "town") f.place.kind === "town" ? null : setTownSheet(true)
                }}
                className={`h-11 rounded-xl text-[14px] font-semibold ${f.place.kind === o.k ? "bg-white text-ink shadow-sm" : "text-ink-2"}`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {f.place.kind === "near" && (
            <div className="flex flex-col gap-3">
              {nav.locating ? (
                <p className="flex items-center gap-2 text-[14px] text-ink-2" role="status">
                  <Loader2 size={16} className="animate-spin text-blue" aria-hidden="true" />
                  מזהים את המיקום שלך…
                </p>
              ) : nav.location ? (
                <p className="flex items-center gap-1.5 text-[14px] text-ink-2">
                  <LocateFixed size={15} className="text-blue" aria-hidden="true" />
                  מרחק מ{nav.location.town}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {locError && <p className="text-[14px] text-ink-2">{locateErrorCopy[locError]}</p>}
                  <Button variant="soft" size="md" icon={<MapPin size={16} />} onClick={() => setTownSheet(true)}>
                    בחירת אזור
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                {radii.map((km) => (
                  <button
                    key={km}
                    type="button"
                    aria-pressed={f.place.kind === "near" && f.place.km === km}
                    onClick={() => up({ place: { kind: "near", km } })}
                    className={`h-11 rounded-2xl text-[14px] font-semibold ${f.place.kind === "near" && f.place.km === km ? "bg-ink text-white" : "ring-1 ring-inset ring-line"}`}
                  >
                    {km} ק"מ
                  </button>
                ))}
              </div>
            </div>
          )}

          {f.place.kind === "town" && (
            <div className="flex items-center gap-3 rounded-2xl bg-lavender p-3">
              <MapPin size={18} className="text-blue" aria-hidden="true" />
              <span className="flex-1 text-[16px] font-semibold">{f.place.town}</span>
              <Button size="md" variant="outline" onClick={() => setTownSheet(true)}>
                שינוי
              </Button>
            </div>
          )}
        </Card>

        <Card id="condition" title="באיזה מצב?" summary={condSummary} open={open === "condition"} onOpen={setOpen}>
          <div className="flex flex-col gap-2" role="group" aria-label="מצב החפץ">
            {conditions.map((c) => (
              <OptionCard
                key={c}
                role="checkbox"
                selected={f.conditions.includes(c)}
                onClick={() => up({ conditions: f.conditions.includes(c) ? f.conditions.filter((x) => x !== c) : [...f.conditions, c] })}
                title={c}
              />
            ))}
          </div>
          <p className="text-[13px] text-ink-2">בלי בחירה מוצגים כל המצבים.</p>
        </Card>

        <Card id="sort" title="סדר תוצאות" summary={sortLabels[f.sort]} open={open === "sort"} onOpen={setOpen}>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="סדר תוצאות">
            {(Object.keys(sortLabels) as Filters["sort"][]).map((s) => (
              <Chip
                key={s}
                selected={f.sort === s}
                onClick={async () => {
                  up({ sort: s })
                  if (s === "near" && !nav.location) {
                    const res = await nav.locate()
                    if (!res.ok) setLocError(res.error)
                  }
                }}
              >
                {sortLabels[s]}
              </Chip>
            ))}
          </div>
          {f.sort === "near" && !nav.location && !nav.locating && <p className="text-[13px] text-ink-2">כדי למיין לפי מרחק צריך מיקום. אפשר לבחור אזור בכרטיס "איפה".</p>}
        </Card>
      </div>

      {/* Live count: people see what they'll get before they tap */}
      <div className="relative z-20 flex items-center gap-3 bg-white px-5 pb-[max(env(safe-area-inset-bottom),14px)] pt-3 shadow-nav">
        <button
          type="button"
          onClick={() => {
            setF(emptyFilters)
            setCatOpen(null)
            setOpen("what")
          }}
          className="min-h-11 px-1 text-[15px] font-semibold underline underline-offset-4"
        >
          ניקוי הכל
        </button>
        <Button className="flex-1" icon={<Search size={18} />} onClick={() => show()}>
          {count === 0 ? "חיפוש" : `הצגת ${count} חפצים`}
        </Button>
      </div>

      {townSheet && (
        <TownSheet
          title="באיזו עיר?"
          current={f.place.kind === "town" ? f.place.town : undefined}
          onClose={() => setTownSheet(false)}
          onPick={(town, source) => {
            setTownSheet(false)
            if (source === "gps") up({ place: { kind: "near", km: f.place.kind === "near" ? f.place.km : 10 } })
            else up({ place: { kind: "town", town } })
          }}
        />
      )}
      {photo.element}
    </div>
  )
}

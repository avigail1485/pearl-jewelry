import { useEffect, useRef, useState } from "react"
import { Bell, Camera, ChevronDown, ChevronLeft, Loader2, LocateFixed, MapPin, Search } from "lucide-react"
import { nearby } from "../../data/filter"
import { locateErrorCopy, type LocateError } from "../../data/location"
import TownSheet from "../location/TownSheet"
import { usePhotoSearch } from "../search/PhotoSearch"
import { items } from "../../data/items"
import { categories } from "../../data/meta"
import type { Item } from "../../data/types"
import { emptyFilters, useNav } from "../../nav"
import { ItemCard } from "../item/ItemCard"
import Logo from "../ui/Logo"

function Section({ title, onAll, children }: { title: string; onAll?: () => void; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-5">
        <h2 className="text-[19px] font-bold">{title}</h2>
        {onAll && (
          <button type="button" onClick={onAll} className="flex items-center gap-0.5 text-[14px] font-semibold text-blue-ink">
            הכל
            <ChevronLeft size={16} />
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

/** One item from each category in turn, so "just posted" shows a real mix rather than one category. */
function mixed(list: Item[], n: number) {
  const queues = categories.map((c) => list.filter((i) => i.category === c.label)).filter((q) => q.length)
  const out: Item[] = []
  while (out.length < n && queues.some((q) => q.length)) for (const q of queues) if (q.length && out.length < n) out.push(q.shift()!)
  return out
}

function Carousel({ list }: { list: typeof items }) {
  return (
    <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto scroll-px-5 px-5 pb-1">
      {list.map((it) => (
        <div key={it.id} className="snap-start">
          <ItemCard item={it} width={156} />
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const nav = useNav()
  const photo = usePhotoSearch()
  // Header shadow only once content scrolls under it
  const sentinel = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  // Each item appears on the home screen once: the category rows skip what "just posted" already shows
  const [townSheet, setTownSheet] = useState(false)
  const [locError, setLocError] = useState<LocateError | null>(null)
  // The board = what the signed-in user published here (still available) + everything else
  const board = [...nav.myItems.filter((i) => !i.given), ...items]
  const near = nav.location ? nearby(nav.location, 30, board).slice(0, 10) : []
  const nearIds = new Set(near.map((i) => i.id))
  const fresh = mixed(board.filter((i) => !nearIds.has(i.id)), 10)
  const shown = new Set([...nearIds, ...fresh.map((i) => i.id)])
  const byCat = (c: string) => board.filter((i) => i.category === c && !shown.has(i.id))
  const useMyLocation = async () => {
    setLocError(null)
    const res = await nav.locate()
    if (!res.ok) setLocError(res.error)
  }
  const openCat = (category: string) => nav.push({ name: "results", filters: { ...emptyFilters, category } })

  return (
    <div className="flex flex-col pb-8">
      <div className="pt-safe flex items-center justify-between bg-white px-5 pb-4">
          <button type="button" onClick={() => nav.goTab("home")} className="flex items-center gap-2" aria-label="אגורה, דף הבית">
            <Logo />
            <span className="text-[20px] font-bold tracking-tight">אגורה</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTownSheet(true)}
              aria-label={nav.location ? `אזור: ${nav.location.town}. שינוי` : "בחירת אזור"}
              className="flex h-10 max-w-[160px] items-center gap-1 rounded-full px-3 text-[14px] font-medium ring-1 ring-inset ring-line hover:bg-lavender"
            >
              <MapPin size={15} className="shrink-0 text-blue" aria-hidden="true" />
              <span className="truncate">{nav.location?.town ?? "בחירת אזור"}</span>
              <ChevronDown size={14} className="shrink-0 text-ink-2" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => nav.push({ name: "alerts" })}
              aria-label="התראות חכמות"
              className="relative flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-inset ring-line hover:bg-lavender"
            >
              <Bell size={19} />
              {nav.alerts.length > 0 && <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-blue" />}
            </button>
          </div>
      </div>
      <div ref={sentinel} aria-hidden="true" className="h-px" />

      <header className={`sticky top-0 z-20 bg-white/95 px-5 pb-4 backdrop-blur transition-all ${scrolled ? "pt-3 shadow-header" : "pt-1"}`}>
        <div className="flex items-center">
        {/* Collapsed header: once the top row scrolls away, the logo (right) and bell (left) slide in beside the search */}
        <button
          type="button"
          onClick={() => nav.goTab("home")}
          aria-label="אגורה, דף הבית"
          tabIndex={scrolled ? 0 : -1}
          aria-hidden={!scrolled}
          className={`flex shrink-0 items-center justify-center overflow-hidden transition-all duration-200 ${scrolled ? "me-2.5 w-9 opacity-100" : "me-0 w-0 opacity-0"}`}
        >
          <Logo size={26} />
        </button>
        {/* One big, obvious search entry — the top complaint in store reviews */}
        <div className={`flex min-w-0 flex-1 items-center rounded-full bg-white pe-2 shadow-search ring-1 ring-inset ring-line transition-all duration-200 ${scrolled ? "h-[52px]" : "h-[60px]"}`}>
          <button type="button" onClick={() => nav.push({ name: "search" })} className="flex h-full min-w-0 flex-1 items-center gap-3 rounded-full ps-5 text-right">
            <Search size={20} className="shrink-0" />
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="text-[15px] font-semibold">מה תרצו לקבל?</span>
              {!scrolled && <span className="truncate text-[13px] text-mute">חיפוש במילים או לפי תמונה</span>}
            </span>
          </button>
          <button
            type="button"
            onClick={photo.open}
            aria-label="חיפוש לפי תמונה"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-line hover:bg-lavender"
          >
            <Camera size={19} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => nav.push({ name: "alerts" })}
          aria-label="התראות חכמות"
          tabIndex={scrolled ? 0 : -1}
          aria-hidden={!scrolled}
          className={`relative flex h-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-inset ring-line transition-all duration-200 hover:bg-lavender ${scrolled ? "ms-2.5 w-10 opacity-100" : "ms-0 w-0 opacity-0 ring-0"}`}
        >
          <Bell size={19} />
          {nav.alerts.length > 0 && <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-blue" />}
        </button>
        </div>
      </header>

      <div className="flex flex-col gap-8 pt-4">
      {nav.location ? (
        <Section
          title={`קרוב אליך, ב${nav.location.town}`}
          onAll={() => nav.push({ name: "results", filters: { ...emptyFilters, place: { kind: "near", km: 10 }, sort: "near" } })}
        >
          {near.length ? (
            <Carousel list={near} />
          ) : (
            <p className="mx-5 rounded-2xl bg-lavender px-4 py-3 text-[14px] text-ink-2">אין כרגע חפצים עד 30 ק"מ ממך. בינתיים, הנה מה שעלה בכל הארץ.</p>
          )}
        </Section>
      ) : (
        <section className="mx-5 flex flex-col gap-3 rounded-3xl bg-lavender p-5" aria-label="חפצים קרובים אליך">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue">
              <MapPin size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[17px] font-bold">מה יש קרוב אליך?</h2>
              <p className="text-[14px] text-ink-2">נציג קודם חפצים שאפשר לאסוף בלי לנסוע רחוק. המיקום נשאר במכשיר.</p>
            </div>
          </div>
          {locError && <p role="alert" className="text-[14px] text-ink-2">{locateErrorCopy[locError]}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={useMyLocation}
              disabled={nav.locating}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue px-3 text-[14px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-70"
            >
              {nav.locating ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <LocateFixed size={17} aria-hidden="true" />}
              {nav.locating ? "מזהים…" : "המיקום שלי"}
            </button>
            <button type="button" onClick={() => setTownSheet(true)} className="h-11 rounded-2xl bg-white px-3 text-[14px] font-semibold ring-1 ring-inset ring-lavender-2 transition-transform active:scale-[0.98]">
              בחירת עיר
            </button>
          </div>
        </section>
      )}

      <Section title="עלו עכשיו" onAll={() => nav.push({ name: "results", filters: emptyFilters })}>
        <Carousel list={fresh} />
      </Section>

      <Section title="ריהוט וכלי בית" onAll={() => openCat("ריהוט וכלי בית")}>
        <Carousel list={byCat("ריהוט וכלי בית")} />
      </Section>

      <Section title="לתינוק ולילד" onAll={() => openCat("לתינוק ולילד")}>
        <Carousel list={byCat("לתינוק ולילד")} />
      </Section>

      <Section title="מוצרי חשמל" onAll={() => openCat("מוצרי חשמל")}>
        <Carousel list={byCat("מוצרי חשמל")} />
      </Section>

      <Section title="עוד באגורה">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5">
          {["ספרים ומדיה", "תחביבים וספורט", "בגדים ואופנה", "סיוע חברתי", "שונות"].map((c) => (
            <button key={c} type="button" onClick={() => openCat(c)} className="h-10 shrink-0 rounded-full px-4 text-[14px] font-medium ring-1 ring-inset ring-line hover:ring-ink/30">
              {c}
            </button>
          ))}
        </div>
      </Section>

      </div>

      {photo.element}
      {townSheet && (
        <TownSheet
          current={nav.location?.town}
          onClose={() => setTownSheet(false)}
          onPick={(town, source) => {
            if (source === "manual") nav.setTown(town)
            setLocError(null)
            setTownSheet(false)
            nav.toast(`מציגים חפצים קרובים ל${town}`)
          }}
        />
      )}

    </div>
  )
}

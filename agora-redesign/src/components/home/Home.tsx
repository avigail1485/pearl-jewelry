import { useEffect, useRef, useState } from "react"
import { Bell, Camera, ChevronLeft, Search, ArrowUpLeft } from "lucide-react"
import { usePhotoSearch } from "../search/PhotoSearch"
import { items } from "../../data/items"
import { categories, wantedRequests } from "../../data/meta"
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
  const fresh = mixed(items, 10)
  const shown = new Set(fresh.map((i) => i.id))
  const byCat = (c: string) => items.filter((i) => i.category === c && !shown.has(i.id))
  const openCat = (category: string) => nav.push({ name: "results", filters: { ...emptyFilters, category } })

  return (
    <div className="flex flex-col pb-8">
      <div className="pt-safe flex items-center justify-between bg-white px-5 pb-4">
          <button type="button" onClick={() => nav.goTab("home")} className="flex items-center gap-2" aria-label="אגורה, דף הבית">
            <Logo />
            <span className="text-[20px] font-bold tracking-tight">אגורה</span>
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
      <div ref={sentinel} aria-hidden="true" className="h-px" />

      <header className={`sticky top-0 z-20 bg-white/95 px-5 pb-4 pt-1 backdrop-blur transition-shadow ${scrolled ? "shadow-header" : ""}`}>
        {/* One big, obvious search entry — the top complaint in store reviews */}
        <div className="flex h-[60px] items-center rounded-full bg-white pe-2 shadow-search ring-1 ring-inset ring-line">
          <button type="button" onClick={() => nav.push({ name: "search" })} className="flex h-full min-w-0 flex-1 items-center gap-3 rounded-full ps-5 text-right">
            <Search size={20} className="shrink-0" />
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="text-[15px] font-semibold">מה תרצו לקבל?</span>
              <span className="truncate text-[13px] text-mute">חיפוש במילים או לפי תמונה</span>
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
      </header>

      <div className="flex flex-col gap-8 pt-4">
      <Section title="עלו עכשיו" onAll={() => nav.push({ name: "results", filters: emptyFilters })}>
        <Carousel list={fresh} />
      </Section>

      <Section title="ריהוט וכלי בית" onAll={() => openCat("ריהוט וכלי בית")}>
        <Carousel list={byCat("ריהוט וכלי בית")} />
      </Section>

      <div className="px-5">
        <button
          type="button"
          onClick={() => nav.push({ name: "request" })}
          className="flex w-full items-center gap-4 rounded-3xl bg-blue p-5 text-right text-white shadow-blue transition-transform active:scale-[0.99]"
        >
          <span className="flex flex-1 flex-col gap-1">
            <span className="text-[18px] font-bold leading-tight">לא מצאתם? בקשו חפץ</span>
            <span className="text-[14px] text-white/80">נפרסם את הבקשה ונודיע לכם כשמישהו באזור מוסר משהו מתאים</span>
          </span>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lime text-ink">
            <ArrowUpLeft size={22} strokeWidth={2.25} />
          </span>
        </button>
      </div>

      <Section title="לתינוק ולילד" onAll={() => openCat("לתינוק ולילד")}>
        <Carousel list={byCat("לתינוק ולילד")} />
      </Section>

      <Section title="מחפשים עכשיו">
        <ul className="mx-5 flex flex-col rounded-3xl bg-lavender px-4">
          {wantedRequests.slice(0, 4).map((r) => (
            <li key={r.id} className="flex items-center gap-3 border-b border-lavender-2 py-3.5 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{r.title}</p>
                <p className="text-[13px] text-mute">
                  {r.city} · {r.posted}
                </p>
              </div>
              <button
                type="button"
                onClick={() => nav.push({ name: "give", forRequest: r })}
                className="h-9 shrink-0 rounded-full bg-white px-4 text-[14px] font-semibold text-blue-ink ring-1 ring-inset ring-lavender-2 hover:ring-blue"
              >
                יש לי
              </button>
            </li>
          ))}
        </ul>
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

    </div>
  )
}

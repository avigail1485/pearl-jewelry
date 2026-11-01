import { useState } from "react"
import { MapPin, ChevronDown, UserCircle2, Search, SlidersHorizontal, ArrowLeft, ShieldCheck, Package } from "lucide-react"
import { categories, previewFeed, openRequests, impact } from "../../data/mock"
import { useNav } from "../../nav"
import ItemGrid from "./ItemGrid"
import Logo from "../ui/Logo"
import CategorySheet, { categoryIcons } from "./CategorySheet"
import LocationSheet from "./LocationSheet"

const hairline = { boxShadow: "var(--shadow-raised)" }

export default function Home() {
  const nav = useNav()
  const [catsOpen, setCatsOpen] = useState(false)
  const [locOpen, setLocOpen] = useState(false)
  const [query, setQuery] = useState("")

  const submitSearch = () => nav.push({ name: "search", query: query.trim() })

  return (
    <div className="flex flex-col">
      <header className="safe-top sticky top-0 z-10 flex flex-col gap-3 bg-ground/95 px-5 pb-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => nav.reset()} className="flex items-center gap-2" aria-label="אגורה — דף הבית">
            <Logo size={28} />
            <span className="font-display text-[20px] font-bold text-deep">אגורה</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocOpen(true)}
              className="flex h-10 items-center gap-1 rounded-full bg-paper px-3 text-[13px] font-medium text-deep hover:text-brand-strong"
              style={hairline}
            >
              <MapPin size={14} className="text-brand-strong" />
              {nav.location.city} · {nav.location.radius} ק"מ
              <ChevronDown size={14} />
            </button>
            <button
              type="button"
              onClick={() => nav.push({ name: "profile" })}
              aria-label="פרופיל וכניסה"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-paper text-deep hover:text-brand-strong"
              style={hairline}
            >
              <UserCircle2 size={22} />
            </button>
          </div>
        </div>

        {/* Big, unmissable search — the #1 complaint in store reviews */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitSearch()
          }}
          className="flex h-14 items-center gap-2 rounded-full bg-paper ps-4 pe-1.5 focus-within:ring-2 focus-within:ring-brand"
          style={{ boxShadow: "var(--shadow-float)" }}
        >
          <button type="submit" aria-label="חיפוש" className="shrink-0 text-brand-strong">
            <Search size={20} />
          </button>
          <input
            type="search"
            aria-label="חיפוש חפצים"
            placeholder="מה אתם מחפשים?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-deep placeholder:text-mute focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setCatsOpen(true)}
            aria-label="כל הקטגוריות"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-paper transition-transform hover:bg-brand-hover active:scale-95"
          >
            <SlidersHorizontal size={19} />
          </button>
        </form>
      </header>

      <div className="flex flex-col gap-8 px-5 pt-2 pb-5">
        {/* Quick categories */}
        <nav aria-label="קטגוריות" className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.icon] ?? Package
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => nav.push({ name: "category", label: cat.label })}
                className="group flex w-[72px] shrink-0 flex-col items-center gap-1.5"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-paper text-brand-strong transition-colors group-hover:bg-brand group-hover:text-paper" style={hairline}>
                  <Icon size={22} />
                </span>
                <span className="text-center text-[12px] font-medium leading-tight text-deep">{cat.label}</span>
              </button>
            )
          })}
        </nav>

        <section aria-label="חדשים באזור שלכם">
          <SectionHeader title="חדשים באזור שלכם" link="הכל" onLink={() => nav.push({ name: "all" })} />
          <ItemGrid items={previewFeed.slice(0, 8)} />
          <button
            type="button"
            onClick={() => nav.push({ name: "all" })}
            className="mx-auto mt-6 flex h-11 w-fit items-center gap-1.5 rounded-full bg-paper px-5 text-[14px] font-semibold text-deep transition-colors hover:text-brand-strong active:scale-[0.98]"
            style={hairline}
          >
            גלו הכל
            <ArrowLeft size={16} />
          </button>
        </section>

        <button
          type="button"
          onClick={() => nav.push({ name: "request" })}
          className="flex items-center gap-3 rounded-[20px] bg-brand p-4 text-right text-paper transition-transform hover:bg-brand-hover active:scale-[0.99]"
        >
          <span className="flex-1">
            <span className="block text-[16px] font-bold">לא מצאתם? פרסמו בקשה</span>
            <span className="block text-[13px] text-paper/85">מוסרים באזור יקבלו התראה</span>
          </span>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-paper">
            <ArrowLeft size={20} />
          </span>
        </button>

        <section aria-label="מחפשים עכשיו באזור">
          <SectionHeader title="מחפשים עכשיו באזור" />
          <div className="flex flex-col gap-3">
            {openRequests.map((req) => (
              <button
                type="button"
                key={req.id}
                onClick={() => nav.push({ name: "give", forRequest: req })}
                className="flex items-center gap-3 rounded-[20px] bg-paper p-4 text-right transition-transform active:scale-[0.99]"
                style={hairline}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    <span className="rounded-full bg-accent-tint px-2.5 py-0.5 text-[11px] font-semibold text-accent-ink">{req.postedLabel}</span>
                    <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] text-ink-soft">{req.person}</span>
                  </div>
                  <h3 className="truncate text-[16px] font-semibold text-deep">{req.title}</h3>
                </div>
                <span className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-brand-tint px-3 text-[13px] font-semibold text-brand-ink">
                  יש לי
                  <ArrowLeft size={16} />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="flex items-center gap-3 rounded-[20px] bg-paper p-4" style={hairline}>
          <ShieldCheck size={22} className="shrink-0 text-brand-strong" />
          <p className="text-[13px] leading-relaxed text-deep">
            הכל בחינם, בלי טלפונים בתשלום · כל המוסרים מאומתים · <span className="font-bold">{impact.total}</span> חפצים נמסרו
          </p>
        </section>
      </div>

      {catsOpen && (
        <CategorySheet
          onClose={() => setCatsOpen(false)}
          onPick={(label) => {
            setCatsOpen(false)
            nav.push({ name: "category", label })
          }}
        />
      )}
      {locOpen && <LocationSheet onClose={() => setLocOpen(false)} />}
    </div>
  )
}

export function SectionHeader({ title, link, onLink }: { title: string; link?: string; onLink?: () => void }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 className="font-display text-[20px] font-bold text-deep">{title}</h2>
      {link && (
        <button type="button" onClick={onLink} className="shrink-0 border-b-2 border-brand pb-0.5 text-[13px] font-semibold text-brand-strong">
          {link}
        </button>
      )}
    </div>
  )
}

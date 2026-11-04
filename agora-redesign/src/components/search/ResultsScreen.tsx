import { useState } from "react"
import { Bell, ChevronDown, LayoutGrid, List, MapPin, SlidersHorizontal, X } from "lucide-react"
import { filterItems } from "../../data/filter"
import { conditions } from "../../data/meta"
import { describeFilters, emptyFilters, placeLabel, useNav, type Filters, type SearchSection } from "../../nav"
import { ItemCard, ItemRow } from "../item/ItemCard"
import TopBar from "../ui/TopBar"
import Chip from "../ui/Chip"
import Button from "../ui/Button"
import EmptyState from "../ui/EmptyState"
import { usePhotoSearch } from "./PhotoSearch"

export default function ResultsScreen({ filters }: { filters: Filters }) {
  const nav = useNav()
  const photo = usePhotoSearch()
  const [view, setView] = useState<"grid" | "list">("grid")
  const list = filterItems(filters, nav.location, nav.myItems.filter((i) => !i.given))
  const set = (f: Filters) => nav.replace({ name: "results", filters: f })
  const edit = (open: SearchSection) => nav.push({ name: "search", filters, open, from: "results" })
  const active = (filters.place.kind !== "all" ? 1 : 0) + filters.conditions.length + (filters.sort !== "new" ? 1 : 0) + (filters.category ? 1 : 0)
  const title = filters.photo ? `דומים ל${filters.photo.label}` : filters.query ? `"${filters.query}"` : filters.sub || filters.category || "כל החפצים"
  const alertOn = nav.alerts.some((a) => describeFilters(a) === describeFilters(filters))
  const toggleCond = (c: (typeof conditions)[number]) =>
    set({ ...filters, conditions: filters.conditions.includes(c) ? filters.conditions.filter((x) => x !== c) : [...filters.conditions, c] })

  return (
    <div className="flex min-h-full flex-col bg-white">
      <TopBar
        end={
          <button type="button" onClick={() => edit("what")} aria-label={`סינון${active ? `, ${active} פעילים` : ""}`} className="relative flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-inset ring-line hover:bg-lavender">
            <SlidersHorizontal size={18} />
            {active > 0 && <span className="absolute -left-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue px-1 text-[11px] font-bold text-white">{active}</span>}
          </button>
        }
      >
        <button
          type="button"
          onClick={() => (filters.photo ? photo.open() : edit("what"))}
          className="flex h-11 min-w-0 flex-1 items-center rounded-full bg-white px-4 text-right leading-tight shadow-search ring-1 ring-inset ring-line"
        >
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[14px] font-semibold">{title}</span>
            <span className="truncate text-[12px] text-ink-2">{filters.photo ? "חיפוש לפי תמונה" : placeLabel(filters.place, nav.location)}</span>
          </span>
        </button>
      </TopBar>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
        <Chip selected={filters.place.kind !== "all"} onClick={() => edit("where")} icon={<MapPin size={14} aria-hidden="true" />}>
          {filters.place.kind === "all" ? "אזור" : placeLabel(filters.place, nav.location)}
          <ChevronDown size={14} aria-hidden="true" />
        </Chip>
        {conditions.slice(0, 3).map((c) => (
          <Chip key={c} selected={filters.conditions.includes(c)} onClick={() => toggleCond(c)}>
            {c}
          </Chip>
        ))}
        {filters.category && !filters.photo && (
          <Chip selected onClick={() => set({ ...filters, category: undefined, sub: undefined })} icon={<X size={14} aria-hidden="true" />}>
            {filters.sub || filters.category}
          </Chip>
        )}
      </div>

      <div className="flex items-center justify-between border-y border-line px-4 py-1.5">
        <span className="text-[13px] text-ink-2" aria-live="polite">
          {list.length} חפצים למסירה
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => (alertOn ? nav.toast("ההתראה כבר פעילה") : nav.addAlert(filters))}
            className={`flex h-10 items-center gap-1 rounded-full px-3 text-[13px] font-semibold ${alertOn ? "bg-lavender text-blue-ink" : "text-blue-ink hover:bg-lavender"}`}
          >
            <Bell size={15} aria-hidden="true" />
            {alertOn ? "התראה פעילה" : "התראה על חדשים"}
          </button>
          <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
          <button type="button" aria-label="תצוגת רשת" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`flex h-10 w-10 items-center justify-center rounded-lg ${view === "grid" ? "bg-lavender text-blue" : "text-ink-2"}`}>
            <LayoutGrid size={17} />
          </button>
          <button type="button" aria-label="תצוגת רשימה" aria-pressed={view === "list"} onClick={() => setView("list")} className={`flex h-10 w-10 items-center justify-center rounded-lg ${view === "list" ? "bg-lavender text-blue" : "text-ink-2"}`}>
            <List size={18} />
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          art="no-results"
          title="לא מצאנו כרגע"
          text="אפשר להרחיב את האזור או לנקות סינונים. אם תפעילו התראה, נודיע לכם ברגע שיעלה חפץ מתאים."
          action={
            <div className="mt-2 flex w-full max-w-[280px] flex-col gap-2">
              <Button icon={<Bell size={18} />} onClick={() => (alertOn ? nav.toast("ההתראה כבר פעילה") : nav.addAlert(filters))}>
                {alertOn ? "התראה פעילה" : "התראה על חדשים"}
              </Button>
              <Button variant="outline" onClick={() => set({ ...emptyFilters, query: filters.query })}>
                ניקוי סינונים
              </Button>
            </div>
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 px-4 py-4">
          {list.map((i) => (
            <ItemCard key={i.id} item={i} />
          ))}
        </div>
      ) : (
        <div className="px-4">
          {list.map((i) => (
            <ItemRow key={i.id} item={i} />
          ))}
        </div>
      )}
      {photo.element}
    </div>
  )
}

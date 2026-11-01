import { useState } from "react"
import { Bell, LayoutGrid, List, SearchX, SlidersHorizontal, X } from "lucide-react"
import { usePhotoSearch } from "./PhotoSearch"
import { filterItems } from "../../data/filter"
import { conditions } from "../../data/meta"
import { describeFilters, useNav, type Filters } from "../../nav"
import { ItemCard, ItemRow } from "../item/ItemCard"
import TopBar from "../ui/TopBar"
import Chip from "../ui/Chip"
import Button from "../ui/Button"
import EmptyState from "../ui/EmptyState"
import FilterSheet from "./FilterSheet"

export default function ResultsScreen({ filters }: { filters: Filters }) {
  const nav = useNav()
  const photo = usePhotoSearch()
  const [view, setView] = useState<"grid" | "list">("grid")
  const [sheet, setSheet] = useState(false)
  const list = filterItems(filters)
  const set = (f: Filters) => nav.replace({ name: "results", filters: f })
  const active = (filters.city !== "כל הארץ" ? 1 : 0) + filters.conditions.length + (filters.sort !== "new" ? 1 : 0)
  const title = filters.photo ? `דומים ל${filters.photo.label}` : filters.query ? `"${filters.query}"` : filters.sub || filters.category || "כל הפריטים"
  const alertOn = nav.alerts.some((a) => describeFilters(a) === describeFilters(filters))

  return (
    <div className="flex min-h-full flex-col bg-white">
      <TopBar
        end={
          <button
            type="button"
            onClick={() => setSheet(true)}
            aria-label="סינון"
            className="relative flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-inset ring-line hover:bg-lavender"
          >
            <SlidersHorizontal size={18} />
            {active > 0 && <span className="absolute -left-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue px-1 text-[11px] font-bold text-white">{active}</span>}
          </button>
        }
      >
        <button
          type="button"
          onClick={() => (filters.photo ? photo.open() : nav.push({ name: "search", initial: filters.query }))}
          className="flex h-11 min-w-0 flex-1 items-center rounded-full bg-lavender px-4 text-right leading-tight"
        >
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[14px] font-semibold">{title}</span>
            <span className="truncate text-[12px] text-mute">
              {filters.photo ? "חיפוש לפי תמונה" : filters.city}
              {!filters.photo && filters.category && filters.sub ? ` · ${filters.category}` : ""}
            </span>
          </span>
        </button>
      </TopBar>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
        {filters.city !== "כל הארץ" && (
          <Chip selected onClick={() => set({ ...filters, city: "כל הארץ" })} icon={<X size={14} />}>
            {filters.city}
          </Chip>
        )}
        {conditions.slice(0, 3).map((c) => (
          <Chip
            key={c}
            selected={filters.conditions.includes(c)}
            onClick={() =>
              set({ ...filters, conditions: filters.conditions.includes(c) ? filters.conditions.filter((x) => x !== c) : [...filters.conditions, c] })
            }
          >
            {c}
          </Chip>
        ))}
        {filters.city === "כל הארץ" && <Chip onClick={() => setSheet(true)}>בחירת אזור</Chip>}
      </div>

      <div className="flex items-center justify-between border-y border-line px-5 py-2">
        <span className="text-[13px] text-ink-2">{list.length} פריטים למסירה</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => (alertOn ? nav.toast("ההתראה כבר פעילה") : nav.addAlert(filters))}
            className={`flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-semibold ${alertOn ? "bg-lavender text-blue-ink" : "text-blue-ink hover:bg-lavender"}`}
          >
            <Bell size={15} />
            {alertOn ? "התראה פעילה" : "התראה על חדשים"}
          </button>
          <span className="mx-1 h-5 w-px bg-line" />
          <button type="button" aria-label="תצוגת רשת" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`flex h-8 w-8 items-center justify-center rounded-lg ${view === "grid" ? "bg-lavender text-blue" : "text-mute"}`}>
            <LayoutGrid size={17} />
          </button>
          <button type="button" aria-label="תצוגת רשימה" aria-pressed={view === "list"} onClick={() => setView("list")} className={`flex h-8 w-8 items-center justify-center rounded-lg ${view === "list" ? "bg-lavender text-blue" : "text-mute"}`}>
            <List size={18} />
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<SearchX size={28} />}
          title="לא מצאנו כרגע"
          text="אפשר להרחיב את האזור, לנקות סינונים, או לפרסם בקשה ונודיע לכם כשיעלה משהו מתאים."
          action={
            <div className="mt-2 flex w-full max-w-[280px] flex-col gap-2">
              <Button onClick={() => nav.push({ name: "request" })}>פרסום בקשה</Button>
              <Button variant="outline" onClick={() => set({ ...filters, city: "כל הארץ", conditions: [] })}>
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

      {sheet && (
        <FilterSheet
          value={filters}
          onClose={() => setSheet(false)}
          onApply={(f) => {
            setSheet(false)
            set(f)
          }}
        />
      )}
      {photo.element}
    </div>
  )
}

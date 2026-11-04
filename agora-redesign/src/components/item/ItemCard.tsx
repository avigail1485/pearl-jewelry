import { Camera, Heart } from "lucide-react"
import { kmTo } from "../../data/location"
import type { Item } from "../../data/types"
import { useNav } from "../../nav"

export const isFresh = (i: Item) => i.posted === "פחות משעה" || i.posted === "עכשיו"

/** Town, plus distance from the viewer when their area is known. */
function Place({ item }: { item: Item }) {
  const nav = useNav()
  const km = kmTo(nav.location?.point ?? null, item.city)
  return (
    <p className="truncate text-[13px] text-ink-2">
      {item.city}
      {km !== null && <span className="text-blue-ink">{`, ${km} ק"מ`}</span>}
    </p>
  )
}

function SaveButton({ item, className = "" }: { item: Item; className?: string }) {
  const nav = useNav()
  const saved = nav.saved.includes(item.id)
  return (
    <button
      type="button"
      aria-label={saved ? "הסרה מהשמורים" : "שמירה"}
      aria-pressed={saved}
      onClick={(e) => {
        e.stopPropagation()
        nav.toggleSaved(item)
      }}
      className={`flex h-10 w-10 items-center justify-center ${className}`}
    >
      <Heart size={22} strokeWidth={2} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.45)]" fill={saved ? "#3869FE" : "rgba(0,0,0,.28)"} />
    </button>
  )
}

/** Photo-first card (Airbnb): used in grids and carousels. */
export function ItemCard({ item, width }: { item: Item; width?: number }) {
  const nav = useNav()
  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={item.title}
      onClick={() => nav.push({ name: "item", item })}
      onKeyDown={(e) => e.key === "Enter" && nav.push({ name: "item", item })}
      className="group flex shrink-0 cursor-pointer flex-col gap-2"
      style={width ? { width } : undefined}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-photo">
        {item.photo ? (
          <img src={item.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-2">
            <Camera size={24} aria-hidden="true" />
          </div>
        )}
        {isFresh(item) && <span className="absolute right-2.5 top-2.5 rounded-full bg-lime px-2.5 py-0.5 text-[12px] font-bold text-ink">חדש</span>}
        <SaveButton item={item} className="absolute left-1 top-1" />
      </div>
      <div className="min-w-0 px-0.5">
        <h3 className="truncate text-[15px] font-semibold leading-snug">{item.title}</h3>
        <Place item={item} />
        <p className="truncate text-[13px] text-mute">{item.condition}</p>
      </div>
    </article>
  )
}

/** Compact row (Yad2 list view): scan many results fast. */
export function ItemRow({ item }: { item: Item }) {
  const nav = useNav()
  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={item.title}
      onClick={() => nav.push({ name: "item", item })}
      onKeyDown={(e) => e.key === "Enter" && nav.push({ name: "item", item })}
      className="flex cursor-pointer gap-3 border-b border-line py-3 last:border-b-0"
    >
      <div className="relative h-[96px] w-[96px] shrink-0 overflow-hidden rounded-xl bg-photo">
        {item.photo ? <img src={item.photo} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-ink-2"><Camera size={20} aria-hidden="true" /></div>}
        {isFresh(item) && <span className="absolute right-1.5 top-1.5 rounded-full bg-lime px-2 text-[11px] font-bold text-ink">חדש</span>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="truncate text-[15px] font-semibold">{item.title}</h3>
        <p className="truncate text-[13px] text-mute">{item.sub || item.category}</p>
        <p className="mt-auto flex items-center gap-1.5 text-[13px] text-ink-2">
          <span className="rounded-md bg-lavender px-1.5 py-0.5 text-[12px] font-medium text-blue-ink">{item.condition}</span>
          {item.city}
        </p>
        <p className="text-[12px] text-mute">{item.posted}</p>
      </div>
      <SaveRowButton item={item} />
    </article>
  )
}

function SaveRowButton({ item }: { item: Item }) {
  const nav = useNav()
  const saved = nav.saved.includes(item.id)
  return (
    <button
      type="button"
      aria-label={saved ? "הסרה מהשמורים" : "שמירה"}
      aria-pressed={saved}
      onClick={(e) => {
        e.stopPropagation()
        nav.toggleSaved(item)
      }}
      className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full hover:bg-lavender"
    >
      <Heart size={20} className={saved ? "text-blue" : "text-ink-2"} fill={saved ? "#3869FE" : "none"} />
    </button>
  )
}

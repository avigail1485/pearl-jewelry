import { Heart } from "lucide-react"
import type { FeedItem } from "../../data/mock"
import PhotoPlaceholder from "../ui/PhotoPlaceholder"
import { ConditionTag, GivenBadge } from "../ui/StatusTag"
import { useNav } from "../../nav"

export default function ItemCard({ item, interactive = true }: { item: FeedItem; interactive?: boolean }) {
  const nav = useNav()
  const saved = nav.saved.has(item.id)
  const given = item.status === "given"
  const open = () => interactive && nav.push({ name: "item", item })

  return (
    <article
      onClick={open}
      onKeyDown={(e) => e.key === "Enter" && open()}
      tabIndex={interactive ? 0 : -1}
      role={interactive ? "link" : undefined}
      aria-label={item.title}
      className={`group flex h-full flex-col gap-2 ${interactive ? "cursor-pointer" : ""}`}
    >
      <div className="relative overflow-hidden rounded-[20px] bg-fill-2 transition-transform duration-200 group-active:scale-[0.98]">
        {item.photo ? (
          <img src={item.photo} alt="" loading="lazy" className={`aspect-square w-full object-cover ${given ? "opacity-70" : ""}`} />
        ) : (
          <PhotoPlaceholder ratio="1/1" />
        )}
        {given && (
          <div className="absolute inset-0 flex items-center justify-center bg-deep/35">
            <GivenBadge />
          </div>
        )}
        <span className="absolute right-2 top-2.5 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.12)]">
          <ConditionTag condition={item.condition} />
        </span>
        {interactive && (
          <button
            type="button"
            aria-label={saved ? "הסרה מהשמורים" : "שמירת הפריט"}
            aria-pressed={saved}
            onClick={(e) => {
              e.stopPropagation()
              nav.toggleSaved(item.id)
              nav.toast(saved ? "הוסר מהשמורים" : "נשמר ברשימת השמורים")
            }}
            className="absolute left-1 top-1 flex h-11 w-11 items-center justify-center text-paper drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
          >
            <Heart size={22} fill={saved ? "#FF7A1A" : "rgba(0,0,0,0.25)"} className={saved ? "text-accent" : ""} />
          </button>
        )}
      </div>
      <div className="px-0.5">
        <h3 className="truncate text-[15px] font-semibold text-deep">{item.title}</h3>
        <p className="truncate text-[13px] text-mute">
          {item.city} · {item.distanceKm} ק"מ
        </p>
      </div>
    </article>
  )
}

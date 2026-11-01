import { Home, Search, Plus, LayoutGrid, User } from "lucide-react"
import { useNav, type Route } from "../../nav"

type NavId = "home" | "search" | "myitems" | "profile"

const items: { id: NavId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "בית", icon: Home },
  { id: "search", label: "חיפוש", icon: Search },
  { id: "myitems", label: "הפריטים שלי", icon: LayoutGrid },
  { id: "profile", label: "פרופיל", icon: User },
]

export default function BottomNav({ active }: { active: NavId }) {
  const nav = useNav()

  const go = (id: NavId) => {
    if (id === active) return
    if (id === "home") return nav.reset()
    nav.reset({ name: "home" })
    nav.push({ name: id } as Route)
  }

  const renderItem = (it: (typeof items)[number]) => {
    const isActive = active === it.id
    const Icon = it.icon
    return (
      <button
        key={it.id}
        type="button"
        onClick={() => go(it.id)}
        aria-current={isActive ? "page" : undefined}
        className={`flex h-16 min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-colors duration-200 ${
          isActive ? "text-brand-strong" : "text-mute hover:text-deep"
        }`}
      >
        <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
        <span className={`text-[11px] ${isActive ? "font-bold" : "font-medium"}`}>{it.label}</span>
      </button>
    )
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 bg-paper px-3 pb-2 pt-1" style={{ boxShadow: "0 -1px 0 rgba(28, 31, 35, 0.06)" }}>
      <nav aria-label="ניווט ראשי" className="mx-auto flex w-full max-w-[430px] items-end justify-center">
        {items.slice(0, 2).map(renderItem)}
        <button
          type="button"
          onClick={() => nav.push({ name: "give" })}
          aria-label="מסירת חפץ חדש"
          className="flex h-16 min-w-16 flex-1 flex-col items-center justify-center gap-1 text-deep transition-transform duration-200 active:scale-95"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-paper shadow-[0_6px_16px_rgba(255,122,26,0.35)]">
            <Plus size={24} strokeWidth={2.5} />
          </span>
          <span className="text-center text-[11px] font-semibold">למסור</span>
        </button>
        {items.slice(2).map(renderItem)}
      </nav>
    </div>
  )
}

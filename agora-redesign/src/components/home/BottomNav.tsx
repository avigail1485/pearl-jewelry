import { Home, Search, Plus, Heart, User } from "lucide-react"
import { useNav, type Tab } from "../../nav"

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "ראשי", icon: Home },
  { id: "search", label: "חיפוש", icon: Search },
  { id: "saved", label: "שמורים", icon: Heart },
  { id: "profile", label: "פרופיל", icon: User },
]

export default function BottomNav({ active }: { active?: Tab }) {
  const nav = useNav()
  const tab = (t: (typeof tabs)[number]) => {
    const on = active === t.id
    const Icon = t.icon
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => nav.goTab(t.id)}
        aria-current={on ? "page" : undefined}
        className={`flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${on ? "font-bold text-blue-ink" : "font-medium text-mute hover:text-ink"}`}
      >
        <Icon size={22} strokeWidth={on ? 2.25 : 1.75} className={on ? "text-blue" : ""} />
        {t.label}
      </button>
    )
  }
  return (
    <nav aria-label="ניווט ראשי" className="absolute inset-x-0 bottom-0 z-30 flex items-center border-t border-line bg-white px-2 pb-[max(env(safe-area-inset-bottom),6px)] pt-1">
      {tabs.slice(0, 2).map(tab)}
      <button type="button" onClick={() => nav.push({ name: "give" })} aria-label="למסור חפץ" className="flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-ink">
        <span className="flex h-9 w-12 items-center justify-center rounded-2xl bg-blue text-white">
          <Plus size={22} strokeWidth={2.5} />
        </span>
        למסור
      </button>
      {tabs.slice(2).map(tab)}
    </nav>
  )
}

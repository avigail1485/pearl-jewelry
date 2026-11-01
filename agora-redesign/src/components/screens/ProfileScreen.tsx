import { useState } from "react"
import { Heart, LayoutGrid, MapPin, Bell, BookOpenCheck, Palette, LifeBuoy, LogOut, ChevronLeft, ShieldCheck } from "lucide-react"
import { useNav, type Route } from "../../nav"
import ScreenHeader from "../ui/ScreenHeader"
import LocationSheet from "../home/LocationSheet"

export default function ProfileScreen() {
  const nav = useNav()
  const [notify, setNotify] = useState(true)
  const [locOpen, setLocOpen] = useState(false)

  const rows: { icon: typeof Heart; label: string; detail?: string; onClick: () => void }[] = [
    { icon: Heart, label: "שמורים", detail: nav.saved.size ? String(nav.saved.size) : undefined, onClick: () => nav.push({ name: "saved" } as Route) },
    { icon: LayoutGrid, label: "הפריטים שלי", onClick: () => nav.push({ name: "myitems" }) },
    { icon: MapPin, label: "אזור חיפוש", detail: `${nav.location.city} · ${nav.location.radius} ק"מ`, onClick: () => setLocOpen(true) },
    { icon: BookOpenCheck, label: "כללי הקהילה", onClick: () => nav.push({ name: "rules" }) },
    { icon: Palette, label: "פלטת צבעים וטיפוגרפיה", detail: "לצוות", onClick: () => nav.push({ name: "palette" }) },
    { icon: LifeBuoy, label: "עזרה ויצירת קשר", onClick: () => nav.toast("פנייתכם התקבלה, נחזור אליכם בהקדם") },
  ]

  return (
    <div className="flex flex-col">
      <ScreenHeader title="פרופיל" />
      <div className="flex flex-col gap-5 px-5 pt-1 pb-6">
        <div className="flex items-center gap-4 rounded-[24px] bg-paper p-5" style={{ boxShadow: "var(--shadow-raised)" }}>
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand text-[24px] font-bold text-paper">
            א
            <span className="absolute -bottom-0.5 -left-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-paper ring-2 ring-paper">
              <ShieldCheck size={13} />
            </span>
          </span>
          <div className="flex flex-col">
            <span className="text-[18px] font-bold text-deep">אורח</span>
            <span className="text-[13px] text-mute">טלפון מאומת · חבר מ־2026</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            ["2", "מסרתי"],
            ["0", "קיבלתי"],
            [String(nav.saved.size), "שמורים"],
          ].map(([n, l]) => (
            <div key={l} className="flex flex-col items-center rounded-[20px] bg-paper py-4" style={{ boxShadow: "var(--shadow-raised)" }}>
              <span className="text-[22px] font-bold text-brand-strong">{n}</span>
              <span className="text-[13px] text-mute">{l}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col overflow-hidden rounded-[24px] bg-paper" style={{ boxShadow: "var(--shadow-raised)" }}>
          {rows.map(({ icon: Icon, label, detail, onClick }) => (
            <button key={label} type="button" onClick={onClick} className="flex items-center gap-3 border-b border-line px-4 py-4 text-right last:border-b-0 hover:bg-ground">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-tint text-brand-strong">
                <Icon size={18} />
              </span>
              <span className="flex-1 text-[15px] font-medium text-deep">{label}</span>
              {detail && <span className="text-[13px] text-mute">{detail}</span>}
              <ChevronLeft size={18} className="text-mute" />
            </button>
          ))}
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-tint text-accent-ink">
              <Bell size={18} />
            </span>
            <span className="flex-1 text-[15px] font-medium text-deep">התראות על פריטים חדשים</span>
            <button
              type="button"
              role="switch"
              aria-checked={notify}
              aria-label="התראות על פריטים חדשים"
              onClick={() => setNotify((v) => !v)}
              className={`relative h-7 w-12 rounded-full transition-colors ${notify ? "bg-brand" : "bg-line-strong"}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-paper transition-all ${notify ? "right-6" : "right-1"}`} />
            </button>
          </div>
        </div>

        <button type="button" onClick={() => nav.toast("יצאתם מהחשבון")} className="flex items-center justify-center gap-2 py-2 text-[14px] font-semibold text-accent-ink">
          <LogOut size={16} />
          יציאה
        </button>
      </div>
      {locOpen && <LocationSheet onClose={() => setLocOpen(false)} />}
    </div>
  )
}

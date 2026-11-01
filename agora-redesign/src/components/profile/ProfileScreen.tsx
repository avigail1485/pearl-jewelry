import { useState } from "react"
import { Bell, BookOpen, ChevronLeft, HelpCircle, LogOut, Plus, Search, ShieldCheck } from "lucide-react"
import { items } from "../../data/items"
import { stats } from "../../data/meta"
import { useNav, type Route } from "../../nav"
import { ItemRow } from "../item/ItemCard"
import Button from "../ui/Button"

export default function ProfileScreen() {
  const nav = useNav()
  const [tab, setTab] = useState<"give" | "want">("give")
  const mine = items.slice(5, 7)

  const rows: { icon: typeof Bell; label: string; detail?: string; to?: Route; onClick?: () => void }[] = [
    { icon: Bell, label: "התראות חכמות", detail: nav.alerts.length ? `${nav.alerts.length} פעילות` : undefined, to: { name: "alerts" } },
    { icon: BookOpen, label: "כללי הקהילה", to: { name: "rules" } },
    { icon: HelpCircle, label: "עזרה ויצירת קשר", onClick: () => nav.toast("פנייתכם נשלחה לצוות אגורה") },
  ]

  return (
    <div className="flex flex-col gap-6 bg-white pb-8">
      <header className="pt-safe flex items-center gap-4 px-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue text-[24px] font-bold text-white">י</span>
        <div>
          <h1 className="text-[22px] font-bold leading-tight">ישראל</h1>
          <p className="text-[13px] text-mute">טלפון מאומת · חבר באגורה מ-2021</p>
        </div>
      </header>

      <div className="mx-5 grid grid-cols-3 divide-x divide-x-reverse divide-line rounded-2xl bg-lavender py-4 text-center">
        {[
          ["12", "מסרתי"],
          ["3", "קיבלתי"],
          [String(nav.saved.length), "שמורים"],
        ].map(([n, l]) => (
          <div key={l}>
            <p className="text-[20px] font-bold">{n}</p>
            <p className="text-[12px] text-mute">{l}</p>
          </div>
        ))}
      </div>

      <section className="px-5">
        <div className="mb-2 flex gap-5 border-b border-line">
          {(["give", "want"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t} className={`-mb-px border-b-2 pb-2 text-[15px] font-semibold ${tab === t ? "border-ink text-ink" : "border-transparent text-mute"}`}>
              {t === "give" ? "החפצים שלי" : "הבקשות שלי"}
            </button>
          ))}
        </div>
        {tab === "give" ? (
          <>
            {mine.map((i) => (
              <ItemRow key={i.id} item={i} />
            ))}
            <Button block variant="soft" icon={<Plus size={18} />} className="mt-3" onClick={() => nav.push({ name: "give" })}>
              למסור חפץ
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Search size={26} className="text-blue" />
            <p className="text-[14px] text-ink-2">אין בקשות פתוחות</p>
            <Button variant="soft" size="md" onClick={() => nav.push({ name: "request" })}>
              בקשת חפץ
            </Button>
          </div>
        )}
      </section>

      <section className="mx-5 flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-card ring-1 ring-inset ring-line" aria-label="קהילת אגורה">
        <h2 className="flex items-center gap-2 text-[15px] font-bold">
          <ShieldCheck size={18} className="text-blue" />
          קהילת אגורה
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[22px] font-bold leading-tight">{stats.members}</p>
            <p className="text-[13px] text-mute">גולשים נותנים ומקבלים</p>
          </div>
          <div>
            <p className="text-[22px] font-bold leading-tight">{stats.given}</p>
            <p className="text-[13px] text-mute">חפצים נמסרו</p>
          </div>
        </div>
        <p className="text-[13px] text-ink-2">הכל בחינם, בלי מספרי 1-900. יוצרים קשר בהודעה בתוך האפליקציה.</p>
      </section>

      <ul className="mx-5">
        {rows.map(({ icon: Icon, label, detail, to, onClick }) => (
          <li key={label}>
            <button type="button" onClick={onClick ?? (() => to && nav.push(to))} className="flex w-full items-center gap-3 border-b border-line py-4 text-right">
              <Icon size={20} className="text-ink-2" />
              <span className="flex-1 text-[15px]">{label}</span>
              {detail && <span className="text-[13px] text-blue-ink">{detail}</span>}
              <ChevronLeft size={18} className="text-mute" />
            </button>
          </li>
        ))}
        <li>
          <button type="button" onClick={() => nav.toast("התנתקתם מהחשבון")} className="flex w-full items-center gap-3 py-4 text-right text-[15px] text-ink-2">
            <LogOut size={20} />
            יציאה
          </button>
        </li>
      </ul>
    </div>
  )
}

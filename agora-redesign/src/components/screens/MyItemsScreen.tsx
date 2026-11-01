import { useState } from "react"
import { PackagePlus, Search } from "lucide-react"
import { useNav } from "../../nav"
import ScreenHeader from "../ui/ScreenHeader"
import Button from "../ui/Button"
import ItemGrid from "../home/ItemGrid"
import { feedItems } from "../../data/mock"

export default function MyItemsScreen() {
  const nav = useNav()
  const [tab, setTab] = useState<"given" | "requests">("given")
  const mine = feedItems.slice(0, 2).map((i) => ({ ...i, id: `mine-${i.id}` }))

  return (
    <div className="flex flex-col">
      <ScreenHeader title="הפריטים שלי" />
      <div className="flex flex-col gap-5 px-5 pt-1 pb-6">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-paper p-1" style={{ boxShadow: "var(--shadow-raised)" }}>
          {(["given", "requests"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t} className={`h-10 rounded-full text-[14px] font-semibold ${tab === t ? "bg-brand text-paper" : "text-ink-soft"}`}>
              {t === "given" ? "מסרתי" : "ביקשתי"}
            </button>
          ))}
        </div>

        {tab === "given" ? (
          <>
            <ItemGrid items={mine} />
            <Button block variant="accent" icon={<PackagePlus size={19} />} onClick={() => nav.push({ name: "give" })}>
              למסור חפץ נוסף
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-[24px] bg-paper px-6 py-10 text-center" style={{ boxShadow: "var(--shadow-raised)" }}>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-brand-strong">
              <Search size={24} />
            </span>
            <h3 className="text-[17px] font-bold text-deep">עוד לא פרסמתם בקשות</h3>
            <p className="text-[14px] text-mute">מחפשים משהו מסוים? נודיע לכם כשהוא יעלה.</p>
            <Button onClick={() => nav.push({ name: "request" })}>פרסום בקשה</Button>
          </div>
        )}
      </div>
    </div>
  )
}

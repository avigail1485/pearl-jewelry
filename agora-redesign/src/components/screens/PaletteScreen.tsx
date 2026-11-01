import { useNav } from "../../nav"
import ScreenHeader from "../ui/ScreenHeader"
import Button from "../ui/Button"
import Chip from "../ui/Chip"
import { ConditionTag } from "../ui/StatusTag"

type Swatch = { name: string; hex: string; use: string; dark?: boolean }

const groups: { title: string; swatches: Swatch[] }[] = [
  {
    title: "ירוק — צבע ראשי",
    swatches: [
      { name: "Brand", hex: "#00B46E", use: "כפתורים ראשיים, מצב פעיל", dark: true },
      { name: "Brand Hover", hex: "#009A5E", use: "ריחוף / לחיצה", dark: true },
      { name: "Brand Strong", hex: "#00804E", use: "טקסט ואייקונים ירוקים", dark: true },
      { name: "Brand Ink", hex: "#00663E", use: "טקסט על רקע ירוק בהיר", dark: true },
      { name: "Brand Tint", hex: "#E3F7EE", use: "רקע תגיות ואייקונים" },
    ],
  },
  {
    title: "כתום — צבע משני",
    swatches: [
      { name: "Accent", hex: "#FF7A1A", use: "כפתור מסירה, הדגשות", dark: true },
      { name: "Accent Hover", hex: "#F2650A", use: "ריחוף / לחיצה", dark: true },
      { name: "Accent Ink", hex: "#B34A00", use: "טקסט כתום, התראות", dark: true },
      { name: "Accent Tint", hex: "#FFF0E3", use: "רקע תגיות \"חדש\" / \"דורש תיקון\"" },
    ],
  },
  {
    title: "אפור ניטרלי — רקעים וטקסט",
    swatches: [
      { name: "Ground", hex: "#F5F6F8", use: "רקע האפליקציה" },
      { name: "Paper", hex: "#FFFFFF", use: "כרטיסים, שדות, גיליונות" },
      { name: "Surface", hex: "#EEF0F3", use: "מילויים רכים" },
      { name: "Line", hex: "#E3E5E9", use: "קווי הפרדה" },
      { name: "Mute", hex: "#6B7079", use: "טקסט משני", dark: true },
      { name: "Ink Soft", hex: "#4B5059", use: "טקסט גוף", dark: true },
      { name: "Deep", hex: "#1C1F23", use: "כותרות וטקסט ראשי", dark: true },
    ],
  },
]

const type = [
  { label: "Display · 26 Bold", cls: "text-[26px] font-bold" },
  { label: "Title · 20 Bold", cls: "text-[20px] font-bold" },
  { label: "Body · 15 Regular", cls: "text-[15px]" },
  { label: "Caption · 13 Medium", cls: "text-[13px] font-medium text-mute" },
]

export default function PaletteScreen() {
  const nav = useNav()
  return (
    <div className="flex flex-col">
      <ScreenHeader title="פלטת צבעים" />
      <div className="flex flex-col gap-7 px-5 pt-1 pb-8">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="mb-3 text-[16px] font-bold text-deep">{g.title}</h2>
            <div className="flex flex-col gap-2">
              {g.swatches.map((s) => (
                <button
                  key={s.hex}
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(s.hex).catch(() => {})
                    nav.toast(`${s.hex} הועתק`)
                  }}
                  className="flex items-center gap-3 rounded-[18px] bg-paper p-2 text-right"
                  style={{ boxShadow: "var(--shadow-raised)" }}
                >
                  <span className="h-12 w-16 shrink-0 rounded-[12px]" style={{ background: s.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)" }} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[14px] font-bold text-deep">{s.name}</span>
                    <span className="truncate text-[12px] text-mute">{s.use}</span>
                  </span>
                  <span dir="ltr" className="font-mono text-[13px] text-ink-soft">{s.hex}</span>
                </button>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="mb-3 text-[16px] font-bold text-deep">טיפוגרפיה — Google Sans</h2>
          <div className="flex flex-col gap-3 rounded-[20px] bg-paper p-4" style={{ boxShadow: "var(--shadow-raised)" }}>
            {type.map((t) => (
              <div key={t.label} className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-b-0 last:pb-0">
                <span className={`text-deep ${t.cls}`}>אגורה מוסרים</span>
                <span dir="ltr" className="shrink-0 text-[12px] text-mute">{t.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[16px] font-bold text-deep">רכיבים בפלטה</h2>
          <div className="flex flex-col gap-3">
            <Button block>כפתור ראשי</Button>
            <Button block variant="accent">כפתור כתום</Button>
            <Button block variant="secondary">כפתור משני</Button>
            <div className="flex flex-wrap gap-2">
              <Chip selected>נבחר</Chip>
              <Chip>רגיל</Chip>
              <ConditionTag condition="כמו חדש" />
              <ConditionTag condition="במצב טוב" />
              <ConditionTag condition="דורש תיקון" />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

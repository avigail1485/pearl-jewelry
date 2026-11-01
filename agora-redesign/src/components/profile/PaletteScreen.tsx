import { useNav } from "../../nav"
import TopBar from "../ui/TopBar"
import Button from "../ui/Button"
import Chip from "../ui/Chip"

const colors = [
  { name: "Blue", hex: "#3869FE", role: "פעולה ראשית, מצב פעיל, קישורים", text: "#fff" },
  { name: "Blue Ink", hex: "#2850D8", role: "טקסט כחול קטן (נגישות AA)", text: "#fff" },
  { name: "Lime", hex: "#D4FA60", role: "הדגשה נקודתית בלבד: \"חדש\", חץ בכרטיס הבקשה", text: "#16181D" },
  { name: "Lavender", hex: "#EFF3FF", role: "שדות, כרטיסי מידע, משטחים רכים", text: "#16181D" },
  { name: "White", hex: "#FFFFFF", role: "רקע המסכים — התמונות הן הגיבורות", text: "#16181D" },
  { name: "Ink", hex: "#16181D", role: "כותרות וטקסט ראשי", text: "#fff" },
  { name: "Ink 2", hex: "#43474F", role: "טקסט גוף", text: "#fff" },
  { name: "Mute", hex: "#6C717B", role: "טקסט משני", text: "#fff" },
  { name: "Line", hex: "#E8EAF0", role: "קווי הפרדה ומסגרות", text: "#16181D" },
]

const ratio = [
  ["לבן + דיו", 82, "#FFFFFF"],
  ["לבנדר", 10, "#EFF3FF"],
  ["כחול", 6, "#3869FE"],
  ["ליים", 2, "#D4FA60"],
] as const

export default function PaletteScreen() {
  const nav = useNav()
  return (
    <div className="min-h-full bg-white">
      <TopBar title="פלטה וטיפוגרפיה" />
      <div className="flex flex-col gap-8 px-5 pb-10">
        <section>
          <h2 className="mb-1 text-[16px] font-bold">יחס שימוש</h2>
          <p className="mb-3 text-[13px] text-mute">הצבע במשורה: רוב המסך לבן, והכחול שמור לפעולה.</p>
          <div className="flex h-10 overflow-hidden rounded-xl ring-1 ring-inset ring-line">
            {ratio.map(([l, p, c]) => (
              <span key={l} className="block h-full" style={{ width: `${p}%`, background: c }} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 text-[12px] text-ink-2">
            {ratio.map(([l, p]) => (
              <span key={l}>
                {l} {p}%
              </span>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="mb-1 text-[16px] font-bold">צבעים</h2>
          {colors.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(c.hex).catch(() => {})
                nav.toast(`${c.hex} הועתק`)
              }}
              className="flex items-center gap-3 text-right"
            >
              <span className="flex h-14 w-20 shrink-0 items-end rounded-xl p-2 text-[11px] font-semibold ring-1 ring-inset ring-black/5" style={{ background: c.hex, color: c.text }}>
                Aa
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold">{c.name}</span>
                <span className="block text-[12px] text-mute">{c.role}</span>
              </span>
              <span dir="ltr" className="font-mono text-[12px] text-ink-2">{c.hex}</span>
            </button>
          ))}
        </section>

        <section>
          <h2 className="mb-3 text-[16px] font-bold">Google Sans</h2>
          {[
            ["כותרת מסך", "text-[26px] font-bold", "26 / Bold"],
            ["כותרת אזור", "text-[19px] font-bold", "19 / Bold"],
            ["כותרת כרטיס", "text-[15px] font-semibold", "15 / Semibold"],
            ["טקסט גוף רגיל", "text-[15px]", "15 / Regular"],
            ["מידע משני", "text-[13px] text-mute", "13 / Regular"],
          ].map(([t, cls, spec]) => (
            <div key={spec} className="flex items-baseline justify-between gap-3 border-b border-line py-2.5">
              <span className={cls}>{t}</span>
              <span dir="ltr" className="shrink-0 text-[12px] text-mute">{spec}</span>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[16px] font-bold">רכיבים</h2>
          <Button block>כפתור ראשי</Button>
          <Button block variant="soft">כפתור משני</Button>
          <Button block variant="outline">כפתור מסגרת</Button>
          <div className="flex flex-wrap gap-2">
            <Chip selected>נבחר</Chip>
            <Chip>רגיל</Chip>
            <span className="flex items-center rounded-full bg-lime px-2.5 text-[12px] font-bold">חדש</span>
          </div>
        </section>
      </div>
    </div>
  )
}

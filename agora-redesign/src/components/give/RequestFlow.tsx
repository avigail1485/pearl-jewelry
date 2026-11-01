import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { conditions } from "../../data/meta"
import { items } from "../../data/items"
import { emptyFilters, useNav } from "../../nav"
import TopBar from "../ui/TopBar"
import Button from "../ui/Button"
import Chip from "../ui/Chip"
import Field, { inputCls } from "../ui/Field"
import { ItemCard } from "../item/ItemCard"

export default function RequestFlow() {
  const nav = useNav()
  const [done, setDone] = useState(false)
  const [what, setWhat] = useState("")
  const [city, setCity] = useState("")
  const [cond, setCond] = useState<string>("לא משנה")
  const [why, setWhy] = useState("")
  const [error, setError] = useState("")

  const submit = () => {
    if (what.trim().length < 2) return setError("כתבו מה אתם מחפשים")
    if (!city.trim()) return setError("באיזה ישוב נוח לכם לאסוף?")
    setError("")
    nav.addAlert({ ...emptyFilters, query: what.trim() })
    setDone(true)
  }

  const matches = items.filter((i) => what.trim() && (i.title.includes(what.trim()) || i.sub.includes(what.trim()))).slice(0, 4)

  if (done) {
    return (
      <div className="screen-in no-scrollbar flex h-full flex-col overflow-y-auto bg-white px-5 pb-6 pt-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 size={60} className="text-blue" strokeWidth={1.5} />
          <h1 className="text-[24px] font-bold">הבקשה פורסמה</h1>
          <p className="max-w-[300px] text-[15px] text-ink-2">מוסרים ב{city} ובסביבה יראו אותה. הפעלנו לכם גם התראה על "{what}".</p>
        </div>
        {matches.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-[17px] font-bold">כבר יש בלוח</h2>
            <div className="grid grid-cols-2 gap-3">
              {matches.map((i) => (
                <ItemCard key={i.id} item={i} />
              ))}
            </div>
          </section>
        )}
        <div className="mt-auto flex flex-col gap-2 pt-8">
          <Button block onClick={() => nav.goTab("home")}>
            לדף הראשי
          </Button>
          <Button block variant="ghost" onClick={() => nav.push({ name: "alerts" })}>
            ניהול התראות
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <TopBar title="בקשת חפץ" />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
        <p className="mb-6 text-[15px] text-ink-2">מתארים מה צריך, ומוסרים שיש להם יפנו אליכם.</p>
        <div className="flex flex-col gap-5">
          <Field label="מה אתם מחפשים?" htmlFor="what" error={error}>
            <input id="what" value={what} onChange={(e) => setWhat(e.target.value)} placeholder="למשל: מיטת תינוק, מקרר קטן" className={inputCls} />
          </Field>
          <Field label="ישוב" htmlFor="rcity">
            <input id="rcity" value={city} onChange={(e) => setCity(e.target.value)} placeholder="הקלידו ישוב" className={inputCls} />
          </Field>
          <Field label="מצב מינימלי">
            <div className="flex flex-wrap gap-2">
              {["לא משנה", ...conditions].map((c) => (
                <Chip key={c} selected={cond === c} onClick={() => setCond(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="כמה מילים על הצורך" htmlFor="why" hint="לא חובה. מוסרים נענים יותר כשמבינים למה.">
            <textarea id="why" rows={3} value={why} onChange={(e) => setWhy(e.target.value)} className={`${inputCls} resize-none`} />
          </Field>
        </div>
      </div>
      <div className="relative z-10 bg-white px-5 shadow-bar pb-[max(env(safe-area-inset-bottom),14px)] pt-3">
        <Button block onClick={submit}>
          פרסום הבקשה
        </Button>
      </div>
    </div>
  )
}

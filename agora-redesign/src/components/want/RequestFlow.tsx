import { useState } from "react"
import { ArrowRight, Sparkles, CheckCircle2, Search } from "lucide-react"
import Button from "../ui/Button"
import Chip from "../ui/Chip"
import Field, { inputCls } from "../ui/Field"
import ItemGrid from "../home/ItemGrid"
import { useNav } from "../../nav"
import { feedItems, type Condition } from "../../data/mock"

type Step = "form" | "confirm" | "success"
type RequestForm = { what: string; area: string; why: string; condition: Condition | "לא משנה" }
const conditions: (Condition | "לא משנה")[] = ["לא משנה", "כמו חדש", "במצב טוב", "דורש תיקון"]

export default function RequestFlow() {
  const nav = useNav()
  const [step, setStep] = useState<Step>("form")
  const [form, setForm] = useState<RequestForm>({ what: "", area: nav.location.city, why: "", condition: "לא משנה" })
  const [error, setError] = useState("")
  const update = (patch: Partial<RequestForm>) => setForm((f) => ({ ...f, ...patch }))

  const back = () => (step === "confirm" ? setStep("form") : nav.back())

  const goConfirm = () => {
    if (!form.what.trim()) return setError("ספרו לנו מה אתם מחפשים")
    if (!form.area.trim()) return setError("איזה אזור נוח לכם?")
    setError("")
    setStep("confirm")
  }

  const matches = feedItems.filter((i) => i.status === "available").slice(0, 4).map((i) => ({ ...i, id: `m-${i.id}` }))

  return (
    <div className="flex h-full flex-col bg-ground">
      {step !== "success" && (
        <header className="safe-top flex items-center gap-3 px-5 pb-2">
          <button type="button" onClick={back} aria-label="חזרה" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper text-deep hover:text-brand-strong" style={{ boxShadow: "var(--shadow-raised)" }}>
            <ArrowRight size={20} />
          </button>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: step === "form" ? "50%" : "100%" }} />
          </div>
        </header>
      )}

      <div className="no-scrollbar flex-1 overflow-y-auto">
        {step === "form" && (
          <div className="screen-in flex flex-col gap-5 px-5 py-5">
            <div>
              <h1 className="font-display text-[26px] font-bold text-deep">מה אתם מחפשים?</h1>
              <p className="mt-1.5 text-[15px] text-ink-soft">נפרסם בקשה, ונודיע לכם כשמישהו קרוב מוסר משהו מתאים.</p>
            </div>
            <Field label="מה אתם מחפשים?" htmlFor="what" error={error}>
              <input id="what" value={form.what} onChange={(e) => update({ what: e.target.value })} placeholder="למשל: מיטת תינוק, מקרר קטן, שולחן כתיבה" className={inputCls} />
            </Field>
            <Field label="אזור" htmlFor="area" hint="נחפש התאמות קרובות אליכם.">
              <input id="area" value={form.area} onChange={(e) => update({ area: e.target.value })} className={inputCls} />
            </Field>
            <Field label="עוד פרטים" htmlFor="why" hint="לא חובה, אבל זה עוזר למוסרים להבין אם זה מתאים.">
              <textarea id="why" value={form.why} onChange={(e) => update({ why: e.target.value })} rows={3} placeholder="מידות, צבע, מתי אתם צריכים..." className={`${inputCls} resize-none`} />
            </Field>
            <Field label="מצב מבוקש">
              <div className="flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <Chip key={c} selected={form.condition === c} onClick={() => update({ condition: c })}>
                    {c}
                  </Chip>
                ))}
              </div>
            </Field>
            <div className="sticky bottom-0 mt-2 bg-ground pt-2 pb-4">
              <Button block onClick={goConfirm}>
                המשך
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="screen-in flex flex-col gap-5 px-5 py-5">
            <div>
              <h1 className="font-display text-[26px] font-bold text-deep">לפרסם בקשה?</h1>
              <p className="mt-1.5 text-[15px] text-ink-soft">כך הבקשה שלכם תיראה למוסרים.</p>
            </div>
            <div className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-paper p-5" style={{ boxShadow: "var(--shadow-raised)" }}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-tint text-accent-ink">
                <Search size={22} />
              </span>
              <h3 className="font-display text-[20px] font-bold text-deep">{form.what}</h3>
              <p className="text-[14px] text-mute">
                {form.area} · מצב: {form.condition}
              </p>
              {form.why.trim() && <p className="text-[15px] leading-relaxed text-ink-soft">{form.why}</p>}
            </div>
            <div className="flex items-start gap-2 rounded-[18px] bg-brand-tint px-4 py-3 text-[13px] leading-relaxed text-brand-ink">
              <Sparkles size={16} className="mt-0.5 shrink-0" />
              נריץ התאמה חכמה מול פריטים חדשים באזור, ונשלח לכם התראה על כל התאמה.
            </div>
            <div className="sticky bottom-0 mt-2 flex flex-col gap-2 bg-ground pt-2 pb-4">
              <Button block onClick={() => setStep("success")}>
                פרסום הבקשה
              </Button>
              <Button block variant="ghost" onClick={() => setStep("form")}>
                עריכה
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="screen-in safe-top flex flex-col gap-6 px-5 pb-8">
            <div className="flex flex-col items-center gap-4 pt-6 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-paper">
                <CheckCircle2 size={30} />
              </span>
              <div>
                <h1 className="font-display text-[26px] font-bold text-deep">הבקשה שלכם פורסמה</h1>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">נעדכן אתכם ברגע שיימסר משהו מתאים. בינתיים — מצאנו כמה פריטים שאולי יתאימו.</p>
              </div>
            </div>
            <section aria-label="התאמות אפשריות">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <h2 className="font-display text-[18px] font-bold text-deep">אולי זה מתאים לכם</h2>
              </div>
              <ItemGrid items={matches} />
            </section>
            <Button block onClick={() => nav.reset()}>
              חזרה לדף הבית
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

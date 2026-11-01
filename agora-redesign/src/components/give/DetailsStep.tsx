import { useState } from "react"
import { ChevronDown, Sparkles } from "lucide-react"
import Button from "../ui/Button"
import Chip from "../ui/Chip"
import Field, { inputCls } from "../ui/Field"
import { categories, type Condition } from "../../data/mock"
import type { GiveForm } from "./GiveFlow"

const conditions: Condition[] = ["כמו חדש", "במצב טוב", "דורש תיקון"]

const aiBadge = (
  <span className="inline-flex items-center gap-1 rounded-full bg-brand-tint px-2 py-0.5 text-[12px] font-semibold text-brand-ink">
    <Sparkles size={11} />
    מולא אוטומטית
  </span>
)

export default function DetailsStep({ form, update, onNext }: { form: GiveForm; update: (p: Partial<GiveForm>) => void; onNext: () => void }) {
  const [error, setError] = useState("")

  const draftDescription = () =>
    update({
      description:
        form.description || "שידת עץ יציבה עם 4 מגירות רחבות, מתאימה לחדר שינה או סלון. מעט סימני שימוש בפינה אחת. נמסרת בגלל מעבר דירה.",
    })

  const handleNext = () => {
    const t = form.title.trim()
    if (!t) return setError('נשמח לכותרת קצרה. למשל: "ספה תלת מושבית אפורה"')
    if (t.length < 3) return setError("עוד כמה מילים יעזרו לאנשים למצוא את זה")
    setError("")
    onNext()
  }

  return (
    <div className="flex flex-1 flex-col px-5 py-5">
      <h1 className="font-display text-[26px] font-bold text-deep">כמעט סיימנו</h1>
      <p className="mt-1.5 text-[15px] text-ink-soft">מילאנו בשבילכם. תקנו מה שלא מדויק.</p>

      <div className="mt-6 flex flex-col gap-5">
        <Field label="כותרת" htmlFor="title" badge={form.title ? aiBadge : undefined} error={error}>
          <input id="title" value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="איך תקראו לזה?" className={inputCls} />
        </Field>

        <Field label="קטגוריה" htmlFor="category" badge={form.category ? aiBadge : undefined}>
          <div className="relative">
            <select id="category" value={form.category} onChange={(e) => update({ category: e.target.value })} className={`${inputCls} appearance-none pl-10`}>
              <option value="">בחרו קטגוריה</option>
              {categories.map((c) => (
                <option key={c.id}>{c.label}</option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
          </div>
        </Field>

        <Field label="אזור איסוף" htmlFor="area" hint="רק העיר תוצג. הכתובת המדויקת נמסרת בשיחה.">
          <input id="area" value={form.area} onChange={(e) => update({ area: e.target.value })} className={inputCls} />
        </Field>

        <Field label="מצב הפריט">
          <div className="flex flex-wrap gap-2">
            {conditions.map((c) => (
              <Chip key={c} selected={form.condition === c} onClick={() => update({ condition: c })}>
                {c}
              </Chip>
            ))}
          </div>
        </Field>

        <Field
          label="תיאור"
          htmlFor="description"
          action={
            <button type="button" onClick={draftDescription} className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-ink">
              <Sparkles size={13} />
              לנסח לי תיאור
            </button>
          }
          hint="משהו שכדאי לדעת? מידות, פגם קטן, למה אתם מוסרים"
        >
          <textarea id="description" value={form.description} onChange={(e) => update({ description: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
        </Field>
      </div>

      <div className="sticky bottom-0 mt-6 bg-ground pt-2 pb-4">
        <Button block onClick={handleNext}>
          לתצוגה מקדימה
        </Button>
      </div>
    </div>
  )
}

import { useRef, useState } from "react"
import { Camera, CheckCircle2, ChevronDown, HandHeart, ImagePlus, Star, X } from "lucide-react"
import { categories, cities, conditions } from "../../data/meta"
import type { Condition, WantedRequest } from "../../data/types"
import { useNav } from "../../nav"
import TopBar from "../ui/TopBar"
import Button from "../ui/Button"
import Chip from "../ui/Chip"
import Field, { inputCls } from "../ui/Field"

type Form = { photos: string[]; title: string; category: string; city: string; condition: Condition; description: string }
type Step = 1 | 2 | 3 | 4

export default function GiveFlow({ forRequest }: { forRequest?: WantedRequest }) {
  const nav = useNav()
  const [step, setStep] = useState<Step>(1)
  const [f, setF] = useState<Form>({ photos: [], title: forRequest?.title ?? "", category: "", city: forRequest?.city ?? "", condition: "מצב טוב", description: "" })
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const up = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }))

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const urls = [...files].slice(0, 6 - f.photos.length).map((file) => URL.createObjectURL(file))
    up({ photos: [...f.photos, ...urls] })
  }

  const next = () => {
    if (step === 2) {
      if (f.title.trim().length < 2) return setError("כתבו מה אתם מוסרים, למשל: ספה תלת מושבית")
      if (!f.category) return setError("בחרו קטגוריה כדי שיוכלו למצוא את החפץ")
      if (!f.city.trim()) return setError("מאיזה ישוב האיסוף?")
    }
    setError("")
    setStep((s) => (s + 1) as Step)
  }

  if (step === 4) {
    return (
      <div className="screen-in flex h-full flex-col bg-white px-5 pb-6 pt-16">
        <div className="flex flex-1 flex-col items-center gap-3 text-center">
          <CheckCircle2 size={64} className="text-blue" strokeWidth={1.5} />
          <h1 className="text-[26px] font-bold">החפץ פורסם</h1>
          <p className="max-w-[300px] text-[15px] text-ink-2">
            "{f.title}" מופיע עכשיו בלוח. מי שהפעיל התראה על {f.category} ב{f.city} יקבל הודעה.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            block
            onClick={() => {
              setF({ photos: [], title: "", category: "", city: f.city, condition: "מצב טוב", description: "" })
              setStep(1)
            }}
          >
            למסור חפץ נוסף
          </Button>
          <Button block variant="outline" onClick={() => nav.goTab("profile")}>
            לחפצים שלי
          </Button>
          <Button block variant="ghost" onClick={() => nav.goTab("home")}>
            לדף הראשי
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <TopBar
        onBack={() => (step === 1 ? nav.back() : setStep((s) => (s - 1) as Step))}
        title={step === 1 ? "תמונות" : step === 2 ? "פרטי החפץ" : "תצוגה מקדימה"}
        end={<span className="text-[13px] font-medium text-mute">שלב {step} מתוך 3</span>}
      />
      <div className="mx-5 mb-2 flex gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`h-1 flex-1 rounded-full ${n <= step ? "bg-blue" : "bg-line"}`} />
        ))}
      </div>

      <div key={step} className="screen-in no-scrollbar flex-1 overflow-y-auto px-5 pb-6 pt-3">
        {forRequest && step === 1 && (
          <p className="mb-4 flex items-center gap-2 rounded-2xl bg-lavender px-4 py-3 text-[14px]">
            <HandHeart size={18} className="shrink-0 text-blue" />
            מוסרים בעקבות בקשה: <b>{forRequest.title}</b> ({forRequest.city})
          </p>
        )}

        {step === 1 && (
          <>
            <h2 className="text-[22px] font-bold">צלמו את החפץ</h2>
            <p className="mb-5 text-[14px] text-ink-2">מודעה עם תמונה נמסרת הרבה יותר מהר. עד 6 תמונות.</p>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
            {f.photos.length === 0 ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-lavender-2 bg-lavender text-blue-ink hover:border-blue"
              >
                <Camera size={36} strokeWidth={1.5} />
                <span className="text-[15px] font-semibold">הוספת תמונות</span>
                <span className="text-[13px] text-mute">מהמצלמה או מהגלריה</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {f.photos.map((p, i) => (
                  <div key={p} className="relative aspect-square overflow-hidden rounded-2xl bg-photo">
                    <img src={p} alt="" className="h-full w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-white px-2 text-[11px] font-bold">
                        <Star size={10} fill="currentColor" />
                        ראשית
                      </span>
                    )}
                    <button type="button" aria-label="הסרת תמונה" onClick={() => up({ photos: f.photos.filter((x) => x !== p) })} className="absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {f.photos.length < 6 && (
                  <button type="button" onClick={() => fileRef.current?.click()} aria-label="הוספת תמונה" className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-lavender-2 text-blue hover:border-blue">
                    <ImagePlus size={24} />
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <Field label="מה מוסרים?" htmlFor="title" error={error}>
              <input id="title" value={f.title} onChange={(e) => up({ title: e.target.value })} placeholder="למשל: שידת מגירות מעץ" className={inputCls} />
            </Field>
            <Field label="קטגוריה" htmlFor="cat">
              <div className="relative">
                <select id="cat" value={f.category} onChange={(e) => up({ category: e.target.value })} className={`${inputCls} appearance-none pl-10`}>
                  <option value="">בחרו קטגוריה</option>
                  {categories.map((c) => (
                    <option key={c.label}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
              </div>
            </Field>
            <Field label="ישוב לאיסוף" htmlFor="city" hint="רק שם הישוב מוצג. הכתובת נמסרת בהודעה.">
              <input id="city" list="cities" value={f.city} onChange={(e) => up({ city: e.target.value })} placeholder="הקלידו ישוב" className={inputCls} />
              <datalist id="cities">
                {cities.slice(1).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="מצב">
              <div className="flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <Chip key={c} selected={f.condition === c} onClick={() => up({ condition: c })}>
                    {c}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="תיאור" htmlFor="desc" hint="מידות, פגמים, זמני איסוף נוחים. לא חובה.">
              <textarea id="desc" rows={3} value={f.description} onChange={(e) => up({ description: e.target.value })} className={`${inputCls} resize-none`} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <p className="text-[14px] text-ink-2">כך המודעה תופיע בלוח:</p>
            <div className="overflow-hidden rounded-3xl ring-1 ring-inset ring-line">
              <div className="aspect-[4/3] bg-photo">
                {f.photos[0] ? (
                  <img src={f.photos[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[14px] text-mute">בלי תמונה</div>
                )}
              </div>
              <div className="p-4">
                <p className="text-[18px] font-bold">{f.title}</p>
                <p className="text-[14px] text-mute">
                  {f.city} · {f.condition} · {f.category}
                </p>
                {f.description && <p className="mt-2 text-[14px] text-ink-2">{f.description}</p>}
              </div>
            </div>
            <p className="text-center text-[13px] text-mute">
              בפרסום אני מאשר/ת את{" "}
              <button type="button" onClick={() => nav.push({ name: "rules" })} className="font-semibold text-blue-ink underline underline-offset-2">
                כללי הקהילה
              </button>
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-line px-5 pb-[max(env(safe-area-inset-bottom),14px)] pt-3">
        {step === 1 && (
          <div className="flex flex-col gap-1">
            <Button block onClick={next} disabled={f.photos.length === 0}>
              המשך
            </Button>
            {f.photos.length === 0 && (
              <button type="button" onClick={next} className="py-2 text-[14px] font-medium text-ink-2 underline underline-offset-4">
                דילוג, אוסיף תמונה אחר כך
              </button>
            )}
          </div>
        )}
        {step === 2 && (
          <Button block onClick={next}>
            לתצוגה מקדימה
          </Button>
        )}
        {step === 3 && (
          <Button block onClick={() => setStep(4)}>
            פרסום בלוח
          </Button>
        )}
      </div>
    </div>
  )
}

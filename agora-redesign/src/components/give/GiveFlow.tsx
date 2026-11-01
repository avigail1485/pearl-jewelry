import { useEffect, useRef, useState } from "react"
import { Camera, CheckCircle2, ChevronDown, HandHeart, ImagePlus, Pencil, Sparkles, Star, X } from "lucide-react"
import { errorCode, recognize } from "../../data/ai"
import AiPanel, { ScanOverlay, type AiState } from "./AiPanel"
import { categories, cities, conditions } from "../../data/meta"
import type { Condition, WantedRequest } from "../../data/types"
import { useNav } from "../../nav"
import TopBar from "../ui/TopBar"
import Button from "../ui/Button"
import Chip from "../ui/Chip"
import Field, { inputCls } from "../ui/Field"

type Photo = { url: string; file: File }
type Form = { photos: Photo[]; title: string; category: string; sub: string; city: string; condition: Condition; description: string }
type AiField = "title" | "category" | "condition" | "description"

const aiBadge = (
  <span className="inline-flex items-center gap-1 rounded-full bg-lavender px-2 py-0.5 text-[11px] font-semibold text-blue-ink">
    <Sparkles size={11} />
    מולא ב-AI
  </span>
)
type Step = 1 | 2 | 3 | 4

export default function GiveFlow({ forRequest }: { forRequest?: WantedRequest }) {
  const nav = useNav()
  const [step, setStep] = useState<Step>(1)
  const [f, setF] = useState<Form>({ photos: [], title: forRequest?.title ?? "", category: "", sub: "", city: forRequest?.city ?? "", condition: "מצב טוב", description: "" })
  const [error, setError] = useState("")
  const [cityError, setCityError] = useState("")
  const [aiMode, setAiMode] = useState(true)
  const [ai, setAi] = useState<AiState>({ status: "idle" })
  const [aiFields, setAiFields] = useState<Set<AiField>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)
  const ctl = useRef<AbortController | null>(null)
  const up = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }))
  /** Editing a field by hand removes its AI badge. */
  const edit = (field: AiField, p: Partial<Form>) => {
    up(p)
    setAiFields((s) => (s.has(field) ? new Set([...s].filter((x) => x !== field)) : s))
  }

  useEffect(() => () => ctl.current?.abort(), [])

  const runAi = (photos: Photo[]) => {
    ctl.current?.abort()
    const c = new AbortController()
    ctl.current = c
    setAi({ status: "scanning" })
    recognize(
      photos.map((p) => p.file),
      c.signal,
    ).then(
      (result) => !c.signal.aborted && setAi({ status: "done", result }),
      (e) => {
        if (c.signal.aborted && errorCode(e) !== "cancelled") return
        const code = errorCode(e)
        setAi({ status: "error", error: code })
        if (code === "not_granted") setAiMode(false)
      },
    )
  }

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return
    const added = [...files].slice(0, 6 - f.photos.length).map((file) => ({ url: URL.createObjectURL(file), file }))
    const photos = [...f.photos, ...added]
    up({ photos })
    // Recognize on the first photo(s); later additions don't re-run unless asked
    if (aiMode && f.photos.length === 0) runAi(photos)
  }

  const applyAi = (go: 2 | 3) => {
    if (ai.status !== "done") return
    const r = ai.result
    up({ title: r.title, category: r.category, sub: r.sub, condition: r.condition, description: r.description })
    setAiFields(new Set<AiField>(["title", "category", "condition", ...(r.description ? (["description"] as AiField[]) : [])]))
    setError("")
    if (go === 3 && !f.city.trim()) {
      setCityError("נשאר רק לכתוב מאיזה ישוב האיסוף")
      return setStep(2)
    }
    setStep(go)
  }

  const next = () => {
    if (step === 2) {
      if (f.title.trim().length < 2) return setError("כתבו מה אתם מוסרים, למשל: ספה תלת מושבית")
      if (!f.category) return setError("בחרו קטגוריה כדי שיוכלו למצוא את החפץ")
      if (!f.city.trim()) return setCityError("מאיזה ישוב האיסוף?")
    }
    setError("")
    setCityError("")
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
              setF({ photos: [], title: "", category: "", sub: "", city: f.city, condition: "מצב טוב", description: "" })
              setAi({ status: "idle" })
              setAiFields(new Set())
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
            <p className="mb-4 text-[14px] text-ink-2">{aiMode ? "ה-AI יזהה מה בתמונה וימלא את פרטי המודעה בשבילכם." : "מודעה עם תמונה נמסרת הרבה יותר מהר. עד 6 תמונות."}</p>
            <div role="radiogroup" aria-label="אופן מילוי הפרטים" className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-lavender p-1">
              {[
                { on: true, label: "זיהוי אוטומטי", icon: <Sparkles size={16} /> },
                { on: false, label: "מילוי ידני", icon: <Pencil size={15} /> },
              ].map((m) => (
                <button
                  key={m.label}
                  type="button"
                  role="radio"
                  aria-checked={aiMode === m.on}
                  onClick={() => {
                    setAiMode(m.on)
                    if (!m.on) {
                      ctl.current?.abort()
                      setAi({ status: "idle" })
                    } else if (f.photos.length && ai.status === "idle") runAi(f.photos)
                  }}
                  className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-[14px] font-semibold transition-colors ${aiMode === m.on ? "bg-white text-ink shadow-sm" : "text-ink-2"}`}
                >
                  <span className={aiMode === m.on && m.on ? "text-blue" : ""}>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
            {f.photos.length === 0 ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-lavender-2 bg-lavender text-blue-ink hover:border-blue"
              >
                {aiMode ? <Sparkles size={36} strokeWidth={1.5} /> : <Camera size={36} strokeWidth={1.5} />}
                <span className="text-[15px] font-semibold">{aiMode ? "צלמו, וה-AI ימלא את השאר" : "הוספת תמונות"}</span>
                <span className="text-[13px] text-mute">מהמצלמה או מהגלריה</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {f.photos.map((p, i) => (
                  <div key={p.url} className={`relative overflow-hidden rounded-2xl bg-photo ${i === 0 && aiMode ? "col-span-3 aspect-[4/3]" : "aspect-square"}`}>
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                    {i === 0 && ai.status === "scanning" && <ScanOverlay onCancel={() => { ctl.current?.abort(); setAi({ status: "idle" }); setAiMode(false) }} />}
                    {i === 0 && (
                      <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-white px-2 text-[11px] font-bold">
                        <Star size={10} fill="currentColor" />
                        ראשית
                      </span>
                    )}
                    <button type="button" aria-label="הסרת תמונה" onClick={() => { const photos = f.photos.filter((x) => x !== p); up({ photos }); if (i === 0) { ctl.current?.abort(); setAi({ status: "idle" }); if (aiMode && photos.length) runAi(photos) } }} className="absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-white">
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
            {aiMode && (
              <AiPanel
                state={ai}
                onAccept={() => applyAi(3)}
                onEdit={() => applyAi(2)}
                onRetry={() => runAi(f.photos)}
                onManual={() => {
                  setAiMode(false)
                  setAi({ status: "idle" })
                  setStep(2)
                }}
              />
            )}
          </>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            {aiFields.size > 0 && (
              <p className="flex items-center gap-2 rounded-2xl bg-lavender px-4 py-3 text-[14px] text-ink-2">
                <Sparkles size={16} className="shrink-0 text-blue" />
                ה-AI מילא את הפרטים. עברו עליהם ותקנו מה שצריך.
              </p>
            )}
            <Field label="מה מוסרים?" htmlFor="title" error={error} action={aiFields.has("title") ? aiBadge : undefined}>
              <input id="title" value={f.title} onChange={(e) => edit("title", { title: e.target.value })} placeholder="למשל: שידת מגירות מעץ" className={inputCls} />
            </Field>
            <Field label="קטגוריה" htmlFor="cat" hint={f.sub ? `תת-קטגוריה: ${f.sub}` : undefined} action={aiFields.has("category") ? aiBadge : undefined}>
              <div className="relative">
                <select id="cat" value={f.category} onChange={(e) => edit("category", { category: e.target.value, sub: "" })} className={`${inputCls} appearance-none pl-10`}>
                  <option value="">בחרו קטגוריה</option>
                  {categories.map((c) => (
                    <option key={c.label}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
              </div>
            </Field>
            <Field label="ישוב לאיסוף" htmlFor="city" error={cityError} hint="רק שם הישוב מוצג. הכתובת נמסרת בהודעה.">
              <input id="city" list="cities" autoFocus={!!cityError} value={f.city} onChange={(e) => { up({ city: e.target.value }); setCityError("") }} placeholder="הקלידו ישוב" className={inputCls} />
              <datalist id="cities">
                {cities.slice(1).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="מצב" action={aiFields.has("condition") ? aiBadge : undefined}>
              <div className="flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <Chip key={c} selected={f.condition === c} onClick={() => edit("condition", { condition: c })}>
                    {c}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="תיאור" htmlFor="desc" hint="מידות, פגמים, זמני איסוף נוחים. לא חובה." action={aiFields.has("description") ? aiBadge : undefined}>
              <textarea id="desc" rows={3} value={f.description} onChange={(e) => edit("description", { description: e.target.value })} className={`${inputCls} resize-none`} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <p className="text-[14px] text-ink-2">כך המודעה תופיע בלוח:</p>
            <div className="overflow-hidden rounded-3xl ring-1 ring-inset ring-line">
              <div className="aspect-[4/3] bg-photo">
                {f.photos[0] ? (
                  <img src={f.photos[0].url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[14px] text-mute">בלי תמונה</div>
                )}
              </div>
              <div className="p-4">
                <p className="text-[18px] font-bold">{f.title}</p>
                <p className="text-[14px] text-mute">
                  {f.city} · {f.condition} · {f.sub || f.category}
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

      <div className="relative z-10 bg-white px-5 shadow-bar pb-[max(env(safe-area-inset-bottom),14px)] pt-3">
        {step === 1 && (
          <div className="flex flex-col gap-1">
            {!(aiMode && ai.status === "done") && (
              <Button block onClick={next} disabled={f.photos.length === 0 || ai.status === "scanning"}>
                {ai.status === "scanning" ? "מזהים…" : "המשך"}
              </Button>
            )}
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

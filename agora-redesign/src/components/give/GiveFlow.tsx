import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  ArrowRight, Baby, BookOpen, Box, Camera, Car, Check, HandHeart, ImagePlus, Loader2, LocateFixed, MapPin, Package, Pencil, Plug, Shirt,
  Sofa, Sparkles, Star, Truck, Volleyball, X,
} from "lucide-react"
import { errorCode, recognize, visionAvailable } from "../../data/ai"
import { coverDataUrl } from "../../data/image"
import { categories, conditions } from "../../data/meta"
import { locateErrorCopy, type LocateError } from "../../data/location"
import type { Condition } from "../../data/types"
import { useNav } from "../../nav"
import AiPanel, { ScanOverlay, type AiState } from "./AiPanel"
import Illustration from "../ui/Illustration"
import Button from "../ui/Button"
import Chip from "../ui/Chip"
import Sheet from "../ui/Sheet"
import Field, { inputCls } from "../ui/Field"
import TownSheet from "../location/TownSheet"
import OptionCard from "../ui/OptionCard"

type Photo = { url: string; file: File }
type Size = "" | "small" | "medium" | "large"
type Form = {
  photos: Photo[]
  title: string
  category: string
  sub: string
  condition: Condition
  description: string
  town: string
  townSource: "" | "gps" | "manual"
  size: Size
  times: string[]
  stairs: boolean
}
type AiField = "title" | "category" | "condition" | "description"
type Step = 1 | 2 | 3 | 4 | 5

const emptyForm: Form = { photos: [], title: "", category: "", sub: "", condition: "מצב טוב", description: "", town: "", townSource: "", size: "", times: [], stairs: false }

const steps = ["תמונות", "פרטי החפץ", "איסוף", "בדיקה ופרסום"] as const

const categoryIcon: Record<string, typeof Sofa> = {
  "ריהוט וכלי בית": Sofa,
  "מוצרי חשמל": Plug,
  "לתינוק ולילד": Baby,
  "ספרים ומדיה": BookOpen,
  "בגדים ואופנה": Shirt,
  "תחביבים וספורט": Volleyball,
  "סיוע חברתי": HandHeart,
  "שונות": Box,
}

const conditionNote: Record<Condition, string> = {
  "כמו חדש": "כמעט בלי סימני שימוש",
  "מצב טוב": "משומש ותקין לגמרי",
  "מעט פגום": "יש פגם קטן, עדיין שמיש",
  "לחומר גלם": "לתיקון, לחלקים או ליצירה",
}

const sizes: { id: Exclude<Size, "">; label: string; note: string; icon: typeof Package }[] = [
  { id: "small", label: "קטן", note: "נכנס לתיק או לידיים", icon: Package },
  { id: "medium", label: "בינוני", note: "צריך רכב", icon: Car },
  { id: "large", label: "גדול", note: "צריך הובלה או שני אנשים", icon: Truck },
]
const pickupTimes = ["בוקר", "צהריים", "ערב", "בתיאום"]

const aiBadge = (
  <span className="inline-flex items-center gap-1 rounded-full bg-lavender px-2 py-0.5 text-[11px] font-semibold text-blue-ink">
    <Sparkles size={11} aria-hidden="true" />
    מולא אוטומטית
  </span>
)

function Section({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h3 className="text-[16px] font-bold">{title}</h3>
          {hint && <p className="text-[13px] text-ink-2">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function GiveFlow() {
  const nav = useNav()
  const resumed = useRef(!!nav.draft)
  const [step, setStep] = useState<Step>(() => (nav.draft as { step?: Step } | null)?.step ?? 1)
  const [f, setF] = useState<Form>(() => (nav.draft as { form?: Form } | null)?.form ?? emptyForm)
  const [errors, setErrors] = useState<Partial<Record<"title" | "category" | "town", string>>>({})
  const [aiMode, setAiMode] = useState(true)
  const [aiOffered, setAiOffered] = useState(true)
  const [ai, setAi] = useState<AiState>({ status: "idle" })
  const [aiFields, setAiFields] = useState<Set<AiField>>(() => new Set((nav.draft as { aiFields?: AiField[] } | null)?.aiFields ?? []))
  const [townSheet, setTownSheet] = useState(false)
  const [locError, setLocError] = useState<LocateError | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const ctl = useRef<AbortController | null>(null)
  const autoLocated = useRef(false)
  const scroller = useRef<HTMLDivElement>(null)

  const up = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }))
  /** Editing a field by hand removes its "filled automatically" badge. */
  const edit = (field: AiField, p: Partial<Form>) => {
    up(p)
    setAiFields((s) => (s.has(field) ? new Set([...s].filter((x) => x !== field)) : s))
  }
  const dirty = f.photos.length > 0 || f.title.trim() !== "" || f.category !== "" || f.description.trim() !== ""

  // Offer automatic recognition only where it can actually run
  useEffect(() => {
    let alive = true
    visionAvailable().then((ok) => {
      if (!alive || ok) return
      setAiOffered(false)
      setAiMode(false)
    })
    return () => {
      alive = false
      ctl.current?.abort()
    }
  }, [])

  // Scroll to top on every step change
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [step])

  // Pickup step: fill the town from the viewer's area, or ask the device once
  useEffect(() => {
    if (step !== 3 || f.town || autoLocated.current) return
    autoLocated.current = true
    if (nav.location) {
      up({ town: nav.location.town, townSource: nav.location.source === "gps" ? "gps" : "manual" })
      return
    }
    nav.locate().then((res) => {
      if (res.ok) up({ town: res.town, townSource: "gps" })
      else setLocError(res.error)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const runAi = (photos: Photo[], fresh = false) => {
    if (!photos.length) return
    ctl.current?.abort()
    const c = new AbortController()
    ctl.current = c
    setAi({ status: "scanning" })
    recognize(
      photos.map((p) => p.file),
      c.signal,
      fresh,
    ).then(
      (result) => {
        if (ctl.current === c) setAi({ status: "done", result })
      },
      (e) => {
        if (ctl.current !== c) return // a newer run (or a cancel) owns the state now
        const code = errorCode(e)
        if (code === "cancelled") return setAi({ status: "idle" })
        setAi({ status: "error", error: code })
        if (code === "unavailable" || code === "not_granted") setAiOffered(false)
      },
    )
  }

  const cancelAi = () => {
    ctl.current?.abort()
    ctl.current = null
    setAi({ status: "idle" })
  }

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return
    const images = [...files].filter((file) => !file.type || file.type.startsWith("image/"))
    if (images.length < files.length) nav.toast("אפשר להעלות רק תמונות")
    const room = 6 - f.photos.length
    if (images.length > room) nav.toast("אפשר עד 6 תמונות")
    const added = images.slice(0, room).map((file) => ({ url: URL.createObjectURL(file), file }))
    if (!added.length) return
    const photos = [...f.photos, ...added]
    up({ photos })
    if (aiMode && f.photos.length === 0) runAi(photos)
  }

  const removePhoto = (i: number) => {
    const photos = f.photos.filter((_, k) => k !== i)
    up({ photos })
    if (i === 0) {
      cancelAi()
      if (aiMode && photos.length) runAi(photos)
    }
  }

  const makeCover = (i: number) => {
    if (i === 0) return
    const photos = [f.photos[i], ...f.photos.filter((_, k) => k !== i)]
    up({ photos })
  }

  const applyAi = (go: 2 | 3) => {
    if (ai.status !== "done" || !ai.result.isItem) return
    const r = ai.result
    up({ title: r.title, category: r.category, sub: r.sub, condition: r.condition, description: r.description || f.description })
    setAiFields(new Set<AiField>(["title", "category", "condition", ...(r.description ? (["description"] as AiField[]) : [])]))
    setErrors({})
    setStep(go)
  }

  const validate = (s: Step) => {
    const e: typeof errors = {}
    if (s === 2) {
      if (f.title.trim().length < 2) e.title = "כתבו מה מוסרים, למשל: ספה תלת מושבית"
      if (!f.category) e.category = "בחרו קטגוריה כדי שיוכלו למצוא את החפץ"
    }
    if (s === 3 && !f.town) e.town = "בחרו מאיזה ישוב האיסוף"
    setErrors(e)
    const first = Object.keys(e)[0]
    if (first) document.getElementById(`give-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    return !first
  }

  const next = () => {
    if (step >= 2 && step <= 3 && !validate(step)) return
    setStep((s) => Math.min(4, s + 1) as Step)
  }
  const goBack = () => {
    if (step === 1) return dirty ? setLeaving(true) : nav.back()
    setStep((s) => (s - 1) as Step)
  }

  const doPublish = async () => {
    setPublishing(true)
    const photo = f.photos[0] ? await coverDataUrl(f.photos[0].file) : ""
    nav.publishItem({
      id: `mine-${Date.now()}`,
      title: f.title.trim(),
      city: f.town,
      region: "",
      posted: "עכשיו",
      condition: f.condition,
      category: f.category,
      sub: f.sub,
      description: f.description.trim(),
      photo,
      giver: "",
      url: "",
      size: sizes.find((x) => x.id === f.size)?.label,
      times: f.times,
      stairs: f.stairs,
    })
    setPublishing(false)
    nav.setDraft(null)
    setStep(5)
  }

  // Sign-in is asked for only here, at the moment of publishing, and publishing continues right after
  const publish = () => {
    if (!validate(2) || !validate(3)) return
    nav.requireAuth("התחברו כדי לפרסם את החפץ", doPublish)
  }

  const restart = () => {
    cancelAi()
    setF({ ...emptyForm, town: f.town, townSource: f.townSource })
    setAiFields(new Set())
    setErrors({})
    setStep(1)
  }

  // ── Success ─────────────────────────────────────────────
  if (step === 5) {
    return (
      <div className="screen-in flex h-full flex-col bg-white px-5 pb-6 pt-14">
        <div className="flex flex-1 flex-col items-center gap-3 text-center">
          <Illustration name="published" size={190} />
          <h1 className="text-[26px] font-bold">החפץ פורסם</h1>
          <p className="max-w-[300px] text-[15px] text-ink-2">
            "{f.title}" מופיע עכשיו בלוח, באזור {f.town}. מי שהפעיל התראה על {f.sub || f.category} יקבל הודעה.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button block onClick={restart}>
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

  const catSubs = categories.find((c) => c.label === f.category)?.subs ?? []

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header: back/close, step name, 4-part progress */}
      <header className="pt-safe relative z-10 bg-white px-4 pb-3 shadow-header">
        <div className="flex items-center gap-2">
          <button type="button" onClick={goBack} aria-label={step === 1 ? "סגירה" : "חזרה לשלב הקודם"} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-lavender">
            {step === 1 ? <X size={22} /> : <ArrowRight size={22} />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-ink-2">שלב {step} מתוך 4</p>
            <h1 className="truncate text-[18px] font-bold leading-tight">{steps[step - 1]}</h1>
          </div>
        </div>
        <ol className="mt-3 grid grid-cols-4 gap-1.5" aria-label="התקדמות">
          {steps.map((s, i) => (
            <li key={s} aria-current={i + 1 === step ? "step" : undefined} className={`h-1.5 rounded-full transition-colors duration-200 ${i + 1 <= step ? "bg-blue" : "bg-line"}`}>
              <span className="sr-only">
                {s}
                {i + 1 < step ? ", הושלם" : ""}
              </span>
            </li>
          ))}
        </ol>
      </header>

      <div ref={scroller} key={step} className="screen-in no-scrollbar flex-1 overflow-y-auto px-5 pb-8 pt-5">
        {resumed.current && step <= 2 && dirty && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-lavender px-4 py-3 text-[14px]">
            <span className="flex-1">ממשיכים מהטיוטה ששמרתם.</span>
            <button
              type="button"
              onClick={() => {
                resumed.current = false
                nav.setDraft(null)
                restart()
              }}
              className="min-h-10 font-semibold text-blue-ink underline underline-offset-4"
            >
              להתחיל מחדש
            </button>
          </div>
        )}

        {/* ── Step 1: photos ─────────────────────────────── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-[24px] font-bold leading-tight">צלמו את החפץ</h2>
              <p className="mt-1 text-[15px] text-ink-2">{aiMode ? "נזהה מה בתמונה ונמלא את פרטי המודעה בשבילכם." : "מודעה עם תמונה נמסרת הרבה יותר מהר. עד 6 תמונות."}</p>
            </div>

            {aiOffered && (
              <div role="radiogroup" aria-label="אופן מילוי הפרטים" className="grid grid-cols-2 gap-1 rounded-2xl bg-lavender p-1">
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
                      if (!m.on) cancelAi()
                      else if (f.photos.length && ai.status !== "done") runAi(f.photos)
                    }}
                    className={`flex h-11 items-center justify-center gap-1.5 rounded-xl text-[14px] font-semibold transition-colors ${aiMode === m.on ? "bg-white text-ink shadow-sm" : "text-ink-2"}`}
                  >
                    <span className={aiMode === m.on && m.on ? "text-blue" : ""} aria-hidden="true">
                      {m.icon}
                    </span>
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = "" // allow picking the same file again
            }} />

            {f.photos.length === 0 ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-lavender-2 bg-white px-4 py-6 text-blue-ink transition-colors hover:border-blue"
              >
                <Illustration name="photo" size={140} />
                <span className="text-[16px] font-semibold">הוספת תמונות</span>
                <span className="text-[13px] text-ink-2">מהמצלמה או מהגלריה</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {f.photos.map((p, i) => (
                  <div key={p.url} className={`relative overflow-hidden rounded-2xl bg-photo ${i === 0 ? "col-span-3 aspect-[4/3]" : "aspect-square"}`}>
                    <img src={p.url} alt={i === 0 ? "התמונה הראשית" : `תמונה ${i + 1}`} className="h-full w-full object-cover" />
                    {i === 0 ? (
                      <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[12px] font-bold">
                        <Star size={11} fill="currentColor" aria-hidden="true" />
                        תמונה ראשית
                      </span>
                    ) : (
                      <button type="button" onClick={() => makeCover(i)} className="absolute bottom-1.5 right-1.5 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold">
                        לראשית
                      </button>
                    )}
                    <button type="button" onClick={() => removePhoto(i)} aria-label={`הסרת ${i === 0 ? "התמונה הראשית" : `תמונה ${i + 1}`}`} className="absolute left-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-ink/70 text-white">
                      <X size={16} />
                    </button>
                    {i === 0 && ai.status === "scanning" && <ScanOverlay onCancel={cancelAi} />}
                  </div>
                ))}
                {f.photos.length < 6 && (
                  <button type="button" onClick={() => fileRef.current?.click()} aria-label="הוספת תמונה" className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-lavender-2 text-blue hover:border-blue">
                    <ImagePlus size={22} aria-hidden="true" />
                    <span className="text-[12px] font-medium text-ink-2">{f.photos.length}/6</span>
                  </button>
                )}
              </div>
            )}

            {aiMode && (
              <AiPanel
                state={ai}
                onAccept={() => applyAi(3)}
                onEdit={() => applyAi(2)}
                onRetry={() => runAi(f.photos, true)}
                onManual={() => {
                  setAiMode(false)
                  cancelAi()
                  setStep(2)
                }}
              />
            )}
            {f.photos.length === 0 && <p className="text-center text-[13px] text-ink-2">טיפ: צלמו באור יום, כשהחפץ במרכז ועל רקע נקי.</p>}
          </div>
        )}

        {/* ── Step 2: details ────────────────────────────── */}
        {step === 2 && (
          <div className="flex flex-col gap-7">
            {aiFields.size > 0 && (
              <p className="flex items-center gap-2 rounded-2xl bg-lavender px-4 py-3 text-[14px] text-ink-2">
                <Sparkles size={16} className="shrink-0 text-blue" aria-hidden="true" />
                מילאנו לפי התמונה. עברו על הפרטים ותקנו מה שצריך.
              </p>
            )}
            <div id="give-title">
              <Field label="איך נקרא החפץ?" htmlFor="title" error={errors.title} hint="2 עד 5 מילים, כמו שהייתם מחפשים אותו." action={aiFields.has("title") ? aiBadge : undefined}>
                <input
                  id="title"
                  name="title"
                  autoComplete="off"
                  enterKeyHint="next"
                  value={f.title}
                  maxLength={60}
                  onChange={(e) => {
                    edit("title", { title: e.target.value })
                    if (errors.title) setErrors((x) => ({ ...x, title: undefined }))
                  }}
                  placeholder="למשל: שידת מגירות מעץ…"
                  aria-invalid={!!errors.title}
                  className={`${inputCls} text-[16px]`}
                />
              </Field>
            </div>

            <div id="give-category">
              <Section title="קטגוריה" action={aiFields.has("category") ? aiBadge : undefined}>
                <div role="radiogroup" aria-label="קטגוריה" className="grid grid-cols-2 gap-2">
                  {categories.map((c) => {
                    const Icon = categoryIcon[c.label] ?? Box
                    const on = f.category === c.label
                    return (
                      <button
                        key={c.label}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          edit("category", { category: c.label, sub: on ? f.sub : "" })
                          setErrors((x) => ({ ...x, category: undefined }))
                        }}
                        className={`flex min-h-14 items-center gap-2.5 rounded-2xl px-3 text-right text-[14px] font-semibold transition-[background-color,box-shadow] duration-150 active:scale-[0.98] ${
                          on ? "bg-lavender ring-2 ring-inset ring-blue" : "ring-1 ring-inset ring-line hover:ring-ink/25"
                        }`}
                      >
                        <Icon size={20} className={on ? "text-blue" : "text-ink-2"} aria-hidden="true" />
                        <span className="leading-tight">{c.label}</span>
                      </button>
                    )
                  })}
                </div>
                {errors.category && <p role="alert" className="text-[13px] font-medium text-[#c2410c]">{errors.category}</p>}
                {catSubs.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[13px] font-medium text-ink-2">סוג (לא חובה)</p>
                    <div className="flex flex-wrap gap-2">
                      {catSubs.map((s) => (
                        <Chip key={s} selected={f.sub === s} onClick={() => up({ sub: f.sub === s ? "" : s })}>
                          {s}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            </div>

            <Section title="מה המצב?" action={aiFields.has("condition") ? aiBadge : undefined}>
              <div role="radiogroup" aria-label="מצב החפץ" className="flex flex-col gap-2">
                {conditions.map((c) => (
                  <OptionCard key={c} selected={f.condition === c} onClick={() => edit("condition", { condition: c })} title={c} note={conditionNote[c]} />
                ))}
              </div>
            </Section>

            <Field
              label="תיאור"
              htmlFor="desc"
              hint={`מידות, פגמים או למה מוסרים. לא חובה. ${f.description.length}/400`}
              action={aiFields.has("description") ? aiBadge : undefined}
            >
              <textarea
                id="desc"
                name="description"
                rows={4}
                maxLength={400}
                value={f.description}
                onChange={(e) => edit("description", { description: e.target.value })}
                placeholder="למשל: 120 על 54, מעט שריטות בצד…"
                className={`${inputCls} resize-none`}
              />
            </Field>
          </div>
        )}

        {/* ── Step 3: pickup ─────────────────────────────── */}
        {step === 3 && (
          <div className="flex flex-col gap-7">
            <div id="give-town">
              <Section title="מאיפה האיסוף?" hint="רק שם הישוב מוצג במודעה. את הכתובת שולחים בהודעה, אחרי שמאשרים מקבל.">
                {f.town ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-lavender p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue text-white">
                      <MapPin size={20} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px] font-bold">{f.town}</p>
                      <p className="flex items-center gap-1 text-[13px] text-ink-2">
                        {f.townSource === "gps" ? (
                          <>
                            <Sparkles size={12} className="text-blue" aria-hidden="true" />
                            זוהה לפי המיקום שלכם
                          </>
                        ) : (
                          "נבחר ידנית"
                        )}
                      </p>
                    </div>
                    <Button size="md" variant="outline" onClick={() => setTownSheet(true)}>
                      שינוי
                    </Button>
                  </div>
                ) : nav.locating ? (
                  <div className="flex min-h-[76px] items-center gap-3 rounded-2xl bg-lavender p-4 text-[15px] font-medium" role="status">
                    <Loader2 size={20} className="animate-spin text-blue" aria-hidden="true" />
                    מזהים את המיקום שלכם…
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {locError && <p className="text-[14px] text-ink-2">{locateErrorCopy[locError]}</p>}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="soft"
                        icon={<LocateFixed size={18} />}
                        onClick={async () => {
                          setLocError(null)
                          const res = await nav.locate()
                          if (res.ok) up({ town: res.town, townSource: "gps" })
                          else setLocError(res.error)
                        }}
                      >
                        המיקום שלי
                      </Button>
                      <Button variant="outline" icon={<MapPin size={18} />} onClick={() => setTownSheet(true)}>
                        בחירת עיר
                      </Button>
                    </div>
                  </div>
                )}
                {errors.town && <p role="alert" className="text-[13px] font-medium text-[#c2410c]">{errors.town}</p>}
              </Section>
            </div>

            <Section title="כמה גדול החפץ?" hint="עוזר למקבלים לדעת איך להגיע.">
              <div role="radiogroup" aria-label="גודל החפץ" className="flex flex-col gap-2">
                {sizes.map((s) => (
                  <OptionCard key={s.id} selected={f.size === s.id} onClick={() => up({ size: f.size === s.id ? "" : s.id })} title={s.label} note={s.note} icon={<s.icon size={20} />} />
                ))}
              </div>
            </Section>

            <Section title="מתי נוח לאסוף?" hint="אפשר לבחור כמה.">
              <div className="flex flex-wrap gap-2">
                {pickupTimes.map((t) => (
                  <Chip key={t} selected={f.times.includes(t)} onClick={() => up({ times: f.times.includes(t) ? f.times.filter((x) => x !== t) : [...f.times, t] })}>
                    {t}
                  </Chip>
                ))}
              </div>
            </Section>

            <button
              type="button"
              role="switch"
              aria-checked={f.stairs}
              onClick={() => up({ stairs: !f.stairs })}
              className="flex min-h-14 items-center gap-3 rounded-2xl px-4 text-right ring-1 ring-inset ring-line"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">יש מדרגות בלי מעלית</span>
                <span className="block text-[13px] text-ink-2">כדאי לדעת לפני שמגיעים עם חפץ כבד</span>
              </span>
              <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${f.stairs ? "bg-blue" : "bg-line"}`} aria-hidden="true">
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[right] duration-150 ${f.stairs ? "right-6" : "right-1"}`} />
              </span>
            </button>
          </div>
        )}

        {/* ── Step 4: review ─────────────────────────────── */}
        {step === 4 && (
          <div className="flex flex-col gap-6">
            <p className="text-[15px] text-ink-2">ככה המודעה תיראה בלוח. אפשר לערוך כל חלק לפני הפרסום.</p>
            <article className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-inset ring-line">
              <div className="aspect-[4/3] bg-photo">
                {f.photos[0] ? (
                  <img src={f.photos[0].url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-[14px] text-ink-2">
                    <Camera size={26} aria-hidden="true" />
                    בלי תמונה
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 p-4">
                <p className="text-[19px] font-bold leading-tight">{f.title}</p>
                <p className="flex items-center gap-1 text-[14px] text-ink-2">
                  <MapPin size={14} aria-hidden="true" />
                  {f.town}
                </p>
                <p className="text-[14px] text-ink-2">{f.condition}</p>
              </div>
            </article>

            {[
              {
                title: "פרטי החפץ",
                go: 2 as Step,
                rows: [
                  ["שם", f.title],
                  ["קטגוריה", f.sub ? `${f.category} › ${f.sub}` : f.category],
                  ["מצב", f.condition],
                  ["תיאור", f.description || "בלי תיאור"],
                ],
              },
              {
                title: "איסוף",
                go: 3 as Step,
                rows: [
                  ["ישוב", f.town],
                  ["גודל", sizes.find((s) => s.id === f.size)?.label ?? "לא צוין"],
                  ["זמנים", f.times.length ? f.times.join(", ") : "לא צוין"],
                  ["מדרגות", f.stairs ? "יש מדרגות בלי מעלית" : "לא צוין"],
                ],
              },
              { title: "תמונות", go: 1 as Step, rows: [["מספר", f.photos.length ? `${f.photos.length} תמונות` : "בלי תמונה"]] },
            ].map((g) => (
              <section key={g.title} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-bold">{g.title}</h3>
                  <button type="button" onClick={() => setStep(g.go)} className="min-h-10 px-1 text-[14px] font-semibold text-blue-ink underline underline-offset-4">
                    עריכה
                  </button>
                </div>
                <dl className="grid grid-cols-[72px_1fr] gap-x-3 gap-y-2 rounded-2xl bg-lavender p-4 text-[14px]">
                  {g.rows.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-ink-2">{k}</dt>
                      <dd className="min-w-0 break-words font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}

            <p className="text-center text-[13px] text-ink-2">
              בפרסום אני מאשר/ת את{" "}
              <button type="button" onClick={() => nav.push({ name: "rules" })} className="font-semibold text-blue-ink underline underline-offset-2">
                כללי הקהילה
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Sticky action bar: one clear next step */}
      {!(step === 1 && aiMode && (ai.status === "done" || ai.status === "error")) && (
        <div className="relative z-10 bg-white px-5 pb-[max(env(safe-area-inset-bottom),14px)] pt-3 shadow-bar">
          {step === 1 && (
            <div className="flex flex-col gap-1">
              <Button block onClick={next} disabled={f.photos.length === 0 || ai.status === "scanning"}>
                {ai.status === "scanning" ? "מזהים…" : "המשך לפרטי החפץ"}
              </Button>
              {f.photos.length === 0 && (
                <button type="button" onClick={() => setStep(2)} className="min-h-10 text-[14px] font-medium text-ink-2 underline underline-offset-4">
                  דילוג, אוסיף תמונה אחר כך
                </button>
              )}
            </div>
          )}
          {step === 2 && (
            <Button block onClick={next}>
              המשך לאיסוף
            </Button>
          )}
          {step === 3 && (
            <Button block onClick={next} disabled={nav.locating}>
              לבדיקה ופרסום
            </Button>
          )}
          {step === 4 && (
            <Button block onClick={publish} disabled={publishing} icon={publishing ? <Loader2 size={18} className="animate-spin" /> : undefined}>
              {publishing ? "מפרסמים…" : "פרסום בלוח"}
            </Button>
          )}
        </div>
      )}

      {townSheet && (
        <TownSheet
          title="מאיפה האיסוף?"
          current={f.town}
          onClose={() => setTownSheet(false)}
          onPick={(town, source) => {
            up({ town, townSource: source })
            setErrors((x) => ({ ...x, town: undefined }))
            setLocError(null)
            setTownSheet(false)
          }}
        />
      )}

      {leaving && (
        <Sheet title="לצאת מהמסירה?" onClose={() => setLeaving(false)}>
          <div className="flex flex-col gap-3">
            <p className="text-[15px] text-ink-2">אפשר לשמור את מה שמילאתם ולהמשיך בפעם הבאה שתלחצו "למסור".</p>
            <Button
              block
              onClick={() => {
                cancelAi()
                nav.setDraft({ step, form: f, aiFields: [...aiFields] })
                nav.toast("נשמר כטיוטה")
                nav.back()
              }}
            >
              שמירה כטיוטה ויציאה
            </Button>
            <Button block variant="outline" onClick={() => setLeaving(false)}>
              להמשיך למלא
            </Button>
            <Button
              block
              variant="ghost"
              onClick={() => {
                cancelAi()
                nav.setDraft(null)
                nav.back()
              }}
            >
              יציאה בלי לשמור
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  )
}

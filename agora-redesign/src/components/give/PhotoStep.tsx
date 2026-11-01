import { useEffect, useState } from "react"
import { Camera, ImagePlus, Plus, Sparkles, Star, X } from "lucide-react"
import Button from "../ui/Button"
import type { GiveForm } from "./GiveFlow"

const MAX = 6
const aiSuggestion = { title: "שידת עץ עם 4 מגירות", category: "ריהוט וכלי בית", condition: "כמו חדש" as const }

export default function PhotoStep({ form, update, onNext }: { form: GiveForm; update: (p: Partial<GiveForm>) => void; onNext: () => void }) {
  const [detecting, setDetecting] = useState(false)
  const count = form.photoCount

  // Simulate AI recognition on the first photo.
  useEffect(() => {
    if (count !== 1) return
    setDetecting(true)
    const t = setTimeout(() => {
      setDetecting(false)
      update({ title: form.title || aiSuggestion.title, category: form.category || aiSuggestion.category, condition: aiSuggestion.condition })
    }, 1400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  const addPhoto = () => count < MAX && update({ photoCount: count + 1 })
  const removePhoto = () => update({ photoCount: Math.max(0, count - 1) })

  return (
    <div className="flex flex-1 flex-col px-5 py-5">
      <h1 className="font-display text-[26px] font-bold text-deep">צלמו את החפץ</h1>
      <p className="mt-1.5 text-[15px] text-ink-soft">תמונה טובה מקצרת את הדרך למישהו שצריך את זה</p>

      {count === 0 ? (
        <div className="mt-6 flex flex-1 flex-col">
          <button
            type="button"
            onClick={addPhoto}
            className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed border-line-strong bg-paper py-14 text-mute transition-colors hover:border-brand hover:text-brand-strong"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand-strong">
              <Camera size={30} />
            </span>
            <p className="max-w-[240px] text-[14px]">אפשר להוסיף עד 6 תמונות. הראשונה היא זו שתוצג בחיפוש.</p>
          </button>
          <div className="mt-4 flex flex-col gap-3">
            <Button block icon={<Camera size={20} />} onClick={addPhoto}>
              פתיחת מצלמה
            </Button>
            <Button block variant="secondary" icon={<ImagePlus size={20} />} onClick={addPhoto}>
              בחירה מהגלריה
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-1 flex-col">
          {detecting && (
            <div className="mb-4 flex items-center gap-2 rounded-[16px] bg-brand-tint px-3.5 py-2.5 text-[14px] font-medium text-brand-ink">
              <Sparkles size={16} className="animate-pulse" />
              מזהים מה יש בתמונה...
            </div>
          )}
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[20px] bg-fill-2 text-mute">
                <ImagePlus size={22} strokeWidth={1.75} />
                {i === 0 && (
                  <span className="absolute bottom-1 right-1 inline-flex items-center gap-1 rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-paper">
                    <Star size={10} fill="currentColor" />
                    ראשית
                  </span>
                )}
                {i === count - 1 && (
                  <button type="button" onClick={removePhoto} aria-label="הסרת תמונה" className="absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-deep/70 text-paper">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            {count < MAX && (
              <button type="button" onClick={addPhoto} aria-label="הוספת תמונה" className="flex aspect-square items-center justify-center rounded-[20px] border-2 border-dashed border-line-strong bg-paper text-mute hover:border-brand hover:text-brand-strong">
                <Plus size={26} />
              </button>
            )}
          </div>
          <p className="mt-3 text-[13px] text-mute">התמונה הראשונה מוצגת בחיפוש.</p>
        </div>
      )}

      {count > 0 && (
        <div className="sticky bottom-0 mt-6 bg-ground pt-2 pb-4">
          <Button block onClick={onNext} disabled={detecting}>
            {detecting ? "רק רגע..." : "להמשך"}
          </Button>
        </div>
      )}
    </div>
  )
}

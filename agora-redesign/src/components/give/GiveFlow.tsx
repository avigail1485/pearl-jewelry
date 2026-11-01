import { useState } from "react"
import { ArrowRight, X, HandHeart } from "lucide-react"
import type { Condition, OpenRequest } from "../../data/mock"
import { useNav } from "../../nav"
import PhotoStep from "./PhotoStep"
import DetailsStep from "./DetailsStep"
import ConfirmStep from "./ConfirmStep"
import SuccessScreen from "./SuccessScreen"

export type GiveForm = {
  photoCount: number
  title: string
  category: string
  area: string
  condition: Condition
  description: string
}

const emptyForm: GiveForm = { photoCount: 0, title: "", category: "", area: "רמת גן", condition: "במצב טוב", description: "" }

type Step = "photo" | "details" | "confirm" | "success"

export default function GiveFlow({ forRequest }: { forRequest?: OpenRequest }) {
  const nav = useNav()
  const [step, setStep] = useState<Step>("photo")
  const [form, setForm] = useState<GiveForm>(() => (forRequest ? { ...emptyForm, title: forRequest.title } : emptyForm))
  const update = (patch: Partial<GiveForm>) => setForm((f) => ({ ...f, ...patch }))
  const stepIndex = step === "photo" ? 1 : step === "details" ? 2 : 3

  const goBack = () => {
    if (step === "photo") return nav.back()
    if (step === "details") return setStep("photo")
    if (step === "confirm") return setStep("details")
    nav.back()
  }

  if (step === "success") {
    return (
      <SuccessScreen
        form={form}
        onGiveMore={() => {
          setForm(emptyForm)
          setStep("photo")
        }}
        onHome={() => nav.reset()}
        onMyItems={() => {
          nav.reset()
          nav.push({ name: "myitems" })
        }}
      />
    )
  }

  return (
    <div className="flex h-full flex-col bg-ground">
      <div className="safe-top flex items-center gap-3 px-5 pb-4">
        <button
          type="button"
          onClick={goBack}
          aria-label={step === "photo" ? "סגירה" : "חזרה"}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-paper text-deep hover:text-brand-strong"
          style={{ boxShadow: "var(--shadow-raised)" }}
        >
          {step === "photo" ? <X size={22} /> : <ArrowRight size={22} />}
        </button>
        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-[13px] font-medium text-mute">שלב {stepIndex} מתוך 3</span>
          <div className="flex gap-1" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= stepIndex ? "bg-brand" : "bg-line"}`} />
            ))}
          </div>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        שלב {stepIndex} מתוך 3
      </p>

      {forRequest && step === "photo" && (
        <div className="mx-5 mb-1 flex items-center gap-2 rounded-[16px] bg-accent-tint px-4 py-3 text-[14px] text-accent-ink">
          <HandHeart size={18} className="shrink-0" />
          <span>
            מוסרים ל{forRequest.person}: <b>{forRequest.title}</b>
          </span>
        </div>
      )}

      <div key={step} className="screen-in flex flex-1 flex-col overflow-y-auto">
        {step === "photo" && <PhotoStep form={form} update={update} onNext={() => setStep("details")} />}
        {step === "details" && <DetailsStep form={form} update={update} onNext={() => setStep("confirm")} />}
        {step === "confirm" && <ConfirmStep form={form} onPublish={() => setStep("success")} />}
      </div>
    </div>
  )
}

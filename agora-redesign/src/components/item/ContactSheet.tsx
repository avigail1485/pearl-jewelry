import { useState } from "react"
import { ArrowRight, CheckCircle2, Send, ShieldCheck } from "lucide-react"
import type { Item } from "../../data/types"
import { useNav } from "../../nav"
import Sheet from "../ui/Sheet"
import Button from "../ui/Button"
import Chip from "../ui/Chip"
import { inputCls } from "../ui/Field"

type Step = "message" | "phone" | "code" | "done"
const quick = ["מתי אפשר לאסוף?", "עדיין רלוונטי?", "אפשר היום בערב?"]
const titles: Record<Step, string> = { message: "הודעה למוסר", phone: "אימות חד-פעמי", code: "קוד אימות", done: "ההודעה נשלחה" }

export default function ContactSheet({ item, onClose }: { item: Item; onClose: () => void }) {
  const nav = useNav()
  const [step, setStep] = useState<Step>("message")
  const [msg, setMsg] = useState(`שלום ${item.giver}, ראיתי את "${item.title}" באגורה ואשמח לקבל. מתי נוח לתאם איסוף?`)
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const backLink = (to: Step, label: string) => (
    <button type="button" onClick={() => setStep(to)} className="mb-4 flex items-center gap-1 text-[14px] font-medium text-ink-2 hover:text-ink">
      <ArrowRight size={16} />
      {label}
    </button>
  )

  return (
    <Sheet title={titles[step]} onClose={onClose}>
      {step === "message" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-lavender p-2.5">
            <img src={item.photo} alt="" className="h-14 w-14 rounded-xl object-cover" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">{item.title}</p>
              <p className="text-[13px] text-mute">
                {item.city} · {item.condition}
              </p>
            </div>
          </div>
          <textarea aria-label="ההודעה" value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} className={`${inputCls} resize-none`} />
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {quick.map((q) => (
              <Chip key={q} onClick={() => setMsg((m) => `${m.trim()} ${q}`)}>
                + {q}
              </Chip>
            ))}
          </div>
          <Button block icon={<Send size={18} />} disabled={!msg.trim()} onClick={() => setStep("phone")}>
            שליחה
          </Button>
          <p className="text-center text-[12px] text-mute">ההודעה נשלחת בתוך האפליקציה. בלי שיחות בתשלום.</p>
        </div>
      )}
      {step === "phone" && (
        <div className="flex flex-col gap-4">
          {backLink("message", "חזרה להודעה")}
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lavender text-blue">
            <ShieldCheck size={26} />
          </span>
          <p className="text-center text-[14px] text-ink-2">אימות חד-פעמי שומר על הקהילה בטוחה. המספר לא מוצג לאף אחד.</p>
          <input type="tel" inputMode="tel" dir="ltr" aria-label="מספר טלפון" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-000-0000" className={`${inputCls} text-center text-[18px]`} />
          <Button block disabled={phone.replace(/\D/g, "").length < 9} onClick={() => setStep("code")}>
            שליחת קוד ב-SMS
          </Button>
        </div>
      )}
      {step === "code" && (
        <div className="flex flex-col gap-4">
          {backLink("phone", "שינוי מספר")}
          <p className="text-center text-[14px] text-ink-2">
            שלחנו קוד בן 4 ספרות אל <span dir="ltr">{phone}</span>
          </p>
          <input inputMode="numeric" dir="ltr" maxLength={4} aria-label="קוד אימות" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="– – – –" className={`${inputCls} text-center text-[26px] tracking-[0.5em]`} />
          <Button block disabled={code.length < 4} onClick={() => setStep("done")}>
            אישור ושליחה
          </Button>
          <button type="button" onClick={() => nav.toast("שלחנו קוד חדש")} className="text-[14px] font-semibold text-blue-ink">
            לא הגיע קוד? שליחה מחדש
          </button>
        </div>
      )}
      {step === "done" && (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <CheckCircle2 size={52} className="text-blue" strokeWidth={1.5} />
          <p className="text-[15px] text-ink-2">{item.giver} יקבל התראה. כשיענה, תקבלו הודעה. אפשר להמשיך לחפש בינתיים.</p>
          <Button block className="mt-2" onClick={onClose}>
            חזרה לפריט
          </Button>
          <Button block variant="ghost" onClick={() => nav.goTab("home")}>
            לדף הראשי
          </Button>
        </div>
      )}
    </Sheet>
  )
}

import { useState } from "react"
import { Send, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react"
import Button from "../ui/Button"
import Chip from "../ui/Chip"
import Sheet from "../ui/Sheet"
import { inputCls } from "../ui/Field"
import { useNav } from "../../nav"
import { itemDetail, type FeedItem } from "../../data/mock"

type Step = "message" | "verify" | "code" | "done"
const quickAdds = ["מתי אפשר לאסוף?", "האם עדיין זמין?", "אפשר לתאם להיום?"]

export default function ContactSheet({ item, onClose }: { item: FeedItem; onClose: () => void }) {
  const nav = useNav()
  const detail = itemDetail(item)
  const [step, setStep] = useState<Step>("message")
  const [message, setMessage] = useState(`שלום ${detail.giver.name}, ראיתי את "${detail.title}" באגורה ואשמח לקבל. אפשר לתאם איסוף?`)
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")

  const titles: Record<Step, string> = { message: "הודעה למוסר", verify: "אימות קצר", code: "הזינו את הקוד", done: "ההודעה נשלחה" }

  return (
    <Sheet title={titles[step]} onClose={onClose}>
      {step === "message" && (
        <div className="flex flex-col gap-4">
          <p className="-mt-3 text-[14px] text-mute">כתבנו טיוטה. אפשר לערוך לפני השליחה. בלי שיחות בתשלום.</p>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className={`${inputCls} resize-none`} aria-label="ההודעה שתישלח" />
          <div className="flex flex-wrap gap-2">
            {quickAdds.map((q) => (
              <Chip key={q} onClick={() => setMessage((m) => `${m.trim()} ${q}`)}>
                {q}
              </Chip>
            ))}
          </div>
          <Button block icon={<Send size={18} />} onClick={() => setStep("verify")} disabled={!message.trim()}>
            שליחת הודעה
          </Button>
        </div>
      )}

      {step === "verify" && (
        <div className="flex flex-col gap-4">
          <button type="button" onClick={() => setStep("message")} className="-mt-2 flex items-center gap-1 self-start text-[14px] font-medium text-ink-soft hover:text-brand-strong">
            <ArrowRight size={16} />
            חזרה להודעה
          </button>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-brand-strong">
            <ShieldCheck size={26} />
          </span>
          <p className="text-center text-[14px] leading-relaxed text-mute">המספר לא מוצג לאף אחד. הוא רק כדי לשמור על אמון בין המוסרים למקבלים.</p>
          <input type="tel" inputMode="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-000-0000" className={`${inputCls} text-center`} aria-label="מספר טלפון" />
          <Button block onClick={() => setStep("code")} disabled={phone.replace(/\D/g, "").length < 9}>
            שליחת קוד ב־SMS
          </Button>
        </div>
      )}

      {step === "code" && (
        <div className="flex flex-col gap-4">
          <button type="button" onClick={() => setStep("verify")} className="-mt-2 flex items-center gap-1 self-start text-[14px] font-medium text-ink-soft hover:text-brand-strong">
            <ArrowRight size={16} />
            שינוי מספר
          </button>
          <p className="text-center text-[14px] text-mute">
            שלחנו קוד בן 4 ספרות אל <span dir="ltr">{phone}</span>
          </p>
          <input inputMode="numeric" dir="ltr" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="––––" className={`${inputCls} text-center text-[24px] tracking-[0.5em]`} aria-label="קוד אימות" />
          <Button block onClick={() => setStep("done")} disabled={code.length < 4}>
            אישור ושליחה
          </Button>
          <button type="button" onClick={() => nav.toast("שלחנו קוד חדש")} className="text-center text-[13px] font-semibold text-accent-ink">
            לא קיבלתם? שליחה מחדש
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-paper">
            <CheckCircle2 size={30} />
          </span>
          <p className="text-[14px] leading-relaxed text-mute">{detail.giver.name} יקבל/ת התראה. כשתהיה תשובה, נעדכן אתכם. אפשר להמשיך לעיין בינתיים.</p>
          <Button block onClick={onClose}>
            חזרה לפריט
          </Button>
          <Button block variant="ghost" onClick={() => nav.reset()}>
            לדף הבית
          </Button>
        </div>
      )}
    </Sheet>
  )
}

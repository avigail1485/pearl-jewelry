import { Gift, PhoneOff, ShieldCheck, Handshake, Star } from "lucide-react"
import ScreenHeader from "../ui/ScreenHeader"

const rules = [
  { icon: Gift, title: "הכל בחינם", text: "באגורה מוסרים בלי תמורה. אין מכירה, אין מקדמות ואין דמי משלוח." },
  { icon: PhoneOff, title: "בלי מספרים בתשלום", text: "יצירת קשר נעשית בהודעה בתוך האפליקציה. לא נדרש להתקשר לשום קידומת בתשלום." },
  { icon: ShieldCheck, title: "פרטיות קודם", text: "מספר הטלפון שלכם נחשף רק אחרי שהמוסר מאשר. הכתובת המדויקת נמסרת בשיחה בלבד." },
  { icon: Handshake, title: "כבוד הדדי", text: "מתאמים בזמן, מגיעים כפי שסוכם, ומעדכנים אם משהו משתנה." },
  { icon: Star, title: "דירוג אחרי מסירה", text: "שני הצדדים מדרגים זה את זה. כך נבנה אמון בקהילה." },
]

export default function RulesScreen() {
  return (
    <div className="flex flex-col">
      <ScreenHeader title="כללי הקהילה" />
      <div className="flex flex-col gap-3 px-5 pt-1 pb-6">
        {rules.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className="flex gap-3 rounded-[20px] bg-paper p-4" style={{ boxShadow: "var(--shadow-raised)" }}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${i % 2 ? "bg-accent-tint text-accent-ink" : "bg-brand-tint text-brand-strong"}`}>
              <Icon size={20} />
            </span>
            <div>
              <h2 className="text-[16px] font-bold text-deep">{title}</h2>
              <p className="text-[14px] leading-relaxed text-ink-soft">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

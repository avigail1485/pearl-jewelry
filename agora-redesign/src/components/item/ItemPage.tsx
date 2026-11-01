import { useState } from "react"
import { ArrowRight, Flag, Heart, MapPin, MessageCircle, Share2, ShieldCheck } from "lucide-react"
import type { Item } from "../../data/types"
import { items } from "../../data/items"
import { emptyFilters, useNav } from "../../nav"
import { ItemCard, isFresh } from "./ItemCard"
import ContactSheet from "./ContactSheet"
import Sheet from "../ui/Sheet"
import Button from "../ui/Button"
import Chip from "../ui/Chip"

const reportReasons = ["מבקשים תשלום על החפץ", "החפץ כבר נמסר", "תוכן לא מתאים", "אחר"]
const conditionNote: Record<Item["condition"], string> = {
  "כמו חדש": "כמעט ללא סימני שימוש",
  "מצב טוב": "משומש ותקין",
  "מעט פגום": "יש פגם קטן, עדיין שמיש",
  "לחומר גלם": "מתאים לחלקים או לתיקון",
}

export default function ItemPage({ item }: { item: Item }) {
  const nav = useNav()
  const [contact, setContact] = useState(false)
  const [report, setReport] = useState(false)
  const [reason, setReason] = useState("")
  const saved = nav.saved.includes(item.id)
  const similar = items.filter((i) => i.category === item.category && i.id !== item.id).slice(0, 8)
  const round = "flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-[0_2px_8px_rgba(0,0,0,.15)] hover:bg-white"

  return (
    <div className="relative flex h-full flex-col bg-white">
      <div className="no-scrollbar flex-1 overflow-y-auto pb-28">
        <div className="relative bg-photo">
          <img src={item.photo} alt={item.title} className="aspect-[4/3.4] w-full object-cover" />
          <div className="pt-safe absolute inset-x-0 top-0 flex items-center justify-between px-4">
            <button type="button" onClick={nav.back} aria-label="חזרה" className={round}>
              <ArrowRight size={20} />
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="שיתוף"
                className={round}
                onClick={() => {
                  navigator.clipboard?.writeText(item.url).catch(() => {})
                  nav.toast("הקישור הועתק")
                }}
              >
                <Share2 size={18} />
              </button>
              <button type="button" aria-label={saved ? "הסרה מהשמורים" : "שמירה"} aria-pressed={saved} onClick={() => nav.toggleSaved(item)} className={round}>
                <Heart size={19} className={saved ? "text-blue" : ""} fill={saved ? "#3869FE" : "none"} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-5 pt-5">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => nav.push({ name: "results", filters: { ...emptyFilters, category: item.category, sub: item.sub || undefined } })}
              className="w-fit text-[13px] font-medium text-blue-ink"
            >
              {item.category}
              {item.sub && ` › ${item.sub}`}
            </button>
            <h1 className="text-[24px] font-bold leading-tight">{item.title}</h1>
            <p className="flex flex-wrap items-center gap-x-1.5 text-[14px] text-ink-2">
              <MapPin size={15} />
              {item.city}
              <span className="text-mute">·</span>
              פורסם {item.posted}
              {isFresh(item) && <span className="rounded-full bg-lime px-2 text-[12px] font-bold text-ink">חדש</span>}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-lavender p-4">
              <p className="text-[12px] text-mute">מצב</p>
              <p className="text-[16px] font-bold">{item.condition}</p>
              <p className="text-[12px] text-ink-2">{conditionNote[item.condition]}</p>
            </div>
            <div className="rounded-2xl bg-lavender p-4">
              <p className="text-[12px] text-mute">איסוף</p>
              <p className="text-[16px] font-bold">{item.city}</p>
              <p className="truncate text-[12px] text-ink-2">{item.region || "הכתובת נמסרת בשיחה"}</p>
            </div>
          </div>

          {item.description && (
            <section>
              <h2 className="mb-1.5 text-[17px] font-bold">על החפץ</h2>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{item.description}</p>
            </section>
          )}

          <section className="flex items-center gap-3 border-y border-line py-4">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lavender text-[18px] font-bold text-blue-ink">
              {item.giver.charAt(0)}
              <span className="absolute -bottom-0.5 -left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue text-white ring-2 ring-white">
                <ShieldCheck size={11} />
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">מוסר: {item.giver}</p>
              <p className="text-[13px] text-mute">טלפון מאומת · עונה בדרך כלל תוך שעות</p>
            </div>
          </section>

          <section className="rounded-2xl p-4 ring-1 ring-inset ring-line">
            <h2 className="mb-2 flex items-center gap-2 text-[15px] font-bold">
              <ShieldCheck size={18} className="text-blue" />
              מסירה בטוחה
            </h2>
            <ul className="flex list-disc flex-col gap-1 pr-5 text-[14px] text-ink-2 marker:text-blue">
              <li>באגורה הכל בחינם. אל תעבירו תשלום או מקדמה.</li>
              <li>המספר שלכם נחשף רק אחרי שהמוסר מאשר.</li>
              <li>מומלץ לאסוף בשעות היום ולתאם מראש.</li>
            </ul>
          </section>

          {similar.length > 0 && (
            <section className="-mx-5">
              <h2 className="mb-3 px-5 text-[17px] font-bold">עוד ב{item.category}</h2>
              <div className="no-scrollbar flex gap-3 overflow-x-auto px-5">
                {similar.map((i) => (
                  <ItemCard key={i.id} item={i} width={140} />
                ))}
              </div>
            </section>
          )}

          <button type="button" onClick={() => setReport(true)} className="mb-2 flex items-center gap-1.5 self-start text-[13px] font-medium text-mute underline underline-offset-4 hover:text-ink">
            <Flag size={14} />
            דיווח על המודעה
          </button>
        </div>
      </div>

      {/* Sticky action bar (Airbnb pattern) */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-line bg-white px-5 pb-[max(env(safe-area-inset-bottom),14px)] pt-3">
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[16px] font-bold">בחינם</p>
          <p className="truncate text-[13px] text-mute">איסוף מ{item.city}</p>
        </div>
        <Button icon={<MessageCircle size={19} />} onClick={() => setContact(true)} className="px-6">
          אני רוצה את זה
        </Button>
      </div>

      {contact && <ContactSheet item={item} onClose={() => setContact(false)} />}
      {report && (
        <Sheet
          title="דיווח על המודעה"
          onClose={() => setReport(false)}
          footer={
            <Button
              block
              disabled={!reason}
              onClick={() => {
                setReport(false)
                nav.toast("תודה. הדיווח הועבר לצוות")
              }}
            >
              שליחת דיווח
            </Button>
          }
        >
          <p className="mb-4 text-[14px] text-ink-2">מה הבעיה במודעה?</p>
          <div className="flex flex-wrap gap-2">
            {reportReasons.map((r) => (
              <Chip key={r} selected={reason === r} onClick={() => setReason(r)}>
                {r}
              </Chip>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  )
}

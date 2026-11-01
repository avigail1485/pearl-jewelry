import { useState } from "react"
import { ArrowRight, Heart, Share2, ShieldCheck, Users, Send, Flag, MapPin } from "lucide-react"
import { itemDetail, previewFeed, type FeedItem } from "../../data/mock"
import { useNav } from "../../nav"
import Chip from "../ui/Chip"
import Sheet from "../ui/Sheet"
import Button from "../ui/Button"
import ItemGrid from "../home/ItemGrid"
import ContactSheet from "./ContactSheet"

const reportReasons = ["הפריט נמכר בתשלום", "תוכן לא הולם", "הפריט כבר נמסר", "אחר"]

export default function ItemPage({ item }: { item: FeedItem }) {
  const nav = useNav()
  const detail = itemDetail(item)
  const [active, setActive] = useState(0)
  const [contactOpen, setContactOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState("")
  const saved = nav.saved.has(item.id)
  const photos = Array.from({ length: Math.max(1, detail.photoCount) })
  const given = detail.status === "given"
  const similar = previewFeed.filter((i) => i.category === detail.category && i.title !== detail.title).slice(0, 2)

  const floatBtn = "flex h-11 w-11 items-center justify-center rounded-full bg-paper text-deep hover:text-brand-strong"

  return (
    <div className="flex h-full flex-col bg-ground">
      <div className="no-scrollbar flex-1 overflow-y-auto pb-28">
        <div className="relative">
          <div
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
            onScroll={(e) => {
              const el = e.currentTarget
              setActive(Math.round(Math.abs(el.scrollLeft) / el.clientWidth))
            }}
          >
            {photos.map((_, i) => (
              <img key={i} src={detail.photo} alt={`${detail.title} — תמונה ${i + 1}`} className="aspect-square w-full shrink-0 snap-center object-cover" />
            ))}
          </div>
          <button type="button" onClick={nav.back} aria-label="חזרה" className={`safe-top-pos absolute right-5 ${floatBtn}`} style={{ boxShadow: "var(--shadow-float)" }}>
            <ArrowRight size={22} />
          </button>
          <div className="safe-top-pos absolute left-5 flex gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(detail.title).catch(() => {})
                nav.toast("הקישור לפריט הועתק")
              }}
              aria-label="שיתוף"
              className={floatBtn}
              style={{ boxShadow: "var(--shadow-float)" }}
            >
              <Share2 size={19} />
            </button>
            <button
              type="button"
              onClick={() => {
                nav.toggleSaved(item.id)
                nav.toast(saved ? "הוסר מהשמורים" : "נשמר ברשימת השמורים")
              }}
              aria-label={saved ? "הסרה מהשמורים" : "שמירת הפריט"}
              aria-pressed={saved}
              className={floatBtn}
              style={{ boxShadow: "var(--shadow-float)" }}
            >
              <Heart size={20} fill={saved ? "#FF7A1A" : "none"} className={saved ? "text-accent" : ""} />
            </button>
          </div>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-deep/75 px-3 py-1 text-[13px] font-semibold text-paper">
            {Math.min(active + 1, photos.length)}/{photos.length}
          </span>
        </div>

        <div className="flex flex-col gap-5 px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <span className="w-fit rounded-full bg-accent-tint px-2.5 py-0.5 text-[12px] font-semibold text-accent-ink">{detail.category}</span>
            <h1 className="font-display text-[24px] font-bold text-deep">{detail.title}</h1>
            <p className="flex items-center gap-1 text-[14px] text-mute">
              <MapPin size={14} />
              {detail.city} · {detail.distanceKm} ק"מ ממך · פורסם {detail.postedLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {detail.tags.map((t) => (
              <Chip key={t} as="span">
                {t}
              </Chip>
            ))}
          </div>

          <p className="text-[15px] leading-relaxed text-ink-soft">{detail.description}</p>

          <button
            type="button"
            onClick={() => nav.toast(`פרופיל ${detail.giver.name}: ${detail.giver.givenCount} חפצים נמסרו`)}
            className="flex items-center gap-3 rounded-[var(--radius-card)] bg-paper p-4 text-right"
            style={{ boxShadow: "var(--shadow-raised)" }}
          >
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[18px] font-bold text-brand-ink">
              {detail.giver.name.charAt(0)}
              {detail.giver.phoneVerified && (
                <span className="absolute -bottom-0.5 -left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-paper ring-2 ring-paper">
                  <ShieldCheck size={12} />
                </span>
              )}
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-[16px] font-semibold text-deep">{detail.giver.name}</span>
              <span className="text-[13px] text-mute">
                מוסר/ת באגורה מ־{detail.giver.since} · {detail.giver.givenCount} חפצים נמסרו
              </span>
            </div>
          </button>

          <section className="rounded-[var(--radius-card)] bg-brand-tint p-4" aria-label="מסירה בטוחה">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-paper">
                <ShieldCheck size={18} />
              </span>
              <h2 className="text-[16px] font-bold text-deep">מסירה בטוחה באגורה</h2>
            </div>
            <ul className="flex flex-col gap-2.5 text-[14px] leading-snug text-deep">
              {[
                "מספר הטלפון שלך נחשף רק אחרי שהמוסר/ת מאשר/ת",
                "הכל בחינם: אף פעם אל תעבירו תשלום או מקדמה",
                "איסוף במקום ציבורי או בליווי, בשעות היום",
                "אחרי המסירה שני הצדדים מדרגים זה את זה",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {t}
                </li>
              ))}
            </ul>
          </section>

          <div className="flex items-center justify-center gap-2 text-[14px] text-ink-soft">
            <Users size={16} />
            {detail.interestCount} אנשים כבר פנו לגבי הפריט הזה
          </div>

          {similar.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-[18px] font-bold text-deep">עוד בקטגוריה</h2>
              <ItemGrid items={similar} />
            </section>
          )}

          <button type="button" onClick={() => setReportOpen(true)} className="mx-auto flex items-center gap-1.5 text-[13px] font-medium text-mute hover:text-accent-ink">
            <Flag size={14} />
            דיווח על הפריט
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ground via-ground to-transparent px-5 pb-5 pt-6">
        <Button block disabled={given} icon={<Send size={19} />} onClick={() => setContactOpen(true)} className="h-[56px]" style={{ boxShadow: "0 10px 24px rgba(0,180,110,0.3)" }}>
          {given ? "הפריט כבר נמסר" : "אני רוצה את זה"}
        </Button>
      </div>

      {contactOpen && <ContactSheet item={detail} onClose={() => setContactOpen(false)} />}
      {reportOpen && (
        <Sheet title="דיווח על הפריט" onClose={() => setReportOpen(false)}>
          <div className="flex flex-col gap-2">
            {reportReasons.map((r) => (
              <Chip key={r} selected={reason === r} onClick={() => setReason(r)}>
                {r}
              </Chip>
            ))}
            <Button
              block
              variant="accent"
              className="mt-3"
              disabled={!reason}
              onClick={() => {
                setReportOpen(false)
                nav.toast("תודה, הדיווח התקבל ויטופל")
              }}
            >
              שליחת דיווח
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  )
}

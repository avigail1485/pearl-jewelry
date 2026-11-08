import { Clock, MapPin, Package, Ruler, Share2, ShieldCheck, Wrench } from "lucide-react";
import { conditionIcon } from "../lib/conditions";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPhotos, markGiven } from "../api/items";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { StairsIcon } from "../components/Icon";
import { ItemImage, itemPhoto } from "../components/ItemImage";
import { Loading } from "../components/Loading";
import { SaveButton } from "../components/SaveButton";
import { Tag } from "../components/Tag";
import { BackButton } from "../components/TopBar";
import { fmtKm, timeAgo } from "../lib/format";
import { useRequireLogin, usePersonAvatar, usePersonName } from "../lib/hooks";
import { isNew, useItem, useItems } from "../store/items";
import { useUI } from "../store/ui";
import { useUser } from "../store/user";
import { ContactSheet } from "./ContactSheet";

const RULES = [
  "נפגשים במקום ציבורי או בכניסה לבניין.",
  "לא משלמים ולא מעבירים פרטי אשראי. הכל בחינם.",
  "מתאמים בהודעות בתוך האפליקציה.",
];

function Highlight({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <li className="flex gap-4">
      <span className="mt-0.5 shrink-0" aria-hidden>{icon}</span>
      <div><p className="text-body font-demibold">{title}</p>{text && <p className="text-body text-ink/65">{text}</p>}</div>
    </li>
  );
}

function Gallery({ photos, item }: { photos: string[]; item: Parameters<typeof ItemImage>[0]["item"] }) {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  if (photos.length <= 1) return <ItemImage item={item} src={photos[0]} eager iconSize={96} className="aspect-[4/3.4] w-full" />;
  return (
    <>
      <div
        ref={ref}
        onScroll={(e) => setIdx(Math.round(Math.abs(e.currentTarget.scrollLeft) / e.currentTarget.clientWidth))}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        aria-label="תמונות"
      >
        {photos.map((p, i) => <ItemImage key={i} item={item} src={p} eager={i === 0} className="aspect-[4/3.4] w-full shrink-0 snap-center" />)}
      </div>
      <span className="absolute bottom-3 left-3 rounded-full bg-ink/70 px-2.5 py-0.5 text-meta text-white">{idx + 1} / {photos.length}</span>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
        {photos.map((_, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/60"}`} />)}
      </div>
    </>
  );
}

export default function Item() {
  const { id = "" } = useParams();
  const item = useItem(id);
  const loaded = useItems((s) => s.loaded);
  const markViewed = useItems((s) => s.markViewed);
  const me = useUser((s) => s.viewer?.id);
  const toast = useUI((s) => s.showToast);
  const nav = useNavigate();
  const requireLogin = useRequireLogin();
  const [photos, setPhotos] = useState<string[]>([]);
  const [contact, setContact] = useState(false);
  const sellerName = usePersonName(item?.demo ? undefined : item?.seller.id, item?.seller.name || "מוסר מהקהילה");
  const sellerAvatar = usePersonAvatar(item?.demo ? undefined : item?.seller.id);

  useEffect(() => { if (item && !item.demo) getPhotos(item.id, item.photoCount ?? 1).then(setPhotos); }, [item?.id]); // eslint-disable-line
  useEffect(() => { window.scrollTo(0, 0); if (id) markViewed(id); }, [id]); // eslint-disable-line

  if (!item) return loaded ? (
    <div className="p-gutter pt-safe"><BackButton /><p className="mt-8 text-center text-body">החפץ כבר לא בלוח.</p></div>
  ) : <Loading />;

  const mine = !!me && item.ownerId === me;
  const CondIcon = conditionIcon(item.condition);
  const gallery = photos.length ? photos : itemPhoto(item) ? [itemPhoto(item)!] : [];
  const share = async () => {
    const text = `${item.title} · בחינם באגורה`;
    try { if (navigator.share) await navigator.share({ title: item.title, text }); else { await navigator.clipboard.writeText(text); toast("הפרטים הועתקו"); } } catch { /* cancelled */ }
  };
  const pickup = [item.floor != null ? (item.floor === 0 ? "קומת קרקע" : `קומה ${item.floor}`) : null, item.elevator === true ? "יש מעלית" : item.elevator === false ? "בלי מעלית" : null].filter(Boolean).join(" · ");

  return (
    <div className="min-h-[100dvh] pb-[110px]">
      <div className="relative">
        <Gallery photos={gallery} item={item} />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-safe">
          <div className="pt-2"><BackButton className="!bg-white shadow-card" /></div>
          <div className="flex pt-2">
            <button type="button" aria-label="שיתוף" onClick={share} className="tap inline-flex items-center justify-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-card"><Share2 size={18} strokeWidth={1.75} /></span>
            </button>
            <SaveButton id={item.id} title={item.title} />
          </div>
        </div>
      </div>

      <main className="relative -mt-5 rounded-t-sheet bg-white px-gutter pt-6">
        <h1 className="text-title font-demibold">{item.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Tag className="gap-1"><CondIcon size={14} strokeWidth={1.75} aria-hidden />{item.condition}</Tag>
          {isNew(item) && <Tag tone="neon">חדש</Tag>}
          {item.status === "given" && <Tag>נמסר</Tag>}
          <span className="text-meta text-ink/65">פורסם {timeAgo(item.createdAt)}</span>
        </div>

        <section className="mt-5 flex items-center gap-3 border-y border-gray-100 py-5" aria-label="המוסר">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neon text-title font-demibold">
            {sellerAvatar ? <img src={sellerAvatar} alt="" className="h-full w-full object-cover" /> : sellerName.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body font-demibold">{mine ? "אתם מוסרים את החפץ" : `מוסר: ${sellerName}`}</p>
            <p className="text-meta text-ink/65">מסר {item.seller.given} חפצים באגורה</p>
          </div>
        </section>

        <ul className="space-y-5 border-b border-gray-100 py-6">
          <Highlight icon={<CondIcon size={24} strokeWidth={1.75} />} title={item.condition} text={item.condition === "כמו חדש" ? "כמעט לא היה בשימוש." : item.condition === "מצב טוב" ? "עובד ונראה טוב, עם סימני שימוש רגילים." : item.condition === "מעט פגום" ? "יש פגם קטן. הפרטים בתיאור." : "מתאים לפירוק, לתיקון או ליצירה."} />
          <Highlight icon={<MapPin size={24} strokeWidth={1.75} />} title={`איסוף ב${item.city}`} text={[`${fmtKm(item.distanceKm)} ממך`, pickup].filter(Boolean).join(" · ")} />
          {item.stairs && <Highlight icon={<StairsIcon size={24} />} title="יש מדרגות בדרך" text="כדאי לבוא עם עוד זוג ידיים." />}
          {item.disassembly && item.disassembly !== "לא" && <Highlight icon={<Wrench size={24} strokeWidth={1.75} />} title={item.disassembly === "כן" ? "צריך לפרק" : "ייתכן שצריך לפרק"} text="קחו איתכם כלי עבודה." />}
          {item.dims && <Highlight icon={<Ruler size={24} strokeWidth={1.75} />} title="מידות" text={item.dims} />}
          <Highlight icon={<Package size={24} strokeWidth={1.75} />} title={`גודל ${item.size}`} text={item.size === "גדול" ? "צריך רכב מתאים להובלה." : undefined} />
          <Highlight icon={<Clock size={24} strokeWidth={1.75} />} title="זמני איסוף" text={item.times.join(", ")} />
        </ul>

        {item.description && (
          <section className="border-b border-gray-100 py-6">
            <h2 className="text-title font-demibold">על החפץ</h2>
            <p className="mt-2 whitespace-pre-line text-body">{item.description}</p>
          </section>
        )}

        <Card className="mt-6 p-4">
          <h2 className="flex items-center gap-2 text-body font-demibold"><ShieldCheck size={20} strokeWidth={1.75} aria-hidden />מסירה בטוחה</h2>
          <ul className="mt-2 list-disc space-y-1 pr-5 text-body">{RULES.map((r) => <li key={r}>{r}</li>)}</ul>
        </Card>

      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app border-t border-gray-100 bg-white pb-safe">
        <div className="flex items-center gap-3 px-gutter py-3">
          {mine ? (
            item.status === "active" ? <Button block onClick={async () => { await markGiven(item.id); toast("סומן כנמסר. תודה!"); }}>סימון כנמסר</Button> : <Tag>נמסר</Tag>
          ) : (
            <Button variant="neon" block disabled={item.status !== "active"} onClick={() => requireLogin(() => setContact(true))}>אני בעניין</Button>
          )}
        </div>
      </div>

      <ContactSheet open={contact} onClose={() => setContact(false)} item={item} onSent={(tid) => { setContact(false); nav(`/sent/${tid}`); }} />
    </div>
  );
}

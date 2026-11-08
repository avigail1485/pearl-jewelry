import { ChevronLeft, Clock, MapPin, Package, Share2, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPhotos, markGiven } from "../api/items";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { StairsIcon } from "../components/Icon";
import { ItemImage } from "../components/ItemImage";
import { fmtKm } from "../components/ItemTile";
import { Loading } from "../components/Loading";
import { SaveButton } from "../components/SaveButton";
import { Tag } from "../components/Tag";
import { BackButton } from "../components/TopBar";
import { useRequireLogin, usePersonAvatar, usePersonName } from "../lib/hooks";
import { isNew, useItems } from "../store/items";
import { useUI } from "../store/ui";
import { useUser } from "../store/user";
import { ContactSheet } from "./ContactSheet";

const RULES = [
  "נפגשים במקום ציבורי או בכניסה לבניין.",
  "לא משלמים ולא מעבירים פרטי אשראי. הכל בחינם.",
  "מתאמים בהודעות בתוך האפליקציה.",
];

export default function Item() {
  const { id = "" } = useParams();
  const item = useItems((s) => s.byId(id));
  const loaded = useItems((s) => s.loaded);
  const me = useUser((s) => s.viewer?.id);
  const toast = useUI((s) => s.showToast);
  const nav = useNavigate();
  const requireLogin = useRequireLogin();
  const [photos, setPhotos] = useState<string[]>([]);
  const [contact, setContact] = useState(false);
  const sellerName = usePersonName(item?.demo ? undefined : item?.seller.id, item?.seller.name || "מוסר מהקהילה");
  const sellerAvatar = usePersonAvatar(item?.demo ? undefined : item?.seller.id);

  useEffect(() => { if (item && !item.demo) getPhotos(item.id).then(setPhotos); }, [item?.id]); // eslint-disable-line
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (!item) return loaded ? (
    <div className="p-gutter pt-safe"><BackButton /><p className="mt-8 text-center text-body">החפץ כבר לא בלוח.</p></div>
  ) : <Loading />;

  const mine = !!me && item.ownerId === me;
  const share = async () => {
    const data = { title: item.title, text: `${item.title} · בחינם באגורה` };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(`${data.text}`); toast("הפרטים הועתקו"); } } catch { /* cancelled */ }
  };

  return (
    <div className="min-h-[100dvh] pb-[110px]">
      {/* Image 4:3.4 with floating buttons */}
      <div className="relative">
        {photos.length > 1 ? (
          <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" aria-label="תמונות">
            {photos.map((p, i) => <ItemImage key={i} item={item} src={p} className="aspect-[4/3.4] w-full shrink-0 snap-center" />)}
          </div>
        ) : (
          <ItemImage item={item} src={photos[0]} iconSize={96} className="aspect-[4/3.4] w-full" />
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-safe">
          <div className="pt-2"><BackButton className="!bg-white shadow-card" /></div>
          <div className="flex pt-2">
            <button type="button" aria-label="שיתוף" onClick={share} className="tap inline-flex items-center justify-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-card"><Share2 size={18} strokeWidth={1.75} /></span>
            </button>
            <SaveButton id={item.id} title={item.title} />
          </div>
        </div>
        {photos.length > 1 && <span className="absolute bottom-3 left-3 rounded-full bg-white px-2.5 py-0.5 text-meta">{photos.length} תמונות</span>}
      </div>

      <main className="px-gutter">
        <nav aria-label="נתיב" className="mt-4 flex items-center gap-1 text-meta text-ink/65">
          <Link to="/" className="underline-offset-4 hover:underline">ראשי</Link>
          <ChevronLeft size={14} strokeWidth={1.75} aria-hidden />
          <span>{item.category}</span>
        </nav>
        <div className="mt-1 flex items-start gap-2">
          <h1 className="flex-1 text-title font-demibold">{item.title}</h1>
          {isNew(item) && <Tag tone="neon">חדש</Tag>}
          {item.status === "given" && <Tag>נמסר</Tag>}
        </div>
        <p className="mt-1 text-meta text-ink/65">{item.city} · {fmtKm(item.distanceKm)}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Card className="p-4">
            <h2 className="flex items-center gap-1.5 text-meta text-ink/65"><Sparkles size={16} strokeWidth={1.75} aria-hidden />מצב</h2>
            <p className="mt-1 text-body font-demibold">{item.condition}</p>
            <p className="mt-1 flex items-center gap-1.5 text-meta"><Package size={16} strokeWidth={1.75} aria-hidden />גודל {item.size}</p>
          </Card>
          <Card className="p-4">
            <h2 className="flex items-center gap-1.5 text-meta text-ink/65"><MapPin size={16} strokeWidth={1.75} aria-hidden />איסוף</h2>
            <p className="mt-1 text-body font-demibold">{item.city}</p>
            <p className="mt-1 flex items-center gap-1.5 text-meta"><Clock size={16} strokeWidth={1.75} aria-hidden />{item.times.join(", ")}</p>
            {item.stairs && <p className="mt-1 flex items-center gap-1.5 text-meta"><StairsIcon size={16} />יש מדרגות</p>}
          </Card>
        </div>

        {item.description && (
          <section className="mt-5">
            <h2 className="text-body font-demibold">תיאור</h2>
            <p className="mt-1 whitespace-pre-line text-body">{item.description}</p>
          </section>
        )}

        <section className="mt-5 flex items-center gap-3 border-y border-gray-100 py-4" aria-label="המוסר">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neon text-body font-demibold">
            {sellerAvatar ? <img src={sellerAvatar} alt="" className="h-full w-full object-cover" /> : sellerName.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body font-demibold">{mine ? "אתם מוסרים את החפץ" : sellerName}</p>
            <p className="text-meta text-ink/65">מסרו {item.seller.given} חפצים באגורה</p>
          </div>
        </section>

        <Card className="mt-5 p-4">
          <h2 className="flex items-center gap-2 text-body font-demibold"><ShieldCheck size={20} strokeWidth={1.75} aria-hidden />מסירה בטוחה</h2>
          <ul className="mt-2 list-disc space-y-1 pr-5 text-body">{RULES.map((r) => <li key={r}>{r}</li>)}</ul>
        </Card>
      </main>

      {/* Sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app bg-white pb-safe shadow-nav">
        <div className="flex items-center gap-3 px-gutter py-3">
          <div className="flex-1">
            <p className="text-title font-demibold">בחינם</p>
            <p className="text-meta text-ink/65">איסוף ב{item.city}</p>
          </div>
          {mine ? (
            item.status === "active" ? (
              <Button onClick={async () => { await markGiven(item.id); toast("סומן כנמסר. תודה!"); }}>סימון כנמסר</Button>
            ) : <Tag>נמסר</Tag>
          ) : (
            <Button variant="neon" disabled={item.status !== "active"} onClick={() => requireLogin(() => setContact(true))}>אני בעניין</Button>
          )}
        </div>
      </div>

      <ContactSheet open={contact} onClose={() => setContact(false)} item={item} onSent={(tid) => { setContact(false); nav(`/sent/${tid}`); }} />
    </div>
  );
}

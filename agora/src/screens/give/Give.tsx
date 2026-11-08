import { Check, ImagePlus, Pencil, Sparkles, X } from "lucide-react";
import { Illustration as Anim } from "../../components/Illustration";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { publishItem } from "../../api/items";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import { StairsIcon } from "../../components/Icon";
import { Illustration } from "../../components/Illustration";
import { ItemImage } from "../../components/ItemImage";
import { ProgressBar } from "../../components/ProgressBar";
import { Sheet } from "../../components/Sheet";
import { Tag } from "../../components/Tag";
import { Toggle } from "../../components/Toggle";
import { TopBar } from "../../components/TopBar";
import { recognize, type Guess, type RecognizeResult } from "../../lib/ai";
import { CATEGORIES, CATEGORY_ICON, CONDITIONS, SIZES, TIMES } from "../../lib/categories";
import { CityInput } from "../../components/CityInput";
import { useRequireLogin } from "../../lib/hooks";
import { compress } from "../../lib/image";
import { preloadRemoveBg, removeBackground } from "../../lib/removeBg";
import { useDraft } from "../../store/giveDraft";
import { useUI } from "../../store/ui";
import { useUser } from "../../store/user";
import type { Item } from "../../api/types";

const TITLES = ["תמונות", "פרטים", "איסוף", "סיכום"];

export default function Give() {
  const [step, setStep] = useState(1);
  const d = useDraft();
  const nav = useNavigate();
  const city = useUser((s) => s.city);
  useEffect(() => { if (!d.city) d.set({ city }); }, []); // eslint-disable-line
  useEffect(() => { window.scrollTo(0, 0); }, [step]);
  // Start fetching the background-removal model while the person picks a photo.
  useEffect(() => { preloadRemoveBg(); }, []);

  const back = () => (step > 1 ? setStep(step - 1) : nav(-1));
  const canNext = step === 1 ? d.photos.length > 0 : step === 2 ? !!(d.title.trim() && d.category && d.condition) : step === 3 ? !!(d.city && d.size && d.times.length) : true;

  return (
    <div className="min-h-[100dvh] pb-[110px]">
      <TopBar title={<span>למסור <span className="text-meta font-light text-ink/65">· שלב {step} מתוך 4 · {TITLES[step - 1]}</span></span>} onBack={back} />
      <div className="px-gutter pb-2"><ProgressBar step={step} /></div>
      <main className="px-gutter pt-3">
        {step === 1 && <Step1 onNext={() => setStep(2)} />}
        {step > 1 && (
          <div className="mb-4 flex items-center gap-3">
            <Illustration name={step === 2 ? "hello" : step === 3 ? "message-sent" : "verified"} size={72} />
            <p className="text-body">{step === 2 ? "בדקו שהפרטים נכונים. מילאנו מה שזיהינו." : step === 3 ? "איך ומתי אפשר לאסוף?" : "כמעט שם. ככה זה ייראה בלוח."}</p>
          </div>
        )}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 goto={setStep} />}
      </main>
      {step < 4 && !(step === 1 && d.photos.length === 0) && (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app bg-white px-gutter pb-safe pt-3 shadow-nav">
          <div className="pb-3"><Button block disabled={!canNext} onClick={() => setStep(step + 1)}>להמשך</Button></div>
        </div>
      )}
    </div>
  );
}

/* ---------- 1 · photos + automatic recognition ---------- */
function Step1({ onNext }: { onNext: () => void }) {
  const d = useDraft();
  const file = useRef<HTMLInputElement>(null);
  const [guess, setGuess] = useState<Guess | null>(null);
  const [failed, setFailed] = useState<RecognizeResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const main = d.photos[0];

  // Fill the form from what was recognised (only fields the person has not filled).
  const apply = (g: Guess) => {
    const cur = useDraft.getState();
    d.set({
      title: cur.title || g.title, category: cur.category || g.category, condition: cur.condition || g.condition,
      size: cur.size || g.size, description: cur.description || g.description,
    });
  };

  // Whenever the main photo changes: remove its background (on the device) and recognise it.
  useEffect(() => {
    if (!main) { d.set({ cutout: null, bg: "idle" }); return; }
    let alive = true;
    d.set({ cutout: null, bg: "working", useCutout: true });
    removeBackground(useDraft.getState().mainHQ ?? main).then((cut) => { if (alive) d.set({ cutout: cut, bg: cut ? "done" : "failed" }); });
    if (!guess) {
      setScanning(true); setFailed(null);
      recognize(d.photos).then((r) => {
        if (!alive) return;
        setScanning(false);
        if (r.ok) { setGuess(r.guess); apply(r.guess); } else setFailed(r);
      });
    }
    return () => { alive = false; };
  }, [main]); // eslint-disable-line

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 4 - d.photos.length);
    if (!picked.length) return;
    const list = await Promise.all(picked.map((f) => compress(f, 800, 0.7)));
    // the first photo becomes the main one: keep a sharper copy for cutting out its background
    if (!d.photos.length) d.set({ mainHQ: await compress(picked[0], 1280, 0.92) });
    d.set({ photos: [...d.photos, ...list].slice(0, 4) });
  };
  const accept = () => onNext();
  const pick = () => { preloadRemoveBg(); file.current?.click(); };
  const picker = <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />;

  if (!d.photos.length) {
    return (
      <div className="flex flex-col items-center pt-6 text-center">
        <Illustration name="add-photo" size={160} />
        <h2 className="mt-4 text-title font-demibold">צלמו את החפץ</h2>
        <p className="mt-1 text-body">תמונה ברורה באור טבעי. נסיר את הרקע, נזהה את החפץ וננסח בשבילכם את הפרטים.</p>
        <Button block className="mt-6" icon={<ImagePlus size={20} strokeWidth={1.75} />} onClick={pick}>צילום או בחירת תמונה</Button>
        {picker}
      </div>
    );
  }

  const showCut = d.useCutout && d.cutout;
  return (
    <div>
      {/* main photo */}
      <div className="relative">
        <div className="aspect-square w-full overflow-hidden rounded-tile bg-gray-100">
          <img src={showCut ? d.cutout! : main} alt="התמונה הראשית" className={`h-full w-full ${showCut ? "object-contain p-[9%]" : "object-cover"}`} />
        </div>
        {d.bg === "working" && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center" aria-live="polite">
            <span className="flex items-center gap-2 rounded-btn bg-white py-1 pl-4 pr-1 text-meta shadow-card"><Anim name="loading" size={28} />מסירים את הרקע…</span>
          </div>
        )}
        <button type="button" aria-label="הסרת התמונה הראשית" onClick={() => d.set({ photos: d.photos.slice(1), mainHQ: null })} className="tap absolute left-1 top-1 inline-flex items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-btn bg-white shadow-card"><X size={18} strokeWidth={1.75} /></span>
        </button>
      </div>
      {d.bg === "done" && (
        <div role="radiogroup" aria-label="רקע התמונה" className="mt-3 flex gap-2">
          <Chip selected={d.useCutout} onClick={() => d.set({ useCutout: true })}>בלי רקע</Chip>
          <Chip selected={!d.useCutout} onClick={() => d.set({ useCutout: false })}>רקע מקורי</Chip>
        </div>
      )}
      {d.bg === "failed" && <p className="mt-3 text-meta text-ink/65">לא הצלחנו להסיר את הרקע בתמונה הזאת. היא תפורסם כמו שהיא.</p>}

      {/* more photos */}
      <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
        {d.photos.slice(1).map((p, i) => (
          <div key={i} className="relative shrink-0">
            <img src={p} alt={`תמונה ${i + 2}`} className="h-20 w-20 rounded-tile bg-gray-100 object-cover" />
            <button type="button" aria-label={`הסרת תמונה ${i + 2}`} onClick={() => d.set({ photos: d.photos.filter((_, j) => j !== i + 1) })} className="tap absolute -left-3 -top-3 inline-flex items-center justify-center">
              <span className="flex h-7 w-7 items-center justify-center rounded-btn bg-white shadow-card"><X size={14} strokeWidth={1.75} /></span>
            </button>
          </div>
        ))}
        {d.photos.length < 4 && (
          <button type="button" onClick={pick} className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-tile bg-gray-100 text-meta">
            <ImagePlus size={22} strokeWidth={1.75} aria-hidden />הוספה
          </button>
        )}
      </div>
      {picker}

      <Card className="mt-5 p-4" aria-live="polite">
        {scanning ? (
          <div className="flex items-center gap-3"><Illustration name="loading" size={40} /><div><p className="text-body font-demibold">מזהים את החפץ…</p><p className="text-meta text-ink/65">ממלאים בשבילכם את הפרטים</p></div></div>
        ) : guess?.title ? (
          <>
            <p className="flex items-center gap-1.5 text-meta text-ink/65"><Sparkles size={14} strokeWidth={1.75} aria-hidden />זיהינו ומילאנו את הפרטים</p>
            <p className="mt-1 text-title font-demibold">{d.title || guess.title}</p>
            <div className="mt-2 flex flex-wrap gap-1.5"><Tag>{d.category || guess.category}</Tag><Tag>{d.condition || guess.condition}</Tag><Tag>{`גודל ${d.size || guess.size}`}</Tag></div>
            {(d.description || guess.description) && <p className="mt-2 text-body">{d.description || guess.description}</p>}
            <Button block className="mt-4" icon={<Check size={20} strokeWidth={1.75} />} onClick={accept}>נראה טוב, להמשך</Button>
            <p className="mt-2 text-center text-meta text-ink/65">משהו לא מדויק? אפשר לשנות בשלב הבא.</p>
          </>
        ) : (
          <p className="text-body">{failed?.ok === false && failed.reason === "unclear" ? "לא הצלחנו לזהות את החפץ בתמונה. נסו תמונה ברורה יותר, או מלאו את הפרטים בשלב הבא." : "בשלב הבא תמלאו שם ופרטים."}</p>
        )}
      </Card>
    </div>
  );
}

/* ---------- 2 · details ---------- */
function Step2() {
  const d = useDraft();
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="title" className="text-body font-demibold">מה מוסרים?</label>
        <input id="title" value={d.title} maxLength={40} onChange={(e) => d.set({ title: e.target.value })} placeholder="למשל: ספה תלת־מושבית" className="mt-2 h-12 w-full rounded-search bg-gray-100 px-3 text-body" />
      </div>
      <fieldset>
        <legend className="text-body font-demibold">קטגוריה</legend>
        <div className="mt-2 flex flex-wrap gap-2">{CATEGORIES.map((c) => <Chip key={c} selected={d.category === c} onClick={() => d.set({ category: c })}>{c}</Chip>)}</div>
      </fieldset>
      <fieldset>
        <legend className="text-body font-demibold">מצב</legend>
        <div className="mt-2 flex flex-wrap gap-2">{CONDITIONS.map((c) => <Chip key={c} selected={d.condition === c} onClick={() => d.set({ condition: c })}>{c}</Chip>)}</div>
      </fieldset>
      <div>
        <label htmlFor="desc" className="text-body font-demibold">תיאור <span className="font-light text-ink/65">(לא חובה)</span></label>
        <textarea id="desc" rows={4} value={d.description} maxLength={400} onChange={(e) => d.set({ description: e.target.value })} placeholder="מידות, פגמים, כל מה שכדאי לדעת…" className="mt-2 w-full resize-none rounded-tile bg-gray-100 p-3 text-body" />
      </div>
    </div>
  );
}

/* ---------- 3 · pickup ---------- */
function Step3() {
  const d = useDraft();
  const setCity = useUser((s) => s.setCity);
  const [pick, setPick] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-tile bg-gray-100 px-4 py-2">
        <div><p className="text-meta text-ink/65">יישוב</p><p className="text-body font-demibold">{d.city}</p></div>
        <Button variant="link" onClick={() => setPick(true)}>שינוי</Button>
      </div>
      <fieldset>
        <legend className="text-body font-demibold">גודל</legend>
        <div className="mt-2 flex flex-wrap gap-2">{SIZES.map((s) => <Chip key={s} selected={d.size === s} onClick={() => d.set({ size: s })}>{s}</Chip>)}</div>
      </fieldset>
      <fieldset>
        <legend className="text-body font-demibold">מתי נוח לאסוף?</legend>
        <div className="mt-2 flex flex-wrap gap-2">{TIMES.map((t) => <Chip key={t} selected={d.times.includes(t)} onClick={() => d.set({ times: d.times.includes(t) ? d.times.filter((x) => x !== t) : [...d.times, t] })}>{t}</Chip>)}</div>
      </fieldset>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-body font-demibold"><StairsIcon />יש מדרגות בדרך</span>
        <Toggle checked={d.stairs} onChange={(stairs) => d.set({ stairs })} label="יש מדרגות בדרך" />
      </div>
      <Sheet open={pick} onClose={() => setPick(false)} label="בחירת יישוב">
        <h2 className="text-section font-light">איפה אוספים?</h2>
        <div className="mt-4 min-h-[320px]"><CityInput value={d.city} onPick={(c) => { d.set({ city: c }); setCity(c); setPick(false); }} label="יישוב האיסוף" autoFocus /></div>
      </Sheet>
    </div>
  );
}

/* ---------- 4 · summary + publish ---------- */
function Step4({ goto }: { goto: (n: number) => void }) {
  const d = useDraft();
  const { viewer } = useUser();
  const toast = useUI((s) => s.showToast);
  const requireLogin = useRequireLogin();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  const publish = async () => {
    const me = useUser.getState().viewer?.id;
    if (!me) { toast("צריך להתחבר כדי לפרסם"); return; }
    setBusy(true);
    try {
      const cut = d.useCutout && d.cutout ? d.cutout : null;
      const mainSrc = cut ?? d.photos[0];
      const thumb = await compress(await (await fetch(mainSrc)).blob(), 360, 0.75, cut ? "image/webp" : "image/jpeg");
      const item: Omit<Item, "id"> = {
        title: d.title.trim(), category: d.category, icon: CATEGORY_ICON[d.category] ?? "box", condition: d.condition,
        city: d.city, distanceKm: 0.5, createdAt: Date.now(), size: d.size, times: d.times, stairs: d.stairs,
        description: d.description.trim(), seller: { id: me, name: "", given: 0 }, status: "active", thumb, ownerId: me, cutout: !!cut,
      };
      const id = await publishItem(item, cut ? [cut, ...d.photos.slice(1)] : d.photos);
      d.reset();
      nav(`/give/published/${id}`, { replace: true });
    } catch {
      toast("הפרסום לא הצליח. נסו שוב.");
    } finally { setBusy(false); }
  };

  const cutMain = d.useCutout && d.cutout ? d.cutout : null;
  const preview = { id: "draft", title: d.title, category: d.category, icon: CATEGORY_ICON[d.category] ?? "box", cutout: !!cutMain } as Item;
  const Row = ({ label, value, to }: { label: string; value: string; to: number }) => (
    <div className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
      <div className="min-w-0"><p className="text-meta text-ink/65">{label}</p><p className="truncate text-body">{value}</p></div>
      <button type="button" aria-label={`עריכת ${label}`} onClick={() => goto(to)} className="tap inline-flex items-center justify-center"><Pencil size={18} strokeWidth={1.75} /></button>
    </div>
  );

  return (
    <div>
      <Card className="overflow-hidden">
        <ItemImage item={preview} src={cutMain ?? d.photos[0]} className="aspect-[4/3.4] w-full" />
        <div className="p-4">
          <h2 className="text-title font-demibold">{d.title}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5"><Tag>{d.category}</Tag><Tag>{d.condition}</Tag></div>
          <div className="mt-3">
            <Row label="תמונות" value={`${d.photos.length} תמונות`} to={1} />
            {d.description && <Row label="תיאור" value={d.description} to={2} />}
            <Row label="איסוף" value={`${d.city} · ${d.times.join(", ")}`} to={3} />
            <Row label="גודל" value={`${d.size}${d.stairs ? " · יש מדרגות" : ""}`} to={3} />
          </div>
        </div>
      </Card>
      <p className="mt-4 text-meta text-ink/65">החפץ יופיע בלוח לכל הקהילה. אפשר לסמן אותו כנמסר בכל רגע.</p>
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app bg-white px-gutter pb-safe pt-3 shadow-nav">
        <div className="pb-3">
          <Button variant="neon" block disabled={busy} onClick={() => requireLogin(publish)}>{busy ? "מפרסמים…" : "פרסום בלוח"}</Button>
          {!viewer && <span className="sr-only">נדרשת התחברות</span>}
        </div>
      </div>
    </div>
  );
}

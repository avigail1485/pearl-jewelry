import { Check, ImagePlus, Pencil, X } from "lucide-react";
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
import { recognize, type Guess } from "../../lib/ai";
import { CATEGORIES, CATEGORY_ICON, CITIES, CONDITIONS, SIZES, TIMES } from "../../lib/categories";
import { useRequireLogin } from "../../lib/hooks";
import { compress } from "../../lib/image";
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

  const back = () => (step > 1 ? setStep(step - 1) : nav(-1));
  const canNext = step === 1 ? d.photos.length > 0 : step === 2 ? !!(d.title.trim() && d.category && d.condition) : step === 3 ? !!(d.city && d.size && d.times.length) : true;

  return (
    <div className="min-h-[100dvh] pb-[110px]">
      <TopBar title={<span>למסור <span className="text-meta font-light text-ink/65">· שלב {step} מתוך 4 · {TITLES[step - 1]}</span></span>} onBack={back} />
      <div className="px-gutter pb-2"><ProgressBar step={step} /></div>
      <main className="px-gutter pt-3">
        {step === 1 && <Step1 onNext={() => setStep(2)} />}
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
  const [scanning, setScanning] = useState(false);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = await Promise.all(Array.from(files).slice(0, 4 - d.photos.length).map((f) => compress(f)));
    const photos = [...d.photos, ...list].slice(0, 4);
    d.set({ photos });
    if (!guess && photos.length) {
      setScanning(true);
      const g = await recognize(photos[0]);
      setScanning(false);
      setGuess(g);
    }
  };
  const accept = () => {
    if (guess) d.set({ title: d.title || guess.title, category: d.category || guess.category, condition: d.condition || guess.condition, description: d.description || guess.description });
    onNext();
  };
  const picker = <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />;

  if (!d.photos.length) {
    return (
      <div className="flex flex-col items-center pt-6 text-center">
        <Illustration name="add-photo" size={160} />
        <h2 className="mt-4 text-title font-demibold">צלמו את החפץ</h2>
        <p className="mt-1 text-body">תמונה ברורה באור טבעי. נזהה את החפץ וננסח בשבילכם את הפרטים.</p>
        <Button block className="mt-6" icon={<ImagePlus size={20} strokeWidth={1.75} />} onClick={() => file.current?.click()}>צילום או בחירת תמונה</Button>
        {picker}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {d.photos.map((p, i) => (
          <div key={i} className="relative">
            <img src={p} alt={`תמונה ${i + 1}`} className="aspect-[169/170] w-full rounded-tile bg-gray-100 object-cover" />
            {i === 0 && <Tag className="absolute bottom-2 right-2">תמונה ראשית</Tag>}
            <button type="button" aria-label={`הסרת תמונה ${i + 1}`} onClick={() => d.set({ photos: d.photos.filter((_, j) => j !== i) })} className="tap absolute left-0 top-0 inline-flex items-center justify-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-card"><X size={16} strokeWidth={1.75} /></span>
            </button>
          </div>
        ))}
        {d.photos.length < 4 && (
          <button type="button" onClick={() => file.current?.click()} className="flex aspect-[169/170] w-full flex-col items-center justify-center gap-2 rounded-tile bg-gray-100 text-body">
            <ImagePlus size={28} strokeWidth={1.75} aria-hidden />עוד תמונה
          </button>
        )}
      </div>
      {picker}
      <Card className="mt-5 p-4" aria-live="polite">
        {scanning ? (
          <div className="flex items-center gap-3"><Illustration name="loading" size={40} /><p className="text-body">מזהים את החפץ…</p></div>
        ) : guess?.title ? (
          <>
            <p className="text-meta text-ink/65">זיהינו</p>
            <p className="mt-1 text-title font-demibold">{guess.title}</p>
            <div className="mt-2 flex flex-wrap gap-1.5"><Tag>{guess.category}</Tag><Tag>{guess.condition}</Tag></div>
            <Button block className="mt-4" icon={<Check size={20} strokeWidth={1.75} />} onClick={accept}>נראה טוב, להמשך</Button>
          </>
        ) : (
          <p className="text-body">בשלב הבא תוסיפו שם ופרטים.</p>
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
        <div className="mt-4 flex flex-wrap gap-2">{CITIES.map((c) => <Chip key={c} selected={d.city === c} onClick={() => { d.set({ city: c }); setCity(c); setPick(false); }}>{c}</Chip>)}</div>
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
      const thumb = await compress(await (await fetch(d.photos[0])).blob(), 360, 0.7);
      const item: Omit<Item, "id"> = {
        title: d.title.trim(), category: d.category, icon: CATEGORY_ICON[d.category] ?? "box", condition: d.condition,
        city: d.city, distanceKm: 0.5, createdAt: Date.now(), size: d.size, times: d.times, stairs: d.stairs,
        description: d.description.trim(), seller: { id: me, name: "", given: 0 }, status: "active", thumb, ownerId: me,
      };
      const id = await publishItem(item, d.photos);
      d.reset();
      nav(`/give/published/${id}`, { replace: true });
    } catch {
      toast("הפרסום לא הצליח. נסו שוב.");
    } finally { setBusy(false); }
  };

  const preview = { id: "draft", title: d.title, category: d.category, icon: CATEGORY_ICON[d.category] ?? "box" } as Item;
  const Row = ({ label, value, to }: { label: string; value: string; to: number }) => (
    <div className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
      <div className="min-w-0"><p className="text-meta text-ink/65">{label}</p><p className="truncate text-body">{value}</p></div>
      <button type="button" aria-label={`עריכת ${label}`} onClick={() => goto(to)} className="tap inline-flex items-center justify-center"><Pencil size={18} strokeWidth={1.75} /></button>
    </div>
  );

  return (
    <div>
      <Card className="overflow-hidden">
        <ItemImage item={preview} src={d.photos[0]} className="aspect-[4/3.4] w-full" />
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

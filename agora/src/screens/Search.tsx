import { ChevronDown, ChevronLeft, Clock, LayoutGrid, LocateFixed, MapPin } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { CategoryPicker } from "../components/CategoryPicker";
import { DistanceSlider } from "../components/DistanceSlider";
import { Illustration } from "../components/Illustration";
import { SearchField } from "../components/SearchField";
import { TopBar } from "../components/TopBar";
import { CITIES } from "../lib/categories";
import { detectCity } from "../lib/locate";
import { useImageSearch } from "../lib/useImageSearch";
import { useFilters } from "../store/filters";
import { useUI } from "../store/ui";
import { useUser } from "../store/user";

type Key = "where" | "cat";

function Option({ id, open, setOpen, icon, title, summary, children }: { id: Key; open: Key | null; setOpen: (k: Key | null) => void; icon: ReactNode; title: string; summary: string; children: ReactNode }) {
  const isOpen = open === id;
  return (
    <Card className="overflow-hidden">
      <h2>
        <button type="button" aria-expanded={isOpen} aria-controls={`opt-${id}`} onClick={() => setOpen(isOpen ? null : id)} className="flex min-h-[64px] w-full items-center gap-3 rounded-btn px-5 text-right">
          <span aria-hidden>{icon}</span>
          <span className="flex-1 text-body font-demibold">{title}</span>
          <span className="max-w-[45%] truncate text-meta text-ink/65">{summary}</span>
          <ChevronDown size={20} strokeWidth={1.75} aria-hidden className={isOpen ? "rotate-180" : ""} />
        </button>
      </h2>
      {isOpen && <div id={`opt-${id}`} className="px-5 pb-5">{children}</div>}
    </Card>
  );
}

export default function Search() {
  const f = useFilters();
  const { city, setCity } = useUser();
  const toast = useUI((s) => s.showToast);
  const nav = useNavigate();
  const imageSearch = useImageSearch();
  const [open, setOpen] = useState<Key | null>(null);
  const [locating, setLocating] = useState(false);
  const go = () => { f.pushRecent(f.q); nav("/results"); };
  const newest = () => { f.set({ q: "", categories: [], cities: [], conditions: [], maxKm: null, sort: "new" }); nav("/results"); };
  const locate = async () => {
    setLocating(true);
    const c = await detectCity();
    setLocating(false);
    if (c) { setCity(c); toast(`זיהינו: ${c}`); } else toast("לא הצלחנו לזהות. בחרו יישוב מהרשימה.");
  };

  return (
    <div className="min-h-[100dvh] pb-[120px]">
      <TopBar title="חיפוש" />
      <main className="px-gutter">
        <div className="flex flex-col items-center pb-5 text-center">
          <Illustration name="searching" size={150} />
          <p className="mt-2 text-title font-demibold">מה מחפשים היום?</p>
        </div>
        <SearchField value={f.q} onChange={(q) => f.set({ q })} onSubmit={go} onImage={imageSearch} className="mb-5 !h-12 !rounded-btn px-1" />

        <div className="space-y-3">
          <Option id="where" open={open} setOpen={setOpen} icon={<MapPin size={24} strokeWidth={1.75} />} title="לפי מיקום" summary={f.maxKm ? `עד ${f.maxKm} ק"מ` : "כל הארץ"}>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <label htmlFor="city" className="text-meta text-ink/65">האזור שלי</label>
                <select id="city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 h-12 w-full rounded-btn bg-gray-100 px-3 text-body">
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Button variant="secondary" disabled={locating} onClick={locate} icon={<LocateFixed size={20} strokeWidth={1.75} />} className="!px-4">{locating ? "מזהים…" : "זיהוי"}</Button>
            </div>
            <div className="mt-6">
              <DistanceSlider city={city} value={f.maxKm} onChange={(maxKm) => f.set({ maxKm, cities: [], sort: maxKm ? "near" : f.sort })} />
            </div>
          </Option>

          <Option id="cat" open={open} setOpen={setOpen} icon={<LayoutGrid size={24} strokeWidth={1.75} />} title="לפי קטגוריה" summary={f.categories.length ? f.categories.join(", ") : "הכל"}>
            <CategoryPicker selected={f.categories} onToggle={(c) => f.toggle("categories", c)} />
          </Option>

          <Card className="overflow-hidden">
            <button type="button" onClick={newest} className="flex min-h-[64px] w-full items-center gap-3 rounded-btn px-5 text-right">
              <Clock size={24} strokeWidth={1.75} aria-hidden />
              <span className="flex-1 text-body font-demibold">הכי חדש</span>
              <span className="text-meta text-ink/65">מה עלה עכשיו</span>
              <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </Card>
        </div>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app bg-white px-gutter pb-safe pt-3 shadow-nav">
        <div className="flex w-full items-center gap-4 pb-3">
          <Button variant="link" onClick={f.clear}>ניקוי הכל</Button>
          <Button block onClick={go}>הצגת חפצים</Button>
        </div>
      </div>
    </div>
  );
}

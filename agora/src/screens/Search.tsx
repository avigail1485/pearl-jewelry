import { ChevronDown, ChevronLeft, Clock, LayoutGrid, MapPin } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { SearchField } from "../components/SearchField";
import { TopBar } from "../components/TopBar";
import { CATEGORIES, CATEGORY_ICONS, CITIES } from "../lib/categories";
import { useImageSearch } from "../lib/useImageSearch";
import { applyFilters, useFilters } from "../store/filters";
import { useAllItems } from "../store/items";
import { useUser } from "../store/user";

export const DISTANCES = [5, 15, 30, 60];
type Key = "where" | "cat";

function Option({ id, open, setOpen, icon, title, summary, children }: { id: Key; open: Key | null; setOpen: (k: Key | null) => void; icon: ReactNode; title: string; summary: string; children: ReactNode }) {
  const isOpen = open === id;
  return (
    <Card className="overflow-hidden">
      <h2>
        <button type="button" aria-expanded={isOpen} aria-controls={`opt-${id}`} onClick={() => setOpen(isOpen ? null : id)} className="flex min-h-[64px] w-full items-center gap-3 px-5 text-right">
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
  const items = useAllItems();
  const { city, setCity } = useUser();
  const nav = useNavigate();
  const imageSearch = useImageSearch();
  const [open, setOpen] = useState<Key | null>(null);
  const n = applyFilters(items, f).length;
  const go = () => { f.pushRecent(f.q); nav("/results"); };
  const newest = () => { f.set({ q: "", categories: [], cities: [], conditions: [], maxKm: null, sort: "new" }); nav("/results"); };
  const whereSummary = f.cities.length ? f.cities.join(", ") : f.maxKm ? `עד ${f.maxKm} ק"מ` : "כל הארץ";

  return (
    <div className="min-h-[100dvh] pb-[120px]">
      <TopBar title="חיפוש" />
      <main className="space-y-3 px-gutter pt-2">
        <SearchField value={f.q} onChange={(q) => f.set({ q })} onSubmit={go} onImage={imageSearch} autoFocus className="mb-5 !h-12 !rounded-full px-1" />

        <Option id="where" open={open} setOpen={setOpen} icon={<MapPin size={24} strokeWidth={1.75} />} title="לפי מיקום" summary={whereSummary}>
          <label htmlFor="city" className="text-meta text-ink/65">האזור שלי</label>
          <select id="city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 h-12 w-full rounded-search bg-gray-100 px-3 text-body">
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="mb-2 mt-4 text-meta text-ink/65">כמה רחוק?</p>
          <div className="flex flex-wrap gap-2">
            <Chip selected={!f.maxKm && !f.cities.length} onClick={() => f.set({ maxKm: null, cities: [] })}>כל הארץ</Chip>
            {DISTANCES.map((d) => <Chip key={d} selected={f.maxKm === d} onClick={() => f.set({ maxKm: f.maxKm === d ? null : d, cities: [], sort: "near" })}>{`עד ${d} ק"מ`}</Chip>)}
          </div>
        </Option>

        <Option id="cat" open={open} setOpen={setOpen} icon={<LayoutGrid size={24} strokeWidth={1.75} />} title="לפי קטגוריה" summary={f.categories.length ? f.categories.join(", ") : "הכל"}>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c];
              const on = f.categories.includes(c);
              return (
                <button key={c} type="button" aria-pressed={on} onClick={() => f.toggle("categories", c)} className="flex flex-col items-center gap-1.5 rounded-tile py-2 text-center">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full ${on ? "bg-ink text-white" : "bg-gray-100"}`}><Icon size={22} strokeWidth={1.75} /></span>
                  <span className={`text-nav leading-tight ${on ? "font-demibold" : ""}`}>{c}</span>
                </button>
              );
            })}
          </div>
        </Option>

        <Card className="overflow-hidden">
          <button type="button" onClick={newest} className="flex min-h-[64px] w-full items-center gap-3 px-5 text-right">
            <Clock size={24} strokeWidth={1.75} aria-hidden />
            <span className="flex-1 text-body font-demibold">הכי חדש</span>
            <span className="text-meta text-ink/65">מה עלה עכשיו</span>
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
          </button>
        </Card>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app bg-white px-gutter pb-safe pt-3 shadow-nav">
        <div className="flex w-full items-center gap-4 pb-3">
          <Button variant="link" onClick={f.clear}>ניקוי הכל</Button>
          <Button block onClick={go} aria-live="polite">{`הצגת ${n} חפצים`}</Button>
        </div>
      </div>
    </div>
  );
}

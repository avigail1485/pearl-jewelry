import { ArrowUpDown, BellPlus, LayoutGrid, List, MapPin, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { CategoryPicker } from "../components/CategoryPicker";
import { Chip } from "../components/Chip";
import { DistanceSlider } from "../components/DistanceSlider";
import { EmptyState } from "../components/EmptyState";
import { ItemFeed, ItemGrid } from "../components/ItemTile";
import { Sheet } from "../components/Sheet";
import { BackButton } from "../components/TopBar";
import { CATEGORY_ICONS, CONDITIONS } from "../lib/categories";
import { conditionIcon } from "../lib/conditions";
import { ls } from "../lib/storage";
import { activeCount, applyFilters, useFilters } from "../store/filters";
import { useAllItems } from "../store/items";
import { useUI } from "../store/ui";
import { useUser } from "../store/user";

type Section = "cat" | "cond" | "where" | "sort";
const TITLES: Record<Section, string> = { cat: "קטגוריה", cond: "מצב החפץ", where: "מרחק", sort: "מיון" };

function FilterButton({ label, icon, active, onClick }: { label: string; icon: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`relative flex h-11 shrink-0 items-center gap-1.5 rounded-btn border px-3 text-body ${active ? "border-ink bg-ink font-demibold text-white" : "border-gray-100 bg-white"}`}>
      {icon}{label}
    </button>
  );
}

export default function Results() {
  const f = useFilters();
  const items = useAllItems();
  const city = useUser((s) => s.city);
  const toast = useUI((s) => s.showToast);
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [view, setView] = useState<"list" | "grid">(() => ls.get("agora.view", "grid"));
  const [sheet, setSheet] = useState<Section | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => { if (params.get("near")) f.set({ maxKm: 15, sort: "near" }); }, []); // eslint-disable-line
  useEffect(() => { ls.set("agora.view", view); }, [view]);

  const res = applyFilters(items, f);
  const count = activeCount(f);
  const alert = () => toast("נעדכן אתכם כשיעלו חפצים חדשים");
  const title = f.q || (f.categories.length === 1 ? f.categories[0] : f.categories.length ? f.categories.join(", ") : "כל החפצים");
  const where = f.maxKm ? `עד ${f.maxKm} ק"מ מ${city}` : "כל הארץ";
  const subtitle = `${where} · ${f.conditions.length ? f.conditions.join(", ") : "כל המצבים"}`;
  const CatIcon = f.categories.length === 1 ? CATEGORY_ICONS[f.categories[0]] : CATEGORY_ICONS["שונות"];
  const CondIcon = f.conditions.length === 1 ? conditionIcon(f.conditions[0]) : conditionIcon("מצב טוב");

  const clearSection = (s: Section) => f.set(s === "cat" ? { categories: [] } : s === "cond" ? { conditions: [] } : s === "where" ? { maxKm: null, cities: [] } : { sort: "new" });

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 bg-white/90 pt-safe backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 py-2">
          <BackButton onClick={() => nav("/")} />
          <button type="button" onClick={() => nav("/search")} className="flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center rounded-btn bg-white px-4 shadow-card">
            <h1 className="max-w-full truncate text-body font-demibold">{title}</h1>
            <p className="max-w-full truncate text-meta text-ink/65">{subtitle}</p>
          </button>
          <button
            type="button"
            aria-label="סינון מתקדם"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((v) => !v)}
            className={`tap relative inline-flex items-center justify-center rounded-btn border ${showFilters ? "border-ink bg-ink text-white" : "border-gray-100"}`}
          >
            <SlidersHorizontal size={20} strokeWidth={1.75} />
            {count > 0 && !showFilters && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-neon ring-2 ring-white" />}
          </button>
        </div>
        {showFilters && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-gutter pb-3">
            <FilterButton label="קטגוריה" icon={<CatIcon size={18} strokeWidth={1.75} aria-hidden />} active={f.categories.length > 0} onClick={() => setSheet("cat")} />
            <FilterButton label="מצב" icon={<CondIcon size={18} strokeWidth={1.75} aria-hidden />} active={f.conditions.length > 0} onClick={() => setSheet("cond")} />
            <FilterButton label="מרחק" icon={<MapPin size={18} strokeWidth={1.75} aria-hidden />} active={!!f.maxKm} onClick={() => setSheet("where")} />
            <FilterButton label="מיון" icon={<ArrowUpDown size={18} strokeWidth={1.75} aria-hidden />} active={f.sort !== "new"} onClick={() => setSheet("sort")} />
          </div>
        )}
      </header>

      <main className="px-gutter pb-10">
        {res.length === 0 ? (
          <EmptyState name="searching" size={180} title="לא מצאנו חפצים כאלה" text="אולי בקרוב. נעדכן אתכם כשיעלה משהו מתאים.">
            <Button block icon={<BellPlus size={20} strokeWidth={1.75} />} onClick={alert}>התראה על חדשים</Button>
            <Button variant="link" onClick={f.clear}>ניקוי סינונים</Button>
          </EmptyState>
        ) : (
          <>
            <div className="flex items-center justify-between pb-2">
              <button type="button" onClick={alert} className="inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-btn text-body underline underline-offset-4">
                <BellPlus size={18} strokeWidth={1.75} aria-hidden />התראה על חדשים
              </button>
              <div className="flex shrink-0 items-center">
                <button type="button" aria-label="תצוגת רשימה" aria-pressed={view === "list"} onClick={() => setView("list")} className={`tap inline-flex items-center justify-center rounded-btn ${view === "list" ? "" : "text-ink/65"}`}><List size={20} strokeWidth={view === "list" ? 2.25 : 1.75} /></button>
                <button type="button" aria-label="תצוגת גריד" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`tap inline-flex items-center justify-center rounded-btn ${view === "grid" ? "" : "text-ink/65"}`}><LayoutGrid size={20} strokeWidth={view === "grid" ? 2.25 : 1.75} /></button>
              </div>
            </div>
            <h2 className="sr-only">תוצאות</h2>
            {view === "grid" ? <ItemGrid items={res} /> : <ItemFeed items={res} />}
          </>
        )}
      </main>

      {/* Each filter button opens a sheet with only its own kind of filter */}
      <Sheet open={!!sheet} onClose={() => setSheet(null)} label={sheet ? TITLES[sheet] : "סינון"}>
        {sheet && (
          <>
            <h2 className="mb-5 text-section font-light">{TITLES[sheet]}</h2>
            {sheet === "cat" && <CategoryPicker selected={f.categories} onToggle={(c) => f.toggle("categories", c)} />}
            {sheet === "cond" && (
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map((c) => {
                  const Icon = conditionIcon(c);
                  const on = f.conditions.includes(c);
                  return (
                    <button key={c} type="button" aria-pressed={on} onClick={() => f.toggle("conditions", c)} className={`flex h-14 items-center gap-2 rounded-btn px-4 text-body ${on ? "bg-ink font-demibold text-white" : "bg-gray-100"}`}>
                      <Icon size={20} strokeWidth={1.75} aria-hidden />{c}
                    </button>
                  );
                })}
              </div>
            )}
            {sheet === "where" && <DistanceSlider city={city} value={f.maxKm} onChange={(maxKm) => f.set({ maxKm, cities: [] })} />}
            {sheet === "sort" && (
              <div className="flex flex-wrap gap-2">
                <Chip selected={f.sort === "new"} onClick={() => f.set({ sort: "new" })}>הכי חדש</Chip>
                <Chip selected={f.sort === "near"} onClick={() => f.set({ sort: "near" })}>הכי קרוב</Chip>
              </div>
            )}
            <div className="mt-8 flex items-center gap-4">
              <Button variant="link" onClick={() => clearSection(sheet)}>ניקוי</Button>
              <Button block onClick={() => setSheet(null)}>הצגת חפצים</Button>
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}

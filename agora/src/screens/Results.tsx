import { BellPlus, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { EmptyState } from "../components/EmptyState";
import { ItemGrid, ItemRow } from "../components/ItemTile";
import { Sheet } from "../components/Sheet";
import { BackButton } from "../components/TopBar";
import { CITIES, CONDITIONS } from "../lib/categories";
import { activeCount, applyFilters, useFilters } from "../store/filters";
import { useItems } from "../store/items";
import { useUI } from "../store/ui";
import { useUser } from "../store/user";
import { DISTANCES } from "./Search";
import { ls } from "../lib/storage";

export default function Results() {
  const f = useFilters();
  const items = useItems((s) => s.all)();
  const city = useUser((s) => s.city);
  const toast = useUI((s) => s.showToast);
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [view, setView] = useState<"list" | "grid">(() => ls.get("agora.view", "list"));
  const [sheet, setSheet] = useState(false);
  useEffect(() => { if (params.get("near")) f.set({ maxKm: 3, sort: "near" }); }, []); // eslint-disable-line
  useEffect(() => { ls.set("agora.view", view); }, [view]);

  const res = applyFilters(items, f);
  const count = activeCount(f);
  const alert = () => toast("נעדכן אתכם כשיעלו חפצים חדשים");
  const subtitle = f.maxKm ? `עד ${f.maxKm} ק"מ מ${city}` : f.cities.length ? f.cities.join(", ") : "כל הארץ";

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 bg-white/90 pt-safe backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 py-2">
          <BackButton onClick={() => nav("/search")} />
          <button type="button" onClick={() => nav("/search")} className="min-w-0 flex-1 text-right">
            <h1 className="truncate text-body font-demibold">{f.q || (f.categories.length ? f.categories.join(", ") : "כל החפצים")}</h1>
            <p className="truncate text-meta text-ink/65">{subtitle}</p>
          </button>
          <button type="button" aria-label={`סינון${count ? `, ${count} פעילים` : ""}`} onClick={() => setSheet(true)} className="tap relative inline-flex items-center justify-center rounded-full bg-gray-100">
            <SlidersHorizontal size={20} strokeWidth={1.75} />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-nav text-white">{count}</span>}
          </button>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-gutter pb-3">
          <Chip selected={f.maxKm === 3} onClick={() => f.set({ maxKm: f.maxKm === 3 ? null : 3 })}>קרוב אליי</Chip>
          <Chip selected={f.sort === "new"} onClick={() => f.set({ sort: f.sort === "new" ? "near" : "new" })}>חדש קודם</Chip>
          {CONDITIONS.slice(0, 2).map((c) => <Chip key={c} selected={f.conditions.includes(c)} onClick={() => f.toggle("conditions", c)}>{c}</Chip>)}
        </div>
      </header>

      <main className="px-gutter pb-8">
        {res.length === 0 ? (
          <EmptyState name="searching" size={180} title="לא מצאנו חפצים כאלה" text="אולי בקרוב. נעדכן אתכם כשיעלה משהו מתאים.">
            <Button block icon={<BellPlus size={20} strokeWidth={1.75} />} onClick={alert}>התראה על חדשים</Button>
            <Button variant="link" onClick={f.clear}>ניקוי סינונים</Button>
          </EmptyState>
        ) : (
          <>
            <div className="flex items-center justify-between py-2">
              <p className="whitespace-nowrap text-body font-demibold" aria-live="polite">{res.length} חפצים</p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={alert} className="inline-flex min-h-[44px] items-center gap-1 whitespace-nowrap px-1 text-meta underline underline-offset-4">
                  <BellPlus size={16} strokeWidth={1.75} aria-hidden />התראה על חדשים
                </button>
                <button type="button" aria-label="תצוגת רשימה" aria-pressed={view === "list"} onClick={() => setView("list")} className={`tap inline-flex items-center justify-center rounded-full ${view === "list" ? "" : "text-placeholder"}`}><List size={20} strokeWidth={view === "list" ? 2.25 : 1.75} /></button>
                <button type="button" aria-label="תצוגת גריד" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`tap inline-flex items-center justify-center rounded-full ${view === "grid" ? "" : "text-placeholder"}`}><LayoutGrid size={20} strokeWidth={view === "grid" ? 2.25 : 1.75} /></button>
              </div>
            </div>
            <h2 className="sr-only">תוצאות</h2>
            {view === "grid" ? <ItemGrid items={res} /> : <ul>{res.map((i) => <li key={i.id}><ItemRow item={i} /></li>)}</ul>}
          </>
        )}
      </main>

      <Sheet open={sheet} onClose={() => setSheet(false)} label="סינון">
        <h2 className="text-section font-light">סינון</h2>
        <h3 className="mb-2 mt-4 text-body font-demibold">איפה</h3>
        <div className="flex flex-wrap gap-2">{CITIES.map((c) => <Chip key={c} selected={f.cities.includes(c)} onClick={() => f.toggle("cities", c)}>{c}</Chip>)}</div>
        <h3 className="mb-2 mt-5 text-body font-demibold">מרחק</h3>
        <div className="flex flex-wrap gap-2">{DISTANCES.map((d) => <Chip key={d} selected={f.maxKm === d} onClick={() => f.set({ maxKm: f.maxKm === d ? null : d })}>{`עד ${d} ק"מ`}</Chip>)}</div>
        <h3 className="mb-2 mt-5 text-body font-demibold">מצב (אפשר כמה)</h3>
        <div className="flex flex-wrap gap-2">{CONDITIONS.map((c) => <Chip key={c} selected={f.conditions.includes(c)} onClick={() => f.toggle("conditions", c)}>{c}</Chip>)}</div>
        <h3 className="mb-2 mt-5 text-body font-demibold">מיון</h3>
        <div className="flex flex-wrap gap-2">
          <Chip selected={f.sort === "new"} onClick={() => f.set({ sort: "new" })}>חדש קודם</Chip>
          <Chip selected={f.sort === "near"} onClick={() => f.set({ sort: "near" })}>קרוב אליי</Chip>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <Button variant="link" onClick={() => f.set({ cities: [], maxKm: null, conditions: [], sort: "new" })}>ניקוי</Button>
          <Button block onClick={() => setSheet(false)}>{`הצגת ${res.length} חפצים`}</Button>
        </div>
      </Sheet>
    </div>
  );
}

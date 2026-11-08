import { BellPlus, ChevronDown, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { EmptyState } from "../components/EmptyState";
import { ItemFeed, ItemGrid } from "../components/ItemTile";
import { Sheet } from "../components/Sheet";
import { BackButton } from "../components/TopBar";
import { CATEGORIES, CITIES, CONDITIONS } from "../lib/categories";
import { ls } from "../lib/storage";
import { activeCount, applyFilters, useFilters } from "../store/filters";
import { useAllItems } from "../store/items";
import { useUI } from "../store/ui";
import { useUser } from "../store/user";
import { DISTANCES } from "./Search";

type Section = "cat" | "cond" | "where" | "sort";

function DropChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`relative inline-flex h-10 shrink-0 items-center gap-1 rounded-full border px-4 text-body after:absolute after:-inset-y-[2px] after:inset-x-0 ${active ? "border-ink bg-ink font-demibold text-white" : "border-gray-100 bg-white"}`}>
      {label}<ChevronDown size={16} strokeWidth={1.75} aria-hidden />
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
  const [view, setView] = useState<"list" | "grid">(() => ls.get("agora.view", "list"));
  const [sheet, setSheet] = useState<Section | null>(null);
  useEffect(() => { if (params.get("near")) f.set({ maxKm: 15, sort: "near" }); }, []); // eslint-disable-line
  useEffect(() => { ls.set("agora.view", view); }, [view]);

  const res = applyFilters(items, f);
  const count = activeCount(f);
  const alert = () => toast("נעדכן אתכם כשיעלו חפצים חדשים");
  const title = f.q || (f.categories.length === 1 ? f.categories[0] : f.categories.length ? `${f.categories.length} קטגוריות` : "כל החפצים");
  const where = f.cities.length ? f.cities.join(", ") : f.maxKm ? `עד ${f.maxKm} ק"מ מ${city}` : "כל הארץ";
  const subtitle = `${where} · ${f.conditions.length ? f.conditions.join(", ") : "כל המצבים"}`;

  const section = (s: Section) => (
    <section key={s} className="border-b border-gray-100 py-5 last:border-0">
      {s === "cat" && (<><h3 className="mb-3 text-body font-demibold">קטגוריה</h3><div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => <Chip key={c} selected={f.categories.includes(c)} onClick={() => f.toggle("categories", c)}>{c}</Chip>)}</div></>)}
      {s === "cond" && (<><h3 className="mb-3 text-body font-demibold">מצב (אפשר כמה)</h3><div className="flex flex-wrap gap-2">{CONDITIONS.map((c) => <Chip key={c} selected={f.conditions.includes(c)} onClick={() => f.toggle("conditions", c)}>{c}</Chip>)}</div></>)}
      {s === "where" && (<>
        <h3 className="mb-3 text-body font-demibold">מרחק מ{city}</h3>
        <div className="flex flex-wrap gap-2">{DISTANCES.map((d) => <Chip key={d} selected={f.maxKm === d} onClick={() => f.set({ maxKm: f.maxKm === d ? null : d })}>{`עד ${d} ק"מ`}</Chip>)}</div>
        <h3 className="mb-3 mt-5 text-body font-demibold">יישוב</h3>
        <div className="flex flex-wrap gap-2">{CITIES.map((c) => <Chip key={c} selected={f.cities.includes(c)} onClick={() => f.toggle("cities", c)}>{c}</Chip>)}</div>
      </>)}
      {s === "sort" && (<><h3 className="mb-3 text-body font-demibold">מיון</h3><div className="flex flex-wrap gap-2"><Chip selected={f.sort === "new"} onClick={() => f.set({ sort: "new" })}>חדש קודם</Chip><Chip selected={f.sort === "near"} onClick={() => f.set({ sort: "near" })}>קרוב אליי</Chip></div></>)}
    </section>
  );
  const order: Section[] = sheet ? [sheet, ...(["cat", "cond", "where", "sort"] as Section[]).filter((s) => s !== sheet)] : [];

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 bg-white/90 pt-safe backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 pt-2">
          <BackButton onClick={() => nav("/")} />
          <button type="button" onClick={() => nav("/search")} className="flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center rounded-full bg-white px-4 shadow-card">
            <h1 className="max-w-full truncate text-body font-demibold">{title}</h1>
            <p className="max-w-full truncate text-meta text-ink/65">{subtitle}</p>
          </button>
          <button type="button" aria-label={`סינון${count ? `, ${count} פעילים` : ""}`} onClick={() => setSheet("cat")} className="tap relative inline-flex items-center justify-center rounded-full border border-gray-100">
            <SlidersHorizontal size={20} strokeWidth={1.75} />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-nav text-white">{count}</span>}
          </button>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-gutter py-3">
          <DropChip label="קטגוריה" active={f.categories.length > 0} onClick={() => setSheet("cat")} />
          <DropChip label="מצב" active={f.conditions.length > 0} onClick={() => setSheet("cond")} />
          <DropChip label="מרחק" active={!!f.maxKm || f.cities.length > 0} onClick={() => setSheet("where")} />
          <DropChip label="מיון" active={f.sort !== "new"} onClick={() => setSheet("sort")} />
        </div>
      </header>

      <main className="px-gutter pb-10">
        {res.length === 0 ? (
          <EmptyState name="searching" size={180} title="לא מצאנו חפצים כאלה" text="אולי בקרוב. נעדכן אתכם כשיעלה משהו מתאים.">
            <Button block icon={<BellPlus size={20} strokeWidth={1.75} />} onClick={alert}>התראה על חדשים</Button>
            <Button variant="link" onClick={f.clear}>ניקוי סינונים</Button>
          </EmptyState>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 pb-3">
              <div className="min-w-0">
                <p className="whitespace-nowrap text-body font-demibold" aria-live="polite">{res.length} חפצים</p>
                <button type="button" onClick={alert} className="-my-2 inline-flex min-h-[44px] items-center gap-1 whitespace-nowrap text-meta underline underline-offset-4">
                  <BellPlus size={16} strokeWidth={1.75} aria-hidden />התראה על חדשים
                </button>
              </div>
              <div className="flex shrink-0 items-center">
                <button type="button" aria-label="תצוגת רשימה" aria-pressed={view === "list"} onClick={() => setView("list")} className={`tap inline-flex items-center justify-center rounded-full ${view === "list" ? "" : "text-ink/65"}`}><List size={20} strokeWidth={view === "list" ? 2.25 : 1.75} /></button>
                <button type="button" aria-label="תצוגת גריד" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`tap inline-flex items-center justify-center rounded-full ${view === "grid" ? "" : "text-ink/65"}`}><LayoutGrid size={20} strokeWidth={view === "grid" ? 2.25 : 1.75} /></button>
              </div>
            </div>
            <h2 className="sr-only">תוצאות</h2>
            {view === "grid" ? <ItemGrid items={res} /> : <ItemFeed items={res} />}
          </>
        )}
      </main>

      <Sheet open={!!sheet} onClose={() => setSheet(null)} label="סינון">
        <h2 className="text-section font-light">סינון</h2>
        {order.map(section)}
        <div className="sticky bottom-0 -mx-gutter flex items-center gap-4 border-t border-gray-100 bg-white px-gutter pt-3">
          <Button variant="link" onClick={() => f.set({ categories: [], cities: [], maxKm: null, conditions: [], sort: "new" })}>ניקוי הכל</Button>
          <Button block onClick={() => setSheet(null)}>{`הצגת ${res.length} חפצים`}</Button>
        </div>
      </Sheet>
    </div>
  );
}

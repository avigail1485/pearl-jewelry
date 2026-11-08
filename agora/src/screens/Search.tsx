import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { SearchField } from "../components/SearchField";
import { TopBar } from "../components/TopBar";
import { CATEGORIES, CATEGORY_ICONS, CITIES, CONDITIONS } from "../lib/categories";
import { useImageSearch } from "../lib/useImageSearch";
import { applyFilters, useFilters } from "../store/filters";
import { useAllItems } from "../store/items";

type Key = "what" | "where" | "cond" | "sort";
const POPULAR = ["ספה", "מקרר", "שולחן", "שידה", "עגלה", "סלקל", "מזרון"];
export const DISTANCES = [5, 15, 30, 60];

function Acc({ id, open, setOpen, title, summary, children }: { id: Key; open: Key | null; setOpen: (k: Key | null) => void; title: string; summary: string; children: ReactNode }) {
  const isOpen = open === id;
  return (
    <Card className="overflow-hidden">
      <h2>
        <button type="button" aria-expanded={isOpen} aria-controls={`acc-${id}`} onClick={() => setOpen(isOpen ? null : id)} className="flex min-h-[59px] w-full items-center justify-between gap-3 px-5 py-3 text-right">
          <span className={isOpen ? "text-section font-light" : "text-body font-demibold"}>{title}</span>
          {!isOpen && <span className="truncate text-body text-ink/65">{summary}</span>}
          {isOpen && <ChevronDown size={20} strokeWidth={1.75} className="rotate-180" aria-hidden />}
        </button>
      </h2>
      {isOpen && <div id={`acc-${id}`} className="px-5 pb-5">{children}</div>}
    </Card>
  );
}

export default function Search() {
  const f = useFilters();
  const items = useAllItems();
  const nav = useNavigate();
  const imageSearch = useImageSearch();
  const [open, setOpen] = useState<Key | null>("what");
  const n = applyFilters(items, f).length;
  const go = () => { f.pushRecent(f.q); nav("/results"); };

  return (
    <div className="min-h-[100dvh] pb-[120px]">
      <TopBar title="חיפוש" />
      <main className="space-y-3 px-gutter pt-2">
        <Acc id="what" open={open} setOpen={setOpen} title="מה מחפשים?" summary={f.q || (f.categories.length ? f.categories.join(", ") : "הכל")}>
          <SearchField value={f.q} onChange={(q) => f.set({ q })} onSubmit={go} onImage={imageSearch} autoFocus />
          {f.recent.length > 0 && (
            <>
              <h3 className="mb-2 mt-5 text-meta text-ink/65">חיפשתם לאחרונה</h3>
              <div className="flex flex-wrap gap-2">{f.recent.map((r) => <Chip key={r} selected={f.q === r} onClick={() => f.set({ q: f.q === r ? "" : r })}>{r}</Chip>)}</div>
            </>
          )}
          <h3 className="mb-2 mt-5 text-meta text-ink/65">מחפשים הרבה</h3>
          <div className="flex flex-wrap gap-2">{POPULAR.map((r) => <Chip key={r} selected={f.q === r} onClick={() => f.set({ q: f.q === r ? "" : r })}>{r}</Chip>)}</div>
          <h3 className="mb-1 mt-5 text-meta text-ink/65">קטגוריה</h3>
          <ul>
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c];
              const on = f.categories.includes(c);
              return (
                <li key={c}>
                  <button type="button" aria-pressed={on} onClick={() => f.toggle("categories", c)} className="flex min-h-[52px] w-full items-center gap-3 border-b border-gray-100 text-right">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${on ? "bg-ink text-white" : "bg-gray-100"}`}><Icon size={20} strokeWidth={1.75} /></span>
                    <span className={`flex-1 text-body ${on ? "font-demibold" : ""}`}>{c}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Acc>
        <Acc id="where" open={open} setOpen={setOpen} title="איפה?" summary={f.cities.length ? f.cities.join(", ") : f.maxKm ? `עד ${f.maxKm} ק"מ` : "כל הארץ"}>
          <div className="flex flex-wrap gap-2">{CITIES.map((c) => <Chip key={c} selected={f.cities.includes(c)} onClick={() => f.toggle("cities", c)}>{c}</Chip>)}</div>
          <h3 className="mb-2 mt-5 text-meta text-ink/65">מרחק</h3>
          <div className="flex flex-wrap gap-2">{DISTANCES.map((d) => <Chip key={d} selected={f.maxKm === d} onClick={() => f.set({ maxKm: f.maxKm === d ? null : d })}>{`עד ${d} ק"מ`}</Chip>)}</div>
        </Acc>
        <Acc id="cond" open={open} setOpen={setOpen} title="באיזה מצב?" summary={f.conditions.length ? f.conditions.join(", ") : "כל המצבים"}>
          <div className="flex flex-wrap gap-2">{CONDITIONS.map((c) => <Chip key={c} selected={f.conditions.includes(c)} onClick={() => f.toggle("conditions", c)}>{c}</Chip>)}</div>
        </Acc>
        <Acc id="sort" open={open} setOpen={setOpen} title="סדר תוצאות" summary={f.sort === "new" ? "חדש קודם" : "קרוב אליי"}>
          <div className="flex flex-wrap gap-2">
            <Chip selected={f.sort === "new"} onClick={() => f.set({ sort: "new" })}>חדש קודם</Chip>
            <Chip selected={f.sort === "near"} onClick={() => f.set({ sort: "near" })}>קרוב אליי</Chip>
          </div>
        </Acc>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-app items-center gap-4 bg-white px-gutter pb-safe pt-3 shadow-nav">
        <div className="flex w-full items-center gap-4 pb-3">
          <Button variant="link" onClick={f.clear}>ניקוי הכל</Button>
          <Button block onClick={go} aria-live="polite">{`הצגת ${n} חפצים`}</Button>
        </div>
      </div>
    </div>
  );
}

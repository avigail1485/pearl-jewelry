import { ChevronLeft } from "lucide-react";
import { useRef, useState } from "react";
import { useParallax, useScrollReveal } from "../lib/motion";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { CategoryTabs } from "../components/CategoryTabs";
import { Header } from "../components/Header";
import { Illustration } from "../components/Illustration";
import { Carousel } from "../components/ItemTile";
import { CATEGORIES } from "../lib/categories";
import { useFilters } from "../store/filters";
import { useAllItems, useItems } from "../store/items";
import { scrollToTop } from "../lib/scroll";
import { useUser } from "../store/user";

export default function Home() {
  const [cat, setCat] = useState("");
  const all = useAllItems().filter((i) => i.status === "active" && (!cat || i.category === cat));
  const viewedIds = useItems((s) => s.viewed);
  const city = useUser((s) => s.city);
  const setFilters = useFilters((s) => s.set);
  const nav = useNavigate();
  const viewed = viewedIds.map((id) => all.find((i) => i.id === id)).filter(Boolean) as typeof all;
  const near = [...all].filter((i) => i.distanceKm <= 15).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 12);
  const fresh = all.slice(0, 12);
  const byCat = CATEGORIES.map((c) => ({ c, items: all.filter((i) => i.category === c).slice(0, 12) })).filter((r) => r.items.length >= 2);
  const mainRef = useRef<HTMLElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  useScrollReveal(mainRef, [cat, all.length, viewed.length]);
  useParallax(artRef);
  const showAll = (categories: string[] = cat ? [cat] : []) => { setFilters({ categories, q: "", sort: "new", maxKm: null, cities: [], conditions: [] }); nav("/results"); };
  const Row = ({ title, items, onMore }: { title: string; items: typeof all; onMore: () => void }) => (
    <section className="mt-7">
      <button type="button" onClick={onMore} className="mb-3 inline-flex min-h-[44px] items-center gap-1 text-right">
        <h2 className="text-title font-demibold">{title}</h2>
        <ChevronLeft size={20} strokeWidth={2.25} aria-hidden />
      </button>
      <Carousel items={items} />
    </section>
  );

  return (
    <>
      <Header tabs={<CategoryTabs value={cat} onChange={(c) => { setCat(c); scrollToTop(); }} />} />
      <main ref={mainRef} className="px-gutter pb-10">
        {!cat && (
          <div ref={artRef} className="-mx-gutter mt-4 origin-top px-2" aria-hidden>
            <Illustration name="community" size="full" eager />
          </div>
        )}

        {fresh.length > 0 && <Row title="עלו עכשיו" items={fresh} onMore={() => showAll()} />}
        {near.length > 0 && <Row title={`קרוב אליך ב${city}`} items={near} onMore={() => { setFilters({ categories: cat ? [cat] : [], q: "", maxKm: 15, sort: "near", cities: [], conditions: [] }); nav("/results"); }} />}
        {viewed.length > 0 && <Row title="נצפו לאחרונה" items={viewed} onMore={() => showAll()} />}
        {!cat && byCat.map(({ c, items }) => <Row key={c} title={c} items={items} onMore={() => showAll([c])} />)}
        {all.length === 0 && <p className="mt-8 text-body">עוד אין כאן חפצים בקטגוריה הזאת.</p>}

        {all.length > 0 && <Button variant="secondary" block className="mt-9" onClick={() => showAll()}>לכל הפריטים</Button>}
      </main>
    </>
  );
}

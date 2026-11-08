import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { CategoryTabs } from "../components/CategoryTabs";
import { Header } from "../components/Header";
import { Illustration } from "../components/Illustration";
import { Carousel } from "../components/ItemTile";
import { CATEGORIES } from "../lib/categories";
import { Tag } from "../components/Tag";
import { useFilters } from "../store/filters";
import { useAllItems, useItems } from "../store/items";
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
      <Header tabs={<CategoryTabs value={cat} onChange={(c) => { setCat(c); window.scrollTo({ top: 0 }); }} />} />
      <main className="px-gutter pb-10">
        {!cat && (
          <Card className="mt-5 p-4">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="whitespace-nowrap text-title font-demibold">לתת זה לקבל</h2>
                <p className="mt-1 text-body">לוח קהילתי למסירת חפצים בחינם. מה שכבר לא צריך אתכם, מחכה למישהו אחר.</p>
              </div>
              <Illustration name="hello" size={96} />
            </div>
            <ol className="mt-3 flex items-center gap-1.5" aria-label="איך זה עובד">
              {["מצלמים", "מפרסמים", "מוסרים"].map((s, i) => (
                <li key={s} className="flex items-center gap-1.5">{i > 0 && <span aria-hidden className="text-meta">·</span>}<Tag>{s}</Tag></li>
              ))}
            </ol>
          </Card>
        )}

        {fresh.length > 0 && <Row title="עלו עכשיו" items={fresh} onMore={() => showAll()} />}
        {near.length > 0 && <Row title={`קרוב אליך ב${city}`} items={near} onMore={() => { setFilters({ categories: cat ? [cat] : [], q: "", maxKm: 15, sort: "near", cities: [], conditions: [] }); nav("/results"); }} />}
        {!cat && (
          <Card className="mt-8 flex items-center gap-3 p-4">
            <Illustration name="add-photo" size={110} />
            <div className="min-w-0 flex-1">
              <h2 className="text-title font-demibold">יש לכם משהו למסור?</h2>
              <p className="mt-1 text-body">צלמו, ואנחנו נסיר את הרקע ונמלא את הפרטים.</p>
              <Button variant="neon" size="sm" className="mt-3" onClick={() => nav("/give")}>למסור חפץ</Button>
            </div>
          </Card>
        )}
        {viewed.length > 0 && <Row title="נצפו לאחרונה" items={viewed} onMore={() => showAll()} />}
        {!cat && byCat.map(({ c, items }) => <Row key={c} title={c} items={items} onMore={() => showAll([c])} />)}
        {all.length === 0 && <p className="mt-8 text-body">עוד אין כאן חפצים בקטגוריה הזאת.</p>}

        {all.length > 0 && <Button variant="secondary" block className="mt-9" onClick={() => showAll()}>לכל החפצים</Button>}
      </main>
    </>
  );
}

import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { CategoryTabs } from "../components/CategoryTabs";
import { Header } from "../components/Header";
import { Illustration } from "../components/Illustration";
import { Carousel, ItemFeed } from "../components/ItemTile";
import { Tag } from "../components/Tag";
import { useFilters } from "../store/filters";
import { useAllItems, useItems } from "../store/items";
import { useUser } from "../store/user";

function SectionLink({ title, to }: { title: string; to: string }) {
  return (
    <Link to={to} className="mb-3 inline-flex min-h-[44px] items-center gap-1">
      <h2 className="text-title font-demibold">{title}</h2>
      <ChevronLeft size={20} strokeWidth={2.25} aria-hidden />
    </Link>
  );
}

export default function Home() {
  const [cat, setCat] = useState("");
  const all = useAllItems().filter((i) => i.status === "active" && (!cat || i.category === cat));
  const viewedIds = useItems((s) => s.viewed);
  const city = useUser((s) => s.city);
  const setFilters = useFilters((s) => s.set);
  const nav = useNavigate();
  const viewed = viewedIds.map((id) => all.find((i) => i.id === id)).filter(Boolean) as typeof all;
  const near = [...all].filter((i) => i.distanceKm <= 15).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 10);
  const feed = all.slice(0, 12);
  const showAll = () => { setFilters({ categories: cat ? [cat] : [], q: "" }); nav("/results"); };

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

        {viewed.length > 0 && (
          <section className="mt-7">
            <SectionLink title="נצפו לאחרונה" to="/results" />
            <Carousel items={viewed} />
          </section>
        )}

        {near.length > 0 && (
          <section className="mt-7">
            <SectionLink title={`קרוב אליך ב${city}`} to="/results?near=1" />
            <Carousel items={near} />
          </section>
        )}

        <section className="mt-8">
          <h2 className="mb-4 text-section font-light">עלו עכשיו</h2>
          {feed.length ? <ItemFeed items={feed} /> : <p className="text-body">עוד אין כאן חפצים בקטגוריה הזאת.</p>}
          {all.length > feed.length && <Button variant="secondary" block className="mt-8" onClick={showAll}>{`לכל ${all.length} החפצים`}</Button>}
        </section>
      </main>
    </>
  );
}

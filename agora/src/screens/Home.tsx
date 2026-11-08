import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { Header } from "../components/Header";
import { Illustration } from "../components/Illustration";
import { ItemGrid } from "../components/ItemTile";
import { ItemImage } from "../components/ItemImage";
import { Tag } from "../components/Tag";
import { useItems } from "../store/items";
import { useUser } from "../store/user";

function SectionHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="text-section font-light">{title}</h2>
      <Link to={to} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-body underline underline-offset-4">הכל</Link>
    </div>
  );
}

export default function Home() {
  const all = useItems((s) => s.all)().filter((i) => i.status === "active");
  const city = useUser((s) => s.city);
  const near = [...all].filter((i) => i.city === city || i.distanceKm <= 3).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 4);
  const fresh = all.slice(0, 6);

  return (
    <>
      <Header />
      <main className="px-gutter pb-8">
        <Card className="mt-4 p-4">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="whitespace-nowrap text-title font-demibold">לתת זה לקבל</h2>
              <p className="mt-1 text-body">לוח קהילתי למסירת חפצים בחינם, לשכנים שצריכים אותם.</p>
            </div>
            <Illustration name="hello" size={96} />
          </div>
          <ol className="mt-3 flex items-center gap-1.5" aria-label="איך זה עובד">
            {["מצלמים", "מפרסמים", "מוסרים"].map((s, i) => (
              <li key={s} className="flex items-center gap-1.5">{i > 0 && <span aria-hidden className="text-meta">·</span>}<Tag>{s}</Tag></li>
            ))}
          </ol>
        </Card>

        <section aria-labelledby="new-h" className="mt-7">
          <h2 id="new-h" className="sr-only">חדש באגורה</h2>
          <ul className="no-scrollbar -mx-gutter flex gap-4 overflow-x-auto px-gutter">
            {fresh.slice(0, 6).map((i) => (
              <li key={i.id} className="shrink-0">
                <Link to={`/item/${i.id}`} className="flex w-20 flex-col items-center gap-1.5 rounded-tile">
                  <ItemImage item={i} iconSize={32} className="h-20 w-20 rounded-full" />
                  <span className="w-full truncate text-center text-meta">{i.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-7">
          <SectionHeader title="באזור שלך" to="/results?near=1" />
          <ItemGrid items={near} />
        </section>
        <section className="mt-8">
          <SectionHeader title="עלו עכשיו" to="/results" />
          <ItemGrid items={fresh} />
        </section>
      </main>
    </>
  );
}

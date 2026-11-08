import { ChevronLeft, HelpCircle, LogOut, MapPin, MessageCircle } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { Illustration } from "../components/Illustration";
import { ItemGrid } from "../components/ItemTile";
import { Sheet } from "../components/Sheet";
import { CITIES } from "../lib/categories";
import { useItems } from "../store/items";
import { useUI } from "../store/ui";
import { useUser } from "../store/user";

function MenuRow({ icon, label, value, onClick, to }: { icon: ReactNode; label: string; value?: string; onClick?: () => void; to?: string }) {
  const cls = "flex min-h-[56px] w-full items-center gap-3 border-b border-gray-100 text-right";
  const inner = (<>{icon}<span className="flex-1 text-body">{label}</span>{value && <span className="text-meta text-ink/65">{value}</span>}<ChevronLeft size={20} strokeWidth={1.75} aria-hidden /></>);
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

function CommunityCard() {
  return (
    <Card className="overflow-hidden">
      <Illustration name="community" size="full" />
      <div className="p-4">
        <h2 className="text-title font-demibold">קהילה שנותנת</h2>
        <p className="mt-1 text-body">כל חפץ שעובר הלאה חוסך קנייה ומשמח שכנים.</p>
      </div>
    </Card>
  );
}

export default function Profile() {
  const { viewer, signedIn, signOut, city, setCity } = useUser();
  const askLogin = useUI((s) => s.askLogin);
  const live = useItems((s) => s.live);
  const nav = useNavigate();
  const [tab, setTab] = useState<"active" | "given">("active");
  const [cityOpen, setCityOpen] = useState(false);
  const mine = live.filter((i) => viewer?.id && i.ownerId === viewer.id);
  const active = mine.filter((i) => i.status === "active");
  const given = mine.filter((i) => i.status === "given");

  const menu = (
    <nav aria-label="תפריט" className="mt-6">
      <MenuRow icon={<MessageCircle size={22} strokeWidth={1.75} aria-hidden />} label="הודעות" to="/inbox" />
      <MenuRow icon={<MapPin size={22} strokeWidth={1.75} aria-hidden />} label="האזור שלי" value={city} onClick={() => setCityOpen(true)} />
      <MenuRow icon={<HelpCircle size={22} strokeWidth={1.75} aria-hidden />} label="מסירה בטוחה" onClick={() => nav("/help")} />
      {signedIn && <MenuRow icon={<LogOut size={22} strokeWidth={1.75} aria-hidden />} label="התנתקות" onClick={signOut} />}
    </nav>
  );

  return (
    <div className="min-h-[100dvh] pb-8 pt-safe">
      <header className="px-gutter pb-3 pt-5"><h1 className="text-section font-light">פרופיל</h1></header>
      <main className="px-gutter">
        {signedIn ? (
          <>
            <Card className="flex flex-col items-center p-6 text-center">
              <Avatar size={88} asButton={false} />
              <p className="mt-3 max-w-full truncate text-title font-demibold">{viewer?.name || "שלום!"}</p>
              <p className="text-meta text-ink/65">{city}</p>
            </Card>
            <div role="tablist" className="mt-6 flex gap-2">
              <Chip selected={tab === "active"} onClick={() => setTab("active")}>בלוח</Chip>
              <Chip selected={tab === "given"} onClick={() => setTab("given")}>נמסרו</Chip>
            </div>
            <div className="mt-4">
              {(tab === "active" ? active : given).length ? (
                <ItemGrid items={tab === "active" ? active : given} />
              ) : (
                <div className="rounded-tile bg-gray-100 p-5 text-center">
                  <p className="text-body">{tab === "active" ? "עוד אין לכם חפצים בלוח." : "עוד לא סימנתם חפץ כנמסר."}</p>
                  {tab === "active" && <Button variant="link" onClick={() => nav("/give")}>למסור חפץ</Button>}
                </div>
              )}
            </div>
            {menu}
            <div className="mt-6"><CommunityCard /></div>
          </>
        ) : (
          <>
            <Card className="flex items-center gap-4 p-4">
              <Avatar size={56} asButton={false} />
              <div className="flex-1">
                <h2 className="text-body font-demibold">אתם גולשים כאורחים</h2>
                <p className="text-meta">התחברו כדי למסור, לפנות למוסרים ולשמור בכל מכשיר.</p>
              </div>
            </Card>
            <Button block className="mt-4" onClick={() => askLogin()}>התחברות</Button>
            {menu}
            <div className="mt-6"><CommunityCard /></div>
          </>
        )}
      </main>
      <Sheet open={cityOpen} onClose={() => setCityOpen(false)} label="האזור שלי">
        <h2 className="text-section font-light">האזור שלי</h2>
        <div className="mt-4 flex flex-wrap gap-2">{CITIES.map((c) => <Chip key={c} selected={city === c} onClick={() => { setCity(c); setCityOpen(false); }}>{c}</Chip>)}</div>
      </Sheet>
    </div>
  );
}

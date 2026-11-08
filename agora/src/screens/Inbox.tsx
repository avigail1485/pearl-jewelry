import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { subscribeThreads } from "../api/messages";
import type { Thread } from "../api/types";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { Loading } from "../components/Loading";
import { TopBar } from "../components/TopBar";
import { usePersonName } from "../lib/hooks";
import { useItem } from "../store/items";
import { useUI } from "../store/ui";
import { useUser } from "../store/user";
import { ItemImage } from "../components/ItemImage";

const time = (t: number) => {
  const d = new Date(t), now = new Date();
  return d.toDateString() === now.toDateString() ? d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });
};

function Row({ t, me }: { t: Thread; me: string }) {
  const other = t.buyerId === me ? t.sellerId : t.buyerId;
  const name = usePersonName(t.demoSellerName ? undefined : other, t.demoSellerName || "מישהו מהקהילה");
  const item = useItem(t.itemId);
  return (
    <li>
      <Link to={`/chat/${t.id}`} className="flex items-center gap-3 border-b border-gray-100 py-3">
        {item ? <ItemImage item={item} iconSize={24} className="h-12 w-12 shrink-0 rounded-full" /> : <span className="h-12 w-12 shrink-0 rounded-full bg-gray-100" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-body font-demibold">{name} · {t.itemTitle}</p>
            <span className="shrink-0 text-meta text-ink/65">{time(t.updatedAt)}</span>
          </div>
          <p className="truncate text-meta text-ink/65">{t.lastText}</p>
        </div>
      </Link>
    </li>
  );
}

export default function Inbox() {
  const { viewer, signedIn } = useUser();
  const askLogin = useUI((s) => s.askLogin);
  const nav = useNavigate();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  useEffect(() => {
    if (!viewer?.id || !signedIn) return;
    let off = () => {};
    const timer = setTimeout(() => setThreads((t) => t ?? []), 10000);
    subscribeThreads(viewer.id, (t) => { clearTimeout(timer); setThreads(t); }).then((u) => (off = u));
    return () => { clearTimeout(timer); off(); };
  }, [viewer?.id, signedIn]);

  return (
    <div className="min-h-[100dvh] pb-8">
      <TopBar title="הודעות" />
      <main className="px-gutter">
        {!signedIn ? (
          <EmptyState name="verified" size={130} title="ההודעות שלכם מחכות כאן" text="התחברו כדי לפנות למוסרים ולקבל תשובות.">
            <Button block onClick={() => askLogin()}>התחברות</Button>
          </EmptyState>
        ) : threads === null ? <Loading /> : threads.length === 0 ? (
          <EmptyState name="hello" size={150} title="עוד אין הודעות" text="מצאו חפץ שאהבתם ופנו למוסר. השיחה תופיע כאן.">
            <Button block onClick={() => nav("/")}>לגלות חפצים</Button>
          </EmptyState>
        ) : <ul>{threads.map((t) => <Row key={t.id} t={t} me={viewer!.id!} />)}</ul>}
      </main>
    </div>
  );
}

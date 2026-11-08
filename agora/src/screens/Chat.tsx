import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getThread, sendMessage, subscribeMessages } from "../api/messages";
import type { Message, Thread } from "../api/types";
import { Loading } from "../components/Loading";
import { TopBar } from "../components/TopBar";
import { usePersonName } from "../lib/hooks";
import { useUser } from "../store/user";

export default function Chat() {
  const { tid = "" } = useParams();
  const me = useUser((s) => s.viewer?.id) ?? "";
  const [thread, setThread] = useState<Thread | null>(null);
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const other = thread ? (thread.buyerId === me ? thread.sellerId : thread.buyerId) : undefined;
  const name = usePersonName(thread?.demoSellerName ? undefined : other, thread?.demoSellerName || "מישהו מהקהילה");

  useEffect(() => {
    getThread(tid).then(setThread);
    let off = () => {};
    subscribeMessages(tid, setMsgs).then((u) => (off = u));
    return () => off();
  }, [tid]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs?.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !me) return;
    setText("");
    await sendMessage(tid, me, t);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar title={<span className="block truncate">{name}{thread && <Link to={`/item/${thread.itemId}`} className="block truncate text-meta font-light text-ink/65 underline underline-offset-4">{thread.itemTitle}</Link>}</span>} />
      <main className="flex-1 px-gutter pb-28" aria-live="polite">
        {msgs === null ? <Loading /> : (
          <ul className="flex flex-col gap-2 py-2">
            {msgs.map((m) => {
              const mine = m.from === me;
              return (
                <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <p className={`max-w-[78%] rounded-tile px-4 py-2 text-body ${mine ? "rounded-bl-[4px] bg-ink text-white" : "rounded-br-[4px] bg-gray-100"}`}>
                    <span className="sr-only">{mine ? "אתם: " : `${name}: `}</span>{m.text}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={end} />
      </main>
      <form onSubmit={send} className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-app items-center gap-2 bg-white px-gutter pb-safe pt-3 shadow-nav">
        <div className="flex w-full items-center gap-2 pb-3">
          <label htmlFor="chat-in" className="sr-only">הודעה</label>
          <input id="chat-in" value={text} onChange={(e) => setText(e.target.value)} placeholder="כתבו הודעה…" className="h-11 flex-1 rounded-btn bg-gray-100 px-4 text-body" />
          <button type="submit" aria-label="שליחה" disabled={!text.trim()} className="tap inline-flex items-center justify-center rounded-btn bg-ink text-white disabled:opacity-40">
            <Send size={20} strokeWidth={1.75} className="-scale-x-100" />
          </button>
        </div>
      </form>
    </div>
  );
}

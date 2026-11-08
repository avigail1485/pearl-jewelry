import { getDB } from "./platform";
import type { Message, Thread } from "./types";

export async function subscribeThreads(me: string, cb: (t: Thread[]) => void) {
  const db = await getDB();
  if (!db) { cb([]); return () => {}; }
  return db.collection("threads").where("participants", "array-contains", me).onSnapshot(
    (s) => cb(s.docs.map((d) => ({ ...(d.data() as Thread), id: d.id })).sort((a, b) => b.updatedAt - a.updatedAt)),
    () => cb([]),
  );
}

export async function subscribeMessages(threadId: string, cb: (m: Message[]) => void) {
  const db = await getDB();
  if (!db) { cb([]); return () => {}; }
  return db.collection(`threads/${threadId}/messages`).orderBy("at", "asc").limit(500).onSnapshot(
    (s) => cb(s.docs.map((d) => ({ ...(d.data() as Message), id: d.id }))),
    () => cb([]),
  );
}

export async function getThread(threadId: string): Promise<Thread | null> {
  const db = await getDB();
  const s = await db?.doc(`threads/${threadId}`).get().catch(() => null);
  return s?.exists ? ({ ...(s.data() as Thread), id: threadId }) : null;
}

/** Opens (or reuses) the thread between a buyer and an item's giver and sends a message. */
export async function startThread(opts: {
  me: string; itemId: string; itemTitle: string; sellerId: string; demoSellerName?: string; text: string;
}): Promise<string> {
  const db = await getDB();
  if (!db) throw new Error("no-db");
  const id = `${opts.itemId}__${opts.me}`.replace(/[^A-Za-z0-9_-]/g, "_");
  const ref = db.doc(`threads/${id}`);
  const now = Date.now();
  const existing = await ref.get();
  const base: Thread = {
    id, itemId: opts.itemId, itemTitle: opts.itemTitle,
    participants: [opts.me, opts.sellerId], buyerId: opts.me, sellerId: opts.sellerId,
    lastText: opts.text, updatedAt: now,
    ...(opts.demoSellerName ? { demoSellerName: opts.demoSellerName } : {}),
  };
  if (existing.exists) await ref.update({ lastText: opts.text, updatedAt: now });
  else await ref.set(base as unknown as Record<string, unknown>);
  await sendMessage(id, opts.me, opts.text, !!opts.demoSellerName, opts.sellerId);
  return id;
}

export async function sendMessage(threadId: string, from: string, text: string, demoSeller = false, sellerId = "") {
  const db = await getDB();
  if (!db) return;
  const at = Date.now();
  await db.collection(`threads/${threadId}/messages`).doc().set({ from, text, at });
  await db.doc(`threads/${threadId}`).update({ lastText: text, updatedAt: at });
  // Demo givers are not real people: answer with a short automatic reply.
  if (demoSeller && sellerId) {
    setTimeout(async () => {
      const reply = "תודה על הפנייה! החפץ עדיין זמין. מתי נוח לכם לאסוף?";
      const t = Date.now();
      await db.collection(`threads/${threadId}/messages`).doc().set({ from: sellerId, text: reply, at: t });
      await db.doc(`threads/${threadId}`).update({ lastText: reply, updatedAt: t });
    }, 2500);
  }
}

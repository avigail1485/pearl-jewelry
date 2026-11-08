// Items API. The demo catalogue (real listings from agora.co.il, watermark removed) ships with
// the app; items people publish live in the shared `items` collection, full photos in `photos/<id>`.
import demo from "../data/items.json";
import { getDB } from "./platform";
import type { Item } from "./types";

const loadedAt = Date.now();
export const demoItems: Item[] = (demo as any[]).map((d) => ({
  ...d,
  distanceKm: 0,
  createdAt: loadedAt - d.minutesAgo * 60_000,
  status: "active",
  demo: true,
}));

export async function subscribeItems(cb: (items: Item[]) => void): Promise<() => void> {
  const db = await getDB();
  if (!db) { cb([]); return () => {}; }
  return db.collection("items").orderBy("createdAt", "desc").limit(500).onSnapshot(
    (s) => cb(s.docs.map((d) => ({ ...(d.data() as Item), id: d.id }))),
    () => cb([]),
  );
}

export async function getPhotos(itemId: string, count = 1): Promise<string[]> {
  const db = await getDB();
  if (!db) return [];
  const snaps = await Promise.all(Array.from({ length: count }, (_, i) => db.doc(`photos/${itemId}-${i}`).get().catch(() => null)));
  return snaps.map((s) => (s?.exists ? (s.data()?.image as string) : "")).filter(Boolean);
}

export async function publishItem(item: Omit<Item, "id">, photos: string[]): Promise<string> {
  const db = await getDB();
  if (!db) throw new Error("no-db");
  const ref = db.collection("items").doc();
  // One document per photo keeps each well under the database's size limit.
  for (let i = 0; i < photos.length; i++) await db.doc(`photos/${ref.id}-${i}`).set({ image: photos[i], ownerId: item.ownerId ?? null });
  await ref.set({ ...item, photoCount: photos.length } as unknown as Record<string, unknown>);
  return ref.id;
}

export async function markGiven(itemId: string) {
  const db = await getDB();
  await db?.doc(`items/${itemId}`).update({ status: "given" });
}

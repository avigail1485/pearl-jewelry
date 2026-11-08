// Automatic recognition of a photo (give flow step 1, and search by photo),
// through the host's "ask Claude" capability. Absent → the flows still work manually.
import { CATEGORIES, CONDITIONS } from "./categories";
import { dataUrlToBlob } from "./image";
import { getBridge } from "../api/platform";

export interface Guess { title: string; category: string; condition: string; description: string }

let sampleP: Promise<any> | null = null;
function getSample() {
  if (!sampleP) sampleP = getBridge().then((c) => (c ? c.use("sample").catch(() => null) : null));
  return sampleP;
}

export async function recognize(photo: string): Promise<Guess | null> {
  try {
    const sample = await getSample();
    if (!sample) return null;
    const lim = await sample.limits?.().catch(() => null);
    if (!lim?.images) return null;
    const blob = await dataUrlToBlob(photo);
    const out = await sample.json(
      `The attached image is a photo of a second-hand household object that someone wants to give away for free on a Hebrew community board.
Return JSON only: {"title": short Hebrew name of the object (2-4 words), "category": one of ${JSON.stringify(CATEGORIES)}, "condition": one of ${JSON.stringify(CONDITIONS)}, "description": one short neutral Hebrew sentence describing the object}.
If the photo does not show an object, return {"title":"","category":"אחר","condition":"מצב טוב","description":""}.`,
      { images: [blob], modelTier: "quick" },
    );
    if (!out || typeof out !== "object") return null;
    return {
      title: String(out.title || "").slice(0, 40),
      category: CATEGORIES.includes(out.category) ? out.category : "אחר",
      condition: CONDITIONS.includes(out.condition) ? out.condition : "מצב טוב",
      description: String(out.description || "").slice(0, 200),
    };
  } catch {
    return null;
  }
}

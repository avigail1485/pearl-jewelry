// Automatic recognition of the item in a photo (give flow step 1, and search by photo),
// through the host's "ask Claude" capability. Fields are filled from the answer; when the
// capability is unavailable the flows still work by hand.
import { getBridge } from "../api/platform";
import { CATEGORIES, CONDITIONS, SIZES } from "./categories";
import { dataUrlToBlob } from "./image";

export interface Guess { title: string; category: string; condition: string; size: string; description: string }
export type RecognizeResult = { ok: true; guess: Guess } | { ok: false; reason: "unavailable" | "declined" | "unclear" | "error" };

let sampleP: Promise<any> | null = null;
function getSample() {
  if (!sampleP) sampleP = getBridge().then((c) => (c ? c.use("sample").catch(() => null) : null));
  return sampleP;
}

const PROMPT = `You help people post second-hand items they give away for free on "אגורה", an Israeli community board. The attached photo(s) show ONE item someone wants to give away.

Identify the main item and answer in Hebrew, the way a person would title a listing (short and natural, e.g. "ספה תלת־מושבית", "עגלת תינוק", "מקרר דו־דלתי", "שולחן כתיבה מעץ").

Return JSON only, no prose:
{
 "title": "2-4 Hebrew words naming the item; add a visible brand only if its logo is clearly readable",
 "category": one of ${JSON.stringify(CATEGORIES)},
 "condition": one of ${JSON.stringify(CONDITIONS)} — judge only from what is visible; if no damage is visible use "מצב טוב", use "כמו חדש" only if it looks new or still packed, "מעט פגום" if there is visible damage, "לחומר גלם" if broken,
 "size": one of ${JSON.stringify(SIZES)} — "קטן" fits in one hand or a bag, "בינוני" can be carried by one person, "גדול" needs two people or a van,
 "description": "one or two short Hebrew sentences: what it is, colour, material and anything visible that matters to a person collecting it. No guesses about things you cannot see.",
 "clear": true if a single item is clearly visible, false if the photo is too dark, blurry or shows no item
}

Category guide: furniture, kitchenware, decor and home items → "ריהוט וכלי בית"; appliances and electronics → "מוצרי חשמל"; anything for babies or children → "לתינוק ולילד"; sports, music, games, hobbies, travel gear → "תחביבים וספורט"; books, DVDs, records → "ספרים ומדיה"; clothes, shoes, bags → "בגדים ואופנה"; everything else → "שונות".`;

export async function recognize(photos: string | string[]): Promise<RecognizeResult> {
  const list = (Array.isArray(photos) ? photos : [photos]).filter(Boolean).slice(0, 2);
  try {
    const sample = await getSample();
    if (!sample) return { ok: false, reason: "unavailable" };
    const lim = await sample.limits?.().catch(() => null);
    if (!lim?.images) return { ok: false, reason: "unavailable" };
    const images = await Promise.all(list.slice(0, lim.images.maxCount ?? 1).map(dataUrlToBlob));
    const out = await sample.json(PROMPT, { images, modelTier: "quick" });
    if (!out || typeof out !== "object" || out.clear === false || !out.title) return { ok: false, reason: "unclear" };
    return {
      ok: true,
      guess: {
        title: String(out.title).trim().slice(0, 40),
        category: (CATEGORIES as readonly string[]).includes(out.category) ? out.category : "שונות",
        condition: (CONDITIONS as readonly string[]).includes(out.condition) ? out.condition : "מצב טוב",
        size: (SIZES as readonly string[]).includes(out.size) ? out.size : "בינוני",
        description: String(out.description || "").trim().slice(0, 300),
      },
    };
  } catch (e: any) {
    return { ok: false, reason: e?.code === "not_granted" ? "declined" : "error" };
  }
}

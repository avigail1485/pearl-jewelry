// Every locality recognised by the State of Israel (data.gov.il), with coordinates from Wikidata
// where they exist. Used for the area picker and for "how far is it" on the board.
import raw from "../data/cities.json";
import rankRaw from "../data/city-rank.json";

const RANK = rankRaw as Record<string, number>;

export const CITY_COORDS = raw as unknown as Record<string, [number, number] | null>;
export const CITY_LIST = Object.keys(CITY_COORDS).sort((a, b) => a.localeCompare(b, "he"));

const strip = (s: string) => s.replace(/["'״׳()\-–־\s]/g, "").replace(/יי/g, "י").replace(/וו/g, "ו").replace(/קריית/g, "קרית");

/** Places whose name starts with what was typed first, then places that contain it. */
export function suggestCities(q: string, limit = 8): string[] {
  const t = strip(q.trim());
  if (!t) return [];
  const starts: string[] = [], words: string[] = [], inside: string[] = [];
  for (const c of CITY_LIST) {
    const n = strip(c);
    if (n.startsWith(t)) starts.push(c);
    else if (c.split(/[\s-]/).some((w) => strip(w).startsWith(t))) words.push(c);
    else if (n.includes(t)) inside.push(c);
  }
  const byRank = (a: string, b: string) => (RANK[a] ?? 3000) - (RANK[b] ?? 3000) || a.length - b.length || a.localeCompare(b, "he");
  return [...starts.sort(byRank), ...words.sort(byRank), ...inside.sort(byRank)].slice(0, limit);
}

export const isCity = (c: string) => c in CITY_COORDS;

export function distanceKm(a: string, b: string): number | null {
  const p = CITY_COORDS[a], q = CITY_COORDS[b];
  if (!p || !q) return null;
  if (a === b) return 0.8;
  const R = 6371, r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(q[0] - p[0]), dLon = r(q[1] - p[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(p[0])) * Math.cos(r(q[0])) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

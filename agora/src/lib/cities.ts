// Approximate city centres, for "how far is it" on the board.
export const CITY_COORDS: Record<string, [number, number]> = {
  "רמת גן": [32.068, 34.824], "תל אביב-יפו": [32.08, 34.78], "גבעתיים": [32.072, 34.81], "בני ברק": [32.084, 34.834],
  "פתח תקווה": [32.087, 34.887], "ראשון לציון": [31.964, 34.804], "אור יהודה": [32.03, 34.855], "ראש העין": [32.096, 34.957],
  "הרצליה": [32.166, 34.844], "רמת השרון": [32.146, 34.84], "רעננה": [32.184, 34.871], "כפר סבא": [32.175, 34.907],
  "הוד השרון": [32.15, 34.889], "נתניה": [32.328, 34.857], "נורדיה": [32.312, 34.893], "אלעד": [32.052, 34.951],
  "רחובות": [31.894, 34.809], "אשדוד": [31.804, 34.655], "ירושלים": [31.769, 35.214], "מעלה אדומים": [31.777, 35.3],
  "בית שמש": [31.747, 34.989], "חיפה": [32.794, 34.99], "קרית מוצקין": [32.837, 35.078], "קרית ביאליק": [32.833, 35.086],
  "צביה": [32.862, 35.252],
};
export const CITY_LIST = Object.keys(CITY_COORDS);

export function distanceKm(a: string, b: string): number | null {
  const p = CITY_COORDS[a], q = CITY_COORDS[b];
  if (!p || !q) return null;
  if (a === b) return 0.8;
  const R = 6371, r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(q[0] - p[0]), dLon = r(q[1] - p[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(p[0])) * Math.cos(r(q[0])) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

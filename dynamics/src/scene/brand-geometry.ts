import patternSvg from '../../public/assets/brand/brand-pattern.svg?raw';

/** נתוני גרפיקת המותג, נקראים ישירות מהקובץ. אין מסלול אחר. */
export interface PatternShape { d: string; fill: string; opacity: number }
export interface PatternData {
  width: number;
  height: number; // החלק הגרפי (בלי השוליים הכהים בתחתית)
  fills: PatternShape[]; // כתמי הצבע (בלי מלבן הרקע)
  lines: string[]; // 4 הקווים הלבנים
  mainLine: string; // קו המירוץ הראשי
}

let cache: PatternData | null = null;

export function patternData(): PatternData {
  if (cache) return cache;
  const doc = new DOMParser().parseFromString(patternSvg, 'image/svg+xml');
  const paths = [...doc.querySelectorAll('path')];
  const lines = paths.filter((p) => p.getAttribute('stroke') === 'white').map((p) => p.getAttribute('d')!);
  const fills = paths
    .filter((p) => p.getAttribute('fill') && p.getAttribute('fill') !== 'none' && !p.getAttribute('d')!.startsWith('M595.27 0H0V841'))
    .map((p) => ({ d: p.getAttribute('d')!, fill: p.getAttribute('fill')!, opacity: Number(p.getAttribute('opacity') ?? 1) }));
  // הקו הראשי: הארוך מבין הקווים הלבנים (M240.66 -2.1, עיקול ה-S המלא)
  const mainLine = lines.find((d) => d.startsWith('M240.66')) ?? lines[0];
  cache = { width: 596, height: 714.48, fills, lines, mainLine };
  return cache;
}

/**
 * מיפוי מרחב הגרפיקה למסך. במסך רוחבי הגרפיקה מסובבת ב-90° כך שקו המירוץ
 * נכנס מימין ויוצא משמאל, בכיוון הקריאה. במסך עומד היא נשארת זקופה.
 */
export function patternMatrix(w: number, h: number, zoom = 1): DOMMatrix {
  const { width: pw, height: ph } = patternData();
  const landscape = w > h;
  const bw = landscape ? ph : pw;
  const bh = landscape ? pw : ph;
  const s = Math.max(w / bw, h / bh) * zoom;
  let m = new DOMMatrix().translateSelf(w / 2, h / 2).scaleSelf(s, s).translateSelf(-bw / 2, -bh / 2);
  // (x,y) → (ph - y, x): ההתחלה (למעלה בגרפיקה) עוברת לצד ימין
  if (landscape) m = m.multiplySelf(new DOMMatrix([0, 1, -1, 0, ph, 0]));
  return m;
}

/** מילון משכים ו-easing יחיד. כניסות חדות, עצירות רכות, כמו בלימה. */
export const DUR = {
  snap: 0.16,
  short: 0.32,
  base: 0.64,
  long: 1.2,
  ignitionHold: 1.4,
  idleToNeutral: 2,
  overviewRise: 4.5,
} as const;

/** CustomEase-שווה ערך בלי תוסף: cubic-bezier כפונקציה. */
const bezier = (x1: number, y1: number, x2: number, y2: number) => (t: number) => {
  // ניוטון-רפסון ל-x(t)=t
  let u = t;
  for (let i = 0; i < 6; i++) {
    const x = 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u ** 2 * x2 + u ** 3 - t;
    const dx = 3 * (1 - u) ** 2 * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u ** 2 * (1 - x2);
    if (Math.abs(dx) < 1e-6) break;
    u -= x / dx;
  }
  u = Math.min(1, Math.max(0, u));
  return 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u ** 2 * y2 + u ** 3;
};

export const EASE = {
  brake: bezier(0.16, 1, 0.3, 1),
  launch: bezier(0.7, 0, 0.84, 0),
  shift: bezier(0.9, 0, 0.1, 1),
} as const;

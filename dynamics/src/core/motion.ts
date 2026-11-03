import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

/** מילון משכים יחיד (שניות). */
export const DUR = {
  snap: 0.16,
  short: 0.32,
  base: 0.64,
  long: 1.2,
  draw: 2.4,
  ignitionHold: 1.4,
  idleToNeutral: 2,
  overviewRise: 4.5,
} as const;

/** Easing מותאם: כניסות חדות, עצירות רכות, כמו בלימה. אין ברירות מחדל. */
export const EASE = {
  brake: CustomEase.create('brake', 'M0,0 C0.16,1 0.3,1 1,1'),
  launch: CustomEase.create('launch', 'M0,0 C0.7,0 0.84,0 1,1'),
  shift: CustomEase.create('shift', 'M0,0 C0.9,0 0.1,1 1,1'),
  /** קו שנמתח: יציאה איטית, תאוצה, ונחיתה ארוכה. */
  draw: CustomEase.create('draw', 'M0,0 C0.45,0 0.12,1 1,1'),
} as const;

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => matchMedia('(pointer: fine)').matches;

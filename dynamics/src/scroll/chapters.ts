/** מקור אמת יחיד לאורכי הפרקים (סעיף 5). vh = אחוזי גובה מסך. */
export type ChapterId =
  | 'hero' | 'lights' | 'launch'
  | 'gear1' | 'shift1' | 'gear2' | 'shift2' | 'gear3' | 'shift3' | 'gear4' | 'shift4' | 'gear5'
  | 'straight' | 'overview' | 'finish';

export interface Chapter { id: ChapterId; vh: number; gear?: 1 | 2 | 3 | 4 | 5; shift?: boolean }

export const CHAPTERS: readonly Chapter[] = [
  { id: 'hero', vh: 150 },
  { id: 'lights', vh: 150 },
  { id: 'launch', vh: 50 },
  { id: 'gear1', vh: 300, gear: 1 },
  { id: 'shift1', vh: 60, shift: true },
  { id: 'gear2', vh: 300, gear: 2 },
  { id: 'shift2', vh: 60, shift: true },
  { id: 'gear3', vh: 350, gear: 3 },
  { id: 'shift3', vh: 60, shift: true },
  { id: 'gear4', vh: 350, gear: 4 },
  { id: 'shift4', vh: 60, shift: true },
  { id: 'gear5', vh: 300, gear: 5 },
  { id: 'straight', vh: 150 },
  { id: 'overview', vh: 150 },
  { id: 'finish', vh: 100 },
] as const;

export const TOTAL_VH = CHAPTERS.reduce((s, c) => s + c.vh, 0);

/** טווח כל פרק כחלק מ-0..1 של המסע. */
export const CHAPTER_RANGES = (() => {
  let acc = 0;
  return CHAPTERS.map((c) => {
    const start = acc / TOTAL_VH;
    acc += c.vh;
    return { ...c, start, end: acc / TOTAL_VH };
  });
})();

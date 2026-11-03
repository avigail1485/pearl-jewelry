import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { reducedMotion } from '../core/motion';

gsap.registerPlugin(ScrollTrigger);

/** מקור אמת אחד: Lenis מזין את ScrollTrigger, והכול רץ על gsap.ticker. אין RAF נוסף. */
export const scrollState = { progress: 0, velocity: 0, direction: 1 as 1 | -1 };

export function initSmoothScroll() {
  const lenis = new Lenis({
    autoRaf: false,
    lerp: reducedMotion() ? 1 : 0.1,
    smoothWheel: !reducedMotion(),
  });
  lenis.on('scroll', (l: Lenis) => {
    scrollState.progress = l.progress;
    scrollState.velocity = l.velocity;
    scrollState.direction = l.direction === -1 ? -1 : 1;
    ScrollTrigger.update();
  });
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

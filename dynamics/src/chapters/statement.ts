import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { reducedMotion } from '../core/motion';

/** משפט גדול שנצבע מילה אחר מילה לפי הגלילה. */
export async function initStatements() {
  await document.fonts.ready;
  document.querySelectorAll<HTMLElement>('[data-statement]').forEach((el) => {
    const split = SplitText.create(el, { type: 'words', aria: 'auto' });
    if (reducedMotion()) return;
    gsap.fromTo(split.words, { opacity: 0.14 }, {
      opacity: 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  });
}

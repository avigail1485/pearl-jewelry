import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DUR, EASE, reducedMotion } from '../core/motion';
import { mountBrandField } from '../ui/brand-field';

gsap.registerPlugin(ScrollTrigger, SplitText);

/** פתיחה: שדה הקווים, כניסת הכותרת וגלילה ראשונה. הטקסט קיים ב-DOM מהרגע הראשון. */
export async function initHero() {
  const hero = document.querySelector<HTMLElement>('.hero')!;
  const fieldHost = hero.querySelector<HTMLElement>('.brand-field')!;
  const field = mountBrandField(fieldHost);
  const reduce = reducedMotion();

  await document.fonts.ready;
  const title = hero.querySelector<HTMLElement>('.hero__title')!;
  const split = SplitText.create(title, { type: 'words', mask: 'words', aria: 'auto' });
  const domains = hero.querySelectorAll<HTMLElement>('.hero__domains span');
  const hint = hero.querySelector<HTMLElement>('.hero__hint')!;

  if (reduce) {
    field.play();
    return;
  }

  gsap.timeline({ defaults: { ease: EASE.brake } })
    .add(() => field.play())
    .from(split.words, { yPercent: 110, duration: DUR.long, stagger: { each: 0.07, from: 'start' } }, 0.25)
    .from(domains, { yPercent: 100, autoAlpha: 0, duration: DUR.base, stagger: 0.06 }, 0.75)
    .from(hint, { autoAlpha: 0, duration: DUR.base }, 1.3);

  // גלילה: השדה מתקרב, הכותרת מתרחקת למעלה. scrub = הגלילה היא הגז.
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: (st) => field.setScroll(st.progress),
  });
  gsap.to(hero.querySelector('.hero__copy'), {
    yPercent: -35,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });
}

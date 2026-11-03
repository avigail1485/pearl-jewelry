import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DUR, EASE, reducedMotion } from '../core/motion';
import { mountHeroCar } from './hero-car';

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * פתיחה: רכב על מסלול לילה, כניסת הכותרת, וגלילה פנימה.
 * הפתיחה ננעלת לאורך 150vh של גלילה: המצלמה נוסעת לתוך הסצנה, והכותרת מתרחקת ונעלמת.
 * הטקסט קיים ב-DOM מהרגע הראשון.
 */
export async function initHero() {
  const hero = document.querySelector<HTMLElement>('.hero')!;
  let car: Awaited<ReturnType<typeof mountHeroCar>> = null;
  let pending = 0;
  mountHeroCar(hero.querySelector<HTMLElement>('.hero-car')!).then((c) => {
    car = c;
    car?.setScroll(pending);
    (window as unknown as { __car?: typeof car }).__car = c;
  });
  const reduce = reducedMotion();

  await document.fonts.ready;
  const title = hero.querySelector<HTMLElement>('.hero__title')!;
  const split = SplitText.create(title, { type: 'words', mask: 'words', aria: 'auto' });
  const domains = hero.querySelectorAll<HTMLElement>('.hero__domains span');
  const hint = hero.querySelector<HTMLElement>('.hero__hint')!;
  const copy = hero.querySelector<HTMLElement>('.hero__copy')!;

  if (reduce) return;

  gsap.timeline({ defaults: { ease: EASE.brake } })
    .from(split.words, { yPercent: 110, duration: DUR.long, stagger: { each: 0.07, from: 'start' } }, 0.4)
    .from(domains, { yPercent: 100, autoAlpha: 0, duration: DUR.base, stagger: 0.06 }, 0.9)
    .from(hint, { autoAlpha: 0, duration: DUR.base }, 1.4);

  // גלילה פנימה: הפתיחה ננעלת, המצלמה נכנסת, הכותרת נשאבת לעומק ונעלמת
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: '+=150%',
      pin: true,
      scrub: true,
      onUpdate: (st) => { pending = st.progress; car?.setScroll(st.progress); },
    },
  });
  tl.to(copy, { scale: 1.7, autoAlpha: 0, filter: 'blur(10px)', ease: 'power2.in', duration: 0.5 }, 0)
    .to(hint, { autoAlpha: 0, duration: 0.15 }, 0)
    .to({}, { duration: 0.45 });
}

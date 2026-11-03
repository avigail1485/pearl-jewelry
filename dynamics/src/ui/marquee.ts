import { gsap } from 'gsap';
import { reducedMotion } from '../core/motion';
import { scrollState } from '../scroll/smooth';

/**
 * רצועות טקסט רצות. השורה העליונה נעה מימין לשמאל (כיוון הנסיעה), התחתונה הפוך.
 * מהירות הגלילה מאיצה אותן; גלילה למעלה הופכת כיוון, כמו רוורס.
 */
export function mountMarquees(root: ParentNode = document) {
  const rows = [...root.querySelectorAll<HTMLElement>('[data-marquee]')];
  if (reducedMotion()) return;
  const state = rows.map((row) => {
    const track = row.querySelector<HTMLElement>('.marquee__track')!;
    // משכפלים עד שהרצועה מכסה פעמיים את הרוחב
    const unit = track.innerHTML;
    while (track.scrollWidth < innerWidth * 2.2) track.insertAdjacentHTML('beforeend', unit);
    track.querySelectorAll('.marquee__item').forEach((el, i) => i > 0 && el.setAttribute('aria-hidden', 'true'));
    const dir = Number(row.dataset.marquee) || 1;
    return { track, dir, x: 0, unitW: 0 };
  });
  const measure = () => state.forEach((s) => {
    const first = s.track.querySelector<HTMLElement>('.marquee__item')!;
    s.unitW = first.offsetWidth;
  });
  measure();
  addEventListener('resize', measure);

  let boost = 0;
  gsap.ticker.add((_t, dt) => {
    const target = Math.min(Math.abs(scrollState.velocity) * 0.9, 40);
    boost += (target - boost) * 0.08;
    const sign = scrollState.direction;
    state.forEach((s) => {
      if (!s.unitW) return;
      // ב-RTL הרצועה מעוגנת לימין; x חיובי מזיז שמאלה
      s.x += (0.6 + boost) * s.dir * sign * (dt / 16.67);
      s.x = ((s.x % s.unitW) + s.unitW) % s.unitW;
      s.track.style.transform = `translate3d(${-s.x}px,0,0)`;
    });
  });
}

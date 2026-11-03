import { gsap } from 'gsap';
import { DUR, EASE, reducedMotion } from '../core/motion';
import { patternData, patternMatrix } from '../scene/brand-geometry';

/**
 * רקע הפתיחה: קווי המותג בלבד, בלי כתמים.
 * הקווים וקווי ה"הד" המקבילים שלהם נמתחים בכניסה, נושמים לאט,
 * נעים בפרלקסה לפי הסמן, ואור כתום רץ לאורך קו המירוץ הראשי.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const ECHOES = 5;

export function mountBrandField(host: HTMLElement) {
  const data = patternData();
  const reduce = reducedMotion();

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('brand-field__lines');
  svg.setAttribute('aria-hidden', 'true');
  const root = document.createElementNS(SVG_NS, 'g');
  svg.append(root);

  const cx = data.width / 2;
  const cy = data.height / 2;
  const layers: { g: SVGGElement; depth: number }[] = [];
  for (let k = ECHOES; k >= 0; k--) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.style.opacity = k === 0 ? '0.9' : String(0.36 - k * 0.055);
    data.lines.forEach((d) => {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('pathLength', '1');
      p.setAttribute('vector-effect', 'non-scaling-stroke');
      p.classList.add('bf-line');
      if (k === 0 && d === data.mainLine) p.classList.add('bf-line--main');
      g.append(p);
    });
    root.append(g);
    layers.push({ g, depth: k });
  }
  const runner = document.createElementNS(SVG_NS, 'path');
  runner.setAttribute('d', data.mainLine);
  runner.setAttribute('pathLength', '1');
  runner.setAttribute('vector-effect', 'non-scaling-stroke');
  runner.classList.add('bf-runner');
  layers.find((l) => l.depth === 0)!.g.append(runner);
  host.append(svg);

  let w = 0, h = 0, m = new DOMMatrix();
  const look = { x: 0, y: 0, zoom: 0, breath: 0 };

  const apply = () => {
    layers.forEach(({ g, depth }) => {
      const px = -look.x * (8 + depth * 12);
      const py = -look.y * (5 + depth * 9);
      const s = (1 + depth * (0.045 + look.breath * 0.012)) * (1 + look.zoom * (0.14 + depth * 0.03));
      const t = new DOMMatrix().translateSelf(px, py).multiplySelf(m)
        .translateSelf(cx, cy).scaleSelf(s, s).translateSelf(-cx, -cy);
      g.setAttribute('transform', `matrix(${t.a} ${t.b} ${t.c} ${t.d} ${t.e} ${t.f})`);
    });
  };
  const resize = () => {
    w = host.clientWidth;
    h = host.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    m = patternMatrix(w, h, 1.08);
    apply();
  };

  const lookX = gsap.quickTo(look, 'x', { duration: 1.6, ease: 'brake', onUpdate: apply });
  const lookY = gsap.quickTo(look, 'y', { duration: 1.6, ease: 'brake', onUpdate: apply });
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    lookX(((e.clientX - r.left) / r.width) * 2 - 1);
    lookY(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  const lines = svg.querySelectorAll<SVGPathElement>('.bf-line');
  const intro = gsap.timeline({ paused: true });
  if (reduce) {
    gsap.set(lines, { strokeDashoffset: 0 });
  } else {
    intro
      .fromTo(lines, { strokeDashoffset: 1 }, {
        strokeDashoffset: 0, duration: DUR.draw, ease: EASE.draw, stagger: { each: 0.04, from: 'end' },
      })
      .fromTo(runner, { strokeDashoffset: 1.08 }, {
        strokeDashoffset: -0.08, duration: 5.5, ease: 'none', repeat: -1, repeatDelay: 1.4,
      }, DUR.draw * 0.6)
      // נשימה: קווי ההד מתרחבים ומתכנסים לאט
      .to(look, { breath: 1, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1, onUpdate: apply }, 0);
  }

  resize();
  addEventListener('resize', resize);
  host.closest('section')?.addEventListener('pointermove', onMove);

  return {
    play: () => intro.play(),
    setScroll: (p: number) => { look.zoom = p; apply(); },
  };
}

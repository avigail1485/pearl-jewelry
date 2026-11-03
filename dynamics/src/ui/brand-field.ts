import { gsap } from 'gsap';
import { DUR, EASE, finePointer, reducedMotion } from '../core/motion';
import { patternData, patternMatrix } from '../scene/brand-geometry';

/**
 * רקע הפתיחה: שדה הקווים של המותג.
 * - קווי הגרפיקה וקווי "הד" מקבילים שלהם (כמו קווי גובה), נמתחים בכניסה ונעים בפרלקסה לפי הסמן.
 * - אור כתום רץ לאורך קו המירוץ הראשי.
 * - שובל הסמן חושף את כתמי הצבע של המותג. הכתמים מתכווצים ונעלמים לאט, עם קצה כתום דק.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const ECHOES = 4; // קווי הד לכל קו
const MAX_BLOBS = 260;

interface Blob { x: number; y: number; r: number; seed: number }

export function mountBrandField(host: HTMLElement) {
  const data = patternData();
  const reduce = reducedMotion();
  const fine = finePointer();

  // ---------- שכבת הקנבס: חשיפת הכתמים ----------
  const canvas = document.createElement('canvas');
  canvas.className = 'brand-field__reveal';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d')!;
  const fills = data.fills.map((f) => ({ ...f, path: new Path2D(f.d) }));
  const mainPath = new Path2D(data.mainLine);
  const linePaths = data.lines.map((d) => new Path2D(d));

  // ---------- שכבת ה-SVG: הקווים ----------
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('brand-field__lines');
  svg.setAttribute('aria-hidden', 'true');
  const root = document.createElementNS(SVG_NS, 'g');
  svg.append(root);

  const cx = data.width / 2;
  const cy = data.height / 2;
  const layers: { g: SVGGElement; depth: number; scale: number }[] = [];
  for (let k = ECHOES; k >= 0; k--) {
    const g = document.createElementNS(SVG_NS, 'g');
    const scale = 1 + k * 0.05;
    g.dataset.k = String(k);
    g.style.opacity = k === 0 ? '1' : String(0.42 - k * 0.08);
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
    layers.push({ g, depth: k, scale });
  }
  // האור שרץ על הקו הראשי
  const runner = document.createElementNS(SVG_NS, 'path');
  runner.setAttribute('d', data.mainLine);
  runner.setAttribute('pathLength', '1');
  runner.setAttribute('vector-effect', 'non-scaling-stroke');
  runner.classList.add('bf-runner');
  layers.find((l) => l.depth === 0)!.g.append(runner);

  host.append(canvas, svg);

  // ---------- מידות ----------
  let w = 0, h = 0, dpr = 1, m = new DOMMatrix();
  const resize = () => {
    w = host.clientWidth;
    h = host.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    m = patternMatrix(w, h, 1.08);
    applyLayers();
  };

  // ---------- פרלקסה ----------
  const look = { x: 0, y: 0, zoom: 0 }; // -1..1, והתקרבות מהגלילה
  const applyLayers = () => {
    layers.forEach(({ g, depth, scale }) => {
      const px = -look.x * (6 + depth * 10);
      const py = -look.y * (4 + depth * 8);
      const s = scale * (1 + look.zoom * (0.12 + depth * 0.03));
      const t = new DOMMatrix()
        .translateSelf(px, py)
        .multiplySelf(m)
        .translateSelf(cx, cy)
        .scaleSelf(s, s)
        .translateSelf(-cx, -cy);
      g.setAttribute('transform', `matrix(${t.a} ${t.b} ${t.c} ${t.d} ${t.e} ${t.f})`);
    });
  };
  const lookX = gsap.quickTo(look, 'x', { duration: 1.4, ease: 'brake', onUpdate: applyLayers });
  const lookY = gsap.quickTo(look, 'y', { duration: 1.4, ease: 'brake', onUpdate: applyLayers });

  // ---------- שובל ----------
  const blobs: Blob[] = [];
  const pointer = { x: 0, y: 0, has: false, last: 0 };
  let prev: { x: number; y: number } | null = null;
  const baseR = () => Math.max(72, Math.min(w, h) * 0.15);

  const stamp = (x: number, y: number, speed: number) => {
    const r = baseR() * (0.75 + Math.min(speed, 60) / 80);
    if (!prev) prev = { x, y };
    const dx = x - prev.x, dy = y - prev.y;
    const dist = Math.hypot(dx, dy);
    const step = r * 0.22;
    const n = Math.max(1, Math.ceil(dist / step));
    for (let i = 1; i <= n; i++) {
      blobs.push({ x: prev.x + (dx * i) / n, y: prev.y + (dy * i) / n, r, seed: Math.random() * 10 });
    }
    if (blobs.length > MAX_BLOBS) blobs.splice(0, blobs.length - MAX_BLOBS);
    prev = { x, y };
  };

  const onMove = (e: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (y < 0 || y > rect.height) return;
    const speed = prev ? Math.hypot(x - prev.x, y - prev.y) : 0;
    pointer.x = x; pointer.y = y; pointer.has = true; pointer.last = performance.now();
    if (e.pointerType === 'mouse' || e.buttons > 0 || e.pointerType === 'pen') stamp(x, y, speed);
    lookX((x / w) * 2 - 1);
    lookY((y / h) * 2 - 1);
  };
  const onLeave = () => { prev = null; };

  // ---------- ציור ----------
  const blobPath = (b: Blob, t: number, grow = 0) => {
    const p = new Path2D();
    const verts = 22;
    for (let i = 0; i <= verts; i++) {
      const a = (i / verts) * Math.PI * 2;
      const rr = (b.r + grow) * (1 + 0.14 * Math.sin(3 * a + t * 0.9 + b.seed) + 0.07 * Math.sin(5 * a - t * 1.3 + b.seed * 2));
      const px = b.x + Math.cos(a) * rr, py = b.y + Math.sin(a) * rr;
      if (i === 0) p.moveTo(px, py); else p.lineTo(px, py);
    }
    p.closePath();
    return p;
  };

  let visible = true;
  let auto = 0;
  const tick = (time: number, dt: number) => {
    if (!visible) return;
    const k = Math.pow(0.972, dt / 16.67);
    for (let i = blobs.length - 1; i >= 0; i--) {
      blobs[i].r *= k;
      if (blobs[i].r < 3) blobs.splice(i, 1);
    }

    // בלי סמן (מגע, או מנוחה ארוכה): האלומה נעה לבד לאט לאורך עקומה
    const idle = !pointer.has || performance.now() - pointer.last > 3500;
    if (idle && !reduce) {
      auto += dt / 1000;
      const x = w * (0.5 + 0.34 * Math.sin(auto * 0.42));
      const y = h * (0.5 + 0.26 * Math.sin(auto * 0.71 + 1.2));
      stamp(x, y, 8);
      if (!fine || !pointer.has) { lookX((x / w) * 2 - 1); lookY((y / h) * 2 - 1); }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!blobs.length) return;

    // קצה כתום דק
    const edge = new Path2D();
    const body = new Path2D();
    for (const b of blobs) {
      edge.addPath(blobPath(b, time, 1.5));
      body.addPath(blobPath(b, time));
    }
    ctx.fillStyle = '#E84B25';
    ctx.fill(edge, 'nonzero');

    ctx.save();
    ctx.clip(body, 'nonzero');
    ctx.fillStyle = '#1D1D1B';
    ctx.fillRect(0, 0, w, h);
    ctx.setTransform(new DOMMatrix().scaleSelf(dpr, dpr).multiplySelf(m));
    for (const f of fills) {
      ctx.globalAlpha = f.opacity;
      ctx.fillStyle = f.fill === '#E84A23' ? '#E84B25' : f.fill === 'black' ? '#000000' : '#575756';
      ctx.fill(f.path);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#FFFFFF';
    const unit = 1 / Math.hypot(m.a, m.b);
    ctx.lineWidth = unit;
    linePaths.forEach((p) => ctx.stroke(p));
    ctx.lineWidth = 3 * unit;
    ctx.stroke(mainPath);
    ctx.restore();
  };

  // ---------- כניסה ----------
  const lines = svg.querySelectorAll<SVGPathElement>('.bf-line');
  const intro = gsap.timeline({ paused: true });
  if (reduce) {
    gsap.set(lines, { strokeDashoffset: 0 });
  } else {
    intro
      .fromTo(lines, { strokeDashoffset: 1 }, {
        strokeDashoffset: 0,
        duration: DUR.draw,
        ease: EASE.draw,
        stagger: { each: 0.05, from: 'end' },
      })
      .fromTo(runner, { strokeDashoffset: 1.08 }, {
        strokeDashoffset: -0.08,
        duration: 5.5,
        ease: 'none',
        repeat: -1,
        repeatDelay: 1.6,
      }, DUR.draw * 0.6);
  }

  // ---------- חיבורים ----------
  resize();
  addEventListener('resize', resize);
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerdown', onMove);
  host.addEventListener('pointerleave', onLeave);
  host.addEventListener('pointerup', onLeave);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
  io.observe(host);
  if (!reduce) gsap.ticker.add(tick);

  return {
    play: () => intro.play(),
    /** 0..1 התקדמות הגלילה בתוך הפתיחה */
    setScroll: (p: number) => { look.zoom = p; applyLayers(); },
    destroy: () => {
      gsap.ticker.remove(tick);
      removeEventListener('resize', resize);
      io.disconnect();
      intro.kill();
      canvas.remove(); svg.remove();
    },
  };
}

import * as THREE from 'three';
import { gsap } from 'gsap';
import { finePointer, reducedMotion } from '../core/motion';
import { scrollState } from '../scroll/smooth';
import { buildPhotoCar } from '../scene/car-photo';

/**
 * הרכב במרכז הפתיחה, פוטוריאליסטי ומתפקד כמו רכב אמיתי:
 * - הגלילה היא הגז: הגלגלים מסתובבים לפי מהירות הגלילה, עם טשטוש תנועה.
 * - מתלים: בהאצה האף מתרומם, בבלימה הוא צולל, וחוזר בקפיץ מרוסן.
 * - פנסים דולקים. לחיצה על הרכב = לחיצה על הגז.
 */
export async function mountHeroCar(host: HTMLElement) {
  const reduce = reducedMotion();
  const fine = finePointer();

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    host.classList.add('no-webgl');
    return null;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = 'hero-car__canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const car = await buildPhotoCar(new URL('/assets/car/car.webp', location.href).href);

  const rig = new THREE.Group();
  rig.add(car.root);
  scene.add(rig);

  const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 100);

  // ---------- מידות ומצלמה ----------
  let w = 1, h = 1, dpr = 1;
  const resize = () => {
    w = host.clientWidth; h = host.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const landscape = w > h;
    const frac = landscape ? 0.62 : 0.96;
    const L = 5.0;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = L / (frac * 2 * tanH * camera.aspect);
    const visH = 2 * dist * tanH;
    // מבט ישר מהצד (בלי הטיה, כדי לא לעוות את התמונה); הרכב מעט מעל המרכז
    const y = 0.62 - visH * (landscape ? 0.13 : 0.1);
    camera.position.set(0, y, dist);
    camera.lookAt(0, y, 0);
    camera.updateProjectionMatrix();
  };

  // ---------- קלט ----------
  const look = { x: 0, y: 0 };
  const pointer = { inside: false, last: -1e9 };
  const lookX = gsap.quickTo(look, 'x', { duration: 1.4, ease: 'brake' });
  const lookY = gsap.quickTo(look, 'y', { duration: 1.4, ease: 'brake' });
  const section = host.closest('section') ?? host;
  section.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    pointer.inside = true; pointer.last = performance.now();
    lookX((x / r.width) * 2 - 1); lookY((y / r.height) * 2 - 1);
  });
  section.addEventListener('pointerleave', () => { pointer.inside = false; });

  // ---------- פיזיקה קטנה ----------
  let scrollP = 0;
  let spin = 0;
  let speed = 0; // יחידות לשנייה, מוחלק
  let prevSpeed = 0;
  const pitch = { x: 0, v: 0 };
  const lightLevel = { v: 0 };
  const rev = { boost: 0 };
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);

  // לחיצה = גז: הגלגלים מסתחררים, הפנסים מהבהבים, האף מתרומם
  renderer.domElement.addEventListener('pointerdown', () => {
    gsap.fromTo(rev, { boost: 1 }, { boost: 0, duration: 1.6, ease: 'brake', overwrite: true });
    gsap.fromTo(lightLevel, { v: 1.6 }, { v: 1, duration: 0.6, ease: 'brake' });
  });
  gsap.to(lightLevel, { v: 1, duration: 1.2, delay: 0.8, ease: 'brake' });

  const tick = (time: number, dtMs: number) => {
    if (!visible) return;
    const dt = Math.min(dtMs, 50) / 1000;

    // מהירות: גלילה + גז
    const target = scrollState.velocity * 0.9 + rev.boost * 9;
    speed += (target - speed) * Math.min(1, dt * 6);
    const accel = (speed - prevSpeed) / Math.max(dt, 1e-3);
    prevSpeed = speed;

    // גלגלים: ω = v / r. נסיעה שמאלה = סיבוב נגד כיוון השעון
    const omega = speed / 0.39;
    spin += omega * dt;
    car.setWheelAngle(-spin, THREE.MathUtils.clamp(Math.abs(omega) * 0.018, 0, 0.9));

    // מתלים: קפיץ מרוסן; האצה מרימה את האף, בלימה מורידה אותו
    const pitchTarget = THREE.MathUtils.clamp(-accel * 0.0009, -0.012, 0.012);
    pitch.v += ((pitchTarget - pitch.x) * 140 - pitch.v * 14) * dt;
    pitch.x += pitch.v * dt;
    car.body.rotation.z = reduce ? 0 : pitch.x;
    const idle = reduce ? 0 : Math.sin(time * 42) * 0.0011 * (1 - Math.min(Math.abs(speed) / 6, 1));
    car.body.position.y = idle - Math.abs(pitch.x) * 0.4;

    // פרלקסה ויציאה בגלילה
    rig.position.x = look.x * 0.06 - scrollP * 2.6;
    rig.position.y = -look.y * 0.025;

    car.setLights(lightLevel.v);

    // בלי סמן (מגע): הטיה איטית מעצמה
    if (!fine && !reduce && (!pointer.inside || performance.now() - pointer.last > 3000)) lookX(Math.sin(time * 0.3) * 0.5);

    renderer.render(scene, camera);
  };

  resize();
  addEventListener('resize', resize);
  if (reduce) {
    car.setLights(1);
    renderer.render(scene, camera);
  } else {
    gsap.ticker.add(tick);
  }

  return {
    canvas: renderer.domElement,
    setScroll: (p: number) => { scrollP = p; if (reduce) renderer.render(scene, camera); },
    stats: () => renderer.info.render,
  };
}

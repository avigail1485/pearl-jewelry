import * as THREE from 'three';
import { gsap } from 'gsap';
import { finePointer, reducedMotion } from '../core/motion';
import { scrollState } from '../scroll/smooth';
import { buildPhotoCar } from '../scene/car-photo';
import { buildTrack } from '../scene/track';
import { buildBrakeGlow, buildSmoke, buildSparks } from '../scene/fx';

/**
 * הפתיחה: רכב פוטוריאליסטי על מסלול לילה, מבצע הופעה בלולאה:
 * ברנאאוט עם עשן → זינוק (האף מתרומם) → מהירות שיא עם טשטוש → בלימה חזקה עם ניצוצות וזוהר בלמים → רוורס קצר.
 * הגלילה נכנסת פנימה: המצלמה נוסעת לתוך הסצנה עד תקריב של הרכב.
 * לחיצה על הרכב = גז.
 */
export async function mountHeroCar(host: HTMLElement) {
  const reduce = reducedMotion();
  const fine = finePointer();

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch {
    host.classList.add('no-webgl');
    return null;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor('#0b0a09', 1);
  renderer.domElement.className = 'hero-car__canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);

  const loader = new THREE.TextureLoader();
  const [car, backTex] = await Promise.all([
    buildPhotoCar(new URL('/assets/car/car.webp', location.href).href),
    loader.loadAsync(new URL('/assets/car/track-night.webp', location.href).href).then((t) => { t.colorSpace = THREE.SRGBColorSpace; return t; }),
  ]);

  const scene = new THREE.Scene();
  const track = buildTrack(backTex);
  scene.add(track.group);

  const rig = new THREE.Group(); // מיקום הרכב ביחס למצלמה
  rig.add(car.root);
  scene.add(rig);
  const smoke = buildSmoke();
  const sparks = buildSparks();
  const brakes = buildBrakeGlow([car.wheelBase.front, car.wheelBase.rear], car.wheelBase.radius);
  scene.add(smoke.object, sparks.object);
  car.root.add(brakes.object);

  const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 200);

  // ---------- מידות ----------
  let w = 1, h = 1, dpr = 1, baseDist = 15;
  const resize = () => {
    w = host.clientWidth; h = host.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const frac = w > h ? 0.6 : 0.95;
    const tanH = Math.tan(THREE.MathUtils.degToRad(20 / 2));
    baseDist = 5.0 / (frac * 2 * tanH * camera.aspect);
    smoke.setScale(h * 0.9);
  };

  // ---------- קלט ----------
  const look = { x: 0, y: 0 };
  const pointer = { inside: false, last: -1e9 };
  const lookX = gsap.quickTo(look, 'x', { duration: 1.6, ease: 'brake' });
  const lookY = gsap.quickTo(look, 'y', { duration: 1.6, ease: 'brake' });
  const section = host.closest('section') ?? host;
  section.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    pointer.inside = true; pointer.last = performance.now();
    lookX(((e.clientX - r.left) / r.width) * 2 - 1);
    lookY(((e.clientY - r.top) / r.height) * 2 - 1);
  });
  section.addEventListener('pointerleave', () => { pointer.inside = false; });

  const rev = { boost: 0 };
  const lightLevel = { v: 0 };
  renderer.domElement.addEventListener('pointerdown', () => {
    gsap.fromTo(rev, { boost: 1 }, { boost: 0, duration: 1.6, ease: 'brake', overwrite: true });
    gsap.fromTo(lightLevel, { v: 1.7 }, { v: 1, duration: 0.6, ease: 'brake' });
  });
  gsap.to(lightLevel, { v: 1, duration: 1.2, delay: 0.6, ease: 'brake' });

  // ---------- במאי ההופעה ----------
  const demo = { speed: 0, spinExtra: 0, smoke: 0, sparks: 0, brake: 0, shake: 0 };
  const show = gsap.timeline({ repeat: -1, paused: reduce, defaults: { ease: 'none' } });
  show
    .to({}, { duration: 1.4 }) // סרק
    // ברנאאוט: הגלגלים מסתחררים במקום, עשן
    .to(demo, { spinExtra: 46, smoke: 1, shake: 0.35, duration: 0.6, ease: 'power2.in' })
    .to({}, { duration: 1.6 })
    // זינוק
    .addLabel('launch')
    .to(demo, { spinExtra: 0, duration: 0.5, ease: 'power2.out' }, 'launch')
    .to(demo, { smoke: 0, duration: 1.1, ease: 'power1.out' }, 'launch')
    .to(demo, { speed: 36, duration: 2.8, ease: 'power2.out' }, 'launch')
    .to(demo, { shake: 0.7, duration: 1.2 }, 'launch')
    .to({}, { duration: 1.6 }) // מהירות שיא
    // בלימה חזקה
    .addLabel('brake')
    .to(demo, { speed: 0, duration: 1.7, ease: 'power3.out' }, 'brake')
    .to(demo, { brake: 1, duration: 0.15 }, 'brake')
    .to(demo, { sparks: 1, duration: 0.05 }, 'brake')
    .to(demo, { sparks: 0, duration: 0.9, ease: 'power2.in' }, 'brake+=0.1')
    .to(demo, { shake: 0.45, duration: 0.1 }, 'brake')
    .to(demo, { shake: 0, duration: 1.6 }, 'brake+=0.2')
    .to(demo, { brake: 0, duration: 1.8, ease: 'power1.in' }, 'brake+=1.2')
    // רוורס קצר וחזרה
    .to(demo, { speed: -3.2, duration: 0.7, ease: 'power2.inOut' }, '+=0.3')
    .to(demo, { speed: 0, duration: 0.8, ease: 'power2.out' }, '+=0.5');

  // ---------- פיזיקה ----------
  let scrollP = 0;
  let spin = 0, offset = 0, speed = 0, prevSpeed = 0;
  const pitch = { x: 0, v: 0 };
  const carX = { x: 0, v: 0 };
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);

  const tick = (time: number, dtMs: number) => {
    if (!visible) return;
    const dt = Math.min(dtMs, 50) / 1000;

    const target = demo.speed + scrollState.velocity * 0.6 + rev.boost * 9;
    speed += (target - speed) * Math.min(1, dt * 8);
    const accel = (speed - prevSpeed) / Math.max(dt, 1e-3);
    prevSpeed = speed;
    offset -= speed * dt; // העולם זז ימינה כשהרכב נוסע שמאלה

    // גלגלים
    const omega = speed / 0.39 + demo.spinExtra + rev.boost * 20;
    spin += omega * dt;
    car.setWheelAngle(-spin, THREE.MathUtils.clamp(Math.abs(omega) * 0.016, 0, 1.1));

    // מתלים: האצה מרימה את האף, בלימה מורידה; ברנאאוט מכווץ את האחור
    const pitchTarget = THREE.MathUtils.clamp(-accel * 0.0011 - demo.spinExtra * 0.00012, -0.016, 0.016);
    pitch.v += ((pitchTarget - pitch.x) * 160 - pitch.v * 13) * dt;
    pitch.x += pitch.v * dt;
    car.body.rotation.z = pitch.x;
    const vib = Math.sin(time * 42) * 0.0011 + (Math.random() - 0.5) * 0.004 * demo.shake;
    car.body.position.y = vib - Math.abs(pitch.x) * 0.3;

    // המצלמה מפגרת מעט אחרי הרכב: בזינוק הרכב בורח קדימה, בבלימה הוא נזרק קדימה וחוזר
    const xTarget = THREE.MathUtils.clamp(-accel * 0.035, -0.9, 0.9);
    carX.v += ((xTarget - carX.x) * 9 - carX.v * 5.5) * dt;
    carX.x += carX.v * dt;
    rig.position.x = carX.x;

    // אפקטים
    if (demo.smoke > 0.02) smoke.emit(car.wheelBase.rear.x + carX.x + 0.15, 0.06, Math.ceil(demo.smoke * 220 * dt), 1.4);
    smoke.update(dt, speed * dt);
    if (demo.sparks > 0.02) sparks.emit(-1.2 + carX.x, 1.3 + carX.x, Math.ceil(demo.sparks * 520 * dt), 1);
    sparks.update(dt);
    brakes.set(demo.brake * 0.9);
    car.setLights(lightLevel.v);
    track.update(offset, Math.min(Math.abs(speed) * 0.035, 1.6), time);

    // ---------- מצלמה: גלילה פנימה ----------
    const p = scrollP;
    const ease = p * p * (3 - 2 * p);
    const dist = baseDist * (1 - ease * 0.66);
    const camY = 1.0 - ease * 0.45;
    const shakeAmp = (demo.shake * 0.012 + Math.min(Math.abs(speed) / 36, 1) * 0.004) * (reduce ? 0 : 1);
    camera.position.set(
      look.x * 0.25 * (1 - ease) + ease * -0.6 + (Math.random() - 0.5) * shakeAmp,
      camY - look.y * 0.08 + (Math.random() - 0.5) * shakeAmp,
      dist,
    );
    camera.lookAt(ease * -0.6, camY - 0.08, 0);
    camera.fov = 20 + Math.min(Math.abs(speed) / 36, 1) * 2.2 + ease * 6;
    // עדשת שיפט: מזיזה את המסגרת כדי שהרכב יישב מעל הכותרת, בלי לעוות את התמונה
    camera.setViewOffset(w, h, 0, h * (0.12 * (1 - ease)), w, h);
    camera.updateProjectionMatrix();

    if (!fine && !pointer.inside) lookX(Math.sin(time * 0.3) * 0.4);

    renderer.render(scene, camera);
  };

  resize();
  addEventListener('resize', resize);
  gsap.ticker.add(tick);
  if (!reduce) show.play();

  return {
    canvas: renderer.domElement,
    setScroll: (p: number) => { scrollP = p; },
    stats: () => renderer.info.render,
  };
}

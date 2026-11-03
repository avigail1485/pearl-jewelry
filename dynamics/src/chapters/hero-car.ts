import * as THREE from 'three';
import { gsap } from 'gsap';
import { finePointer, reducedMotion } from '../core/motion';
import { scrollState } from '../scroll/smooth';
import { buildCar, makeMaterials } from '../scene/car';
import { makeContactShadow, makeStudioEnv } from '../scene/env';
import { buildXRay, cutShell, lensUniforms } from '../scene/xray';

/**
 * הרכב במרכז הפתיחה.
 * חלון חיתוך מעוגל עוקב אחרי הסמן וחושף את השלדה, המנוע והטורבו בקווי רנטגן.
 * הגלגלים הקדמיים פונים לסמן, הרכב נוטה קלות לפי התנועה, והגלילה מניעה אותו.
 */
export function mountHeroCar(host: HTMLElement) {
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = 'hero-car__canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const env = makeStudioEnv(renderer);
  const mats = makeMaterials(env);
  const car = buildCar(mats);
  car.shellMaterials.forEach(cutShell);
  const xray = buildXRay(car);
  car.root.add(xray.group);

  const rig = new THREE.Group(); // הטיה ופרלקסה
  rig.add(car.root);
  scene.add(rig);
  scene.add(makeContactShadow(6.4, 2.6));
  car.root.position.x = 0.15;

  const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 100);
  const target = new THREE.Vector3(0, 0.42, 0);

  // ---------- מידות ומצלמה ----------
  let w = 1, h = 1, dpr = 1;
  const resize = () => {
    w = host.clientWidth; h = host.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const landscape = w > h;
    const frac = landscape ? 0.6 : 0.98; // החלק מרוחב המסך שהרכב תופס
    const L = 5.5;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = L / (frac * 2 * tanH * camera.aspect);
    const visH = 2 * dist * tanH;
    // הרכב מעט מעל המרכז, הכותרת יושבת מתחתיו
    target.y = 0.42 - visH * (landscape ? 0.14 : 0.12);
    camera.position.set(0, target.y + dist * 0.16, dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    const half = Math.min(w * 0.095, 175);
    lensUniforms.uLensHalf.value.set(half * dpr * lens.open, half * 0.62 * dpr * lens.open);
    lensUniforms.uLensRadius.value = 28 * dpr;
    lensUniforms.uLensEdge.value = 1.6 * dpr;
  };

  // ---------- מצב ----------
  const look = { x: 0, y: 0 };
  const lens = { x: w / 2, y: h / 2, open: 0 };
  const pointer = { x: 0, y: 0, inside: false, last: -1e9 };
  const lookX = gsap.quickTo(look, 'x', { duration: 1.2, ease: 'brake' });
  const lookY = gsap.quickTo(look, 'y', { duration: 1.2, ease: 'brake' });
  const lensX = gsap.quickTo(lens, 'x', { duration: 0.55, ease: 'brake' });
  const lensY = gsap.quickTo(lens, 'y', { duration: 0.55, ease: 'brake' });

  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    pointer.x = x; pointer.y = y; pointer.inside = true; pointer.last = performance.now();
    lookX((x / r.width) * 2 - 1);
    lookY((y / r.height) * 2 - 1);
    lensX(x); lensY(y);
    gsap.to(lens, { open: 1, duration: 0.5, ease: 'brake', overwrite: 'auto' });
  };
  const onLeave = () => { pointer.inside = false; };
  const section = host.closest('section') ?? host;
  section.addEventListener('pointermove', onMove);
  section.addEventListener('pointerdown', onMove);
  section.addEventListener('pointerleave', onLeave);

  // נקודות הקצה של הרכב על המסך, למסלול החלון האוטומטי
  const project = (v: THREE.Vector3) => {
    const p = v.clone();
    car.root.localToWorld(p);
    p.project(camera);
    return { x: (p.x * 0.5 + 0.5) * w, y: (-p.y * 0.5 + 0.5) * h };
  };

  let scrollP = 0;
  let wheelSpin = 0;
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(host);

  const tick = (time: number, dt: number) => {
    if (!visible) return;
    const idle = !pointer.inside || performance.now() - pointer.last > 3000;

    // בלי סמן: החלון נוסע לאורך הרכב מימין לשמאל, כמו סריקה
    if (idle && !reduce) {
      const a = project(new THREE.Vector3(2.0, 0.42, 0.3));
      const b = project(new THREE.Vector3(-2.2, 0.32, 0.3));
      const t = (Math.sin(time * 0.35) + 1) / 2;
      lensX(a.x + (b.x - a.x) * t);
      lensY(a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * h * 0.02);
      if (lens.open < 1) lens.open = Math.min(1, lens.open + dt / 900);
      if (!fine) { lookX((t - 0.5) * -0.8); lookY(0); }
    }

    // הטיה, היגוי וגלילה
    rig.rotation.y = look.x * 0.14 + scrollP * 0.55;
    rig.rotation.x = look.y * 0.035;
    rig.position.x = -scrollP * 2.2;
    car.steer.forEach((s) => { s.rotation.y = THREE.MathUtils.damp(s.rotation.y, -look.x * 0.38, 6, dt / 1000); });
    // הגלגלים מסתובבים לפי מהירות הגלילה (נסיעה שמאלה = סיבוב חיובי סביב z)
    wheelSpin += (scrollState.velocity * 0.02) * (dt / 16.67);
    Object.values(car.wheels).forEach((wh) => { wh.rotation.z = wheelSpin; });
    // רטט מנוע בסרק
    car.root.position.y = reduce ? 0 : Math.sin(time * 38) * 0.0015;

    xray.update(time, 9 + Math.abs(scrollState.velocity) * 0.4);

    const half = Math.min(w * 0.095, 175) * lens.open;
    lensUniforms.uLensHalf.value.set(half * dpr, half * 0.62 * dpr);
    lensUniforms.uLensCenter.value.set(lens.x * dpr, (h - lens.y) * dpr);

    renderer.render(scene, camera);
  };

  resize();
  addEventListener('resize', resize);
  if (reduce) {
    lens.open = 0;
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

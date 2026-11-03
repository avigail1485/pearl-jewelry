import * as THREE from 'three';

/**
 * רכב מירוץ מקורי של DYNAMICS, נבנה בקוד (מסלול ב' בסעיף 4).
 * משטחים חלקים ונקיים, סילואט נמוך ורחב. אין לוגואים, מספרים או סימנים מסחריים.
 * צירים: x לאורך הרכב (האף ב-x שלילי, כך שהרכב נוסע מימין לשמאל), y למעלה, z לרוחב.
 */

export const BRAND = new THREE.Color('#E84B25');

export interface CarParts {
  root: THREE.Group;
  body: THREE.Group; // כל חלקי המעטפת שנחתכים בחלון הרנטגן
  wheels: Record<'wheel_fl' | 'wheel_fr' | 'wheel_rl' | 'wheel_rr', THREE.Group>;
  steer: THREE.Group[]; // צירי ההיגוי של הגלגלים הקדמיים
  shellMaterials: THREE.Material[];
  halfWidthAt: (x: number) => number;
  heightAt: (x: number) => { bottom: number; top: number };
}

// ---------- חומרים ----------
export function makeMaterials(env: THREE.Texture | null) {
  const paint = new THREE.MeshPhysicalMaterial({
    color: BRAND, roughness: 0.32, metalness: 0.05,
    clearcoat: 1, clearcoatRoughness: 0.05, envMap: env, envMapIntensity: 1.15,
  });
  const carbon = new THREE.MeshPhysicalMaterial({
    color: '#0d0d0c', roughness: 0.38, metalness: 0.25,
    clearcoat: 0.7, clearcoatRoughness: 0.12, envMap: env, envMapIntensity: 0.9,
  });
  const satin = new THREE.MeshPhysicalMaterial({
    color: '#1D1D1B', roughness: 0.55, metalness: 0.1, envMap: env, envMapIntensity: 0.6,
  });
  const rubber = new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.92, metalness: 0, envMap: env, envMapIntensity: 0.35 });
  const rim = new THREE.MeshPhysicalMaterial({ color: '#4a4a48', roughness: 0.2, metalness: 1, envMap: env, envMapIntensity: 1.8 });
  const white = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
  return { paint, carbon, satin, rubber, rim, white };
}

// ---------- לופט: גוף חלק מחתכי רוחב ----------
interface Station { x: number; w: number; b: number; t: number; n?: number }

function sampleStations(st: Station[], count: number) {
  const curve = (key: keyof Station) => new THREE.CatmullRomCurve3(
    st.map((s) => new THREE.Vector3(s.x, (s[key] as number) ?? 2.6, 0)), false, 'centripetal',
  );
  const cx = curve('x'), cw = curve('w'), cb = curve('b'), ct = curve('t'), cn = curve('n');
  const out: Station[] = [];
  for (let i = 0; i < count; i++) {
    const u = i / (count - 1);
    out.push({ x: cx.getPoint(u).y, w: cw.getPoint(u).y, b: cb.getPoint(u).y, t: ct.getPoint(u).y, n: cn.getPoint(u).y });
  }
  return out;
}

/** חתך סופר־אליפסה: תחתית שטוחה יותר, גב מעוגל. */
function loft(stations: Station[], slices = 90, ring = 56, zOffset = 0) {
  const s = sampleStations(stations, slices);
  const pos: number[] = [];
  const idx: number[] = [];
  for (const st of s) {
    const yc = (st.b + st.t) / 2, ry = Math.max((st.t - st.b) / 2, 1e-3), rz = Math.max(st.w, 1e-3);
    const n = st.n ?? 2.6;
    for (let j = 0; j < ring; j++) {
      const a = (j / ring) * Math.PI * 2;
      const c = Math.cos(a), sn = Math.sin(a);
      const ez = Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
      const ey = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / (sn < 0 ? n * 1.5 : n));
      pos.push(st.x, yc + ey * ry, zOffset + ez * rz);
    }
  }
  for (let i = 0; i < slices - 1; i++) {
    for (let j = 0; j < ring; j++) {
      const a = i * ring + j, b = i * ring + ((j + 1) % ring);
      const c = (i + 1) * ring + j, d = (i + 1) * ring + ((j + 1) % ring);
      idx.push(a, c, b, b, c, d);
    }
  }
  // סגירת קצוות
  const cap = (i: number, flip: boolean) => {
    const st = s[i];
    const center = pos.length / 3;
    pos.push(st.x, (st.b + st.t) / 2, zOffset);
    for (let j = 0; j < ring; j++) {
      const a = i * ring + j, b = i * ring + ((j + 1) % ring);
      if (flip) idx.push(center, a, b); else idx.push(center, b, a);
    }
  };
  cap(0, true);
  cap(slices - 1, false);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { geometry: g, samples: s };
}

// ---------- כנפיים ----------
function airfoil(chord: number, thick: number, camber = 0.06) {
  const sh = new THREE.Shape();
  const N = 24;
  const upper: THREE.Vector2[] = [], lower: THREE.Vector2[] = [];
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    const t = 5 * thick * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
    const c = camber * 4 * x * (1 - x);
    upper.push(new THREE.Vector2(x * chord, (c + t) * chord));
    lower.push(new THREE.Vector2(x * chord, (c - t) * chord));
  }
  sh.moveTo(upper[0].x, upper[0].y);
  upper.slice(1).forEach((p) => sh.lineTo(p.x, p.y));
  lower.reverse().forEach((p) => sh.lineTo(p.x, p.y));
  return sh;
}

function wing(chord: number, thick: number, span: number, mat: THREE.Material, aoa: number) {
  const g = new THREE.ExtrudeGeometry(airfoil(chord, thick), { depth: span, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -span / 2);
  const m = new THREE.Mesh(g, mat);
  m.rotation.z = -aoa;
  return m;
}

function plate(points: [number, number][], depth: number, mat: THREE.Material) {
  const sh = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 });
  g.translate(0, 0, -depth / 2);
  return new THREE.Mesh(g, mat);
}

function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r, r, len, 10);
  const m = new THREE.Mesh(g, mat);
  m.position.copy(a).lerp(b, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

// ---------- גלגל ----------
function makeWheel(radius: number, width: number, mats: ReturnType<typeof makeMaterials>, outward: 1 | -1) {
  const g = new THREE.Group();
  const rimR = radius * 0.62;
  const hw = width / 2;
  const prof: THREE.Vector2[] = [
    [rimR, -hw], [radius * 0.9, -hw], [radius * 0.975, -hw * 0.86], [radius, -hw * 0.6],
    [radius, hw * 0.6], [radius * 0.975, hw * 0.86], [radius * 0.9, hw], [rimR, hw],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const tire = new THREE.LatheGeometry(prof, 72);
  tire.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(tire, mats.rubber));

  // חישוק: דיסקה כהה, חישורים, ואום מרכזי כתום
  const dish = new THREE.CylinderGeometry(rimR, rimR * 0.92, width * 0.9, 48, 1, true);
  dish.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(dish, mats.rim));
  const face = new THREE.Group();
  face.position.z = outward * hw * 0.55;
  const back = new THREE.Mesh(new THREE.CircleGeometry(rimR * 0.98, 48), mats.satin);
  back.position.z = -outward * 0.02;
  if (outward < 0) back.rotation.y = Math.PI;
  face.add(back);
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(rimR * 0.92, 0.018, 0.02), mats.rim);
    s.geometry.translate(rimR * 0.46, 0, 0);
    s.rotation.z = (i / 10) * Math.PI * 2;
    face.add(s);
  }
  const nut = new THREE.Mesh(new THREE.CylinderGeometry(rimR * 0.2, rimR * 0.24, 0.05, 6), mats.paint);
  nut.rotation.x = Math.PI / 2;
  face.add(nut);
  g.add(face);

  // קו מתאר לבן דק על דופן הצמיג, כמו קווי המותג
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.86, 0.0035, 6, 120), mats.white);
  ring.position.z = outward * hw * 1.0;
  g.add(ring);
  return g;
}

// ---------- הרכב ----------
export function buildCar(mats: ReturnType<typeof makeMaterials>): CarParts {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // מידות
  const FRONT_X = -1.55, REAR_X = 1.85, TRACK = 0.82;
  const RF = 0.34, RR = 0.36, WF = 0.3, WR = 0.4;

  // מונוקוק + כיסוי מנוע
  const mono = loft([
    { x: -2.72, w: 0.035, b: 0.2, t: 0.25, n: 2.2 },
    { x: -2.4, w: 0.1, b: 0.16, t: 0.33 },
    { x: -1.9, w: 0.16, b: 0.13, t: 0.43 },
    { x: -1.25, w: 0.24, b: 0.11, t: 0.53 },
    { x: -0.65, w: 0.34, b: 0.09, t: 0.6 },
    { x: -0.1, w: 0.4, b: 0.08, t: 0.63 },
    { x: 0.35, w: 0.38, b: 0.08, t: 0.86 },
    { x: 0.85, w: 0.32, b: 0.08, t: 0.8 },
    { x: 1.45, w: 0.22, b: 0.1, t: 0.6 },
    { x: 2.0, w: 0.12, b: 0.14, t: 0.42 },
    { x: 2.35, w: 0.06, b: 0.18, t: 0.3, n: 2.2 },
  ], 110, 64);
  const monoMesh = new THREE.Mesh(mono.geometry, mats.paint);
  monoMesh.name = 'body';
  body.add(monoMesh);

  const interp = (x: number) => {
    const s = mono.samples;
    if (x <= s[0].x) return s[0];
    for (let i = 1; i < s.length; i++) if (s[i].x >= x) {
      const a = s[i - 1], b = s[i], t = (x - a.x) / (b.x - a.x);
      return { x, w: a.w + (b.w - a.w) * t, b: a.b + (b.b - a.b) * t, t: a.t + (b.t - a.t) * t };
    }
    return s[s.length - 1];
  };

  // תאי צד (סייד־פודס), כהים מלמטה וצבועים מלמעלה
  for (const side of [1, -1]) {
    const pod = loft([
      { x: -0.55, w: 0.16, b: 0.1, t: 0.38, n: 3.2 },
      { x: -0.3, w: 0.2, b: 0.09, t: 0.44, n: 3.2 },
      { x: 0.3, w: 0.2, b: 0.09, t: 0.42, n: 3 },
      { x: 0.95, w: 0.15, b: 0.09, t: 0.32, n: 2.8 },
      { x: 1.5, w: 0.06, b: 0.1, t: 0.2, n: 2.4 },
    ], 60, 48, side * 0.42);
    const m = new THREE.Mesh(pod.geometry, mats.paint);
    m.name = 'sidepod';
    body.add(m);
    // פתח הכניסה לאוויר: אליפסה כהה בחזית התא
    const inlet = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mats.carbon);
    inlet.scale.set(0.02, 0.12, 0.13);
    inlet.position.set(-0.56, 0.27, side * 0.43);
    body.add(inlet);
  }

  // רצפה
  const floorShape: [number, number][] = [
    [-1.05, -0.36], [1.95, -0.62], [2.2, -0.55], [2.2, 0.55], [1.95, 0.62], [-1.05, 0.36], [-1.2, 0],
  ];
  const fsh = new THREE.Shape(floorShape.map(([x, z]) => new THREE.Vector2(x, z)));
  const floorG = new THREE.ExtrudeGeometry(fsh, { depth: 0.025, bevelEnabled: false });
  floorG.rotateX(Math.PI / 2);
  const floor = new THREE.Mesh(floorG, mats.carbon);
  floor.position.y = 0.085;
  body.add(floor);

  // תא נהג ריק + שסתום אוויר מעל
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), mats.carbon);
  cockpit.scale.set(0.42, 0.06, 0.24);
  cockpit.position.set(-0.32, interp(-0.32).t - 0.01, 0);
  body.add(cockpit);
  const airbox = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mats.carbon);
  airbox.scale.set(0.05, 0.08, 0.1);
  airbox.position.set(0.17, 0.79, 0);
  body.add(airbox);

  // סנפיר מנוע
  const fin = plate([[0.3, 0.84], [0.5, 0.92], [1.9, 0.62], [1.9, 0.5], [0.9, 0.76]], 0.012, mats.paint);
  body.add(fin);

  // הילה (Halo)
  const haloCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.12, 0.7, -0.3), new THREE.Vector3(-0.18, 0.86, -0.3),
    new THREE.Vector3(-0.5, 0.87, 0), new THREE.Vector3(-0.18, 0.86, 0.3), new THREE.Vector3(0.12, 0.7, 0.3),
  ]);
  body.add(new THREE.Mesh(new THREE.TubeGeometry(haloCurve, 80, 0.026, 12), mats.carbon));
  body.add(rod(new THREE.Vector3(-0.5, 0.87, 0), new THREE.Vector3(-0.72, 0.6, 0), 0.03, mats.carbon));

  // כנף קדמית: שני אלמנטים ולוחות קצה
  const fw = new THREE.Group();
  fw.position.set(-2.62, 0.09, 0);
  fw.add(wing(0.42, 0.09, 1.86, mats.carbon, 0.04));
  const fw2 = wing(0.26, 0.08, 1.7, mats.paint, 0.22);
  fw2.position.set(0.3, 0.07, 0);
  fw.add(fw2);
  for (const side of [1, -1]) {
    const ep = plate([[0, -0.01], [0.46, -0.01], [0.5, 0.08], [0.3, 0.13], [0.04, 0.07]], 0.01, mats.carbon);
    ep.position.z = side * 0.93;
    fw.add(ep);
  }
  body.add(fw);
  body.add(rod(new THREE.Vector3(-2.4, 0.13, 0.08), new THREE.Vector3(-2.2, 0.22, 0.06), 0.012, mats.carbon));
  body.add(rod(new THREE.Vector3(-2.4, 0.13, -0.08), new THREE.Vector3(-2.2, 0.22, -0.06), 0.012, mats.carbon));

  // כנף אחורית: שני אלמנטים, לוחות קצה מעוקלים ועמוד
  const rw = new THREE.Group();
  rw.position.set(2.05, 0.78, 0);
  rw.add(wing(0.36, 0.1, 1.08, mats.carbon, 0.1));
  const rw2 = wing(0.2, 0.09, 1.08, mats.paint, 0.42);
  rw2.position.set(0.3, 0.1, 0);
  rw.add(rw2);
  for (const side of [1, -1]) {
    const ep = plate([[0.02, -0.34], [0.46, -0.3], [0.52, 0.16], [0.4, 0.24], [0.0, 0.2], [-0.06, -0.06]], 0.01, mats.carbon);
    ep.position.z = side * 0.55;
    rw.add(ep);
  }
  body.add(rw);
  body.add(rod(new THREE.Vector3(2.2, 0.78, 0), new THREE.Vector3(1.95, 0.42, 0), 0.025, mats.carbon));

  // דיפיוזר
  const diff = plate([[1.95, 0.08], [2.32, 0.08], [2.32, 0.2], [2.1, 0.14]], 1.0, mats.carbon);
  body.add(diff);

  // מראות
  for (const side of [1, -1]) {
    const mirror = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), mats.paint);
    mirror.scale.set(0.07, 0.035, 0.045);
    mirror.position.set(-0.62, 0.68, side * 0.5);
    body.add(mirror);
    body.add(rod(new THREE.Vector3(-0.6, 0.6, side * 0.3), new THREE.Vector3(-0.62, 0.66, side * 0.48), 0.008, mats.carbon));
  }

  // קווי ליברי: קווי המותג רצים לאורך דופן הגוף (לבן דק + שחור עבה)
  const livery = (offsets: [number, number][], mat: THREE.Material, r: number) => {
    for (const side of [1, -1]) {
      const pts = offsets.map(([x, k]) => {
        const s = interp(x);
        const y = s.b + (s.t - s.b) * k;
        return new THREE.Vector3(x, y, side * (s.w * 0.985 + 0.004));
      });
      body.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, r, 6), mat));
    }
  };
  livery([[-2.5, 0.55], [-1.8, 0.6], [-1.1, 0.5], [-0.6, 0.66], [0.2, 0.7], [0.9, 0.55], [1.6, 0.6], [2.2, 0.5]], mats.white, 0.0035);
  livery([[-2.3, 0.3], [-1.6, 0.36], [-1.0, 0.28], [-0.7, 0.3]], mats.carbon, 0.012);

  // ---------- גלגלים ומתלים ----------
  const wheels = {} as CarParts['wheels'];
  const steer: THREE.Group[] = [];
  const corner = (name: keyof CarParts['wheels'], x: number, z: number, r: number, wd: number, front: boolean) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, r, z);
    const wheel = makeWheel(r, wd, mats, z > 0 ? 1 : -1);
    wheel.name = name;
    pivot.add(wheel);
    root.add(pivot);
    wheels[name] = wheel;
    if (front) steer.push(pivot);
    // עצמות עליונות ותחתונות אל הגוף
    const s = interp(x);
    const sign = Math.sign(z);
    const hubIn = z - sign * wd * 0.45;
    for (const [yHub, yBody] of [[r + 0.08, s.t - 0.06], [r - 0.08, s.b + 0.06]] as const) {
      root.add(rod(new THREE.Vector3(x, yHub, hubIn), new THREE.Vector3(x - 0.18, yBody, sign * s.w * 0.8), 0.011, mats.carbon));
      root.add(rod(new THREE.Vector3(x, yHub, hubIn), new THREE.Vector3(x + 0.18, yBody, sign * s.w * 0.8), 0.011, mats.carbon));
    }
  };
  corner('wheel_fl', FRONT_X, TRACK, RF, WF, true);
  corner('wheel_fr', FRONT_X, -TRACK, RF, WF, true);
  corner('wheel_rl', REAR_X, TRACK - 0.04, RR, WR, false);
  corner('wheel_rr', REAR_X, -(TRACK - 0.04), RR, WR, false);

  return {
    root,
    body,
    wheels,
    steer,
    shellMaterials: [mats.paint, mats.carbon],
    halfWidthAt: (x) => interp(x).w,
    heightAt: (x) => { const s = interp(x); return { bottom: s.b, top: s.t }; },
  };
}

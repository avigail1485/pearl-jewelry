import * as THREE from 'three';
import type { CarParts } from './car';

/**
 * "רנטגן": החלקים הפנימיים כקווי מתאר לבנים דקים עם נגיעות כתום (סעיף 4).
 * נחשפים רק דרך חלון החיתוך שעוקב אחרי הסמן.
 */

export const lensUniforms = {
  uLensCenter: { value: new THREE.Vector2(-9999, -9999) }, // פיקסלים בבאפר, מקור בפינה השמאלית התחתונה
  uLensHalf: { value: new THREE.Vector2(0, 0) },
  uLensRadius: { value: 24 },
  uLensEdge: { value: 2 },
  uBrand: { value: new THREE.Color('#E84B25') },
};

const SDF = /* glsl */ `
  uniform vec2 uLensCenter; uniform vec2 uLensHalf; uniform float uLensRadius; uniform float uLensEdge; uniform vec3 uBrand;
  float lensSdf() {
    vec2 p = gl_FragCoord.xy - uLensCenter;
    float r = min(uLensRadius, min(uLensHalf.x, uLensHalf.y));
    vec2 q = abs(p) - uLensHalf + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
`;

/** מעטפת: נחתכת בתוך החלון, עם קו כתום דק בשפה. */
export function cutShell(mat: THREE.Material) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, lensUniforms);
    shader.fragmentShader = SDF + shader.fragmentShader
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        float lensD = lensSdf();
        if (gl_FrontFacing && lensD < -uLensEdge) discard;`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        if (!gl_FrontFacing) gl_FragColor = vec4(vec3(0.018), 1.0);
        else if (lensD < 0.0) gl_FragColor = vec4(uBrand, 1.0);`);
  };
  mat.side = THREE.DoubleSide;
  mat.customProgramCacheKey = () => 'lens-shell';
  mat.needsUpdate = true;
}

/** פנים: נראה רק בתוך החלון. */
function insideOnly(mat: THREE.Material) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, lensUniforms);
    shader.fragmentShader = SDF + shader.fragmentShader
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        if (lensSdf() > -uLensEdge) discard;`);
  };
  mat.customProgramCacheKey = () => 'lens-inside';
  mat.needsUpdate = true;
}

export interface XRay {
  group: THREE.Group;
  update: (time: number, rpm: number) => void;
}

export function buildXRay(car: CarParts): XRay {
  const group = new THREE.Group();
  const white = new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.85 });
  const dim = new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.28 });
  const orange = new THREE.LineBasicMaterial({ color: '#E84B25' });
  [white, dim, orange].forEach(insideOnly);

  const seg = (pts: number[], mat: THREE.LineBasicMaterial) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const l = new THREE.LineSegments(g, mat);
    group.add(l);
    return l;
  };

  // ---------- שלדה: מסגרת צינורות לפי קווי הגוף ----------
  const xs: number[] = [];
  for (let x = -2.45; x <= 2.15; x += 0.23) xs.push(x);
  const k = 0.8;
  const ring = (x: number, n = 16) => {
    const w = car.halfWidthAt(x) * k;
    const { bottom, top } = car.heightAt(x);
    const yc = (bottom + top) / 2, ry = ((top - bottom) / 2) * k;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push(new THREE.Vector3(x, yc + Math.sin(a) * ry, Math.cos(a) * w));
    }
    return pts;
  };
  const rings = xs.map((x) => ring(x));
  const frame: number[] = [], frameDim: number[] = [];
  rings.forEach((r, i) => {
    const target = i % 3 === 0 ? frame : frameDim;
    r.forEach((p, j) => { const q = r[(j + 1) % r.length]; target.push(p.x, p.y, p.z, q.x, q.y, q.z); });
    if (i > 0) {
      const prev = rings[i - 1];
      [0, 4, 8, 12].forEach((j) => frame.push(prev[j].x, prev[j].y, prev[j].z, r[j].x, r[j].y, r[j].z));
      // אלכסונים
      [2, 6].forEach((j) => frameDim.push(prev[j].x, prev[j].y, prev[j].z, r[j + 1].x, r[j + 1].y, r[j + 1].z));
    }
  });
  seg(frame, white);
  seg(frameDim, dim);

  // ---------- מנוע V6 ----------
  const engine = new THREE.Group();
  engine.position.set(0.95, 0.36, 0);
  group.add(engine);
  const box = (sx: number, sy: number, sz: number, mat: THREE.LineBasicMaterial, pos: THREE.Vector3, rotX = 0) => {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(sx, sy, sz)), mat);
    e.position.copy(pos);
    e.rotation.x = rotX;
    engine.add(e);
    return e;
  };
  box(0.72, 0.18, 0.3, white, new THREE.Vector3(0, -0.05, 0)); // בלוק
  // גל ארכובה
  const crank: number[] = [];
  crank.push(-0.46, 0, 0, 0.46, 0, 0);
  for (let i = 0; i < 6; i++) { const x = -0.27 + i * 0.11; const a = (i * Math.PI * 2) / 3; crank.push(x, 0, 0, x, Math.cos(a) * 0.04, Math.sin(a) * 0.04); }
  const crankL = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(crank, 3)), orange);
  crankL.position.y = -0.08;
  engine.add(crankL);
  // צילינדרים ובוכנות (שלושה בכל גדה, V של 90°)
  const pistons: { m: THREE.Object3D; base: THREE.Vector3; dir: THREE.Vector3; phase: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const bank = i % 2 === 0 ? 1 : -1;
    const x = -0.24 + Math.floor(i / 2) * 0.22 + (bank > 0 ? 0 : 0.06);
    const ang = bank * Math.PI / 4;
    const dir = new THREE.Vector3(0, Math.cos(ang), Math.sin(ang));
    const base = new THREE.Vector3(x, 0.04, 0).addScaledVector(dir, 0.08);
    // צילינדר: מעגל עליון ותחתון וקווי צד
    const cyl = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 12), 1), dim);
    cyl.position.copy(base).addScaledVector(dir, 0.04);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    engine.add(cyl);
    const p = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12), 1), orange);
    p.quaternion.copy(cyl.quaternion);
    engine.add(p);
    pistons.push({ m: p, base, dir, phase: [0, 4, 2, 5, 1, 3][i] * (Math.PI / 3) });
  }
  // צינורות פליטה זורמים אחורה
  const exhaust: number[] = [];
  for (const side of [1, -1]) {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, 0.12, side * 0.16), new THREE.Vector3(0.2, 0.15, side * 0.2),
      new THREE.Vector3(0.55, 0.1, side * 0.1), new THREE.Vector3(0.75, 0.06, 0),
    ]);
    const pts = c.getPoints(24);
    pts.forEach((p, i) => { if (i) exhaust.push(pts[i - 1].x, pts[i - 1].y, pts[i - 1].z, p.x, p.y, p.z); });
  }
  engine.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(exhaust, 3)), white));

  // ---------- טורבו: חלזון ומאוורר ----------
  const turbo = new THREE.Group();
  turbo.position.set(1.72, 0.3, 0);
  group.add(turbo);
  const snail: number[] = [];
  let prev: THREE.Vector3 | null = null;
  for (let i = 0; i <= 120; i++) {
    const a = (i / 120) * Math.PI * 2 * 1.15;
    const r = 0.05 + a * 0.012;
    const p = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0.06);
    if (prev) snail.push(prev.x, prev.y, prev.z, p.x, p.y, p.z);
    prev = p;
  }
  turbo.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(snail, 3)), white));
  const fan = new THREE.Group();
  const blades: number[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    blades.push(0, 0, 0.065, Math.cos(a) * 0.045, Math.sin(a) * 0.045, 0.065);
    blades.push(Math.cos(a) * 0.045, Math.sin(a) * 0.045, 0.065, Math.cos(a + 0.4) * 0.05, Math.sin(a + 0.4) * 0.05, 0.065);
  }
  fan.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(blades, 3)), orange));
  turbo.add(fan);

  // ---------- מיכל דלק ותאי קירור ----------
  const tank = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CapsuleGeometry(0.17, 0.42, 4, 10).rotateZ(Math.PI / 2), 20), dim);
  tank.position.set(0.05, 0.32, 0);
  group.add(tank);
  for (const side of [1, -1]) {
    const rad = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.5, 0.22, 0.08)), white);
    rad.position.set(-0.1, 0.25, side * 0.42);
    rad.rotation.z = 0.25;
    group.add(rad);
  }

  return {
    group,
    update: (time, rpm) => {
      const w = time * rpm;
      pistons.forEach(({ m, base, dir, phase }) => {
        m.position.copy(base).addScaledVector(dir, 0.04 + Math.sin(w + phase) * 0.04);
      });
      crankL.rotation.x = w;
      fan.rotation.z = -w * 2.4;
    },
  };
}

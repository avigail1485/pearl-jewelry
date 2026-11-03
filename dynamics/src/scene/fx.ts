import * as THREE from 'three';

/** עשן צמיגים, ניצוצות מתחת לרצפה וזוהר בלמים. האור מגיע מהרכב. */

function softDot() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.5, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// ---------- עשן ----------
export function buildSmoke(max = 160) {
  const pos = new Float32Array(max * 3);
  const size = new Float32Array(max);
  const alpha = new Float32Array(max);
  const parts = Array.from({ length: max }, () => ({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, s: 0 }));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { map: { value: softDot() }, uScale: { value: 400 } },
    vertexShader: /* glsl */ `
      attribute float aSize; attribute float aAlpha; varying float vA; uniform float uScale;
      void main() {
        vA = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; varying float vA;
      void main() {
        float a = texture2D(map, gl_PointCoord).a * vA;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vec3(0.62, 0.61, 0.6), a);
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 6;
  let cursor = 0;

  return {
    object: points,
    setScale: (s: number) => { mat.uniforms.uScale.value = s; },
    emit: (x: number, y: number, n: number, push: number) => {
      for (let i = 0; i < n; i++) {
        const p = parts[cursor];
        cursor = (cursor + 1) % max;
        Object.assign(p, {
          alive: true, x: x + (Math.random() - 0.5) * 0.3, y: y + Math.random() * 0.1, z: (Math.random() - 0.3) * 0.8,
          vx: push * (0.6 + Math.random() * 0.8), vy: 0.25 + Math.random() * 0.45, vz: (Math.random() - 0.5) * 0.5,
          life: 0, max: 1.4 + Math.random() * 1.6, s: 0.35 + Math.random() * 0.3,
        });
      }
    },
    update: (dt: number, worldShift: number) => {
      parts.forEach((p, i) => {
        if (!p.alive) { alpha[i] = 0; return; }
        p.life += dt;
        if (p.life > p.max) { p.alive = false; alpha[i] = 0; return; }
        p.vx *= 1 - dt * 0.6; p.vy *= 1 - dt * 0.4;
        p.x += p.vx * dt + worldShift; p.y += p.vy * dt; p.z += p.vz * dt;
        const t = p.life / p.max;
        pos.set([p.x, p.y, p.z], i * 3);
        size[i] = p.s * (1 + t * 5);
        alpha[i] = Math.sin(Math.PI * Math.min(1, t * 1.4)) * 0.38 * (1 - t);
      });
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aSize.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
    },
  };
}

// ---------- ניצוצות ----------
export function buildSparks(max = 90) {
  const pos = new Float32Array(max * 6);
  const col = new Float32Array(max * 6);
  const parts = Array.from({ length: max }, () => ({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, life: 0, max: 0.5 }));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  lines.renderOrder = 7;
  const brand = new THREE.Color('#E84B25');
  const hot = new THREE.Color('#FFD2A8');
  let cursor = 0;
  return {
    object: lines,
    emit: (xMin: number, xMax: number, n: number, push: number) => {
      for (let i = 0; i < n; i++) {
        const p = parts[cursor];
        cursor = (cursor + 1) % max;
        Object.assign(p, {
          alive: true, x: xMin + Math.random() * (xMax - xMin), y: 0.03, z: (Math.random() - 0.5) * 0.9,
          vx: push * (3 + Math.random() * 5), vy: 0.6 + Math.random() * 1.8, life: 0, max: 0.25 + Math.random() * 0.45,
        });
      }
    },
    update: (dt: number) => {
      parts.forEach((p, i) => {
        const o = i * 6;
        if (!p.alive) { pos.fill(0, o, o + 6); col.fill(0, o, o + 6); return; }
        p.life += dt;
        if (p.life > p.max) { p.alive = false; return; }
        p.vy -= 9.8 * dt;
        p.x += p.vx * dt; p.y = Math.max(0.005, p.y + p.vy * dt);
        if (p.y <= 0.005) p.vy = Math.abs(p.vy) * 0.35;
        const t = p.life / p.max;
        const c = hot.clone().lerp(brand, t).multiplyScalar(1 - t);
        pos.set([p.x, p.y, p.z, p.x - p.vx * 0.025, p.y - p.vy * 0.025, p.z], o);
        col.set([c.r, c.g, c.b, c.r * 0.3, c.g * 0.3, c.b * 0.3], o);
      });
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    },
  };
}

// ---------- זוהר בלמים ----------
export function buildBrakeGlow(centers: THREE.Vector2[], r: number) {
  const tex = softDot();
  const group = new THREE.Group();
  const mats = centers.map((c) => {
    const m = new THREE.MeshBasicMaterial({ map: tex, color: '#E84B25', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(r * 1.5, r * 1.5), m);
    mesh.position.set(c.x, c.y, 0.02);
    mesh.renderOrder = 5;
    group.add(mesh);
    return m;
  });
  return { object: group, set: (v: number) => mats.forEach((m) => { m.opacity = v; }) };
}

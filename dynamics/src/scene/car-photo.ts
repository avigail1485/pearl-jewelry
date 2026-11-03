import * as THREE from 'three';


/**
 * הרכב מתמונה מבודדת (צילום סטודיו שנוצר ל-DYNAMICS, בלי לוגואים).
 * התמונה מפורקת לשכבות שמתפקדות כמו רכב אמיתי:
 * גוף על מתלים, גלגלים שמסתובבים בפועל (כולל טשטוש תנועה), פנסים,
 * השתקפות ברצפה וצל מגע.
 *
 * מערכת יחידות: אורך הרכב 4.9, הרצפה ב-y=0, האף ב-x שלילי (נוסע מימין לשמאל).
 */

// מדידות מהתמונה המקורית (פיקסלים בקובץ car.webp אחרי החיתוך)
const IMG = { w: 1206, h: 339 };
const S = 4.9 / 1190; // יחידות לפיקסל
const ORIGIN = { x: 718.5 - 116, y: 556 - 228 }; // מרכז הרכב בציר x והרצפה בציר y, בקואורדינטות התמונה
const px = (x: number, y: number) => new THREE.Vector2((x - ORIGIN.x) * S, (ORIGIN.y - y) * S);
const WHEELS = [
  { name: 'wheel_f', c: px(364 - 116, 459 - 228), r: 95 * S },
  { name: 'wheel_r', c: px(1095 - 116, 457 - 228), r: 97 * S },
];
const HEADLIGHT = px(195 - 116, 423 - 228);

const GLSL_UTIL = /* glsl */ `
  float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
`;

export interface PhotoCar {
  root: THREE.Group;
  body: THREE.Group; // על המתלים
  setWheelAngle: (a: number, blur: number) => void;
  setLights: (v: number) => void;
  wheelBase: { front: THREE.Vector2; rear: THREE.Vector2; radius: number };
}

export async function buildPhotoCar(url: string): Promise<PhotoCar> {
  const tex = await new THREE.TextureLoader().loadAsync(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const planeW = IMG.w * S, planeH = IMG.h * S;
  const planeCenter = px(IMG.w / 2, IMG.h / 2);

  // ---------- גוף ----------
  const bodyMat = new THREE.MeshBasicMaterial({ map: tex, color: '#e2dcd6', transparent: true, depthWrite: false, toneMapped: false });
  const bodyMesh = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), bodyMat);
  bodyMesh.name = 'body';
  bodyMesh.position.set(planeCenter.x, planeCenter.y, 0);
  bodyMesh.renderOrder = 2;
  body.add(bodyMesh);

  // ---------- גלגלים: דוגמים את אותה תמונה ומסובבים אותה ----------
  const wheelMats: THREE.ShaderMaterial[] = [];
  for (const wh of WHEELS) {
    const centerUv = new THREE.Vector2((wh.c.x - planeCenter.x) / planeW + 0.5, (wh.c.y - planeCenter.y) / planeH + 0.5);
    const radiusUv = new THREE.Vector2(wh.r / planeW, wh.r / planeH);
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        map: { value: tex }, uCenter: { value: centerUv }, uRad: { value: radiusUv },
        uAngle: { value: 0 }, uBlur: { value: 0 },
      },
      vertexShader: /* glsl */ `
        uniform vec2 uCenter; uniform vec2 uRad; varying vec2 vTex; varying vec2 vP;
        void main() {
          vP = (uv - 0.5) * 2.0 * 1.03;
          vTex = uCenter + vP * uRad;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: GLSL_UTIL + /* glsl */ `
        uniform sampler2D map; uniform vec2 uCenter; uniform vec2 uRad; uniform float uAngle; uniform float uBlur;
        varying vec2 vTex; varying vec2 vP;
        vec4 sampleRot(float a) {
          float cs = cos(a), sn = sin(a);
          vec2 q = vec2(cs * vP.x - sn * vP.y, sn * vP.x + cs * vP.y);
          vec4 s = texture2D(map, uCenter + q * uRad);
          // חלק מהקשת שנכנס לסיבוב מוחלף בגומי
          if (length(q) > 0.8 && luma(s.rgb) > 0.07) s = vec4(vec3(0.012), 1.0);
          s.a = 1.0;
          return s;
        }
        void main() {
          float dist = length(vP);
          if (dist > 1.0) discard;
          vec4 orig = texture2D(map, vTex);
          // שולי הקשת הצבועים נשארים במקום
          if (dist > 0.8 && luma(orig.rgb) > 0.07 && orig.a > 0.5) discard;
          vec4 acc = vec4(0.0);
          for (int i = 0; i < 7; i++) acc += sampleRot(uAngle - uBlur * (float(i) / 6.0));
          vec4 col = acc / 7.0;
          float a = smoothstep(1.0, 0.975, dist);
          gl_FragColor = vec4(col.rgb, a);
          #include <colorspace_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(wh.r * 2.06, wh.r * 2.06), m);
    mesh.position.set(wh.c.x, wh.c.y, 0.002);
    mesh.renderOrder = 3;
    mesh.name = wh.name;
    root.add(mesh);
    wheelMats.push(m);
  }

  // ---------- השתקפות ברצפה ----------
  const reflMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: { map: { value: tex } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; varying vec2 vUv;
      void main() {
        vec4 c = texture2D(map, vec2(vUv.x, 1.0 - vUv.y));
        float fade = smoothstep(0.62, 1.0, vUv.y);
        gl_FragColor = vec4(c.rgb * 0.55, c.a * fade * 0.2);
        #include <colorspace_fragment>
      }`,
  });
  const refl = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), reflMat);
  refl.position.set(planeCenter.x, -planeCenter.y, -0.01);
  refl.renderOrder = 0;
  root.add(refl);

  // צל מגע: אליפסה רכה על הקרקע מתחת לרכב, כהה במיוחד מתחת לצמיגים
  const shadowC = document.createElement('canvas');
  shadowC.width = 512; shadowC.height = 128;
  const g = shadowC.getContext('2d')!;
  g.setTransform(1, 0, 0, 0.25, 0, 0);
  const grd = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  grd.addColorStop(0, 'rgba(0,0,0,0.92)'); grd.addColorStop(0.6, 'rgba(0,0,0,0.6)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (const wh of WHEELS) {
    const u = ((wh.c.x + 2.9) / 5.8) * 512;
    const t = g.createRadialGradient(u, 64, 0, u, 64, 60);
    t.addColorStop(0, 'rgba(0,0,0,0.95)'); t.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = t; g.fillRect(u - 60, 0, 120, 128);
  }
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.8, 1.9).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowC), transparent: true, depthWrite: false }),
  );
  shadow.position.set(0, 0.004, 0);
  shadow.renderOrder = 1;
  root.add(shadow);

  // ---------- פנסים: האור מגיע מהרכב ----------
  const glowC = document.createElement('canvas');
  glowC.width = glowC.height = 128;
  const gg = glowC.getContext('2d')!;
  const rg = gg.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.18, 'rgba(255,236,220,0.55)'); rg.addColorStop(1, 'rgba(255,200,170,0)');
  gg.fillStyle = rg; gg.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(glowC);
  const lights = { value: 0 };
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), glowMat);
  glow.position.set(HEADLIGHT.x - 0.05, HEADLIGHT.y, 0.01);
  glow.renderOrder = 4;
  body.add(glow);
  // שלולית אור רכה על הרצפה לפני הרכב
  const poolC = document.createElement('canvas');
  poolC.width = 256; poolC.height = 64;
  const pg = poolC.getContext('2d')!;
  pg.setTransform(1, 0, 0, 0.25, 0, 0);
  const pr = pg.createRadialGradient(128, 128, 0, 128, 128, 128);
  pr.addColorStop(0, 'rgba(255,238,225,0.55)'); pr.addColorStop(0.4, 'rgba(255,230,215,0.18)'); pr.addColorStop(1, 'rgba(255,230,215,0)');
  pg.fillStyle = pr; pg.fillRect(0, 0, 256, 256);
  const beamMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(poolC), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6).rotateX(-Math.PI / 2), beamMat);
  beam.position.set(HEADLIGHT.x - 1.4, 0.006, 0.1);
  beam.renderOrder = 1;
  root.add(beam);

  return {
    root,
    body,
    wheelBase: { front: WHEELS[0].c, rear: WHEELS[1].c, radius: WHEELS[1].r },
    setWheelAngle: (a, blur) => wheelMats.forEach((m) => { m.uniforms.uAngle.value = a; m.uniforms.uBlur.value = blur; }),
    setLights: (v) => { lights.value = v; glowMat.opacity = v; beamMat.opacity = v * 0.6; },
  };
}

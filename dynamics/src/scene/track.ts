import * as THREE from 'three';

/**
 * משטח המירוץ: אספלט, קו מירוץ גומי, שפות (קרבים) כתומות־לבנות וקווי שוליים.
 * הכול נגזר ממיקום בעולם + היסט הנסיעה, כך שהכביש זז מתחת לרכב בפרספקטיבה אמיתית.
 * טשטוש תנועה לאורך ציר הנסיעה לפי המהירות.
 */

const NOISE = /* glsl */ `
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }
`;

export interface Track {
  group: THREE.Group;
  update: (offset: number, blur: number, time: number) => void;
}

const BACK_H = 22;
const BACK_W = 220;

export function buildTrack(backdropTex: THREE.Texture | null): Track {
  const group = new THREE.Group();

  // ---------- כביש ----------
  const uniforms = {
    uOffset: { value: 0 },
    uBlur: { value: 0 },
    uFog: { value: new THREE.Color('#33261d') },
    uBrand: { value: new THREE.Color('#E84B25') },
  };
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 60, 1, 1).rotateX(-Math.PI / 2).translate(0, 0, -20),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */ `
        varying vec3 vW;
        void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: NOISE + /* glsl */ `
        uniform float uOffset; uniform float uBlur; uniform vec3 uFog; uniform vec3 uBrand;
        varying vec3 vW;

        vec3 surface(vec2 p) {
          // אספלט: גרעיניות, כתמי זפת וניצוצות אגרגט
          float g = fbm(p * vec2(3.0, 3.0));
          float fine = vnoise(p * 140.0);
          vec3 col = vec3(0.024, 0.021, 0.019) + (g - 0.5) * 0.018 + (fine - 0.5) * 0.012;
          col += step(0.985, vnoise(p * 260.0)) * 0.05;
          // קו מירוץ: גומי כהה סביב z=0
          col *= 1.0 - 0.35 * exp(-pow(p.y / 0.7, 2.0)) * (0.7 + 0.3 * fbm(p * vec2(0.6, 8.0)));
          // קווי שוליים לבנים
          float edgeNear = smoothstep(0.06, 0.04, abs(p.y - 1.25));
          float edgeFar = smoothstep(0.06, 0.04, abs(p.y + 4.4));
          col = mix(col, vec3(0.55), (edgeNear + edgeFar) * (0.85 + 0.15 * fine));
          // קרב (שפה) כתום־לבן ליד המצלמה
          if (p.y > 1.32 && p.y < 1.9) {
            float stripe = step(0.5, fract(p.x / 1.6));
            vec3 kerb = mix(vec3(0.62), uBrand * 0.8, stripe);
            col = kerb * (0.85 + 0.15 * fine) * (0.75 + 0.25 * smoothstep(1.9, 1.5, p.y));
          }
          // דשא כהה מחוץ למסלול
          if (p.y > 1.9 || p.y < -4.5) col = vec3(0.012, 0.016, 0.011) + (g - 0.5) * 0.01;
          return col;
        }

        void main() {
          vec2 p = vec2(vW.x + uOffset, vW.z);
          vec3 col = vec3(0.0);
          for (int i = 0; i < 8; i++) col += surface(p + vec2(uBlur * (float(i) / 7.0 - 0.5), 0.0));
          col /= 8.0;
          // ברק רטוב לקראת האופק ואור מעל המסלול
          float dist = length(vW.xz - cameraPosition.xz);
          col += vec3(0.05, 0.035, 0.025) * smoothstep(8.0, 40.0, dist) * 0.6;
          col = mix(col, uFog, smoothstep(16.0, 64.0, dist));
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    }),
  );
  ground.renderOrder = -2;
  group.add(ground);

  // ---------- רקע: המעגל בלילה, זז לאט (פרלקסה) ----------
  const bUniforms = { map: { value: backdropTex }, uScroll: { value: 0 }, uBlur: { value: 0 } };
  if (backdropTex) {
    backdropTex.wrapS = THREE.MirroredRepeatWrapping;
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(BACK_W, BACK_H),
      new THREE.ShaderMaterial({
        uniforms: bUniforms,
        depthWrite: false,
        vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D map; uniform float uScroll; uniform float uBlur; varying vec2 vUv;
          const float REPEAT = ${(BACK_W / (BACK_H * 1456 / 472)).toFixed(4)};
          void main() {
            vec2 uv = vec2(vUv.x * REPEAT + uScroll, vUv.y);
            vec3 c = vec3(0.0);
            for (int i = 0; i < 9; i++) c += texture2D(map, uv + vec2(uBlur * (float(i) / 8.0 - 0.5), 0.0)).rgb;
            c /= 9.0;
            // תחתית הרקע נמסה לתוך ערפל הכביש
            c = mix(vec3(0.033, 0.024, 0.017), c, smoothstep(0.0, 0.06, vUv.y));
            gl_FragColor = vec4(c * 0.9, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    );
    backdrop.position.set(0, BACK_H / 2 - 0.4, -50);
    backdrop.renderOrder = -3;
    group.add(backdrop);
  }

  return {
    group,
    update: (offset, blur) => {
      uniforms.uOffset.value = offset;
      uniforms.uBlur.value = blur;
      bUniforms.uScroll.value = offset * 0.0012;
      bUniforms.uBlur.value = blur * 0.002;
    },
  };
}

import * as THREE from 'three';

/** סביבת השתקפות מותאמת: פסי אור בסצנה נפרדת דרך PMREMGenerator, בלי HDRI חיצוני. */
export function makeStudioEnv(renderer: THREE.WebGLRenderer) {
  const env = new THREE.Scene();
  env.background = new THREE.Color('#050505');
  const strip = (w: number, h: number, intensity: number, pos: [number, number, number], rot: [number, number, number], color = '#FFFFFF') => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.rotation.set(...rot);
    env.add(m);
  };
  // סופטבוקס עליון ארוך: קו האור על הפח
  strip(14, 1.4, 5, [0, 7, 0], [Math.PI / 2, 0, 0]);
  strip(14, 0.35, 8, [0, 6.5, 2.4], [Math.PI / 2.4, 0, 0]);
  // פסים צדדיים בצד המצלמה
  strip(16, 0.25, 6, [0, 2.2, 8], [0, 0, 0]);
  strip(16, 0.12, 4, [0, 0.9, 8], [0, 0, 0]);
  // אור קצה מאחור
  strip(16, 0.5, 4, [0, 3.5, -8], [0, 0, 0]);
  // נגיעה כתומה חמה מהצד, כמו אור המסלול
  strip(3, 6, 1.6, [-9, 2, 2], [0, Math.PI / 2, 0], '#E84B25');
  strip(3, 6, 0.8, [9, 2, 2], [0, -Math.PI / 2, 0]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.02).texture;
  pmrem.dispose();
  return tex;
}

/** צל מגע רך מתחת לרכב. */
export function makeContactShadow(length: number, width: number) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(128, 64, 4, 128, 64, 128);
  grd.addColorStop(0, 'rgba(0,0,0,0.85)');
  grd.addColorStop(0.45, 'rgba(0,0,0,0.5)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 128);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(length, width),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.002;
  return m;
}

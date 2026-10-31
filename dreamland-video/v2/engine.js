'use strict';
/* ארץ החלומות — מנוע טיפוגרפיה קינטית.
   render(t) היא פונקציה טהורה של הזמן: אותו קוד משמש לתצוגה החיה ולרינדור. */
(function () {
  // ---------- זמן ופעמות ----------
  const W = 1920, H = 1080, FPS = 30, DUR = 30;
  const OFFSET = 27.4966;                              // תחילת הפזמון בשיר
  const BPM = 140, P = 60 / BPM, B0 = 0;             // הפעמה הראשונה של הפזמון = פריים 0
  const beat = n => B0 + n * P;
  const bar = k => beat(4 * k);

  // ---------- פלטה מהרפרנסים: נייר · קובלט · ורוד מסטיק · אשכולית · יין ----------
  const C = {
    paper: '#F1EEE8', ink: '#1A0B3D', cobalt: '#3A15AA', cobaltL: '#5B3BD0',
    pink: '#FE88E5', blush: '#F7C0BE', coral: '#E53E2A', red: '#C8231F', wine: '#510512', cream: '#F8E3D2',
  };

  // ---------- גריד 12 עמודות ----------
  const M = 120, G = 24, CW = 118;                    // שוליים 120, מרווח 24, עמודה 118
  const RX = i => W - M - (i - 1) * (CW + G);         // קצה ימני של עמודה i (1 = הימנית)
  const LX = i => RX(i) - CW;
  const CX = W / 2;                                    // הקו בין עמודה 6 ל-7
  const SAFE_W = W - 2 * M;                            // 1680

  const FONT = '"Drakonit"';
  let ctx = null, REG = null, SHOW_GRID = false, BASE = null;

  // ---------- עזרי מתמטיקה ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eOutC = p => 1 - Math.pow(1 - p, 3);
  const eInC = p => p * p * p;
  const eIO = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const eOutQ = p => 1 - Math.pow(1 - p, 5);
  const spr = (tau, f = 22, k = 7) => (tau < 0 ? 0 : Math.exp(-tau * k) * Math.sin(tau * f));
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  // עוצמת הפעמה הנוכחית (1 על הפעמה, דועך)
  const beatEnv = (t, k = 9) => { const n = Math.floor((t - B0) / P); if (n < 0) return 0; return Math.exp(-(t - beat(n)) * k); };
  const beatsSince = (t, t0) => { const x = (t - t0) / P; const n = Math.floor(x); return { n, f: x - n }; };

  // ---------- מדידת טקסט ----------
  const MC = new Map();
  function meas(str, sz) {
    let m = MC.get(str);
    if (!m) {
      ctx.save();
      ctx.font = `100px ${FONT}`; ctx.direction = 'rtl'; ctx.textAlign = 'center';
      const r = ctx.measureText(str);
      m = { w: r.width / 100, asc: r.actualBoundingBoxAscent / 100, desc: r.actualBoundingBoxDescent / 100,
            bl: r.actualBoundingBoxLeft / 100, br: r.actualBoundingBoxRight / 100 };
      ctx.restore();
      MC.set(str, m);
    }
    return { w: m.w * sz, asc: m.asc * sz, desc: m.desc * sz, h: (m.asc + m.desc) * sz,
             bl: m.bl * sz, br: m.br * sz, vw: (m.bl + m.br) * sz };
  }
  // גודל גופן שמתאים לרוחב נתון
  const fit = (str, maxW, maxS) => Math.min(maxS, 100 * maxW / meas(str, 100).vw);

  // ---------- רישום תיבות לבדיקת QA ----------
  function reg(cx, cy, w, h, rot, a, role, group, str) {
    if (!REG || a < 0.02) return;
    const c = Math.abs(Math.cos(rot)), s = Math.abs(Math.sin(rot));
    const hw = (w * c + h * s) / 2, hh = (w * s + h * c) / 2;
    REG.push({ x0: cx - hw, y0: cy - hh, x1: cx + hw, y1: cy + hh, a, role, group, str });
  }
  // דהייה כשהתיבה מתקרבת לקצה הפריים — טקסט אף פעם לא נחתך
  function edgeAlpha(cx, cy, w, h, rot) {
    const c = Math.abs(Math.cos(rot)), s = Math.abs(Math.sin(rot));
    const hw = (w * c + h * s) / 2, hh = (w * s + h * c) / 2;
    const m = Math.min(cx - hw, W - cx - hw, cy - hh, H - cy - hh);
    return clamp(m / 50);
  }

  /* טקסט: (x,y) = מרכז ויזואלי אנכי; align קובע את העוגן האופקי */
  function text(str, x, y, sz, col, o = {}) {
    const m = meas(str, sz);
    const s = o.s ?? 1, sx = o.sx ?? 1, sy = o.sy ?? 1, rot = o.rot ?? 0;
    const align = o.align || 'center';
    let bx = align === 'center' ? x : align === 'right' ? x - m.vw / 2 : x + m.vw / 2;
    bx += o.dx || 0; const by = y + (o.dy || 0);
    let a = o.a ?? 1;
    const bw = m.vw * s * sx, bh = m.h * s * sy;
    const role = o.role || 'main';
    if (o.edge ?? (role === 'fly' || role === 'deco')) a *= edgeAlpha(bx, by, bw, bh, rot);
    if (a < 0.004) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(bx, by);
    if (rot) ctx.rotate(rot);
    ctx.scale(s * sx, s * sy);
    if (o.blur > 0.3) ctx.filter = `blur(${o.blur.toFixed(1)}px)`;
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowR ?? 40; }
    ctx.font = `${sz}px ${FONT}`; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    if (o.ext) {   // הבלטה תלת-ממדית: שכבות מוסטות בצבע כהה
      ctx.fillStyle = o.ext.col; const d = o.ext.d ?? 14, dx = o.ext.dx ?? 0.55, dy = o.ext.dy ?? 0.85;
      for (let i = d; i >= 1; i--) ctx.fillText(str, -(m.br - m.bl) / 2 + i * dx, (m.asc - m.desc) / 2 + i * dy);
    }
    ctx.fillStyle = col;
    ctx.fillText(str, -(m.br - m.bl) / 2, (m.asc - m.desc) / 2);
    ctx.restore();
    reg(bx, by, bw, bh, rot, a, role, o.group || str, str);
  }

  /* אות בודדת: x = מרכז ה-advance, yb = קו בסיס. סיבוב/קנה מידה סביב נקודת הבסיס */
  function glyph(ch, x, yb, sz, col, rot, a, role, group, s = 1) {
    if (a < 0.004) return;
    const m = meas(ch, sz);
    const cosr = Math.cos(rot), sinr = Math.sin(rot);
    // מרכז ויזואלי של האות אחרי סיבוב
    const ox = (m.br - m.bl) / 2 * s, oy = -(m.asc - m.desc) / 2 * s;
    const cx = x + ox * cosr - oy * sinr, cy = yb + ox * sinr + oy * cosr;
    if (role === 'deco' || role === 'fly' || role === 'band') a *= edgeAlpha(cx, cy, m.vw * s, m.h * s, rot);
    if (a < 0.004) return;
    ctx.globalAlpha = a;
    if (BASE) { ctx.setTransform(BASE); ctx.transform(cosr * s, sinr * s, -sinr * s, cosr * s, x, yb); }
    else ctx.setTransform(cosr * s, sinr * s, -sinr * s, cosr * s, x, yb);
    ctx.fillStyle = col;
    ctx.font = `${sz}px ${FONT}`; ctx.textAlign = 'center'; ctx.direction = 'rtl';
    ctx.fillText(ch, 0, 0);
    if (BASE) ctx.setTransform(BASE); else ctx.setTransform(1, 0, 0, 1, 0, 0);
    reg(cx, cy, m.vw * s, m.h * s, rot, a, role, group, ch);
  }

  // מיקומי אותיות במילה (מימין לשמאל), יחסית למרכז הוויזואלי
  function glyphs(str, sz) {
    const m = meas(str, sz), res = [];
    const chars = Array.from(str);
    let pre = 0;
    for (const ch of chars) {
      const cw = meas(ch, sz).w;
      res.push({ ch, off: m.w / 2 - pre - cw / 2 - (m.br - m.bl) / 2 });
      pre += cw;
    }
    return { list: res, base: (m.asc - m.desc) / 2 };   // base = היסט קו הבסיס ממרכז ויזואלי
  }

  function star(x, y, r, col, a, rot = 0) {
    if (a < 0.01 || r < 0.5) return;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = col;
    const k = r * 0.16;
    ctx.beginPath(); ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(k, -k, r, 0); ctx.quadraticCurveTo(k, k, 0, r);
    ctx.quadraticCurveTo(-k, k, -r, 0); ctx.quadraticCurveTo(-k, -k, 0, -r);
    ctx.fill(); ctx.restore();
  }
  // אבקת קסם: ניצוצות מנצנצים שעולים לאט ומתבהרים על הפעמה
  function burst(t, t0, x, y, n, col, seed, spread = 520, dur = 0.9) {
    const tau = t - t0; if (tau < 0 || tau > dur) return;
    const p = tau / dur;
    for (let i = 0; i < n; i++) {
      const ang = hash(seed + i) * Math.PI * 2, sp = 0.35 + 0.65 * hash(seed + i * 3);
      const d = spread * sp * eOutC(p);
      star(x + Math.cos(ang) * d, y + Math.sin(ang) * d * 0.75, (6 + 14 * hash(seed + i * 7)) * (1 - p), col, 1 - p * p, p * 3);
    }
  }
  // גל הדף עגול רך
  function ring(t, t0, x, y, col, maxR = 700, dur = 0.6, lw = 10) {
    const tau = t - t0; if (tau < 0 || tau > dur) return;
    const p = tau / dur;
    ctx.save(); ctx.globalAlpha = (1 - p) * 0.8; ctx.strokeStyle = col; ctx.lineWidth = lw * (1 - p) + 1;
    ctx.beginPath(); ctx.arc(x, y, maxR * eOutC(p), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  // הבזק מעבר
  function flash(t, tf, col, up = 0.06, down = 0.3) {
    let a = 0;
    if (t >= tf - up && t < tf) a = prog(t, tf - up, tf);
    else if (t >= tf && t < tf + down) a = 1 - eOutC(prog(t, tf, tf + down));
    if (a > 0) { ctx.globalAlpha = a; fill(col); ctx.globalAlpha = 1; }
  }
  // שובל מהירות לעבר המצלמה
  // ---------- מחזור חיים של אלמנט: נוחת בדיוק על tin, יוצא לפני tout ----------
  // כניסה מהירה (din) שמסתיימת על הפעמה, ואז "נחיתה" רכה בקפיץ
  function life(t, tin, tout, din = 0.2, dout = 0.12) {
    if (t < tin - din || t > tout - din) return null;
    return { pin: eOutC(prog(t, tin - din, tin)), pout: prog(t, tout - din - dout, tout - din), tau: t - tin };
  }
  const STY = {
    // קפיצה מהעומק — נחיתה רכה עם קפיץ
    pop: L => ({ s: lerp(0.45, 1, L.pin) * (1 + 0.045 * spr(L.tau)) * lerp(1, 0.94, L.pout), a: clamp(L.pin * 1.6) * (1 - L.pout), blur: (1 - L.pin) * 10 }),
    // עלייה רכה
    rise: L => ({ dy: (1 - L.pin) * 46 - L.pout * 20, s: 1, a: clamp(L.pin * 1.4) * (1 - L.pout), blur: (1 - L.pin) * 8 }),
    // הטחה מהמצלמה
    slam: L => ({ s: lerp(1.22, 1, L.pin) * (1 - 0.03 * spr(L.tau, 30, 9)) * lerp(1, 0.94, L.pout), a: clamp(L.pin * L.pin * 1.4) * (1 - L.pout), blur: (1 - L.pin) * 12 }),
    // חלומי ואיטי (לשבירה)
    soft: L => ({ s: lerp(0.9, 1, L.pin) * lerp(1, 1.04, L.pout), dy: (1 - L.pin) * 30, a: L.pin * (1 - L.pout), blur: (1 - L.pin) * 22 + L.pout * 22 }),
  };
  // טקסט עם מחזור חיים
  function el(t, str, x, y, sz, col, tin, tout, o = {}) {
    const L = life(t, tin, tout, o.din ?? (o.style === 'soft' ? 0.5 : 0.2), o.dout ?? (o.style === 'soft' ? 0.4 : 0.12));
    if (!L) return null;
    const st = STY[o.style || 'pop'](L);
    const kick = o.kick ? 1 + 0.035 * beatEnv(t, 10) : 1;
    text(str, x, y, sz, col, Object.assign({}, o, { s: (st.s ?? 1) * kick * (o.s ?? 1), a: st.a * (o.a ?? 1), dy: (st.dy || 0) + (o.dy || 0), blur: st.blur }));
    return L;
  }

  // פריסה: מילה ענקית + שורות קטנות (קטנות פי 3 לפחות)
  function lay(main, o = {}) {
    const maxW = o.maxW ?? SAFE_W, gs = o.gs ?? fit(main, maxW, o.maxS ?? 400);
    const mm = meas(main, gs);
    const ss = Math.min(o.smallS ?? 130, gs / 3.05);
    const gap = gs * (o.gap ?? 0.17);
    const am = o.above ? meas(o.above, ss) : null, bm = o.below ? meas(o.below, ss) : null;
    // מרכוז כל הבלוק סביב cy
    const top = (am ? am.h + gap : 0), bot = (bm ? bm.h + gap : 0);
    const cy = (o.cy ?? 545) + (top - bot) / 2;
    return { gs, ss, my: cy,
      ay: am ? cy - mm.h / 2 - gap - am.h / 2 : 0,
      by: bm ? cy + mm.h / 2 + gap + bm.h / 2 : 0,
      mw: mm.vw, mh: mm.h };
  }

  // ---------- אפקט: מילים שעפות לעבר המצלמה ----------
  // המילה נוחתת בגודל מלא בדיוק על tb, נסחפת לאט קדימה, ועוברת את המצלמה לפני הבאה
  function fly(t, str, tb, tnext, col, o = {}) {
    const din = 0.24, dout = 0.2, tau = t - tb;
    const holdEnd = tnext - tb - din - dout;
    if (tau < -din || tau > holdEnd + dout) return;
    const gs = o.gs ?? fit(str, 1250, o.maxS ?? 380);
    let s, a, blur = 0;
    if (tau < 0) { const p = eOutC(prog(tau, -din, 0)); s = 1 / lerp(5, 1, p); a = clamp(p * 2); blur = (1 - p) * 6; }
    else if (tau < holdEnd) { s = (1 + 0.1 * tau / holdEnd) * (1 + 0.04 * spr(tau)); a = 1; }
    else { const p = eInC(prog(tau, holdEnd, holdEnd + dout)); s = lerp(1.1, 2.2, p); a = 1 - prog(tau, holdEnd, holdEnd + dout * 0.8); blur = p * 14; }
    text(str, o.x ?? W / 2, o.y ?? 545, gs, col, { s, a, blur, role: 'fly', glow: o.glow, glowR: 50 });
  }

  // ---------- אפקט: פיצוץ מילה לאותיות לעבר המצלמה ----------
  function explode(t, str, t0, x, y, gs, col, seed, dur = 1.0) {
    const tau = t - t0; if (tau < 0 || tau > dur) return;
    const p = tau / dur, gl = glyphs(str, gs);
    for (let i = 0; i < gl.list.length; i++) {
      const g = gl.list[i];
      const hx = hash(seed + i * 3.3) - 0.5, hy = hash(seed + i * 7.7) - 0.5;
      const dirx = g.off / (gs * 2) + hx * 0.9, diry = hy * 1.4 - 0.15;
      const d = 1100 * eOutC(p);
      const s = 1 + 3.2 * eInC(p) + 0.8 * p;                  // מתקרב למצלמה
      const rot = (hash(seed + i) - 0.5) * 2.4 * eOutC(p);
      const a = 1 - eInC(p);
      glyph(g.ch, x + g.off + dirx * d, y + gl.base + diry * d, gs, col, rot, a, 'fly', 'boom:' + str, s);
    }
    ctx.globalAlpha = 1;
  }

  // ========================================================================
  //                      אפקטים חדשים בהשראת הרפרנסים
  // ========================================================================
  function fill(col) { ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); }
  function disc(x, y, r, col, a = 1) { if (r <= 0) return; ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  const mod = (a, n) => ((a % n) + n) % n;

  // גרעיניות נייר — תחושת דפוס של פוסטר
  let GRAIN = null;
  function grain(a = 0.08) {
    if (!GRAIN) {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const g = c.getContext('2d'), id = g.createImageData(256, 256);
      for (let i = 0; i < 65536; i++) { const v = 255 * hash(i * 0.731 + 0.17); id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
      g.putImageData(id, 0, 0); GRAIN = ctx.createPattern(c, 'repeat');
    }
    ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = GRAIN; ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  // קונפטי: עיגולים ופלחים קטנים שמרחפים ופועמים על הפעמה
  function confetti(t, n, seed, cols, a = 1) {
    const be = beatEnv(t, 7);
    for (let i = 0; i < n; i++) {
      const h1 = hash(seed + i * 1.37), h2 = hash(seed + i * 2.71), h3 = hash(seed + i * 4.13);
      const x = h1 * W + Math.sin(t * 0.7 + i) * 18;
      let y = (h2 * (H + 120) - t * (20 + 40 * h3)) % (H + 120); if (y < 0) y += H + 120; y -= 60;
      const r = (4 + 9 * h3) * (1 + 0.6 * be), col = cols[i % cols.length];
      if (i % 3 === 0) {  // פלח קטן
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.translate(x, y); ctx.rotate(t * (h1 - 0.5) * 3 + i);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 2, -0.5, 0.5); ctx.closePath(); ctx.fill(); ctx.restore();
      } else disc(x, y, r, col, a);
    }
  }

  // ---------- מסלול חלק (Catmull-Rom) ----------
  function path(cps, seg = 36) {
    const pts = [], n = cps.length;
    for (let i = 0; i < n - 1; i++) {
      const p0 = cps[Math.max(0, i - 1)], p1 = cps[i], p2 = cps[i + 1], p3 = cps[Math.min(n - 1, i + 2)];
      for (let j = 0; j < seg; j++) {
        const u = j / seg, u2 = u * u, u3 = u2 * u;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
        pts.push({ x: f(p0[0], p1[0], p2[0], p3[0]), y: f(p0[1], p1[1], p2[1], p3[1]) });
      }
    }
    pts.push({ x: cps[n - 1][0], y: cps[n - 1][1] });
    const L = [0];
    for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    return { pts, L, tot: L[L.length - 1] };
  }
  function pathAt(P_, s) {
    const { pts, L } = P_; let lo = 0, hi = L.length - 1;
    s = clamp(s, 0, P_.tot);
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] < s) lo = m; else hi = m; }
    const u = (s - L[lo]) / Math.max(1e-6, L[hi] - L[lo]), A = pts[lo], B = pts[hi];
    return { x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), ang: Math.atan2(B.y - A.y, B.x - A.x) };
  }

  /* ---------- אפקט: סרט-נחש עם טקסט, ששוזר מעל ומתחת למילה הענקית ----------
     שני מעברים: layer='under' לפני המילה, layer='over' אחריה — כמו ברפרנס הקובלט/ורוד */
  function snake(t, o, layer) {
    const Pp = o.P, tot = Pp.tot;
    const head = clamp(o.head) * tot, tail = clamp(o.tail) * tot;
    if (head - tail < 2) return;
    const under = o.underFn ? (s => o.underFn(pathAt(Pp, s))) : (s => o.per ? Math.sin(s / o.per * Math.PI + (o.uph || 0)) < 0 : false);
    const want = layer === 'under';
    ctx.save();
    ctx.lineWidth = o.w; ctx.lineJoin = 'round'; ctx.lineCap = 'butt'; ctx.strokeStyle = o.col;
    if (!want) { ctx.shadowColor = 'rgba(26,11,61,.30)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 16; }
    ctx.beginPath();
    let run = false;
    const step = 6;
    for (let s = tail; s <= head + step; s += step) {
      const ss = Math.min(s, head), p = pathAt(Pp, ss);
      // מקטעים חופפים מעט כדי שלא ייראה תפר במעבר מעל/מתחת
      if (under(ss) === want) { if (!run) { const q = pathAt(Pp, Math.max(tail, ss - 3)); ctx.moveTo(q.x, q.y); run = true; } ctx.lineTo(p.x, p.y); }
      else { if (run) ctx.lineTo(p.x, p.y); run = false; }
      if (ss >= head) break;
    }
    ctx.stroke();
    // קצוות מעוגלים
    ctx.fillStyle = o.col;
    for (const s of [tail, head]) if (under(s) === want) { const p = pathAt(Pp, s); ctx.beginPath(); ctx.arc(p.x, p.y, o.w / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    if (!o.text) return;
    // טקסט זורם לאורך הסרט (האות הראשונה בקצה הקדמי — קריאה מימין לשמאל)
    const fs = o.w * 0.46, um = meas(o.text, fs), gapW = fs * 1.2, uw = um.w + gapW;
    const chars = Array.from(o.text), cw = chars.map(c => meas(c, fs).w);
    const capH = meas('א', fs).asc;
    const flow = (t * (o.flow ?? 110)) % uw;
    for (let s0 = tail - uw + flow; s0 < head; s0 += uw) {
      let pre = 0;
      for (let i = 0; i < chars.length; i++) {
        const s = s0 + um.w - pre - cw[i] / 2; pre += cw[i];
        if (s < tail || s > head || under(s) !== want) continue;
        const a = clamp((s - tail) / 50) * clamp((head - s) / 50) * (o.ta ?? 1);
        if (a < 0.01) continue;
        const p = pathAt(Pp, s);
        const dx = -Math.sin(p.ang) * capH / 2, dy = Math.cos(p.ang) * capH / 2;
        ctx.textAlign = 'center';
        glyph(chars[i], p.x + dx, p.y + dy, fs, o.tcol, p.ang, a, 'band', 'snake' + (o.id || ''));
      }
      const sp = s0 + um.w + gapW / 2;
      if (sp > tail && sp < head && under(sp) === want) { const p = pathAt(Pp, sp); disc(p.x, p.y, fs * 0.16, o.tcol, clamp((sp - tail) / 50) * clamp((head - sp) / 50)); }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- אפקט: פלח אשכולית — קליפה עם טקסט מסתובב, פלחים עסיסיים ---------- */
  function slice(t, cx, cy, R, rot, o = {}) {
    const n = o.n || 10, ex = o.explode || 0;    // explode: 0 = שלם, 1 = הפלחים עפו החוצה
    const a = o.a ?? 1;
    ctx.save(); ctx.globalAlpha = a;
    if (ex < 0.02) {
      ctx.shadowColor = 'rgba(40,0,10,.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
      disc(cx, cy, R, C.cream, a); ctx.shadowColor = 'transparent';
      ctx.globalAlpha = a; disc(cx, cy, R * 0.885, '#FBEFE6', a);
    }
    ctx.globalAlpha = a;
    for (let i = 0; i < n; i++) {
      const a0 = rot + i * 2 * Math.PI / n, a1 = a0 + 2 * Math.PI / n, am = (a0 + a1) / 2, g = 0.03;
      const d = ex * (900 + 500 * hash(i + 3)) , sc = 1 + ex * 1.6;
      const ox = cx + Math.cos(am) * d, oy = cy + Math.sin(am) * d;
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(ex * (hash(i) - 0.5) * 2); ctx.scale(sc, sc);
      const gr = ctx.createRadialGradient(0, 0, R * 0.05, 0, 0, R * 0.85);
      gr.addColorStop(0, '#FF7A5C'); gr.addColorStop(0.6, C.coral); gr.addColorStop(1, C.red);
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.85, a0 + g, a1 - g);
      ctx.lineTo(Math.cos(am) * R * 0.09, Math.sin(am) * R * 0.09); ctx.closePath(); ctx.fill();
      // שלפוחיות מיץ
      ctx.globalAlpha = a * 0.35; ctx.fillStyle = '#FFB3A0';
      for (let k = 0; k < 7; k++) {
        const rr = R * (0.25 + 0.55 * hash(i * 13 + k)), aa = lerp(a0 + 0.12, a1 - 0.12, hash(i * 7 + k * 3));
        ctx.beginPath(); ctx.ellipse(Math.cos(aa) * rr, Math.sin(aa) * rr, R * 0.05, R * 0.014, aa, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = a; ctx.restore();
    }
    ctx.restore();
    if (ex < 0.02) disc(cx, cy, R * 0.05, '#FBEFE6', a);
    // טקסט על הקליפה
    if (o.text && ex < 0.02) circText(o.text, cx, cy, R * 0.905, R * 0.068, rot * 0.6 + t * 0.15, o.tcol || C.wine, a, 'rind');
  }
  // טקסט מעגלי: baseline על רדיוס rb, קריאה מימין לשמאל לאורך הקשת העליונה
  function circText(str, cx, cy, rb, fs, rot, col, a, group, sep = 1.0) {
    const um = meas(str, fs), gapW = fs * sep, uw = um.w + gapW;
    const circ = 2 * Math.PI * rb, reps = Math.max(1, Math.floor(circ / uw)), sc = circ / (reps * uw);
    const chars = Array.from(str), cw = chars.map(c => meas(c, fs).w);
    for (let j = 0; j < reps; j++) {
      let pre = 0;
      for (let i = 0; i < chars.length; i++) {
        const sArc = (j * uw + pre + cw[i] / 2) * sc; pre += cw[i];
        const th = -Math.PI / 2 + rot - sArc / rb;
        const x = cx + Math.cos(th) * rb, y = cy + Math.sin(th) * rb;
        if (x < -fs * 2 || x > W + fs * 2 || y < -fs * 2 || y > H + fs * 2) continue;
        glyph(chars[i], x, y, fs, col, th + Math.PI / 2, a, 'deco', group);
      }
      const th = -Math.PI / 2 + rot - (j * uw + um.w + gapW / 2) * sc / rb;
      disc(cx + Math.cos(th) * (rb + fs * 0.32), cy + Math.sin(th) * (rb + fs * 0.32), fs * 0.15, col, a);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- אפקט: מנהרת טקסט בעומק — טבעות מלאות בניגוד חד (כמו HOLE) ---------- */
  function bands(t, o) {
    const q = 1.25, cx = o.cx ?? W / 2, cy = o.cy ?? H / 2;
    const ph = o.phase, n0 = Math.floor(ph), f = ph - n0;
    const rs = [];
    for (let k = 0; k < 60; k++) { const r = 3 * Math.pow(q, k + f); if (r > 2300) break; rs.push({ r, id: k - n0 }); }
    for (let i = rs.length - 1; i >= 0; i--) disc(cx, cy, rs[i].r, o.cols[mod(rs[i].id, o.cols.length)]);
    for (const { r, id } of rs) {
      if (r < 70) continue;
      const fs = r * 0.1, rb = r / q + r * 0.03;
      if (rb - fs * 0.3 < (o.hole || 0)) continue;
      const fade = clamp((r - 70) / 60);
      const rot = (id % 2 ? 1 : -1) * t * 0.14 + id * 0.8;
      circText(o.text, cx, cy, rb, fs, rot, o.tcols[mod(id, o.tcols.length)], fade, 'band' + id, 1.1);
    }
    if (o.hole > 0) {
      ctx.save(); ctx.shadowColor = 'rgba(26,11,61,.35)'; ctx.shadowBlur = 40;
      disc(cx, cy, o.hole, o.holeCol); ctx.restore();
    }
  }
  const tPhase = (t, t0, v, jump) => { const b = beatsSince(t, t0); return v * (t - t0) + jump * (Math.max(0, b.n) + (b.n >= 0 ? eOutQ(b.f) : 0)); };

  /* ---------- אפקט: עמודות הגריד מתהפכות על הפעמה (מימין לשמאל) ---------- */
  const colEdge = i => (i === 1 ? W : RX(i) + G / 2);          // גבול ימני של רצועת עמודה i
  const colEdgeL = i => (i === 12 ? 0 : LX(i) - G / 2);
  function stripes(t, t0, cols, o = {}) {
    // כל פעמה מאז t0 מחליפה צבע; כל עמודה מתחילה מעט אחרי הקודמת (גל RTL), ומסיימת על הפעמה
    const n = Math.floor((t - t0) / P + 1e-6);
    for (let i = 1; i <= 12; i++) {
      const x0 = colEdgeL(i), x1 = colEdge(i);
      let k = 0;
      // כמה החלפות הושלמו בעמודה זו
      for (let b = 0; b <= n + 1; b++) {
        const tb = t0 + b * P, st = tb - 0.24 + (i - 1) * 0.012;
        const p = prog(t, st, st + 0.22);
        if (p >= 1) k = b + 1;
        else if (p > 0) {
          ctx.fillStyle = cols[mod(b, cols.length)]; ctx.fillRect(x0, 0, x1 - x0, H);
          const e = eOutQ(p), down = i % 2 === 0;
          ctx.fillStyle = cols[mod(b + 1, cols.length)];
          if (down) ctx.fillRect(x0, 0, x1 - x0, H * e); else ctx.fillRect(x0, H * (1 - e), x1 - x0, H * e);
          k = -1; break;
        } else break;
      }
      if (k >= 0) { ctx.fillStyle = cols[mod(k, cols.length)]; ctx.fillRect(x0, 0, x1 - x0, H); }
    }
  }

  // דחיפת זום קטנה על הטחות — אגרוף בתנועת המצלמה
  const PUNCH = [];
  const punch = t => { let s = 1; for (const tb of PUNCH) if (t >= tb && t < tb + 0.6) s += 0.02 * Math.exp(-(t - tb) * 9); return s; };

  // ========================================================================
  //                                  סצנות
  // ========================================================================
  const SC = [];
  const scene = (t0, t1, fn) => SC.push({ t0, t1, fn });
  const B = (k, b = 0) => bar(k) + b * P;

  // --- 1. הוק (0–3.4): נייר + ורוד ענק מובלט + סרט קובלט מסתלסל שעובר מאחורי המילה ---
  const P1 = path([[-220, 860], [260, 930], [520, 700], [380, 420], [560, 300], [760, 420], [700, 760], [960, 960], [1240, 760], [1180, 420], [1380, 300], [1560, 420], [1440, 720], [1700, 900], [2180, 760]], 30);
  // מאחורי המילה בתוך התיבה שלה, חוץ מחציה אחת מלפנים — שזירה שלא פוגעת בקריאות
  const behind = (x0, x1, y0, y1, over) => p => p.x > x0 && p.x < x1 && p.y > y0 && p.y < y1 && !(over && p.x > over[0] && p.x < over[1]);
  scene(0, B(2), t => {
    fill(C.paper);
    confetti(t, 26, 3, [C.pink, C.coral, C.cobalt], 0.9);
    const A = lay('הכל', { maxS: 620, cy: 560 });
    const gs2 = fit('אפשרי?', 1500, 520);
    const ss = 104, smallY = 170, mainY = 590;
    const wordOut = prog(t, B(1) - 0.32, B(1) - 0.2);
    const head = 0.38 + 0.62 * eOutC(clamp(t / B(1, 2))), tail = eInC(prog(t, B(1, 2), B(2) - 0.12));
    const box = t < B(1) - 0.2 ? behind(CX - A.mw / 2 - 20, CX + A.mw / 2 + 20, 300, 860, [1180, 1300]) : behind(CX - meas('אפשרי?', gs2).vw / 2 - 20, CX + meas('אפשרי?', gs2).vw / 2 + 20, 330, 880, [700, 800]);
    const sn = { P: P1, w: 100, col: C.cobalt, tcol: C.cream, text: 'מה אם הכל אפשרי', underFn: box, head, tail, flow: 130 };
    snake(t, sn, 'under');
    const ext = { col: C.cobalt, d: 16 };
    if (t < B(1) - 0.2) {
      const k = 1 + 0.06 * spr(t, 18, 6) + 0.03 * beatEnv(t);
      text('הכל', CX, A.my, A.gs, C.pink, { s: k * lerp(1, 0.92, wordOut), a: 1 - wordOut, ext });
    }
    el(t, 'מה אם הכל', CX, smallY, ss, C.cobalt, B(1), B(2), { style: 'rise' });
    el(t, 'אפשרי?', CX, mainY, gs2, C.pink, B(1), B(2), { style: 'slam', kick: true, ext });
    snake(t, sn, 'over');
    // מעבר: עיגול יין נפתח מהמרכז ונוחת על התיבה הבאה
    const ir = eInC(prog(t, B(2) - 0.32, B(2)));
    if (ir > 0) disc(CX, 540, 1150 * ir, C.wine);
    grain();
  });

  // --- 2. פלח אשכולית (3.4–6.9): יין + אלמוג. פלח משמאל, טקסט מיושר לקו עמודה 1 ---
  scene(B(2), B(4), t => {
    fill(C.wine);
    confetti(t, 20, 7, [C.coral, C.blush], 0.6);
    const asm = eOutQ(prog(t, B(2), B(2, 1)));                  // הפלחים מתאספים, נוחתים על פעמה 1
    const mv = eIO(prog(t, B(3, 1), B(3, 2)));                   // הפלח זז למרכז
    const dive = eInC(prog(t, B(3, 2), B(4)));                  // צלילה לתוך הפלח
    const R = lerp(370, 470, mv) * lerp(1, 6, dive);
    let rs = 0; for (let i = 1; i < 8; i++) rs += eOutQ(prog(t, B(2, i) - 0.18, B(2, i)));
    slice(t, lerp(540, CX, mv), 540, R, rs * (2 * Math.PI / 10) - 0.3, { explode: 1 - asm, text: 'ארץ החלומות', tcol: C.wine });
    const gs = fit('החלומות', 900, 380), ss = Math.min(100, gs / 3.05);
    const mm = meas('החלומות', gs), gap = gs * 0.17, my = 540 + (meas('ברוכים הבאים לארץ', ss).h + gap) / 2;
    const ay = my - mm.h / 2 - gap - meas('ברוכים הבאים לארץ', ss).h / 2;
    el(t, 'ברוכים הבאים לארץ', RX(1), ay, ss, C.blush, B(2, 3), B(3, 1), { style: 'rise', align: 'right' });
    el(t, 'החלומות', RX(1), my, gs, C.cream, B(2, 2), B(3, 1), { style: 'slam', align: 'right', kick: true, ext: { col: C.coral, d: 12 } });
    grain();
  });

  // --- 3. מנהרת טבעות (6.9–10.3): אשכולית בעומק, "תרצו" במרכז ---
  scene(B(4), B(6), t => {
    const ph = tPhase(t, B(4), 0.6, 0.5) + 2;
    const wIn = eOutC(prog(t, B(5) - 0.4, B(5)));
    const wOut = eInC(prog(t, B(5, 2), B(6) - 0.06));
    const hole = lerp(0, 330, wIn) + 1400 * wOut;
    bands(t, { phase: ph + wOut * 2, cols: [C.coral, C.blush, C.wine, C.cream], tcols: [C.cream, C.wine, C.blush, C.coral], text: 'אם רק תרצו', hole, holeCol: C.cobalt });
    const T = lay('תרצו', { above: 'אם רק', maxS: 230, smallS: 74, cy: 540 });
    if (wIn > 0) {
      const s = (1 / lerp(5, 1, wIn)) * (1 + 0.04 * spr(t - B(5))) * lerp(1, 2.4, wOut);
      text('תרצו', CX, 540 + (T.my - 540) * s, T.gs, C.pink, { s, a: clamp(wIn * 2) * (1 - clamp(wOut * 2.5)) });
      const sa = eOutC(prog(t, B(5, 1) - 0.2, B(5, 1))) * (1 - clamp(wOut * 2.5));
      text('אם רק', CX, 540 + (T.ay - 540) * s + (1 - sa) * 16, T.ss, C.cream, { a: sa, s });
    }
    grain(0.06);
  });

  // --- 4. עמודות הגריד (10.3–13.7): "ותעיזו", אות על כל פעמה ---
  scene(B(6), B(8), t => {
    stripes(t, B(6), [C.cobalt, C.coral]);
    const word = 'ותעיזו';
    const A = lay(word, { below: 'לחלום בגדול', maxS: 470, cy: 540 });
    const gl = glyphs(word, A.gs);
    const outP = prog(t, B(8) - 0.36, B(8) - 0.22);
    gl.list.forEach((g, i) => {
      const tb = B(6, i);
      if (t < tb - 0.16) return;
      const p = eOutC(prog(t, tb - 0.16, tb));
      const s = lerp(1.6, 1, p) * (1 - 0.05 * spr(t - tb, 26, 8)) * (t >= B(7, 3) ? 1 + 0.06 * beatEnv(t, 8) : 1);
      const dy = (1 - p) * -80;
      glyph(g.ch, CX + g.off, A.my + gl.base + dy, A.gs, C.cream, 0, clamp(p * 1.8) * (1 - outP), 'main', 'tazizu', s * lerp(1, 0.9, outP));
    });
    ctx.globalAlpha = 1;
    el(t, 'לחלום בגדול', CX, A.by, A.ss, C.cream, B(7, 2), B(8), { style: 'rise' });
    // מעבר: כל העמודות מתהפכות לוורוד, מימין לשמאל, ונוחתות על התיבה
    for (let i = 1; i <= 12; i++) {
      const st = B(8) - 0.3 + (i - 1) * 0.014, p = eOutQ(prog(t, st, st + 0.22));
      if (p > 0) { ctx.fillStyle = C.pink; const x0 = colEdgeL(i), x1 = colEdge(i); if (i % 2) ctx.fillRect(x0, H * (1 - p), x1 - x0, H * p); else ctx.fillRect(x0, 0, x1 - x0, H * p); }
    }
    grain(0.06);
  });

  // --- 5. פיצוץ לעבר המצלמה (13.7–18.9): ורוד + קובלט ---
  const WORDS = ['אור', 'קסם', 'אומץ', 'חלום'];
  scene(B(8), B(11), t => {
    fill(C.pink);
    // טבעות הלם קונצנטריות על כל פעמה — כמו פלח שנפתח
    for (let k = 0; k < 4; k++) {
      const b = Math.floor(t / P) - k; if (b < 0) continue;
      const p = (t - b * P) / (P * 4);
      ctx.save(); ctx.globalAlpha = 0.5 * (1 - p); ctx.strokeStyle = C.blush; ctx.lineWidth = 30 * (1 - p) + 2;
      ctx.beginPath(); ctx.arc(CX, 540, 80 + 1100 * eOutC(p), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    confetti(t, 30, 11, [C.cobalt, C.coral, C.paper], 0.9);
    const capA = eOutC(prog(t, B(8), B(8) + 0.25)) * (1 - prog(t, B(10) - 0.32, B(10) - 0.2));
    text('מה מחכה לכם שם?', CX, 140, 92, C.cobalt, { a: capA, dy: (1 - capA) * 20 });
    WORDS.forEach((w, i) => { const tb = B(8, 2 * i); fly(t, w, tb, tb + 2 * P, i % 2 ? C.wine : C.cobalt, { gs: fit(w, 1250, 300) }); });
    const A = lay('אופטימיים', { above: 'להיות', maxS: 420, cy: 540 });
    const tEx = B(10, 2);
    el(t, 'להיות', CX, A.ay, A.ss, C.wine, B(10), tEx + 0.2, { style: 'rise' });
    if (t >= B(10) - 0.2 && t < tEx) {
      const st = STY.slam(life(t, B(10), tEx + 0.2));
      text('אופטימיים', CX, A.my, A.gs, C.cobalt, { s: st.s * (1 + 0.03 * beatEnv(t)), a: st.a, blur: st.blur, ext: { col: C.wine, d: 12 } });
    }
    // פלחי אשכולית מתפזרים מאחורי האותיות
    if (t >= tEx && t < tEx + 0.8) slice(t, CX, 540, 300, 0.3, { explode: 0.08 + 0.92 * eOutC(prog(t, tEx, tEx + 0.8)), a: 1 - prog(t, tEx + 0.4, tEx + 0.8) });
    explode(t, 'אופטימיים', tEx, CX, A.my, A.gs, C.cobalt, 17, 0.8);
    grain(0.06);
  });

  // --- 6. השיא (18.9–24): "הכל אפשרי" + שני סרטים שוזרים — הפריים שנשאר בזיכרון ---
  const P6a = path([[-240, 240], [380, 230], [960, 850], [1540, 230], [2180, 250]]);
  const P6b = path([[2180, 840], [1540, 850], [960, 230], [380, 850], [-240, 830]]);
  scene(B(11), B(14), t => {
    fill(C.paper);
    confetti(t, 22, 13, [C.pink, C.coral, C.cobalt], 0.7);
    const A = lay('הכל אפשרי', { below: 'אם רק תרצו ותעיזו להיות אופטימיים', maxS: 440, smallS: 104, cy: 540 });
    const wx = A.mw / 2 + 30;
    const hd = eOutQ(prog(t, B(11), B(12))), tl = eInC(prog(t, B(12, 2), B(13) + 0.1));
    const sa = { P: P6a, w: 96, col: C.cobalt, tcol: C.cream, text: 'אם רק תרצו ותעיזו', underFn: behind(CX - wx, CX + wx, 340, 740, [1150, 1250]), head: hd, tail: tl, flow: 140, id: 'a' };
    const sb = { P: P6b, w: 96, col: C.coral, tcol: C.cream, text: 'להיות אופטימיים', underFn: behind(CX - wx, CX + wx, 340, 740, [670, 770]), head: hd, tail: tl, flow: 120, id: 'b' };
    snake(t, sa, 'under'); snake(t, sb, 'under');
    const L = life(t, B(11), 1e9), st = STY.slam(L);
    // המילה עולה מעט כשהשורה הקטנה נכנסת — היררכיה ברורה
    const lift = eOutC(prog(t, B(13) - 0.2, B(13)));
    const y = lerp(540, A.my, lift);
    text('הכל אפשרי', CX, y, A.gs, C.pink, { s: st.s * (1 + 0.025 * beatEnv(t)), a: st.a, blur: st.blur, ext: { col: C.cobalt, d: 16 } });
    snake(t, sa, 'over'); snake(t, sb, 'over');
    el(t, 'אם רק תרצו ותעיזו להיות אופטימיים', CX, A.by, A.ss, C.cobalt, B(13), B(14) + 0.2, { style: 'rise' });
    const ir = eInC(prog(t, B(14) - 0.3, B(14)));
    if (ir > 0) slice(t, CX, 540, 1250 * ir, ir * 2, { n: 10 });
    grain();
  });

  // --- 7+8. קריאה לפעולה (24–30): אשכולית מסתובבת, "הירשמו" ענק ---
  scene(B(14), DUR + 1, t => {
    fill(C.coral);
    // פלחים ענקיים מסתובבים לאט בפינות — עומק רך
    slice(t, -60, 1040, 520, t * 0.25, { a: 1 });
    slice(t, 1980, 40, 460, -t * 0.22, { a: 1 });
    confetti(t, 20, 17, [C.cream, C.blush, C.wine], 0.7);
    [['שתפו', C.cream], ['הגיבו', C.blush]].forEach(([w, c], i) => {
      const tb = B(14, i);
      el(t, w, CX, 545, fit(w, 1400, 460), c, tb, tb + P, { style: 'slam', din: 0.14, dout: 0.08 });
    });
    const tF = B(14, 2);
    if (t >= tF - 0.14) {
      const gs = 300, m = meas('הירשמו', gs), ss = 98, py = 555;
      const st = STY.slam(life(t, tF, 1e9, 0.14));
      const k = st.s * (1 + 0.025 * beatEnv(t, 7) * (t < 27.4 ? 1 : 0));
      const pw = m.vw + gs * 0.8, ph = m.h + gs * 0.6;
      ctx.save(); ctx.globalAlpha = st.a; ctx.translate(CX, py); ctx.scale(k, k);
      ctx.shadowColor = 'rgba(26,11,61,.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 22;
      ctx.fillStyle = C.cobalt; ctx.beginPath(); ctx.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fill();
      ctx.restore();
      text('הירשמו', CX, py, gs, C.pink, { s: k, a: st.a, blur: st.blur });
      const sa = eOutC(prog(t, tF + P - 0.2, tF + P)), sb = eOutC(prog(t, tF + 2 * P - 0.2, tF + 2 * P));
      const ry = py - ph / 2 - 110;
      text('שתפו', CX + 46, ry, ss, C.cream, { align: 'left', a: sa, dy: (1 - sa) * 24 });
      disc(CX, ry + (1 - sa) * 24, 12, C.wine, sa);
      text('הגיבו', CX - 46, ry, ss, C.cream, { align: 'right', a: sa, dy: (1 - sa) * 24 });
      text('לעוד רגעים של קסם', CX, py + ph / 2 + 100, 80, C.cream, { a: sb, dy: (1 - sb) * 24 });
    }
    grain();
  });

  const FLASHES = [[B(8), C.paper, 0.04, 0.16], [B(11), C.paper, 0.08, 0.28]];
  PUNCH.push(0, B(1), B(2, 2), B(5), B(8), B(10), B(10, 2), B(11), B(14), B(14, 1), B(14, 2));

  function flashAll(t) { for (const [tf, col, up, down] of FLASHES) flash(t, tf, col, up, down); }

  function drawGrid() {
    ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#00E5FF';
    for (let i = 1; i <= 12; i++) ctx.fillRect(LX(i), 0, CW, H);
    ctx.globalAlpha = 0.9; ctx.strokeStyle = '#00E5FF'; ctx.lineWidth = 2; ctx.strokeRect(M, 80, W - 2 * M, H - 160);
    ctx.beginPath(); ctx.moveTo(CX, 0); ctx.lineTo(CX, H); ctx.stroke(); ctx.restore();
  }

  function render(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.shadowBlur = 0;
    ctx.direction = 'rtl'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
    t = clamp(t, 0, DUR - 1e-4);
    const sc = SC.find(s => t >= s.t0 && t < s.t1) || SC[SC.length - 1];
    const k = punch(t);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(k, k); ctx.translate(-W / 2, -H / 2);
    // glyph() משתמש ב-setTransform — שומרים את מטריצת האגרוף כבסיס
    BASE = ctx.getTransform();
    sc.fn(t);
    ctx.restore(); BASE = null;
    ctx.globalAlpha = 1;
    flashAll(t);
    if (SHOW_GRID) drawGrid();
  }

  function qa(t) {
    REG = []; render(t); const R = REG; REG = null;
    const issues = [];
    for (const b of R) {
      if (b.role !== 'deco' && b.role !== 'band' && b.a > 0.05 && (b.x0 < -0.5 || b.y0 < -0.5 || b.x1 > W + 0.5 || b.y1 > H + 0.5))
        issues.push(`חיתוך: "${b.str}" (${b.role})`);
    }
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
      const A = R[i], Bx = R[j];
      if (A.group === Bx.group) continue;
      const da = A.role === 'deco' || A.role === 'band', db = Bx.role === 'deco' || Bx.role === 'band';
      if (da && db) continue;
      // טקסט על סרט אטום שעובר מעל המילה — כמו ברפרנס; מותר רק מול המילה הענקית
      if ((A.role === 'band' || Bx.role === 'band')) continue;
      if (Math.min(A.a, Bx.a) < 0.1) continue;
      const ox = Math.min(A.x1, Bx.x1) - Math.max(A.x0, Bx.x0), oy = Math.min(A.y1, Bx.y1) - Math.max(A.y0, Bx.y0);
      if (ox > 2 && oy > 2) issues.push(`חפיפה: "${A.str}" ↔ "${Bx.str}"`);
    }
    return { issues: [...new Set(issues)], n: R.length };
  }

  function init(cv) {
    ctx = cv.getContext('2d');
    const ff = new FontFace('Drakonit', 'url(assets/font.woff2)');
    document.fonts.add(ff);
    return ff.load().then(() => document.fonts.ready).then(() => { MC.clear(); });
  }

  window.DREAM = { W, H, FPS, DUR, OFFSET, BPM, P, beat, bar, init, render, qa, setGrid: v => (SHOW_GRID = v), scenes: SC };
})();

'use strict';
/* ארץ החלומות — מנוע טיפוגרפיה קינטית.
   render(t) היא פונקציה טהורה של הזמן: אותו קוד משמש לתצוגה החיה ולרינדור. */
(function () {
  // ---------- זמן ופעמות ----------
  const W = 1920, H = 1080, FPS = 30, DUR = 101.17;
  const BPM = 140, P = 60 / BPM, B0 = 0.07;          // נמדד מהשיר (librosa)
  const beat = n => B0 + n * P;
  const bar = k => beat(4 * k);

  // ---------- פלטה: סגול · ורוד · כתום (+ קרם ניטרלי) ----------
  const C = {
    ink: '#1B0532', plum: '#3A0C6A', purple: '#7B2BD8', violet: '#B98CFF', lav: '#EEE2FF',
    pink: '#FF3E9B', rose: '#FF8DC7', blush: '#FFD6EB',
    orange: '#FF7417', amber: '#FFA23F', peach: '#FFD3A6',
    cream: '#FFF7EE',
  };

  // ---------- גריד 12 עמודות ----------
  const M = 120, G = 24, CW = 118;                    // שוליים 120, מרווח 24, עמודה 118
  const RX = i => W - M - (i - 1) * (CW + G);         // קצה ימני של עמודה i (1 = הימנית)
  const LX = i => RX(i) - CW;
  const CX = W / 2;                                    // הקו בין עמודה 6 ל-7
  const SAFE_W = W - 2 * M;                            // 1680

  const FONT = '"Drakonit"';
  let ctx = null, REG = null, SHOW_GRID = false;

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
    if (role === 'deco' || role === 'fly') a *= edgeAlpha(cx, cy, m.vw * s, m.h * s, rot);
    if (a < 0.004) return;
    ctx.globalAlpha = a;
    ctx.setTransform(cosr * s, sinr * s, -sinr * s, cosr * s, x, yb);
    ctx.fillStyle = col;
    ctx.font = `${sz}px ${FONT}`;
    ctx.fillText(ch, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
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

  // ---------- רקעים, זוהר, ניצוצות ----------
  function fill(col) { ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); }
  function linear(stops, ang = 0) {
    const r = Math.hypot(W, H) / 2, dx = Math.cos(ang) * r, dy = Math.sin(ang) * r;
    const g = ctx.createLinearGradient(W / 2 - dx, H / 2 - dy, W / 2 + dx, H / 2 + dy);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function radial(inner, outer, x = W / 2, y = H / 2, r = 1200) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, inner); g.addColorStop(1, outer);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function blob(x, y, r, col, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.globalAlpha = 1;
  }
  // כתמי אור רכים שנודדים לאט — ה"רכות"
  function blobs(t, cols, seed, a = 0.45) {
    for (let i = 0; i < 4; i++) {
      const h1 = hash(seed * 13 + i), h2 = hash(seed * 7 + i * 3.1);
      const x = W * (0.15 + 0.7 * h1) + Math.sin(t * 0.31 + i * 2) * 160;
      const y = H * (0.2 + 0.6 * h2) + Math.cos(t * 0.27 + i) * 110;
      blob(x, y, 520 + 180 * hash(seed + i * 5), cols[i % cols.length], a);
    }
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
  function dust(t, n, seed, col, a = 1, area = null) {
    const be = beatEnv(t, 6);
    for (let i = 0; i < n; i++) {
      const h1 = hash(seed + i * 1.37), h2 = hash(seed + i * 2.71), h3 = hash(seed + i * 4.13);
      const x = (area ? area[0] + h1 * (area[2] - area[0]) : h1 * W) + Math.sin(t * 0.6 + i) * 12;
      let y = (h2 * (H + 200) - t * (14 + 30 * h3)) % (H + 200); if (y < 0) y += H + 200; y -= 100;
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (2 + 3 * h3) + i));
      const r = (3 + 10 * h3) * (1 + 0.5 * be);
      star(x, y, r, col, a * tw * (0.5 + 0.5 * be), t * 0.5 * (h1 - 0.5));
    }
  }
  // פרץ ניצוצות ממרכז
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
  function warp(t, n, seed, col, speed = 1, a = 0.7, cx = W / 2, cy = H / 2) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const ang = hash(seed + i) * Math.PI * 2;
      const z = 1 - (((t * speed * (0.5 + hash(seed + i * 9)) + hash(seed + i * 3)) % 1));
      const z2 = Math.min(1, z + 0.06 * speed);
      const r1 = 60 / Math.max(z, 0.05), r2 = 60 / z2;
      ctx.globalAlpha = a * clamp((1 - z) * 2) * clamp(z * 6);
      ctx.lineWidth = 1 + 5 * (1 - z);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
      ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
      ctx.stroke();
    }
    ctx.restore();
  }

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

  // ---------- אפקט: מנהרת טקסט בעומק (זום אינסופי) ----------
  function tunnel(t, o) {
    const q = 1.17, rMax = 525, cx = o.cx ?? W / 2, cy = o.cy ?? H / 2;
    const ph = o.phase, n0 = Math.floor(ph), f = ph - n0;
    const sep = o.sep || 0.9;
    // טבעות דקורטיביות (קווים, לא טקסט) שממשיכות מחוץ למסגרת הרחבה
    ctx.save();
    for (let k = 0; k < 60; k++) {
      const r = 6 * Math.pow(q, k + f); if (r > 1300) break; if (r < rMax) continue;
      ctx.globalAlpha = 0.22 * (o.a ?? 1) * clamp((1300 - r) / 500);
      ctx.strokeStyle = (k - n0) % 2 ? o.cols[0] : o.cols[1];
      ctx.lineWidth = 2 + r * 0.012;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    const unitStr = o.text;
    for (let k = 0; k < 60; k++) {
      const r = 6 * Math.pow(q, k + f); if (r > rMax + 60) break;
      const fs = r * 0.105; if (fs < 6) continue;
      const id = k - n0;
      let a = (o.a ?? 1) * clamp((fs - 6) / 10);
      a *= clamp((rMax + 5 - (r + fs * 0.8)) / 45);              // לא נחתך בקצה הפריים
      a *= clamp((r - fs * 0.25 - (o.hole || 0)) / 35);           // החור במרכז נפתח
      if (a < 0.01) continue;
      const col = id % 2 ? o.cols[0] : o.cols[1];
      const um = meas(unitStr, fs), gapW = fs * sep, uw = um.w + gapW;
      const circ = 2 * Math.PI * r, reps = Math.max(1, Math.floor(circ / uw)), sc = circ / (reps * uw);
      const rot = (id % 2 ? 1 : -1) * t * 0.12 + id * 0.9 + (o.spin || 0);
      const gl = glyphs(unitStr, fs).list;
      for (let j = 0; j < reps; j++) {
        for (const g of gl) {
          const sArc = (j * uw + (um.w / 2 - g.off)) * sc;    // מרחק לאורך הקשת מתחילת המופע (ימין)
          const th = -Math.PI / 2 + rot - sArc / r;
          glyph(g.ch, cx + Math.cos(th) * r, cy + Math.sin(th) * r, fs, col, th + Math.PI / 2, a, 'deco', 'ring' + id);
        }
        const th = -Math.PI / 2 + rot - (j * uw + um.w + gapW / 2) * sc / r;
        star(cx + Math.cos(th) * (r + fs * 0.33), cy + Math.sin(th) * (r + fs * 0.33), fs * 0.3, col, a, th);
      }
    }
    ctx.globalAlpha = 1;
  }
  // תנועת מצלמה במנהרה: זרימה רציפה + דחיפה על כל פעמה
  const tPhase = (t, t0, v, jump) => { const b = beatsSince(t, t0); return v * (t - t0) + jump * (Math.max(0, b.n) + (b.n >= 0 ? eOutQ(b.f) : 0)); };

  // ---------- אפקט: טקסט שזורם על סרט מתפתל ----------
  function ribbon(t, o) {
    const N = 140, x0 = W + 160, x1 = -160;
    const reveal = o.reveal ?? 1, wid = o.w;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const x = lerp(x0, x1, i / N);
      const y = o.y + o.amp * Math.sin(x * o.freq + o.ph + t * o.sp) + o.amp * 0.35 * Math.sin(x * o.freq * 2.3 - t * o.sp * 0.7 + o.ph);
      const tw = Math.cos(x * (o.twF ?? 0.0021) + t * (o.twS ?? 0.9) + o.ph * 2);   // פיתול הסרט
      pts.push({ x, y, tw });
    }
    const cut = Math.floor(N * reveal);
    // נורמלים
    for (let i = 0; i <= N; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
      const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
      pts[i].nx = -dy / l; pts[i].ny = dx / l;
    }
    ctx.save();
    ctx.globalAlpha = o.a ?? 1;
    for (let i = 0; i < cut; i++) {
      const p = pts[i], q2 = pts[i + 1];
      const w1 = wid / 2 * p.tw, w2 = wid / 2 * q2.tw;
      ctx.fillStyle = p.tw >= 0 ? o.col : o.back;
      ctx.beginPath();
      ctx.moveTo(p.x + p.nx * w1, p.y + p.ny * w1); ctx.lineTo(q2.x + q2.nx * w2, q2.y + q2.ny * w2);
      ctx.lineTo(q2.x - q2.nx * w2, q2.y - q2.ny * w2); ctx.lineTo(p.x - p.nx * w1, p.y - p.ny * w1);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    if (!o.text) return;
    // אורך קשת
    const L = [0];
    for (let i = 1; i <= N; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const at = s => {
      let lo = 0, hi = N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] < s) lo = m; else hi = m; }
      const p = (s - L[lo]) / Math.max(1e-6, L[hi] - L[lo]), A = pts[lo], B = pts[hi];
      return { x: lerp(A.x, B.x, p), y: lerp(A.y, B.y, p), tw: lerp(A.tw, B.tw, p), ang: Math.atan2(A.y - B.y, A.x - B.x), i: lo };
    };
    const fs = wid * 0.5, um = meas(o.text, fs), gapW = fs * 1.1, uw = um.w + gapW;
    const gl = glyphs(o.text, fs).list;
    // זרימה ימינה: בעברית כך נחשף המשך המשפט
    let off = -((t * (o.flow ?? 120)) % uw);
    for (let s0 = off - uw; s0 < L[N]; s0 += uw) {
      for (const g of gl) {
        const s = s0 + (um.w / 2 - g.off); if (s < 0 || s > L[N]) continue;
        const p = at(s); if (p.i >= cut) continue;
        const a = clamp((p.tw - 0.45) / 0.25) * (o.ta ?? 1) * (o.a ?? 1);
        if (a < 0.01) continue;
        const sY = clamp(p.tw, 0, 1);
        // קו הבסיס מוזז כך שהאות ממורכזת על קו האמצע של הסרט
        const m = meas(g.ch, fs), lift = (m.asc - m.desc) / 2 * sY;
        const bx = p.x - Math.sin(p.ang) * -lift, by = p.y + Math.cos(p.ang) * lift;
        ctx.globalAlpha = 1;
        glyphRibbon(g.ch, bx, by, fs, o.tcol, p.ang, a, sY);
      }
      const p = at(s0 + um.w + gapW / 2);
      if (p.i < cut) star(p.x, p.y, fs * 0.28 * clamp(p.tw), o.tcol, clamp((p.tw - 0.45) / 0.25) * (o.a ?? 1), p.ang);
    }
    ctx.globalAlpha = 1;
  }
  function glyphRibbon(ch, x, yb, sz, col, rot, a, sY) {
    const m = meas(ch, sz);
    const cosr = Math.cos(rot), sinr = Math.sin(rot);
    const ox = (m.br - m.bl) / 2, oy = -(m.asc - m.desc) / 2 * sY;
    const cx = x + ox * cosr - oy * sinr, cy = yb + ox * sinr + oy * cosr;
    a *= edgeAlpha(cx, cy, m.vw, m.h * sY, rot);
    if (a < 0.004) return;
    ctx.globalAlpha = a;
    ctx.setTransform(cosr, sinr, -sinr * sY, cosr * sY, x, yb);
    ctx.fillStyle = col; ctx.font = `${sz}px ${FONT}`; ctx.fillText(ch, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    reg(cx, cy, m.vw, m.h * sY, rot, a, 'deco', 'ribbon', ch);
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
  //                                  סצנות
  // ========================================================================
  const SC = [];
  const scene = (t0, t1, fn) => SC.push({ t0, t1, fn });

  // --- 1. הוק: "מה אם הכל אפשרי?" | סגול עמוק + כתום ---
  scene(0, bar(4), t => {
    radial(C.plum, C.ink, W / 2, 560, 1300);
    blobs(t, [C.purple, C.pink, C.purple], 1, 0.35);
    dust(t, 46, 11, C.peach, 0.9);
    const A = lay('הכל', { above: 'מה אם', maxS: 430 });
    // פריים 0 כבר מלא: המילה כבר שם ופועמת על הפעמה הראשונה
    if (t < bar(1) - 0.2) {
      const L = life(t, -1, bar(1));
      const k = 1 + 0.07 * spr(t - B0, 18, 6) + 0.03 * beatEnv(t, 10);
      text('מה אם', CX, A.ay, A.ss, C.peach, { a: 1 - L.pout });
      text('הכל', CX, A.my, A.gs, C.orange, { s: k * lerp(1, 0.94, L.pout), a: 1 - L.pout, glow: 'rgba(255,116,23,.45)', glowR: 60 });
    }
    const B = lay('אפשרי?', { above: 'מה אם הכל', maxS: 430 });
    el(t, 'מה אם הכל', CX, B.ay, B.ss, C.peach, bar(1), bar(2), { style: 'rise' });
    el(t, 'אפשרי?', CX, B.my, B.gs, C.orange, bar(1), bar(2), { style: 'pop', kick: true, glow: 'rgba(255,116,23,.45)', glowR: 60 });
    // סימן השאלה הופך לקריאה — האופטימיות מנצחת את הספק
    const D = lay('הכל אפשרי!', { above: 'בארץ החלומות', maxS: 330 });
    if (t >= bar(2) - 0.2) {
      el(t, 'בארץ החלומות', CX, D.ay, D.ss, C.rose, bar(2), bar(3) + P, { style: 'rise' });
      const L = life(t, bar(2), 1e9), st = STY.slam(L);
      // שלוש פעמות: המילה מתכווצת בקפיצות לתוך הפורטל
      let step = 0;
      for (let i = 1; i <= 3; i++) step += eOutC(prog(t, bar(3) + i * P - 0.16, bar(3) + i * P));
      const s = lerp(1, 0.2, step / 3) * (1 + 0.03 * beatEnv(t));
      const a = st.a * (1 - prog(t, bar(4) - 0.22, bar(4) - 0.04));
      const y = lerp(D.my, 540, step / 3);
      const ta = clamp(step) * (1 - prog(t, bar(4) - 0.15, bar(4)));
      if (ta > 0) tunnel(t, { text: 'ארץ החלומות', cols: [C.pink, C.rose], phase: tPhase(t, bar(3), 0.35, 0.5), a: ta * 0.9, hole: D.mw / 2 * s + 60 });
      text('הכל אפשרי!', CX, y, D.gs, C.orange, { s: st.s * s, a, blur: st.blur, glow: 'rgba(255,62,155,.5)', glowR: 70 });
    }
    burst(t, bar(2), CX, D.my, 40, C.peach, 3, 900);
    ring(t, bar(2), CX, D.my, C.pink, 1000, 0.7, 14);
  });

  // --- 2. מנהרת טקסט: "ארץ החלומות" | סגול + ורוד ---
  scene(bar(4), bar(8), t => {
    radial(C.plum, C.ink, W / 2, H / 2, 1100);
    const ph = tPhase(t, bar(4), 0.5, 0.42) + 1.2;
    // החור נפתח כשהמילה מגיעה מן העומק
    const wIn = eOutC(prog(t, bar(6) - 0.45, bar(6)));
    const wOut = eInC(prog(t, bar(7) + 2 * P, bar(8) - 0.12));
    const T = lay('החלומות', { above: 'ברוכים הבאים לארץ', maxS: 190, smallS: 62, gap: 0.12, cy: 540 });
    const hole = 400 * wIn + 260 * wOut;
    blob(W / 2, H / 2, 420, C.pink, 0.25 + 0.25 * beatEnv(t, 5));
    tunnel(t, { text: 'ברוכים הבאים לארץ החלומות', cols: [C.pink, C.rose], phase: ph + wOut * 3, hole, sep: 1.0 });
    dust(t, 30, 21, C.blush, 0.7);
    if (wIn > 0) {
      const sIn = 1 / lerp(6, 1, wIn), s = sIn * (1 + 0.035 * spr(t - bar(6))) * lerp(1, 1.5, wOut);
      const a = clamp(wIn * 2) * (1 - wOut);
      text('החלומות', CX, 540 + (T.my - 540) * s / sIn, T.gs, C.cream, { s, a, blur: (1 - wIn) * 8 + wOut * 10, glow: 'rgba(255,62,155,.8)', glowR: 50 });
      const sa = eOutC(prog(t, bar(6) + 2 * P - 0.2, bar(6) + 2 * P)) * (1 - wOut);
      text('ברוכים הבאים לארץ', CX, 540 + (T.ay - 540) * lerp(1, 1.5, wOut) - (1 - sa) * 20, T.ss, C.rose, { a: sa, s: lerp(1, 1.5, wOut) });
      burst(t, bar(6), W / 2, H / 2, 30, C.cream, 5, 380, 0.8);
    }
  });

  // --- 3. סרטים מתפתלים: "תרצו" | ורוד + סגול (סרטים כתומים) ---
  scene(bar(8), bar(12), t => {
    linear([C.rose, C.pink], Math.PI * 0.3);
    blobs(t, [C.blush, C.orange, C.purple], 3, 0.25);
    const rv = eOutC(prog(t, bar(8) - 0.1, bar(9)));
    const wipe = prog(t, bar(11) + 3 * P - 0.25, bar(12));
    const ribA = { y: 140, amp: 42, freq: 0.0032, ph: 0.4, sp: 0.8, w: 116, col: C.orange, back: '#D9560C', text: 'רק תרצו', tcol: C.cream, flow: 140, reveal: rv };
    const ribB = { y: 940, amp: 42, freq: 0.0027, ph: 2.2, sp: -0.7, w: 116, col: C.plum, back: C.ink, text: 'הכל מתחיל ברצון', tcol: C.blush, flow: 110, reveal: rv };
    ribbon(t, ribA); ribbon(t, ribB);
    dust(t, 30, 31, C.cream, 0.8);
    const A = lay('תרצו', { above: 'אם רק', below: 'באמת, בכל הלב', maxS: 340, smallS: 105, cy: 540 });
    const endMain = bar(11) + 2 * P;
    el(t, 'אם רק', CX, A.ay, A.ss, C.plum, bar(9), endMain, { style: 'rise' });
    el(t, 'תרצו', CX, A.my, A.gs, C.ink, bar(9), endMain, { style: 'pop', kick: true, glow: 'rgba(255,214,235,.7)', glowR: 40 });
    el(t, 'באמת, בכל הלב', CX, A.by, A.ss, C.plum, bar(10), endMain, { style: 'rise' });
    burst(t, bar(9), CX, A.my, 34, C.cream, 7, 760);
    // מעבר: עיגול כתום רך נפתח מהמרכז על הפעמה האחרונה
    if (wipe > 0) {
      ctx.save(); ctx.fillStyle = C.orange; ctx.shadowColor = C.amber; ctx.shadowBlur = 80;
      ctx.beginPath(); ctx.arc(CX, 540, 1150 * eInC(wipe), 0, Math.PI * 2); ctx.fill(); ctx.restore();
      burst(t, bar(11) + 3 * P, CX, 540, 40, C.cream, 8, 900, 0.6);
    }
  });

  // --- 4. "ותעיזו": אותיות ננעצות על הפעמות | כתום + סגול ---
  scene(bar(12), bar(16), t => {
    const build = t >= bar(15);
    const bc = build ? beatsSince(t, bar(15)).n : -1;
    linear(build && bc % 2 ? [C.pink, C.rose] : [C.orange, C.amber], Math.PI * 0.2);
    blobs(t, [C.peach, C.pink], 4, 0.3);
    dust(t, 34, 41, C.cream, 0.8);
    const word = 'ותעיזו';
    const A = lay(word, { below: 'לחלום בגדול', maxS: 420, cy: 540 });
    const gl = glyphs(word, A.gs);
    const endT = bar(16) - 0.2;
    const outP = prog(t, endT - 0.14, endT);
    // ננעצות מימין לשמאל, אות על כל פעמה
    gl.list.forEach((g, i) => {
      const tb = beat(48 + i);
      if (t < tb - 0.16) return;
      const p = eOutC(prog(t, tb - 0.16, tb));
      let s = lerp(1.7, 1, p) * (1 - 0.06 * spr(t - tb, 26, 8));
      // בר 14: גל קפיצה, אות-אות, על הפעמות
      const wv = t > bar(14) ? Math.max(0, Math.sin(clamp((t - bar(14) - i * P / 3) / (P * 2)) * Math.PI)) * (t < bar(15) ? 1 : 0) : 0;
      // בר 15: בנייה — פעימה חזקה על כל פעמה
      const bs = build ? 1 + 0.07 * beatEnv(t, 8) : 1;
      const a = clamp(p * p * 1.6) * (1 - outP);
      const col = build && bc % 2 ? C.ink : C.ink;
      glyph(g.ch, CX + g.off, A.my + gl.base - wv * 40, A.gs, col, 0, a, 'main', 'tazizu', s * bs * lerp(1, 0.9, outP));
      ring(t, tb, CX + g.off, A.my, C.pink, 260, 0.45, 8);
    });
    ctx.globalAlpha = 1;
    el(t, 'לחלום בגדול', CX, A.by, A.ss, C.plum, bar(13) + 2 * P, bar(16), { style: 'rise' });
    burst(t, bar(13) + P, CX, A.my, 30, C.cream, 9, 900);
  });

  // --- 5. פזמון: מילים מתפוצצות לעבר המצלמה | סגול + כתום ---
  const WORDS1 = ['אור', 'חלום', 'קסם', 'תקווה', 'שמחה', 'אומץ', 'חיוך', 'אמונה'];
  scene(bar(16), bar(24), t => {
    radial(C.purple, C.ink, W / 2, H / 2, 1250);
    blobs(t, [C.pink, C.purple], 5, 0.25);
    warp(t, 70, 51, C.peach, 0.9, 0.55);
    dust(t, 24, 52, C.peach, 0.6);
    // שלב א: מילים עפות, אחת לכל 2 פעמות
    const capA = eOutC(prog(t, bar(16) - 0.2, bar(16))) * (1 - prog(t, bar(20) - 0.32, bar(20) - 0.2));
    text('מה מחכה לכם שם?', CX, 150, 92, C.peach, { a: capA, dy: (1 - capA) * 20 });
    WORDS1.forEach((w, i) => {
      const tb = beat(64 + 2 * i);
      fly(t, w, tb, tb + 2 * P, i % 2 ? C.peach : C.orange, { gs: fit(w, 1250, 300), glow: 'rgba(255,116,23,.5)' });
    });
    // שלב ב: "אופטימיים"
    const A = lay('אופטימיים', { above: 'להיות', below: 'זה כל הסוד', maxS: 400, cy: 540 });
    const tEx = bar(22);
    el(t, 'להיות', CX, A.ay, A.ss, C.peach, bar(20), tEx - 2 * P + 0.2, { style: 'rise' });
    el(t, 'זה כל הסוד', CX, A.by, A.ss, C.peach, bar(21), tEx - 2 * P + 0.2, { style: 'rise' });
    if (t >= bar(20) - 0.2 && t < tEx) {
      const L = life(t, bar(20), tEx + 0.2); const st = STY.slam(L);
      text('אופטימיים', CX, A.my, A.gs, C.orange, { s: st.s * (1 + 0.03 * beatEnv(t)), a: st.a, blur: st.blur, glow: 'rgba(255,62,155,.55)', glowR: 60 });
    }
    burst(t, bar(20), CX, A.my, 40, C.peach, 13, 1000);
    // פיצוץ האותיות לעבר המצלמה
    explode(t, 'אופטימיים', tEx, CX, A.my, A.gs, C.orange, 17, 1.05);
    burst(t, tEx, CX, A.my, 60, C.pink, 19, 1100, 1.1);
    ring(t, tEx, CX, A.my, C.peach, 1100, 0.8, 18);
    const B = lay('גבולות!', { above: 'ואז אין', maxS: 420, cy: 540 });
    el(t, 'ואז אין', CX, B.ay, B.ss, C.peach, bar(23), bar(24), { style: 'rise' });
    el(t, 'גבולות!', CX, B.my, B.gs, C.orange, bar(23), bar(24), { style: 'slam', kick: true, glow: 'rgba(255,116,23,.5)', glowR: 60 });
  });

  // --- 6. "אפשר" + סרטים | סגול עמוק + ורוד + כתום ---
  const POSS = ['לחלום', 'לעוף', 'להצליח', 'להתחיל מחדש'];
  scene(bar(24), bar(32), t => {
    radial(C.plum, C.ink, W * 0.65, H * 0.4, 1300);
    blobs(t, [C.pink, C.purple, C.orange], 6, 0.22);
    dust(t, 36, 61, C.rose, 0.8);
    // שלב א: מיושר לימין על קו עמודה 1 — "אפשר" קבוע, המילה הקטנה מתחלפת על כל תיבה
    const A = lay('אפשר', { below: 'להתחיל מחדש', maxS: 440, maxW: 1100, cy: 520 });
    el(t, 'אפשר', RX(1), A.my, A.gs, C.pink, bar(24), bar(28), { align: 'right', style: 'slam', kick: true, glow: 'rgba(255,62,155,.45)', glowR: 60 });
    POSS.forEach((w, i) => el(t, w, RX(1), A.by, A.ss, C.orange, bar(24 + i), bar(25 + i), { align: 'right', style: 'rise' }));
    // שלב ב: "הכל אפשרי" עם סרטים
    if (t >= bar(28) - 0.2) {
      const rv = eOutC(prog(t, bar(28) - 0.2, bar(28) + P)), fo = 1 - prog(t, bar(31) + P, bar(32) - 0.1);
      ribbon(t, { y: 168, amp: 50, freq: 0.003, ph: 1.4, sp: 0.9, w: 110, col: C.pink, back: '#B01E66', text: 'הכל אפשרי', tcol: C.cream, flow: 150, reveal: rv, a: fo });
      ribbon(t, { y: 912, amp: 50, freq: 0.0025, ph: 3.0, sp: -0.8, w: 110, col: C.orange, back: '#C2500A', text: 'הכל אפשרי', tcol: C.ink, flow: 120, reveal: rv, a: fo });
    }
    const B = lay('אפשרי', { above: 'הכל', below: 'אם רק תרצו', maxS: 430, cy: 540 });
    const endB = bar(31) + 2 * P;
    el(t, 'הכל', CX, B.ay, B.ss, C.rose, bar(28), endB, { style: 'rise' });
    el(t, 'אפשרי', CX, B.my, B.gs, C.pink, bar(28), endB, { style: 'pop', kick: true, glow: 'rgba(255,62,155,.5)', glowR: 60 });
    el(t, 'אם רק תרצו', CX, B.by, B.ss, C.orange, bar(29), bar(30), { style: 'rise' });
    el(t, 'ותעיזו', CX, B.by, B.ss, C.orange, bar(30), endB, { style: 'rise' });
    burst(t, bar(28), CX, B.my, 40, C.rose, 23, 900);
  });

  // --- 7. שבירה רכה: "תדמיינו" | לבנדר + ורוד חיוור (רכות) ---
  scene(bar(32), bar(40), t => {
    const cd = t >= bar(39) - 0.2;
    linear([C.lav, C.blush], Math.PI * 0.35);
    blobs(t, [C.rose, C.violet, C.peach], 7, 0.35);
    dust(t, 60, 71, C.purple, 0.55);
    dust(t, 30, 72, C.pink, 0.6);
    const items = [
      ['תדמיינו', 'עצמו עיניים', bar(33), bar(34)],
      ['הצלחתם', 'את הרגע שבו', bar(34), bar(36)],
      ['הקסם?', 'מרגישים את', bar(36), bar(38)],
      ['מוכנים?', 'אז...', bar(38), bar(39)],
    ];
    items.forEach(([w, s, a, b]) => {
      const A = lay(w, { above: s, maxS: 400, cy: 540 });
      el(t, s, CX, A.ay, A.ss, C.pink, a === bar(33) ? bar(32) + 2 * P : a, b, { style: 'soft' });
      el(t, w, CX, A.my, A.gs, C.purple, a, b, { style: 'soft', glow: 'rgba(255,255,255,.9)', glowR: 50 });
    });
    // ספירה לאחור, ספרה על כל פעמה
    if (cd) {
      const n = beatsSince(t, bar(39)).n;
      if (n >= 0 && n % 2) { ctx.globalAlpha = 0.85 * beatEnv(t, 4); fill(C.pink); ctx.globalAlpha = 1; }
      ['3', '2', '1'].forEach((d, i) => {
        const tb = bar(39) + i * P;
        el(t, d, CX, 545, 480, C.purple, tb, tb + P, { style: 'slam', din: 0.12, dout: 0.08 });
        ring(t, tb, CX, 545, C.pink, 600, 0.4, 12);
      });
      star(CX, 545, 260 * eOutC(prog(t, bar(39) + 3 * P - 0.15, bar(39) + 3 * P)) * (1 + 0.1 * beatEnv(t)), C.orange, prog(t, bar(39) + 3 * P - 0.15, bar(39) + 3 * P), t);
    }
  });

  // --- 8. פזמון 2: מנהרה + מילים לעבר המצלמה | כתום + ורוד + סגול ---
  const WORDS2 = ['תרצו', 'תעיזו', 'תאמינו', 'תחייכו', 'תצליחו', 'תגשימו'];
  scene(bar(40), bar(48), t => {
    linear([C.orange, C.pink], Math.PI * 0.25);
    blobs(t, [C.amber, C.rose, C.violet], 8, 0.3);
    if (t < bar(44)) {
      const wIn = eOutC(prog(t, bar(42) - 0.45, bar(42)));
      const wOut = eInC(prog(t, bar(43) + 2 * P, bar(44) - 0.3));
      const ph = tPhase(t, bar(40), 0.7, 0.55);
      const T = lay('אפשרי', { above: 'הכל', maxS: 220, smallS: 72, gap: 0.12, cy: 540 });
      tunnel(t, { text: 'אם רק תרצו הכל אפשרי', cols: [C.plum, C.purple], phase: ph + wOut * 3, hole: 400 * wIn + 260 * wOut, sep: 1.0 });
      if (wIn > 0) {
        const s = 1 / lerp(6, 1, wIn) * (1 + 0.035 * spr(t - bar(42))) * lerp(1, 1.5, wOut);
        text('אפשרי', CX, T.my, T.gs, C.ink, { s, a: clamp(wIn * 2) * (1 - wOut), blur: (1 - wIn) * 8 + wOut * 10, glow: 'rgba(255,247,238,.9)', glowR: 40 });
        const sa = eOutC(prog(t, bar(42) + 2 * P - 0.2, bar(42) + 2 * P)) * (1 - wOut);
        text('הכל', CX, 540 + (T.ay - 540) * lerp(1, 1.5, wOut) - (1 - sa) * 20, T.ss, C.plum, { a: sa, s: lerp(1, 1.5, wOut) });
        burst(t, bar(42), W / 2, H / 2, 30, C.cream, 25, 380, 0.8);
      }
    }
    if (t >= bar(44) - 0.3) {
      warp(t, 70, 81, C.cream, 1.0, 0.6);
      dust(t, 24, 82, C.cream, 0.6);
      const capA = eOutC(prog(t, bar(44) - 0.2, bar(44))) * (1 - prog(t, bar(47) - 0.32, bar(47) - 0.2));
      text('הכל מתחיל בכם', CX, 150, 92, C.ink, { a: capA, dy: (1 - capA) * 20 });
      WORDS2.forEach((w, i) => {
        const tb = beat(176 + 2 * i);
        fly(t, w, tb, tb + 2 * P, i % 2 ? C.plum : C.ink, { gs: fit(w, 1250, 320), glow: 'rgba(255,247,238,.6)' });
      });
      const A = lay('עכשיו!', { maxS: 440, cy: 545 });
      const tEx = bar(47) + 2 * P;
      if (t >= bar(47) - 0.2 && t < tEx) {
        const L = life(t, bar(47), tEx + 0.2); const st = STY.slam(L);
        text('עכשיו!', CX, A.my, A.gs, C.plum, { s: st.s * (1 + 0.03 * beatEnv(t)), a: st.a, blur: st.blur, glow: 'rgba(255,247,238,.7)', glowR: 50 });
      }
      explode(t, 'עכשיו!', tEx, CX, A.my, A.gs, C.plum, 29, 0.78);
      burst(t, tEx, CX, A.my, 50, C.cream, 31, 1000, 0.85);
    }
  });

  // --- 9. סיכום המסר: ניגודים חדים, צבע מתחלף על כל תיבה ---
  scene(bar(48), bar(55), t => {
    const seq = [
      { k: 48, bg: C.plum, fg: C.orange, sm: C.peach, main: 'תרצו', above: 'אם רק' },
      { k: 49, bg: C.orange, fg: C.plum, sm: C.ink, main: 'ותעיזו' },
      { k: 50, bg: C.pink, fg: C.ink, sm: C.plum, main: 'אופטימיים', above: 'להיות' },
      { k: 51, bg: C.plum, fg: C.pink, sm: C.rose, main: 'הכל' },
      { k: 52, bg: C.purple, fg: C.orange, sm: C.peach, main: 'אפשרי!' },
    ];
    const cur = seq.filter(s => t >= bar(s.k) - 0.2).pop();
    if (t < bar(53) - 0.2) {
      fill(cur.bg);
      blob(W / 2, H / 2, 900, cur.fg, 0.16);
      dust(t, 26, 91, cur.sm, 0.5);
      seq.forEach((s, i) => {
        const A = lay(s.main, { above: s.above, maxS: 430, cy: 540 });
        const end = bar(s.k + 1);
        if (s.above) el(t, s.above, RX(1), A.ay, A.ss, s.sm, bar(s.k), end, { style: 'rise', align: 'right' });
        el(t, s.main, RX(1), A.my, A.gs, s.fg, bar(s.k), end, { style: 'slam', align: 'right', kick: true });
      });
      return;
    }
    // הפריים שנשאר בזיכרון: שקיעה סגול-ורוד-כתום, "הכל אפשרי"
    linear([C.purple, C.pink, C.orange], Math.PI * 0.5 + Math.sin(t * 0.3) * 0.15);
    blobs(t, [C.amber, C.violet, C.rose], 9, 0.3);
    ribbon(t, { y: 120, amp: 40, freq: 0.0028, ph: 0.3, sp: 0.6, w: 70, col: 'rgba(255,247,238,.35)', back: 'rgba(255,247,238,.15)', reveal: eOutC(prog(t, bar(53) - 0.2, bar(54))) });
    ribbon(t, { y: 965, amp: 40, freq: 0.0024, ph: 2.6, sp: -0.5, w: 70, col: 'rgba(255,247,238,.35)', back: 'rgba(255,247,238,.15)', reveal: eOutC(prog(t, bar(53) - 0.2, bar(54))) });
    dust(t, 50, 93, C.cream, 0.8);
    const A = lay('הכל אפשרי', { below: 'אם רק תרצו ותעיזו להיות אופטימיים', maxS: 330, smallS: 100, gap: 0.22, cy: 535 });
    el(t, 'הכל אפשרי', CX, A.my, A.gs, C.cream, bar(53), bar(55), { style: 'pop', kick: true, glow: 'rgba(123,43,216,.55)', glowR: 60 });
    el(t, 'אם רק תרצו ותעיזו להיות אופטימיים', CX, A.by, A.ss, C.cream, bar(53) + 2 * P, bar(55), { style: 'rise', glow: 'rgba(58,12,106,.5)', glowR: 20 });
    burst(t, bar(53), CX, A.my, 60, C.cream, 37, 1100, 1.1);
  });

  // --- 10. קריאה לפעולה ---
  scene(bar(55), DUR + 1, t => {
    radial(C.purple, C.ink, W / 2, H * 0.55, 1300);
    blobs(t, [C.pink, C.orange, C.purple], 10, 0.3);
    dust(t, 50, 101, C.peach, 0.8);
    const quick = [['שתפו', C.orange], ['הגיבו', C.pink]];
    quick.forEach(([w, c], i) => {
      const tb = bar(55) + i * P;
      el(t, w, CX, 545, fit(w, 1400, 440), c, tb, tb + P, { style: 'slam', din: 0.14, dout: 0.08 });
    });
    const tF = bar(55) + 2 * P;      // 95.21 — מוחזק ~6 שניות עד הסוף
    if (t >= tF - 0.14) {
      const gs = 300, m = meas('הירשמו', gs), ss = 96;
      const L = life(t, tF, 1e9, 0.14);
      const st = STY.slam(L);
      const k = st.s * (1 + 0.025 * beatEnv(t, 7) * (t < 97.8 ? 1 : 0));
      // כפתור גלולה כתום
      const pw = m.vw + gs * 0.75, ph = m.h + gs * 0.62, py = 560;
      ctx.save(); ctx.globalAlpha = st.a; ctx.translate(CX, py); ctx.scale(k, k);
      ctx.shadowColor = 'rgba(255,62,155,.6)'; ctx.shadowBlur = 70;
      const g = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0); g.addColorStop(0, C.orange); g.addColorStop(1, C.pink);
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fill();
      ctx.restore();
      text('הירשמו', CX, py, gs, C.cream, { s: k, a: st.a, blur: st.blur });
      const sa = eOutC(prog(t, tF + P - 0.2, tF + P)), sb = eOutC(prog(t, tF + 2 * P - 0.2, tF + 2 * P));
      const ry = py - ph / 2 - 120;
      text('שתפו', CX + 50, ry, ss, C.peach, { align: 'left', a: sa, dy: (1 - sa) * 24 });
      star(CX, ry + (1 - sa) * 24, 22, C.orange, sa, t * 0.8);
      text('הגיבו', CX - 50, ry, ss, C.peach, { align: 'right', a: sa, dy: (1 - sa) * 24 });
      text('לעוד רגעים של קסם', CX, py + ph / 2 + 110, ss * 0.8, C.rose, { a: sb, dy: (1 - sb) * 24 });
      burst(t, tF, CX, py, 50, C.peach, 41, 1100, 1.0);
      ring(t, tF, CX, py, C.orange, 1000, 0.7, 16);
      // ניצוץ קטן שמסתובב סביב הכפתור — קסם שממשיך
      const ang = t * 1.6;
      star(CX + Math.cos(ang) * (pw / 2 + 30), py + Math.sin(ang) * (ph / 2 + 30), 18, C.cream, sa, t);
    }
  });

  // מעברים בין סצנות — הבזק על הפעמה
  const FLASHES = [[bar(4), C.blush, 0.08, 0.35], [bar(8), C.cream, 0.1, 0.3], [bar(16), C.cream, 0.12, 0.3],
    [bar(40), C.cream, 0.1, 0.3], [bar(44), C.cream, 0.1, 0.3], [bar(48), C.cream, 0.04, 0.18], [bar(55), C.cream, 0.04, 0.18]];

  // ---------- גריד ניפוי ----------
  function drawGrid() {
    ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#00E5FF';
    for (let i = 1; i <= 12; i++) ctx.fillRect(LX(i), 0, CW, H);
    ctx.globalAlpha = 0.9; ctx.strokeStyle = '#00E5FF'; ctx.lineWidth = 2; ctx.strokeRect(M, 80, W - 2 * M, H - 160);
    ctx.beginPath(); ctx.moveTo(CX, 0); ctx.lineTo(CX, H); ctx.stroke(); ctx.restore();
  }

  function render(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.shadowBlur = 0;
    ctx.direction = 'rtl'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
    t = clamp(t, 0, DUR);
    const sc = SC.find(s => t >= s.t0 && t < s.t1) || SC[SC.length - 1];
    sc.fn(t);
    ctx.globalAlpha = 1;
    for (const [tf, col, up, down] of FLASHES) flash(t, tf, col, up, down);
    if (SHOW_GRID) drawGrid();
  }

  // ---------- QA: חפיפות וחיתוכים ----------
  function qa(t) {
    REG = []; render(t); const R = REG; REG = null;
    const issues = [];
    for (const b of R) {
      if (b.a > 0.05 && (b.x0 < -0.5 || b.y0 < -0.5 || b.x1 > W + 0.5 || b.y1 > H + 0.5))
        issues.push(`חיתוך: "${b.str}" (${b.role}) α=${b.a.toFixed(2)}`);
    }
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
      const A = R[i], B = R[j];
      if (A.group === B.group) continue;
      if (A.role === 'deco' && B.role === 'deco') continue;
      if (Math.min(A.a, B.a) < 0.1) continue;
      const ox = Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0), oy = Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0);
      if (ox > 2 && oy > 2) issues.push(`חפיפה: "${A.str}" ↔ "${B.str}"`);
    }
    // קטן פי 3 לפחות: יחס בין גבהי הטקסטים הראשיים
    return { issues: [...new Set(issues)], n: R.length, boxes: R };
  }

  function init(cv) {
    ctx = cv.getContext('2d');
    const ff = new FontFace('Drakonit', 'url(assets/font.woff2)');
    document.fonts.add(ff);
    return ff.load().then(() => document.fonts.ready).then(() => { MC.clear(); });
  }

  window.DREAM = { W, H, FPS, DUR, BPM, P, B0, beat, bar, init, render, qa, setGrid: v => (SHOW_GRID = v), scenes: SC };
})();

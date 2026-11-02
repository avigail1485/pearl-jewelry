/* ONLY STORY motion engine.
   Every template is a pure function of time: draw(ctx, W, H, t, o).
   The same code renders the hero phone, gallery previews, the studio canvas and the export. */
(function () {
  'use strict';
  const B = window.OS_BRAND;
  const symPath = new Path2D(B.sym);
  const wmPaths = B.wm.map(d => new Path2D(d));
  const SYM_W = 156.92, SYM_H = 155.88, WM_W = 764.22, WM_H = 96.43;
  const CUT = 47 * Math.PI / 180; // the diagonal of the symbol's cut

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, p) => a + (b - a) * p;
  const E = {
    out: t => 1 - Math.pow(1 - t, 3),
    quint: t => 1 - Math.pow(1 - t, 5),
    inOut: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    elastic: t => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1)
  };

  function font(o, role, px) {
    if (role === 'mono') return `500 ${px}px "Google Sans Code", ui-monospace, monospace`;
    if (role === 'ui') return `500 ${px}px "Google Sans", system-ui, sans-serif`;
    if (role === 'd2') return `400 ${px}px "Google Sans", system-ui, sans-serif`;
    return `700 ${px}px "Google Sans", system-ui, sans-serif`;
  }
  function track(ctx, px, k) { if ('letterSpacing' in ctx) ctx.letterSpacing = (px * (k == null ? -0.035 : k)).toFixed(2) + 'px'; }
  function setText(ctx, o) { ctx.direction = o.rtl ? 'rtl' : 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'; }
  function fitPx(ctx, o, role, str, px, maxW) {
    if (!str) return px;
    ctx.font = font(o, role, px); track(ctx, px, role === 'mono' ? 0 : -0.03);
    const w = ctx.measureText(str).width;
    return w > maxW ? px * maxW / w : px;
  }
  function layout(ctx, o, role, str, px, cx) {
    ctx.font = font(o, role, px); track(ctx, px, -0.03);
    const ws = (str || '').split(/\s+/).filter(Boolean);
    const sp = ctx.measureText(' ').width;
    const m = ws.map(s => ctx.measureText(s).width);
    const total = m.reduce((a, b) => a + b, 0) + sp * Math.max(0, ws.length - 1);
    const out = [];
    if (o.rtl) { let xr = cx + total / 2; ws.forEach((s, i) => { xr -= m[i]; out.push({ s, x: xr, w: m[i] }); xr -= sp; }); }
    else { let x = cx - total / 2; ws.forEach((s, i) => { out.push({ s, x, w: m[i] }); x += m[i] + sp; }); }
    return { words: out, total, px };
  }
  function bg(ctx, W, H, c) { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H); }

  function drawSymbol(ctx, cx, cy, size, color, split) {
    const s = size / SYM_W;
    ctx.save();
    ctx.translate(cx - size / 2, cy - (SYM_H * s) / 2);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    if (!split) { ctx.fill(symPath); ctx.restore(); return; }
    // draw the two halves of the cut, offset along the diagonal
    const c = { x: 78.5, y: 78 }, d = { x: Math.cos(CUT), y: -Math.sin(CUT) }, n = { x: Math.sin(CUT), y: Math.cos(CUT) };
    [1, -1].forEach(side => {
      ctx.save();
      ctx.translate(d.x * split * side * 40, d.y * split * side * 40);
      ctx.beginPath();
      ctx.moveTo(c.x - d.x * 300, c.y - d.y * 300);
      ctx.lineTo(c.x + d.x * 300, c.y + d.y * 300);
      ctx.lineTo(c.x + d.x * 300 + n.x * 300 * side, c.y + d.y * 300 + n.y * 300 * side);
      ctx.lineTo(c.x - d.x * 300 + n.x * 300 * side, c.y - d.y * 300 + n.y * 300 * side);
      ctx.closePath();
      ctx.clip();
      ctx.fill(symPath);
      ctx.restore();
    });
    ctx.restore();
  }
  function drawWordmark(ctx, cx, cy, width, color, p) {
    const s = width / WM_W;
    ctx.save();
    ctx.translate(cx - width / 2, cy - (WM_H * s) / 2);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    wmPaths.forEach((path, i) => {
      const k = p === undefined ? 1 : E.quint(seg(p, i * .06, i * .06 + .5));
      ctx.save();
      ctx.globalAlpha *= k;
      ctx.translate(0, (1 - k) * 30);
      ctx.fill(path);
      ctx.restore();
    });
    ctx.restore();
  }
  function drawLogo(ctx, o, cx, cy, size, color, split) {
    if (o.logoImg) {
      const im = o.logoImg, r = Math.min(size / im.width, size / im.height);
      ctx.drawImage(im, cx - im.width * r / 2, cy - im.height * r / 2, im.width * r, im.height * r);
    } else drawSymbol(ctx, cx, cy, size, color, split);
  }
  function timecode(ctx, o, W, H, t, color) {
    const px = Math.max(8, Math.round(Math.min(W, H) * .032));
    ctx.save();
    ctx.font = font(o, 'mono', px); if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.fillStyle = color;
    ctx.globalAlpha = .55;
    ctx.direction = 'ltr';
    ctx.textAlign = 'left';
    const s = Math.floor(t), f = Math.floor((t % 1) * 30);
    ctx.fillText(`00:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`, W * .07, H - W * .07);
    ctx.restore();
  }
  // diagonal clip region that sweeps across the frame along the cut angle, p 0..1
  function cutRegion(ctx, W, H, p, rtl) {
    const k = H / Math.tan(CUT);
    const e = lerp(0, W + k, p);
    ctx.beginPath();
    if (!rtl) { ctx.moveTo(0, 0); ctx.lineTo(e, 0); ctx.lineTo(e - k, H); ctx.lineTo(0, H); }
    else { ctx.moveTo(W, 0); ctx.lineTo(W - e + k, 0); ctx.lineTo(W - e, H); ctx.lineTo(W, H); }
    ctx.closePath();
  }

  /* ---------- templates ---------- */
  const T = {};

  T.softRise = {
    D: 5, hold: 2.4,
    draw(ctx, W, H, t, o, opt = {}) {
      const D = opt.D || this.D;
      if (!opt.noBg) bg(ctx, W, H, o.paper);
      setText(ctx, o);
      const base = Math.min(W * .16, H * .16);
      let px = Math.min(fitPx(ctx, o, 'd1', o.l1, base, W * .82), fitPx(ctx, o, 'd2', o.l2, base, W * .82));
      const lh = px * 1.08, y1 = H * .5 - lh * .1, y2 = y1 + lh;
      const L1 = layout(ctx, o, 'd1', o.l1, px, W / 2), L2 = layout(ctx, o, 'd2', o.l2, px, W / 2);
      const out = E.inOut(seg(t, D - .7, D - .1));
      ctx.save();
      ctx.translate(0, -out * px * .6);
      ctx.globalAlpha = 1 - out;
      // chartreuse marker behind the last word of line two
      const kw = L2.words[L2.words.length - 1];
      if (kw) {
        const mp = E.out(seg(t, 1.25, 2.05));
        const mw = (kw.w + px * .16) * mp, mx = o.rtl ? kw.x + kw.w + px * .08 - mw : kw.x - px * .08;
        ctx.fillStyle = o.accent;
        ctx.fillRect(mx, y2 - px * .5, mw, px * .58);
      }
      let k = 0;
      [[L1, 'd1', y1], [L2, 'd2', y2]].forEach(([L, role, y]) => {
        ctx.font = font(o, role, px);
        L.words.forEach(w => {
          const p = E.quint(seg(t, .2 + k * .11, .2 + k * .11 + .85));
          ctx.save();
          ctx.globalAlpha *= p;
          ctx.fillStyle = o.ink;
          ctx.fillText(w.s, w.x, y + (1 - p) * px * .55);
          ctx.restore();
          k++;
        });
      });
      ctx.restore();
      if (!opt.bare) {
        const lp = E.out(seg(t, 1.6, 2.4)) * (1 - out);
        ctx.save(); ctx.globalAlpha = lp;
        drawLogo(ctx, o, W / 2, H * .12, Math.min(W, H) * .075, o.ink);
        ctx.restore();
        timecode(ctx, o, W, H, t, o.ink);
      }
    }
  };

  T.beatSlam = {
    D: 4.2, hold: 3.7,
    draw(ctx, W, H, t, o, opt = {}) {
      const D = opt.D || this.D;
      const words = ((o.l1 || '') + ' ' + (o.l2 || '')).split(/\s+/).filter(Boolean);
      const n = Math.max(1, words.length), dur = (D - .25) / n;
      const i = Math.min(n - 1, Math.floor(t / dur)), lt = (t - i * dur) / dur;
      const last = i === n - 1;
      bg(ctx, W, H, last ? o.accent : o.ink);
      setText(ctx, o);
      const role = i % 2 ? 'd2' : 'd1';
      const base = Math.min(W * .34, H * .3);
      const px = fitPx(ctx, o, role, words[i], base, W * .8);
      const sc = 1.16 - .16 * E.quint(clamp(lt * 2.2));
      ctx.save();
      ctx.translate(W / 2, H / 2 + px * .3);
      ctx.scale(sc, sc);
      ctx.font = font(o, role, px);
      ctx.fillStyle = last ? o.ink : o.paper;
      ctx.globalAlpha = E.out(clamp(lt * 4));
      const w = ctx.measureText(words[i]).width;
      ctx.fillText(words[i], -w / 2, 0);
      ctx.restore();
      if (!opt.bare) {
        // beat ticks
        const r = Math.max(1.5, W * .008), gap = r * 4, x0 = W / 2 - (n - 1) * gap / 2;
        for (let j = 0; j < n; j++) {
          ctx.beginPath();
          ctx.arc(o.rtl ? W - (x0 + j * gap) : x0 + j * gap, H * .9, r, 0, Math.PI * 2);
          ctx.fillStyle = last ? o.ink : (j === i ? o.accent : o.paper);
          ctx.globalAlpha = j <= i ? 1 : .25;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
  };

  T.pricePop = {
    D: 4.6, hold: 2.6,
    draw(ctx, W, H, t, o) {
      const D = this.D;
      bg(ctx, W, H, o.paper);
      setText(ctx, o);
      const out = E.inOut(seg(t, D - .6, D - .1));
      const m = Math.min(W, H);
      const cy = H * .5;
      // sticker
      const sp = E.back(seg(t, .15, .8)) * (1 - out);
      ctx.save();
      ctx.translate(W / 2, cy);
      ctx.rotate(t * .25);
      ctx.scale(sp, sp);
      ctx.beginPath();
      const R = m * .36, spikes = 18;
      for (let j = 0; j < spikes * 2; j++) {
        const a = j / (spikes * 2) * Math.PI * 2, rr = j % 2 ? R * .93 : R;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = o.accent;
      ctx.fill();
      ctx.restore();
      // price
      const price = o.price || (o.rtl ? '₪49' : '$49');
      const pp = E.back(seg(t, .45, 1.05)) * (1 - out);
      const px = fitPx(ctx, o, 'd1', price, m * .3, m * .6);
      ctx.save();
      ctx.translate(W / 2, cy + px * .32);
      ctx.scale(pp, pp);
      ctx.font = font(o, 'd1', px);
      ctx.direction = 'ltr';
      ctx.fillStyle = o.ink;
      const pw = ctx.measureText(price).width;
      ctx.fillText(price, -pw / 2, 0);
      ctx.restore();
      // label above, line two below
      const lp = E.quint(seg(t, .7, 1.4)) * (1 - out);
      ctx.save();
      ctx.globalAlpha = lp;
      setText(ctx, o);
      const upx = fitPx(ctx, o, 'ui', o.l1, m * .055, W * .8);
      ctx.font = font(o, 'ui', upx);
      ctx.fillStyle = o.ink;
      let w = ctx.measureText(o.l1 || '').width;
      ctx.fillText(o.l1 || '', W / 2 - w / 2, cy - m * .44 + (1 - lp) * 10);
      const dpx = fitPx(ctx, o, 'd2', o.l2, m * .085, W * .8);
      ctx.font = font(o, 'd2', dpx);
      w = ctx.measureText(o.l2 || '').width;
      ctx.fillText(o.l2 || '', W / 2 - w / 2, cy + m * .5 - (1 - lp) * 10);
      ctx.restore();
      // old price, struck through
      const op = E.out(seg(t, 1.1, 1.6)) * (1 - out);
      ctx.save();
      ctx.globalAlpha = op * .6;
      ctx.font = font(o, 'mono', m * .045);
      ctx.direction = 'ltr';
      ctx.fillStyle = o.ink;
      const old = o.rtl ? '₪89' : '$89';
      w = ctx.measureText(old).width;
      const ox = W / 2 + m * .2, oy = cy - m * .2;
      ctx.fillText(old, ox, oy);
      ctx.fillRect(ox - 2, oy - m * .016, (w + 4) * E.out(seg(t, 1.4, 1.9)), Math.max(1, m * .004));
      ctx.restore();
      timecode(ctx, o, W, H, t, o.ink);
    }
  };

  T.diagonalWipe = {
    D: 4.8, hold: 1.2,
    draw(ctx, W, H, t, o) {
      const D = this.D;
      const pIn = E.inOut(seg(t, 1.5, 2.3)), pOut = E.inOut(seg(t, D - .9, D - .1));
      const scene = (fill, txt, role, col) => {
        bg(ctx, W, H, fill);
        setText(ctx, o);
        const px = fitPx(ctx, o, role, txt, Math.min(W * .22, H * .22), W * .8);
        ctx.font = font(o, role, px);
        ctx.fillStyle = col;
        const w = ctx.measureText(txt || '').width;
        ctx.fillText(txt || '', W / 2 - w / 2, H / 2 + px * .3);
      };
      scene(o.paper, o.l1, 'd1', o.ink);
      const p = pIn * (1 - pOut);
      if (p > 0) {
        const k = H / Math.tan(CUT);
        // accent leading band
        ctx.save(); cutRegion(ctx, W, H, Math.min(1, p * 1.06 + .02), o.rtl); ctx.clip(); bg(ctx, W, H, o.accent); ctx.restore();
        ctx.save(); cutRegion(ctx, W, H, p, o.rtl); ctx.clip(); scene(o.ink, o.l2, 'd2', o.paper); ctx.restore();
        void k;
      }
      timecode(ctx, o, W, H, t, p > .5 ? o.paper : o.ink);
    }
  };

  T.breathing = {
    D: 6, hold: 2.4,
    draw(ctx, W, H, t, o) {
      const D = this.D, ph = t / D * Math.PI * 2;
      bg(ctx, W, H, o.paper);
      const blobs = [
        [o.c1 || '#CFC2FF', .3, .32, .55, 0],
        [o.c2 || '#FFC49B', .72, .4, .5, 1.7],
        [o.c3 || '#B9DCFF', .45, .72, .6, 3.1],
        [o.accent, .7, .78, .38, 4.4]
      ];
      const m = Math.max(W, H);
      blobs.forEach(([c, x, y, r, off]) => {
        const cx = W * (x + .06 * Math.sin(ph + off)), cy = H * (y + .05 * Math.cos(ph * 1 + off));
        const rr = m * r * (1 + .08 * Math.sin(ph + off));
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
        g.addColorStop(0, c); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = .85;
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });
      ctx.globalAlpha = 1;
      const s = 1 + .012 * Math.sin(ph);
      ctx.save();
      ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
      const tt = t % D;
      T.softRise.draw(ctx, W, H, tt, Object.assign({}, o, { accent: 'rgba(255,255,255,.55)' }), { noBg: true, bare: true, D });
      ctx.restore();
    }
  };

  T.marquee = {
    D: 6, hold: 1,
    draw(ctx, W, H, t, o) {
      const D = this.D;
      bg(ctx, W, H, o.ink);
      const txt = ((o.l1 || '') + (o.l2 ? '  ' + o.l2 : '')).trim() || 'ONLY STORY';
      const rows = 7, rh = H / rows, px = rh * .78;
      ctx.direction = o.rtl ? 'rtl' : 'ltr';
      ctx.textAlign = 'left';
      for (let r = 0; r < rows; r++) {
        const role = r % 2 ? 'd2' : 'd1';
        ctx.font = font(o, role, px);
        const unit = txt + '  ·  ';
        const uw = ctx.measureText(unit).width;
        const dir = (r % 2 ? 1 : -1) * (o.rtl ? -1 : 1);
        const off = ((t / D) * uw * dir) % uw;
        const y = rh * r + rh * .78;
        const center = r === 3;
        for (let x = -uw * 2 + off; x < W + uw; x += uw) {
          if (center) { ctx.fillStyle = o.accent; ctx.fillText(unit, x, y); }
          else if (r % 2) { ctx.fillStyle = o.paper; ctx.globalAlpha = .9; ctx.fillText(unit, x, y); ctx.globalAlpha = 1; }
          else { ctx.strokeStyle = o.paper; ctx.globalAlpha = .45; ctx.lineWidth = Math.max(.6, px * .012); ctx.strokeText(unit, x, y); ctx.globalAlpha = 1; }
        }
      }
    }
  };

  T.endCard = {
    D: 3, hold: 2.4,
    draw(ctx, W, H, t, o) {
      bg(ctx, W, H, o.paper);
      const m = Math.min(W, H);
      const p = E.quint(seg(t, .1, 1.2));
      ctx.save();
      ctx.globalAlpha = p;
      drawLogo(ctx, o, W / 2, H * .44, m * .34 * (.85 + .15 * p), o.ink, o.logoImg ? 0 : (1 - p) * .5 + .02);
      ctx.restore();
      if (!o.logoImg) drawWordmark(ctx, W / 2, H * .44 + m * .3, m * .66, o.ink, seg(t, .5, 2));
      const lp = E.out(seg(t, 1.3, 2));
      ctx.save();
      ctx.globalAlpha = lp * .7;
      ctx.font = font(o, 'mono', Math.max(8, m * .034));
      ctx.direction = 'ltr';
      ctx.fillStyle = o.ink;
      const tag = 'WORDS IN MOTION · IN EVERY SCRIPT';
      const w = ctx.measureText(tag).width;
      ctx.fillText(tag, W / 2 - w / 2, H * .44 + m * .45);
      ctx.restore();
      // chartreuse cut line through the frame
      const cp = E.out(seg(t, .2, 1));
      ctx.save();
      ctx.strokeStyle = o.accent;
      ctx.lineWidth = Math.max(1.5, m * .006);
      const L = Math.hypot(W, H) * cp * .5;
      ctx.beginPath();
      ctx.moveTo(W / 2 - Math.cos(CUT) * L, H * .44 + Math.sin(CUT) * L);
      ctx.lineTo(W / 2 + Math.cos(CUT) * L, H * .44 - Math.sin(CUT) * L);
      ctx.globalAlpha = .9 * (1 - seg(t, 1.6, 2.6));
      ctx.stroke();
      ctx.restore();
    }
  };

  // the hero showreel: soft rise → beat slam → end card, joined by diagonal wipes
  T.reel = {
    D: 8.6, hold: 2.4,
    draw(ctx, W, H, t, o) {
      const a = 3.4, b = 6.0, D = this.D;
      const wipe = .45;
      const A = tt => T.softRise.draw(ctx, W, H, tt, o, { D: a + .3, bare: false });
      const Bf = tt => T.beatSlam.draw(ctx, W, H, tt, o, { D: b - a, bare: true });
      const C = tt => T.endCard.draw(ctx, W, H, tt, o);
      if (t < a) A(t);
      else if (t < b) {
        if (t < a + wipe) { A(Math.min(t, a + .3)); ctx.save(); cutRegion(ctx, W, H, E.inOut((t - a) / wipe), o.rtl); ctx.clip(); Bf(t - a); ctx.restore(); }
        else Bf(t - a);
      } else {
        if (t < b + wipe) { Bf(b - a - .01); ctx.save(); cutRegion(ctx, W, H, E.inOut((t - b) / wipe), o.rtl); ctx.clip(); C(t - b); ctx.restore(); }
        else C(t - b);
        // soft fade back to the first scene
        const f = seg(t, D - .35, D);
        if (f > 0) { ctx.save(); ctx.globalAlpha = f; bg(ctx, W, H, o.paper); ctx.restore(); }
      }
    }
  };


  /* ---------- school templates ---------- */
  const SITE_BG = ['#F2F0EA', '#0F0F0E', '#D5FF5F', '#E6E0FF', '#FFE1CC', '#D9E8FF'];
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  // a small, procedurally drawn website: nav, headline, image, grid
  function drawSite(ctx, x, y, w, h, v, p = 1) {
    const bgc = SITE_BG[v % SITE_BG.length], dark = bgc === '#0F0F0E';
    const fg = dark ? '#F2F0EA' : '#0F0F0E', mute = dark ? 'rgba(242,240,234,.28)' : 'rgba(15,15,14,.18)';
    ctx.save();
    rr(ctx, x, y, w, h, w * .025); ctx.fillStyle = bgc; ctx.fill(); ctx.clip();
    const u = w / 24;
    ctx.fillStyle = mute; ctx.fillRect(x, y + u * 1.6, w, Math.max(1, u * .06));
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x + u * 1.2, y + u * .8, u * .32, 0, 7); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = mute; ctx.fillRect(x + w - u * (6 - i * 1.3), y + u * .7, u * .9, u * .2); }
    const k = v % 3;
    if (k === 0) { // headline left, image right
      ctx.fillStyle = fg; ctx.fillRect(x + u, y + u * 3.2, u * 11 * p, u * 1.5); ctx.fillRect(x + u, y + u * 5.1, u * 8 * p, u * 1.5);
      ctx.fillStyle = mute; ctx.fillRect(x + u, y + u * 7.4, u * 7, u * .35); ctx.fillRect(x + u, y + u * 8.1, u * 6, u * .35);
      ctx.fillStyle = v % 2 ? '#D5FF5F' : fg; rr(ctx, x + u, y + u * 9.3, u * 3.4, u * 1.1, u * .55); ctx.fill();
      const g = ctx.createLinearGradient(x + u * 13, y, x + w, y + h); g.addColorStop(0, '#C9B8FF'); g.addColorStop(1, '#FFB990');
      ctx.fillStyle = g; rr(ctx, x + u * 13.5, y + u * 3.2, u * 9.5 * p, h - u * 4.4, u * .4); ctx.fill();
    } else if (k === 1) { // giant centered word
      ctx.fillStyle = fg; ctx.font = `700 ${u * 4.2}px "Google Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
      ctx.fillText(['STUDIO', 'MOTION', 'FORMA', 'NORTH', 'KIN', 'ATLAS'][v % 6], x + w / 2, y + h * .45);
      ctx.fillStyle = mute; for (let i = 0; i < 3; i++) ctx.fillRect(x + u * (2 + i * 7.3), y + h - u * 3, u * 6, u * 2);
    } else { // editorial grid
      ctx.fillStyle = fg; ctx.fillRect(x + u, y + u * 3, u * 15 * p, u * 2.2);
      for (let i = 0; i < 3; i++) { const g = ctx.createLinearGradient(0, y + u * 6.5, 0, y + h); g.addColorStop(0, ['#D5FF5F', '#C9B8FF', '#FFB990'][i]); g.addColorStop(1, mute); ctx.fillStyle = g; ctx.fillRect(x + u * (1 + i * 7.6), y + u * 6.5, u * 6.8, h - u * 8.5); }
    }
    ctx.restore();
  }
  T.siteBuild = {
    D: 6, hold: 4,
    draw(ctx, W, H, t, o) {
      bg(ctx, W, H, o.paper);
      const m = Math.min(W, H), out = 1 - E.inOut(seg(t, 5.3, 5.95));
      const fw = W * .84, fh = Math.min(H * .7, fw * .62), fx = (W - fw) / 2, fy = (H - fh) / 2;
      ctx.save(); ctx.globalAlpha = out;
      rr(ctx, fx, fy, fw, fh, m * .03); ctx.fillStyle = '#FFFFFF'; ctx.fill();
      ctx.strokeStyle = 'rgba(15,15,14,.14)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(15,15,14,.1)'; ctx.fillRect(fx, fy + fh * .1, fw, 1);
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(fx + fh * .05 + i * fh * .045, fy + fh * .05, fh * .012, 0, 7); ctx.fill(); }
      const gp = E.out(seg(t, .2, 1.2)), cols = 6, gx = fx + fw * .06, gw = fw * .88;
      ctx.fillStyle = 'rgba(213,255,95,.35)';
      for (let i = 0; i < cols; i++) ctx.fillRect(gx + i * gw / cols + 2, fy + fh * .14, gw / cols - 4, (fh * .8) * gp);
      const hp = E.quint(seg(t, 1, 2));
      ctx.fillStyle = o.ink; ctx.fillRect(gx, fy + fh * .24, gw * .55 * hp, fh * .12); ctx.fillRect(gx, fy + fh * .4, gw * .38 * hp, fh * .12);
      const ip = E.inOut(seg(t, 1.8, 2.8));
      if (ip > 0) { ctx.save(); ctx.beginPath(); ctx.rect(gx + gw * .62, fy + fh * .24, gw * .38, fh * .62); ctx.clip(); cutRegion(ctx, W, H, ip, o.rtl); ctx.clip(); const g = ctx.createLinearGradient(gx + gw * .62, fy, gx + gw, fy + fh); g.addColorStop(0, '#C9B8FF'); g.addColorStop(1, '#FFB990'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      const bp = E.back(seg(t, 2.8, 3.5));
      ctx.save(); ctx.translate(gx + gw * .09, fy + fh * .7); ctx.scale(bp, bp); rr(ctx, -gw * .09, -fh * .05, gw * .18, fh * .1, fh * .05); ctx.fillStyle = o.accent; ctx.fill(); ctx.restore();
      ctx.restore();
      timecode(ctx, o, W, H, t, o.ink);
    }
  };

  T.lesson = {
    D: 16, hold: 7,
    draw(ctx, W, H, t, o) {
      bg(ctx, W, H, '#ECE9E1');
      const m = Math.min(W, H);
      const fw = W * .62, fh = fw * .6, fx = (W - fw) / 2 + (o.rtl ? -W * .08 : W * .08), fy = (H - fh) / 2 + H * .04;
      rr(ctx, fx, fy, fw, fh, m * .02); ctx.fillStyle = '#FFFFFF'; ctx.fill();
      const ph = t < 4 ? 0 : t < 8 ? 1 : t < 12 ? 2 : 3;
      const k = E.inOut(seg(t, 4, 5.2)), sp = E.inOut(seg(t, 8, 9.2));
      const ink = '#0F0F0E', gray = 'rgba(15,15,14,.22)';
      const pad = fw * .07, x0 = o.rtl ? fx + fw - pad : fx + pad, dir = o.rtl ? -1 : 1;
      const bar = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(o.rtl ? x - w : x, y, w, h); };
      const hH = lerp(fh * .06, fh * .14, k), gap = lerp(fh * .06, fh * .035, sp), gap2 = lerp(fh * .06, fh * .1, sp);
      let y = fy + fh * .18;
      bar(x0, y, fw * lerp(.5, .68, k), hH, k > .5 ? ink : gray); y += hH + gap;
      if (k > .5) { bar(x0, y, fw * .5, hH * .8, ink); y += hH * .8 + gap; }
      bar(x0, y, fw * .44, fh * .035, gray); y += fh * .035 + gap * .6; bar(x0, y, fw * .36, fh * .035, gray); y += fh * .035 + gap2;
      const bw = fw * .2, bh = fh * lerp(.06, .1, k);
      ctx.fillStyle = k > .5 ? o.accent : gray; rr(ctx, o.rtl ? x0 - bw : x0, y, bw, bh, bh / 2); ctx.fill();
      // numbered callouts
      if (ph >= 1) {
        const a = E.out(seg(t, 5, 6));
        [[fy + fh * .18 + hH / 2, '1'], [fy + fh * .18 + hH * 2.3, '2'], [y + bh / 2, '3']].forEach(([cy, n], i) => {
          const cx = o.rtl ? fx + fw + m * .05 : fx - m * .05;
          ctx.save(); ctx.globalAlpha = E.out(seg(t, 5 + i * .3, 5.8 + i * .3)) * (ph === 3 ? .4 : 1);
          ctx.beginPath(); ctx.arc(cx, cy, m * .025, 0, 7); ctx.fillStyle = ink; ctx.fill();
          ctx.fillStyle = '#F2F0EA'; ctx.font = font(o, 'mono', m * .026); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n, cx, cy + 1);
          ctx.restore(); void a;
        });
      }
      if (ph === 2) { // proximity brackets
        const a = E.out(seg(t, 9, 10));
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = o.accent === '#D5FF5F' ? '#8AAE14' : o.accent; ctx.lineWidth = Math.max(1.5, m * .004);
        const bx = o.rtl ? fx + fw * .2 : fx + fw * .8;
        ctx.beginPath(); ctx.moveTo(bx, fy + fh * .18); ctx.lineTo(bx + dir * m * .02, fy + fh * .18); ctx.lineTo(bx + dir * m * .02, y - gap2 * .6); ctx.lineTo(bx, y - gap2 * .6); ctx.stroke();
        ctx.restore();
      }
      if (ph === 3) { // cursor moves to the button and clicks
        const p = E.inOut(seg(t, 12.2, 13.6)), cxp = lerp(fx + fw * .8, o.rtl ? x0 - bw / 2 : x0 + bw / 2, p), cyp = lerp(fy + fh * .9, y + bh / 2, p);
        const click = seg(t, 13.7, 14.1);
        if (click > 0 && click < 1) { ctx.beginPath(); ctx.arc(cxp, cyp, m * .05 * click, 0, 7); ctx.strokeStyle = `rgba(15,15,14,${1 - click})`; ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.save(); ctx.translate(cxp, cyp); ctx.fillStyle = ink; ctx.beginPath(); const s = m * .03; ctx.moveTo(0, 0); ctx.lineTo(0, s * 1.4); ctx.lineTo(s * .38, s * 1.05); ctx.lineTo(s * .7, s * 1.6); ctx.lineTo(s * .9, s * 1.5); ctx.lineTo(s * .62, s * .95); ctx.lineTo(s * 1.05, s * .95); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      // chapter label
      const labels = o.rtl ? ['בלי היררכיה, הכל צועק', 'שלוש רמות: 1, 2, 3', 'קרבה יוצרת קבוצה', 'עכשיו העין יודעת לאן ללכת'] : ['No hierarchy: everything shouts', 'Three levels: 1, 2, 3', 'Proximity makes groups', 'Now the eye knows where to go'];
      setText(ctx, o);
      const lp = E.out(seg(t % 4, 0, .6));
      ctx.save(); ctx.globalAlpha = lp; ctx.font = font(o, 'd1', m * .055); track(ctx, m * .055, -0.03); ctx.fillStyle = ink;
      const txt = labels[ph], tw = ctx.measureText(txt).width;
      ctx.fillText(txt, o.rtl ? W - m * .07 - tw : m * .07, m * .12 + (1 - lp) * 8);
      ctx.font = font(o, 'mono', m * .028); track(ctx, 0, 0); ctx.globalAlpha = lp * .6;
      const ch = `CHAPTER 0${ph + 1}/04`, cw = ctx.measureText(ch).width; ctx.direction = 'ltr';
      ctx.fillText(ch, o.rtl ? W - m * .07 - cw : m * .07, m * .17);
      ctx.restore();
    }
  };


  T.sitePage = {
    D: 9, hold: 2,
    draw(ctx, W, H, t, o) {
      const v = o.v || 0;
      bg(ctx, W, H, '#E8E5DC');
      const p = .5 - .5 * Math.cos(t / this.D * Math.PI * 2);
      const fw = W * .86, fx = (W - fw) / 2, sh = fw * .62;
      ctx.save(); rr(ctx, fx, H * .08, fw, H * .92, W * .02); ctx.clip();
      const off = -p * sh * 1.6;
      for (let i = 0; i < 4; i++) drawSite(ctx, fx, H * .08 + off + i * (sh + 2), fw, sh, v + i * 3, 1);
      ctx.restore();
      ctx.fillStyle = '#0F0F0E'; rr(ctx, fx, H * .08 - W * .045, fw, W * .045 + 2, [W * .02, W * .02, 0, 0]); ctx.fill();
      ctx.fillStyle = '#5E5D58'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(fx + W * .03 + i * W * .025, H * .08 - W * .022, W * .007, 0, 7); ctx.fill(); }
    }
  };

  T.showreel = {
    D: 17, hold: 11,
    draw(ctx, W, H, t, o) {
      const m = Math.min(W, H), P = '#F2F0EA', K = '#0F0F0E', A = o.accent || '#D5FF5F';
      const he = o.rtl;
      const center = (txt, role, px, y, col, alpha = 1) => { ctx.save(); ctx.globalAlpha = alpha; setText(ctx, o); px = fitPx(ctx, o, role, txt, px, W * .86); ctx.font = font(o, role, px); track(ctx, px, -0.04); ctx.fillStyle = col; const w = ctx.measureText(txt).width; ctx.fillText(txt, W / 2 - w / 2, y); ctx.restore(); return px; };
      const shape = (x, y, s, f, rot, col) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); rr(ctx, -s / 2, -s / 2, s, s, lerp(s / 2, s * .14, f)); ctx.fillStyle = col; ctx.fill(); ctx.restore(); };
      if (t < 3) { // five shapes morphing
        bg(ctx, W, H, K);
        const s = m * .06, gap = s * 1.7, x0 = W / 2 - gap * 2, col = seg(t, 2.4, 2.9);
        for (let i = 0; i < 5; i++) {
          const ph2 = (t * 1.3 - i * .18), f = .5 + .5 * Math.sin(ph2 * Math.PI), rot = (i % 2 ? 1 : -1) * E.inOut(clamp(ph2 % 1)) * Math.PI / 4;
          const x = lerp(x0 + i * gap, W / 2, E.inOut(col)), y = H / 2 - Math.abs(Math.sin(ph2 * Math.PI)) * s * .5 * (1 - col);
          shape(x, y, s * (1 - col * .5), f, rot, i === 2 ? A : P);
        }
      } else if (t < 6.5) { // the problem
        bg(ctx, W, H, K);
        const lt = t - 3;
        const l1 = he ? 'עוד אתר שנראה' : 'Another site that', l2 = he ? 'כמו כולם?' : 'looks like the rest?';
        const n1 = Math.round(clamp(lt / 1.1) * l1.length), n2 = Math.round(seg(lt, 1.1, 2) * l2.length);
        const px = m * .12;
        center(l1.slice(0, n1), 'd1', px, H * .44, P);
        center(l2.slice(0, n2), 'd1', px, H * .44 + px * 1.05, P);
        if (lt > 2.2) {
          const g = Math.floor(t * 18) % 7, jx = g === 3 ? m * .012 : g === 5 ? -m * .008 : 0;
          ctx.save(); ctx.translate(jx, 0);
          center('ERROR 404 · INSPIRATION NOT FOUND', 'mono', m * .032, H * .44 + px * 1.9, g === 3 ? A : 'rgba(242,240,234,.55)');
          ctx.restore();
        }
      } else if (t < 9.5) { // the turn: chartreuse wipe along the cut
        bg(ctx, W, H, K);
        const lt = t - 6.5, p = E.inOut(seg(lt, 0, .5));
        ctx.save(); cutRegion(ctx, W, H, p, he); ctx.clip(); bg(ctx, W, H, A);
        const px = m * .14, e1 = E.quint(seg(lt, .35, 1.1)), e2 = E.quint(seg(lt, .55, 1.3));
        center(he ? 'בואו נבנה' : "Let's build", 'd1', px, H * .46 + (1 - e1) * px * .5, K, e1);
        const p2 = center(he ? 'משהו אחר' : 'something else', 'd1', px, H * .46 + px * 1.05 + (1 - e2) * px * .5, K, e2);
        ctx.font = font(o, 'd1', p2); const w2 = ctx.measureText(he ? 'משהו אחר' : 'something else').width;
        const pulse = 1 + .15 * Math.sin(lt * 6);
        ctx.beginPath(); ctx.arc(he ? W / 2 - w2 / 2 - p2 * .45 : W / 2 + w2 / 2 + p2 * .45, H * .46 + px * 1.05 - p2 * .3, p2 * .17 * e2 * pulse, 0, 7); ctx.fillStyle = K; ctx.fill();
        ctx.restore();
      } else if (t < 14) { // floating sites, league level
        bg(ctx, W, H, K);
        const lt = t - 9.5, f = W * .9, cards = [];
        for (let i = 0; i < 12; i++) {
          const x = ((i * 0.618) % 1 - .5) * W * 1.7, y = (((i * 0.382 + .17) % 1) - .5) * H * 1.5;
          let z = ((i / 12) * 6 + 6 - lt * 1.3) % 6 + .8;
          cards.push({ x, y, z, i });
        }
        cards.sort((a, b) => b.z - a.z).forEach(c => {
          const s = f / (c.z * W), cw = W * .32 * s * 1.1, ch = cw * .62;
          const sx = W / 2 + c.x * s - cw / 2, sy = H / 2 + c.y * s - ch / 2;
          ctx.save(); ctx.globalAlpha = clamp((6.8 - c.z) / 1.5) * clamp((c.z - .8) / .4);
          ctx.translate(sx + cw / 2, sy + ch / 2); ctx.rotate(Math.sin(c.i * 2.1) * .12); ctx.translate(-cw / 2, -ch / 2);
          drawSite(ctx, 0, 0, cw, ch, c.i);
          ctx.restore();
        });
        const e = E.quint(seg(lt, .6, 1.6));
        ctx.save(); ctx.fillStyle = 'rgba(15,15,14,.35)'; ctx.fillRect(0, H * .36, W, H * .26 * e); ctx.restore();
        center(he ? 'ברמת ליגה.' : 'League-level.', 'd1', m * .2, H * .5 + m * .07 + (1 - e) * m * .08, P, e);
      } else { // skills marquee and the end card
        bg(ctx, W, H, P);
        const lt = t - 14, skills = ['GRID', 'TYPE', 'EASING', 'SCROLL', 'RTL', '4K', 'CUT', 'BRAND'];
        const r = m * .07, gap = r * 2.5, off = (lt * r * 1.6) % (gap * skills.length);
        ctx.save(); ctx.globalAlpha = 1 - seg(lt, 1.6, 2.2);
        for (let k = -1; k < skills.length * 2; k++) {
          const x = (he ? W - (k * gap - off) : k * gap - off), sIdx = ((k % skills.length) + skills.length) % skills.length;
          ctx.beginPath(); ctx.arc(x, H * .3, r, 0, 7); ctx.fillStyle = sIdx % 3 === 0 ? A : K; ctx.fill();
          ctx.fillStyle = sIdx % 3 === 0 ? K : P; ctx.font = font(o, 'mono', r * .32); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText(skills[sIdx], x, H * .3);
        }
        ctx.restore();
        const e = E.quint(seg(lt, 1.6, 2.4)), fade = seg(lt, 2.7, 3);
        ctx.save(); ctx.globalAlpha = e;
        drawSymbol(ctx, W / 2 - m * .42, H * .55, m * .14, K, (1 - e) * .6 + .02);
        drawWordmark(ctx, W / 2 + m * .1, H * .55, m * .78, K, seg(lt, 1.6, 2.8));
        ctx.restore();
        center(he ? 'בית ספר לאתרים ולמושן' : 'A school for web & motion', 'mono', m * .034, H * .55 + m * .16, 'rgba(15,15,14,.6)', e);
        if (fade > 0) { ctx.save(); ctx.globalAlpha = fade; bg(ctx, W, H, K); ctx.restore(); }
      }
    }
  };

  /* ---------- live canvas manager ---------- */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const items = new Set();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    es.forEach(e => { const it = e.target.__os; if (it) { it.visible = e.isIntersecting; it.dirty = true; } });
  }, { rootMargin: '80px' }) : null;

  function mount(canvas, cfg) {
    // cfg: { tpl: () => key, opts: () => o, speed, onTime(t), still: () => bool }
    const it = Object.assign({ canvas, ctx: canvas.getContext('2d'), visible: !io, dirty: true, t: 0, last: performance.now(), paused: false }, cfg);
    canvas.__os = it;
    items.add(it);
    if (io) io.observe(canvas);
    return it;
  }
  function unmount(it) { items.delete(it); if (io) io.unobserve(it.canvas); }
  function invalidate() { items.forEach(it => (it.dirty = true)); }

  function frame(now) {
    items.forEach(it => {
      if (!it.canvas.isConnected) return;
      const dt = Math.min(.1, (now - it.last) / 1000);
      it.last = now;
      if (!it.visible) return;
      const key = it.tpl(), tpl = T[key] || T.softRise;
      const still = (it.respectReduce !== false && reduce.matches) || (it.still && it.still());
      if (!it.paused && !still) it.t = (it.t + dt * (it.speed ? it.speed() : 1)) % tpl.D;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cw = Math.round(it.canvas.clientWidth * dpr), ch = Math.round(it.canvas.clientHeight * dpr);
      if (!cw || !ch) return;
      if (it.canvas.width !== cw || it.canvas.height !== ch) { it.canvas.width = cw; it.canvas.height = ch; it.dirty = true; }
      if ((still || it.paused) && !it.dirty) return;
      const t = still && !it.paused ? (it.fixedT != null ? it.fixedT : tpl.hold) : it.t;
      it.ctx.setTransform(1, 0, 0, 1, 0, 0);
      it.ctx.globalAlpha = 1;
      if ('letterSpacing' in it.ctx) it.ctx.letterSpacing = '0px';
      tpl.draw(it.ctx, cw, ch, t, it.opts());
      it.dirty = false;
      if (it.onTime) it.onTime(t, tpl.D);
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function renderStill(canvas, key, o, t) {
    const tpl = T[key] || T.softRise;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.round(canvas.clientWidth * dpr) || canvas.width, ch = Math.round(canvas.clientHeight * dpr) || canvas.height;
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    tpl.draw(ctx, cw, ch, t == null ? tpl.hold : t, o);
  }

  window.OSEngine = { T, E, mount, unmount, invalidate, renderStill, drawSymbol, drawWordmark, reduce, CUT };
})();

/* Chocolate Bite – generative score (Web Audio API).
   Every hit is scheduled from the animation's own sync markers, so the same code
   plays live in the browser (AudioContext) and renders offline to WAV (OfflineAudioContext). */
(function () {
  const BPM = 128, BEAT = 60 / BPM, SWING = 0.035;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const rng = seed => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };

  const CHORDS = {
    C:  { bass: 36, tones: [60, 64, 67, 72] },
    Am: { bass: 33, tones: [57, 60, 64, 69] },
    F:  { bass: 29, tones: [53, 57, 60, 65] },
    G:  { bass: 31, tones: [55, 59, 62, 67] }
  };
  const PROG = ['C', 'Am', 'F', 'G'];

  /* ---------- the kit: buses, reverb, noise ---------- */
  function makeKit(ctx, out) {
    const sr = ctx.sampleRate, r = rng(7);
    const nb = ctx.createBuffer(1, sr * 2, sr), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;
    const ir = ctx.createBuffer(2, Math.floor(sr * 2.2), sr);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / d.length, 3.4); }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const verbOut = ctx.createGain(); verbOut.gain.value = 0.32; verb.connect(verbOut).connect(out);
    const music = ctx.createGain(); music.connect(out);   // melodic bus, "breathes" with the kick
    return { ctx, nb, verb, music, out };
  }

  /* ---------- small building blocks ---------- */
  function env(k, t, a, peak, dec) {
    const g = k.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
    return g;
  }
  function osc(k, type, f, t, dur) {
    const o = k.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function noise(k, t, dur) {
    const s = k.ctx.createBufferSource(); s.buffer = k.nb;
    s.start(t, (t * 7.31) % 1.5); s.stop(t + dur + 0.05); return s;
  }
  function filt(k, type, f, q = 1) { const b = k.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
  function pan(k, p) { const s = k.ctx.createStereoPanner(); s.pan.value = p; return s; }
  function out(k, node, dest, rev = 0) {
    node.connect(dest);
    if (rev) { const g = k.ctx.createGain(); g.gain.value = rev; node.connect(g); g.connect(k.verb); }
  }

  /* ---------- instruments ---------- */
  function marimba(k, t, m, v = 0.22, rev = 0.18) {
    const f = mtof(m), p = pan(k, Math.max(-0.6, Math.min(0.6, (m - 72) / 24)));
    const g1 = env(k, t, 0.003, v, 0.5); osc(k, 'sine', f, t, 0.6).connect(g1).connect(p);
    const g2 = env(k, t, 0.002, v * 0.32, 0.1); osc(k, 'sine', f * 3.93, t, 0.15).connect(g2).connect(p);
    const g3 = env(k, t, 0.001, v * 0.15, 0.02); osc(k, 'triangle', f * 9.2, t, 0.05).connect(g3).connect(p);
    out(k, p, k.music, rev);
  }
  function bell(k, t, m, v = 0.12, dec = 1.6, rev = 0.5) {
    const f = mtof(m), p = pan(k, ((m * 37) % 11) / 11 - 0.5);
    [[1, 1, 1], [2.76, 0.4, 0.55], [5.4, 0.2, 0.3], [8.93, 0.08, 0.18]].forEach(([r, a, d]) => {
      const g = env(k, t, 0.002, v * a, dec * d); osc(k, 'sine', f * r, t, dec * d + 0.1).connect(g).connect(p);
    });
    out(k, p, k.music, rev);
  }
  function bass(k, t, m, dur = 0.2, v = 0.3) {
    const o = osc(k, 'sawtooth', mtof(m), t, dur + 0.1), lp = filt(k, 'lowpass', 1600, 7);
    lp.frequency.setValueAtTime(2200, t); lp.frequency.exponentialRampToValueAtTime(180, t + 0.16);
    const sub = osc(k, 'sine', mtof(m), t, dur + 0.1);
    const g = k.ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.03);
    o.connect(lp).connect(g); sub.connect(g); out(k, g, k.music);
  }
  function pad(k, t, ch, dur, v = 0.045) {
    const lp = filt(k, 'lowpass', 700, 0.7);
    // slow LFO on the filter: the pad "breathes"
    const lfo = osc(k, 'sine', 0.55, t, dur + 0.8), lg = k.ctx.createGain(); lg.gain.value = 380;
    lfo.connect(lg).connect(lp.frequency);
    const g = k.ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.35);
    g.gain.setValueAtTime(v, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 0.6);
    CHORDS[ch].tones.slice(0, 3).forEach((m, i) => [-8, 8].forEach(c => {
      const o = osc(k, 'sawtooth', mtof(m - 12 + (i === 0 ? 12 : 0)), t, dur + 0.7); o.detune.value = c; o.connect(lp);
    }));
    lp.connect(g); out(k, g, k.music, 0.35);
  }
  function kick(k, t, v = 0.9, dec = 0.38, f0 = 160, f1 = 44) {
    const o = osc(k, 'sine', f0, t, dec + 0.1);
    o.frequency.exponentialRampToValueAtTime(f1, t + 0.11);
    const g = env(k, t, 0.002, v, dec); o.connect(g); out(k, g, k.out);
    const c = env(k, t, 0.001, v * 0.25, 0.012); noise(k, t, 0.03).connect(filt(k, 'highpass', 3000)).connect(c); out(k, c, k.out);
    // sidechain-style pump on the melodic bus
    k.music.gain.cancelScheduledValues(t);
    k.music.gain.setValueAtTime(0.55, t); k.music.gain.linearRampToValueAtTime(1, t + 0.24);
  }
  function clap(k, t, v = 0.3) {
    const bp = filt(k, 'bandpass', 1400, 0.9), g = k.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    [0, 0.011, 0.022].forEach(d => { g.gain.setValueAtTime(v, t + d); g.gain.linearRampToValueAtTime(v * 0.3, t + d + 0.009); });
    g.gain.setValueAtTime(v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    noise(k, t, 0.25).connect(bp).connect(g); out(k, g, k.out, 0.25);
  }
  function snare(k, t, v = 0.2) {
    const g = env(k, t, 0.001, v, 0.1); noise(k, t, 0.12).connect(filt(k, 'bandpass', 2400, 0.7)).connect(g); out(k, g, k.out, 0.15);
    const tg = env(k, t, 0.001, v * 0.6, 0.06); osc(k, 'triangle', 190, t, 0.08).connect(tg); out(k, tg, k.out);
  }
  function hat(k, t, v = 0.06, dec = 0.035) {
    const g = env(k, t, 0.001, v, dec); noise(k, t, dec + 0.05).connect(filt(k, 'highpass', 7800)).connect(g);
    const p = pan(k, 0.25); g.connect(p); out(k, p, k.out);
  }
  function shaker(k, t, v = 0.05) {
    const g = env(k, t, 0.012, v, 0.06); noise(k, t, 0.1).connect(filt(k, 'bandpass', 6000, 1.2)).connect(g);
    const p = pan(k, -0.3); g.connect(p); out(k, p, k.out);
  }
  function bloop(k, t, f0 = 900, f1 = 220, v = 0.28) {   // the drop landing
    const o = osc(k, 'sine', f0, t, 0.25); o.frequency.exponentialRampToValueAtTime(f1, t + 0.13);
    const g = env(k, t, 0.003, v, 0.2); o.connect(g); out(k, g, k.out, 0.12);
  }
  function blip(k, t, f0 = 320, f1 = 900, v = 0.1) {    // the drop taking off
    const o = osc(k, 'triangle', f0, t, 0.12); o.frequency.exponentialRampToValueAtTime(f1, t + 0.08);
    const g = env(k, t, 0.004, v, 0.08); o.connect(g); out(k, g, k.out);
  }
  function whoosh(k, t, dur, f0, f1, v = 0.18) {
    const bp = filt(k, 'bandpass', f0, 1.8); bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = k.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, t + dur);
    noise(k, t, dur).connect(bp).connect(g); out(k, g, k.out, 0.2);
  }
  function riser(k, t, dur, v = 0.06) {
    const lp = filt(k, 'lowpass', 400, 4); lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(6000, t + dur);
    const g = k.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 0.03);
    [-10, 10].forEach(c => { const o = osc(k, 'sawtooth', mtof(55), t, dur); o.detune.value = c; o.frequency.exponentialRampToValueAtTime(mtof(79), t + dur); o.connect(lp); });
    lp.connect(g); out(k, g, k.out, 0.2);
  }
  function impact(k, t) {   // "בום!"
    kick(k, t, 1.1, 0.9, 130, 34);
    const sub = osc(k, 'sine', 58, t, 1.1), sg = env(k, t, 0.005, 0.4, 0.9); sub.connect(sg); out(k, sg, k.out);
    const cg = env(k, t, 0.002, 0.22, 1.4); noise(k, t, 1.5).connect(filt(k, 'highpass', 2500)).connect(cg); out(k, cg, k.out, 0.45);
    const pop = osc(k, 'square', 520, t, 0.2); pop.frequency.exponentialRampToValueAtTime(90, t + 0.15);
    const pg = env(k, t, 0.001, 0.08, 0.15); pop.connect(filt(k, 'lowpass', 2500)).connect(pg); out(k, pg, k.out);
  }
  function crash(k, t, v = 0.1) { const g = env(k, t, 0.002, v, 1.1); noise(k, t, 1.2).connect(filt(k, 'highpass', 4500)).connect(g); out(k, g, k.out, 0.4); }
  function wheee(k, t, dur) {   // the loop-the-loop glide
    const o = osc(k, 'triangle', mtof(67), t, dur + 0.2);
    o.frequency.exponentialRampToValueAtTime(mtof(91), t + dur * 0.55);
    o.frequency.exponentialRampToValueAtTime(mtof(79), t + dur);
    const vib = osc(k, 'sine', 7, t, dur + 0.2), vg = k.ctx.createGain(); vg.gain.value = 18; vib.connect(vg).connect(o.frequency);
    const g = k.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.06); g.gain.setValueAtTime(0.12, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, t + dur + 0.15);
    o.connect(filt(k, 'lowpass', 5000)).connect(g); out(k, g, k.music, 0.4);
  }
  function crunch(k, t) {   // the bite
    const r = rng(42);
    for (let i = 0; i < 7; i++) {
      const d = i * 0.03 + r() * 0.012, f = 900 + r() * 2200;
      const g = env(k, t + d, 0.001, 0.32 * (1 - i / 9), 0.03 + r() * 0.03);
      noise(k, t + d, 0.08).connect(filt(k, 'bandpass', f, 1.4)).connect(g); out(k, g, k.out, 0.1);
    }
    kick(k, t, 0.6, 0.25, 120, 50);
  }

  /* ---------- the score: a pure list of timed events ---------- */
  function events(M, X) {
    const ev = [], add = (t, f) => { if (t >= 0 && t < M.end) ev.push({ t, f }); };
    const G0 = M.boom - 7 * BEAT;   // beat grid anchored so "בום!" sits on a beat
    const beat = i => G0 + i * BEAT;
    const chordAt = t => t >= M.fade ? 'C' : PROG[Math.floor(Math.max(0, t - G0) / (4 * BEAT)) % 4];
    const nBeats = Math.ceil((M.end - G0) / BEAT);

    const drumsOn = t => (t >= M.boom - 0.01 && t < M.merge) || (t >= M.cube + 0.4 && t < M.outro3);
    const groove = t => t >= M.boom - 0.01 && t < M.bite;
    const stopTime = t => t >= M.bite + 0.05 && t < M.fade;

    // pads + bass + melody on the 8th-note grid
    for (let b = 0; b < nBeats; b += 4) {
      const t = beat(b); if (t >= M.fade) break;
      add(Math.max(0, t), (k, w) => pad(k, w, chordAt(t + 0.01), Math.min(4 * BEAT, M.fade - Math.max(0, t)) - 0.05, t < M.boom ? 0.03 : 0.045));
    }
    const PAT = [0, 2, 1, 3, 2, 1, 3, 2], HIT = [1, 0, 1, 1, 0, 1, 1, 1];
    for (let e = 0; e < nBeats * 2; e++) {
      const t0 = G0 + e * BEAT / 2, t = t0 + (e % 2 ? SWING : 0);
      if (t < 0.05 || t >= M.end || stopTime(t) || t >= M.fade) continue;
      const ch = CHORDS[chordAt(t)], step = e % 8, inOrbit = t >= X.ORB0 && t < M.merge;
      // bass: soft on beats in the intro, bouncy octaves once the groove is in
      if (t < M.boom) { if (step % 4 === 0) add(t, (k, w) => bass(k, w, ch.bass + 12, 0.3, 0.2)); }
      else if (t < M.merge || (t >= M.cube && t < M.bite)) add(t, (k, w) => bass(k, w, ch.bass + (e % 2 ? 24 : 12), 0.13, t >= M.outro3 ? 0.17 : 0.24));
      // melody (marimba); during the orbit it turns into a rising 16th arpeggio
      if (inOrbit) continue;
      if (t >= M.outro3 && t < M.wink + 1) continue;
      if (HIT[step]) add(t, (k, w) => marimba(k, w, ch.tones[PAT[step]] + 12, t < M.boom ? 0.16 : 0.2));
      if (t >= M.cube && step % 4 === 2) add(t, (k, w) => bell(k, w, ch.tones[(step / 2 + e) % 4] + 24, 0.05, 0.9));
    }
    // orbit arpeggio: 16ths rising until the loop peak, then falling into the merge
    for (let s = 0; ; s++) {
      const t = X.ORB0 + s * BEAT / 4; if (t >= M.merge) break;
      const ch = CHORDS[chordAt(t)], up = t < M.loops;
      const idx = up ? s % 8 : 7 - (s % 8), oct = up ? Math.floor(s / 8) : 1;
      add(t, (k, w) => marimba(k, w, ch.tones[idx % 4] + 12 * (1 + Math.floor(idx / 4)) + 12 * Math.min(oct, 1), 0.14, 0.25));
    }
    // drums
    for (let e = 0; e < nBeats * 2; e++) {
      const t0 = G0 + e * BEAT / 2, t = t0 + (e % 2 ? SWING : 0);
      if (t < 0.05 || t >= M.end) continue;
      if (t < M.boom - 0.01) { add(t, (k, w) => shaker(k, w, e % 2 ? 0.05 : 0.025)); continue; }
      if (drumsOn(t)) {
        if (e % 2 === 0) add(t, (k, w) => kick(k, w, 0.8));
        if (e % 4 === 2) add(t, (k, w) => clap(k, w));
        if (e % 2 === 1) add(t, (k, w) => hat(k, w, 0.07));
        add(t + BEAT / 4, (k, w) => shaker(k, w, 0.03));
      } else if (groove(t) && t >= M.outro3 && t < M.bite - 0.6) {
        if (e % 2 === 1) add(t, (k, w) => hat(k, w, 0.06));
      }
    }

    // ---- shot 1: the drop ----
    add(M.dropLand - 0.02, (k, w) => bloop(k, w, 1000, 200, 0.3));
    X.HOPS.forEach(([t0, t1], i) => {
      add(t0 - 0.02, (k, w) => blip(k, w, 300 + i * 60, 900 + i * 120));
      add(t1, (k, w) => bloop(k, w, 950 - i * 90, 230 - i * 20, 0.28));
    });
    add(2.72, (k, w) => whoosh(k, w, X.COLLIDE - 2.72, 500, 5000, 0.16));
    add(2.5, (k, w) => riser(k, w, X.COLLIDE - 2.5, 0.05));

    // ---- shot 2: boom, whip, loops ----
    add(X.COLLIDE, (k, w) => impact(k, w));
    add(M.boom, (k, w) => crash(k, w, 0.08));
    add(M.whip - 0.05, (k, w) => whoosh(k, w, 0.38, 6000, 400, 0.22));
    add(M.loops - 0.32, (k, w) => wheee(k, w, 0.75));
    add(M.loops, (k, w) => crash(k, w, 0.07));
    add(M.merge, (k, w) => riser(k, w, M.cube - M.merge, 0.07));
    add(M.merge, (k, w) => whoosh(k, w, M.cube - M.merge, 300, 3000, 0.1));

    // ---- shot 3: the cube cools ----
    add(M.cube + 0.25, (k, w) => { kick(k, w, 0.7, 0.5); [72, 76, 79, 84].forEach((m, i) => bell(k, w + i * 0.025, m, 0.09, 2.2)); });
    for (let i = 0; i < 6; i++) { const ft = M.cube + 0.1 + i * 0.12 + 0.45 * 0.45; add(ft, (k, w) => bell(k, w, [96, 91, 100, 93, 98, 103][i], 0.045, 1.2, 0.7)); }
    [M.shine + 0.25, M.best + 0.85].forEach(st => [84, 88, 91, 96, 100].forEach((m, i) => add(st + i * 0.05, (k, w) => bell(k, w, m, 0.055, 1.1, 0.6))));

    // ---- shot 4: wink + bite + logo ----
    add(M.wink + 0.1, (k, w) => { bell(k, w, 88, 0.1, 1.2); bell(k, w + 0.09, 95, 0.1, 1.4); });
    add(M.wink + 0.53, (k, w) => blip(k, w, 1400, 2600, 0.06));
    // "תנו" / "בי" word pops
    [M.bite - 0.7, M.bite - 0.54].forEach((st, i) => add(st + X.PEAK * 0.42, (k, w) => marimba(k, w, [79, 84][i], 0.22)));
    for (let i = 0; i < 10; i++) { const p = i / 10, t = M.bite - 0.62 + 0.6 * (1 - Math.pow(1 - p, 1.6)); add(t, (k, w) => snare(k, w, 0.05 + 0.12 * p)); }
    add(M.bite, (k, w) => { crunch(k, w); clap(k, w, 0.25); });
    add(M.fade, (k, w) => {
      kick(k, w, 0.6, 0.6, 120, 40);
      pad(k, w, 'C', M.end - M.fade - 0.6, 0.05);
      bass(k, w, 36, 0.9, 0.22);
      [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => bell(k, w + i * 0.045, m, 0.07, 2.4, 0.6));
      [72, 76, 79].forEach((m, i) => marimba(k, w + 0.02 * i, m, 0.12));
    });
    add(M.end - 0.6, (k, w) => { k.out.gain.setValueAtTime(1, w); k.out.gain.linearRampToValueAtTime(0, w + 0.58); });
    return ev.sort((a, b) => a.t - b.t);
  }

  /* ---------- live playback ---------- */
  function play(ctx, M, X, from = 0, dest = ctx.destination) {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    const master = ctx.createGain(); master.gain.value = 0.85;
    const session = ctx.createGain();
    session.connect(comp).connect(master).connect(dest);
    const k = makeKit(ctx, session), when0 = ctx.currentTime + 0.06;
    events(M, X).forEach(e => { if (e.t >= from - 1e-4) e.f(k, when0 + e.t - from); });
    return {
      startTime: when0 - from,
      stop() { const n = ctx.currentTime; master.gain.cancelScheduledValues(n); master.gain.setValueAtTime(master.gain.value, n); master.gain.linearRampToValueAtTime(0, n + 0.08); setTimeout(() => master.disconnect(), 200); }
    };
  }

  /* ---------- offline render → WAV (base64) ---------- */
  async function renderWav(M, X, sr = 48000) {
    const ctx = new OfflineAudioContext(2, Math.ceil(sr * M.end), sr);
    play(ctx, M, X, 0);
    const buf = await ctx.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    let peak = 0; for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    const norm = peak > 0 ? 0.89 / peak : 1;
    const n = L.length, bytes = new DataView(new ArrayBuffer(44 + n * 4));
    const str = (o, s) => [...s].forEach((c, i) => bytes.setUint8(o + i, c.charCodeAt(0)));
    str(0, 'RIFF'); bytes.setUint32(4, 36 + n * 4, true); str(8, 'WAVEfmt ');
    bytes.setUint32(16, 16, true); bytes.setUint16(20, 1, true); bytes.setUint16(22, 2, true);
    bytes.setUint32(24, sr, true); bytes.setUint32(28, sr * 4, true); bytes.setUint16(32, 4, true); bytes.setUint16(34, 16, true);
    str(36, 'data'); bytes.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i++) {
      bytes.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i] * norm)) * 32767, true);
      bytes.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i] * norm)) * 32767, true);
    }
    const u8 = new Uint8Array(bytes.buffer); let bin = '';
    for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  window.Music = { events, play, renderWav, BPM };
})();

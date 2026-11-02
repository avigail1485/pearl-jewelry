/* ONLY STORY site: language, theme, routing, hero, docs pages, component specimens and the studio. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const Eng = window.OSEngine;
  const store = {
    get(k) { try { return localStorage.getItem('os-' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('os-' + k, v); } catch (e) { /* storage unavailable */ } }
  };
  const L = (he, en) => `<span class="he">${he}</span><span class="en">${en}</span>`;
  const ic = (id, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const lang = () => root.lang === 'en' ? 'en' : 'he';
  const tr = (he, en) => (lang() === 'he' ? he : en);
  const isRTLText = s => /[֐-׿؀-ۿ]/.test(s || '');

  /* ---------- toasts ---------- */
  function toast(he, en, icon = 'i-check', tile = 't-chart') {
    const host = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast glass l3';
    el.innerHTML = `<span class="tile ${tile}">${ic(icon)}</span><span>${L(he, en)}</span>`;
    host.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 2600);
  }

  /* ---------- clipboard ---------- */
  function copyText(text) {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); return ok;
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true, () => fallback());
    }
    return Promise.resolve(fallback());
  }

  /* ---------- language & theme ---------- */
  const listeners = [];
  const onLang = fn => listeners.push(fn);
  function setLang(l, save = true) {
    root.lang = l;
    root.dir = l === 'he' ? 'rtl' : 'ltr';
    $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    $$('[data-label-he]').forEach(el => el.setAttribute('aria-label', el.dataset[l === 'he' ? 'labelHe' : 'labelEn']));
    $$('[data-ph-he]').forEach(el => (el.placeholder = el.dataset[l === 'he' ? 'phHe' : 'phEn']));
    const bt = $('#badgeText');
    if (bt) bt.textContent = l === 'he' ? '• מילים בתנועה • בכל כתב • מילים בתנועה • בכל כתב ' : '• WORDS IN MOTION • IN EVERY SCRIPT ';
    document.title = l === 'he' ? 'ONLY STORY · מערכת עיצוב' : 'ONLY STORY · Design system';
    if (save) store.set('lang', l);
    listeners.forEach(fn => fn(l));
    Eng.invalidate();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-lang]');
    if (b) setLang(b.dataset.lang);
  });
  function setTheme(t, save = true) {
    root.setAttribute('data-theme', t);
    const b = $('#themeBtn');
    if (b) b.setAttribute('aria-pressed', String(t === 'dark'));
    if (save) store.set('theme', t);
  }
  $('#themeBtn').addEventListener('click', () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  /* ---------- router with the diagonal wipe ---------- */
  const ROUTES = ['home', 'foundations', 'components', 'studio'];
  const routeHooks = {};
  let current = null;
  function route() {
    const h = (location.hash || '#home').slice(1);
    let name = ROUTES.includes(h) ? h : null;
    let anchor = null;
    if (!name) {
      const el = document.getElementById(h);
      const pg = el && el.closest('.page');
      if (pg) { name = pg.dataset.page; anchor = el; } else name = 'home';
    }
    if (name !== current) {
      $$('.page').forEach(p => {
        const on = p.dataset.page === name;
        p.hidden = !on;
        p.classList.remove('enter');
        if (on && current !== null && !Eng.reduce.matches) { void p.offsetWidth; p.classList.add('enter'); }
      });
      $$('.capsule a').forEach(a => { if (a.dataset.route === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      const first = current === null;
      current = name;
      if (!anchor && !first) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      if (routeHooks[name]) routeHooks[name]();
      Eng.invalidate();
    }
    if (anchor) requestAnimationFrame(() => anchor.scrollIntoView({ behavior: Eng.reduce.matches ? 'auto' : 'smooth', block: 'start' }));
  }
  $$('.page').forEach(p => p.addEventListener('animationend', () => p.classList.remove('enter')));
  window.addEventListener('hashchange', route);

  /* ---------- sample content ---------- */
  const SAMPLE = {
    hero: { he: ['רק הסיפור שלך.', 'עכשיו בתנועה.'], en: ['Only your story.', 'Now in motion.'] },
    softRise: { he: ['פותחים עונה.', 'קולקציית סתיו.'], en: ['New season.', 'The autumn edit.'] },
    beatSlam: { he: ['מהר. חד.', 'שלך.'], en: ['Fast. Sharp.', 'Yours.'] },
    pricePop: { he: ['מבצע השקה', 'רק השבוע'], en: ['Launch offer', 'This week only'] },
    diagonalWipe: { he: ['לפני.', 'אחרי.'], en: ['Before.', 'After.'] },
    breathing: { he: ['נשימה עמוקה.', 'ומתחילים.'], en: ['Breathe in.', 'Begin again.'] },
    marquee: { he: ['מילים בתנועה', ''], en: ['Words in motion', ''] },
    endCard: { he: ['', ''], en: ['', ''] }
  };
  const BASE_PAL = { ink: '#111110', accent: '#D5FF5F', paper: '#F6F4EF' };
  const sampleOpts = key => {
    const l = lang(), s = (SAMPLE[key] || SAMPLE.hero)[l];
    return Object.assign({}, BASE_PAL, { l1: s[0], l2: s[1], rtl: l === 'he' });
  };
  const TPL_META = {
    softRise: { name: 'Soft Rise', fam: ['חשיפות', 'Reveals'], tile: 't-chart', icon: 'i-rise' },
    beatSlam: { name: 'Beat Slam', fam: ['טיפוגרפיה קינטית', 'Kinetic Type'], tile: 't-lav', icon: 'i-type' },
    pricePop: { name: 'Price Pop', fam: ['מכירה', 'Commerce'], tile: 't-peach', icon: 'i-tag' },
    diagonalWipe: { name: 'Diagonal Wipe', fam: ['מעברים', 'Transitions'], tile: 't-sky', icon: 'i-cut' },
    breathing: { name: 'Breathing Gradient', fam: ['רקעים', 'Backgrounds'], tile: 't-lav', icon: 'i-wave' },
    marquee: { name: 'Marquee Stack', fam: ['טיפוגרפיה קינטית', 'Kinetic Type'], tile: 't-chart', icon: 'i-layers' },
    endCard: { name: 'End Card', fam: ['מותג ולוגו', 'Brand & Logo'], tile: 't-sky', icon: 'i-eye' },
    reel: { name: 'Showreel', fam: ['רצף', 'Sequence'], tile: 't-chart', icon: 'i-film' }
  };
  const dur = k => '00:0' + Math.round(Eng.T[k].D);

  /* ---------- hero ---------- */
  const heroIt = Eng.mount($('#heroCanvas'), { tpl: () => 'reel', opts: () => sampleOpts('hero') });
  $('#watchBtn').addEventListener('click', () => {
    heroIt.t = 0; heroIt.paused = false; heroIt.dirty = true;
    heroIt.respectReduce = false;
    $('#ring').classList.add('paused');
    $('#heroPhone').scrollIntoView({ behavior: Eng.reduce.matches ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => $('#ring').classList.remove('paused'), Eng.T.reel.D * 1000);
  });

  function drawOrbits() {
    const svg = $('#orbits'), hero = $('.hero');
    if (!svg || !hero || hero.offsetParent === null) return;
    const hr = hero.getBoundingClientRect();
    const st = $('#stage').getBoundingClientRect();
    const cx = st.left - hr.left + st.width / 2, cy = st.top - hr.top + 178;
    svg.setAttribute('viewBox', `0 0 ${hr.width} ${hr.height}`);
    let d = '';
    const dots = [];
    [['#floatL', -1], ['#floatR', 1]].forEach(([sel]) => {
      const r = $(sel).getBoundingClientRect();
      const sx = r.left - hr.left + r.width / 2, sy = r.bottom - hr.top;
      const side = sx < cx ? -1 : 1;
      const ex = cx + side * 300, ey = cy + 26;
      d += `M${sx} ${sy} C ${sx} ${sy + (ey - sy) * .9}, ${ex - side * -60} ${ey + 10}, ${ex} ${ey} `;
      dots.push([sx, sy], [ex, ey]);
    });
    svg.innerHTML = `<path d="${d}"/><path d="M${cx - 360} ${cy + 20} A 360 70 0 0 0 ${cx + 360} ${cy + 20}" style="opacity:.7"/>` + dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5"/>`).join('');
  }
  window.addEventListener('resize', drawOrbits);

  // typing demo in "Tell it"
  (function typing() {
    const el = $('#typingText');
    const lines = { he: ['פתיחת סניף חדש בחיפה', 'מבצע סוף עונה, 30% הנחה', 'הזמנה לערב השקה'], en: ['New branch opening in Haifa', 'End of season, 30% off', 'An invitation to launch night'] };
    let i = 0, c = 0, dir = 1;
    function tick() {
      const arr = lines[lang()], s = arr[i % arr.length];
      if (Eng.reduce.matches) { el.textContent = s; return setTimeout(tick, 1500); }
      c += dir;
      el.textContent = s.slice(0, c);
      let wait = 70;
      if (c >= s.length) { dir = -1; wait = 1600; }
      else if (c <= 0) { dir = 1; i++; wait = 400; }
      setTimeout(tick, dir < 0 && c < s.length ? 28 : wait);
    }
    tick();
    onLang(() => { c = 0; dir = 1; });
  })();

  /* ---------- gallery ---------- */
  const GAL = ['softRise', 'beatSlam', 'pricePop', 'diagonalWipe', 'breathing', 'marquee'];
  function tcard(key, extra = '', tag = 'button') {
    const m = TPL_META[key];
    return `<${tag} class="tcard card glass hoverable ${extra}" ${tag === 'button' ? 'type="button"' : ''} data-tpl="${key}">
      <div class="pv"><canvas data-live="${key}" aria-hidden="true"></canvas></div>
      <div class="meta-row"><span class="tile ${m.tile}">${ic(m.icon)}</span><div><div class="name">${m.name}</div><div class="fam">${L(m.fam[0], m.fam[1])}</div></div><span class="mono muted">${dur(key)}</span></div>
    </${tag}>`;
  }
  $('#gallery').innerHTML = GAL.map(k => tcard(k)).join('');
  function mountLive(scope) {
    $$('canvas[data-live]', scope).forEach(cv => {
      if (cv.__os) return;
      const k = cv.dataset.live;
      Eng.mount(cv, { tpl: () => k, opts: () => sampleOpts(k) });
    });
  }
  mountLive($('#gallery'));
  $('#gallery').addEventListener('click', e => {
    const c = e.target.closest('[data-tpl]');
    if (!c) return;
    Studio.useTemplate(c.dataset.tpl);
    location.hash = '#studio';
  });

  /* ---------- brief ---------- */
  const FORMATS = { '9:16': [1080, 1920], '1:1': [1080, 1080], '16:9': [1920, 1080] };
  function briefText(st) {
    const rtl = isRTLText(st.l1 + st.l2);
    const m = TPL_META[st.tpl];
    const [w, h] = FORMATS[st.format];
    let s = `ONLY STORY → Claude Code
────────────────────────────────────
Project   "${st.l1}${st.l2 ? ' / ' + st.l2 : ''}"
Template  ${m.name} · ${m.fam[1]} · ${dur(st.tpl)}
Format    ${st.format} · ${w}×${h} · 30fps
Script    ${rtl ? 'Hebrew · RTL · animate by grapheme, keep niqqud attached' : 'Latin · LTR · animate by word'}
Palette   Ink ${st.pal.ink} · Accent ${st.pal.accent} · Paper ${st.pal.paper}
Type      ${rtl ? 'Frank Ruhl Libre 500 / 300' : 'Instrument Serif roman / italic'} · Google Sans
Style     ${st.style || 'Headline & Sub'}
Motion    ease-out cubic-bezier(.22,1,.36,1) · 110ms stagger
Rules     hold 1.2s + 0.3s per word · contrast ≥ 4.5:1 · safe area 8% × 7%

Build this as a deterministic HTML canvas composition where
draw(t) depends only on time, then add an MP4 export.
Keep the palette, timing and direction above.`;
    if (st.mode === 'pro') {
      s += `

composition.json
${JSON.stringify({ template: st.tpl, format: st.format, size: [w, h], fps: 30, duration: Eng.T[st.tpl].D, direction: rtl ? 'rtl' : 'ltr', text: [st.l1, st.l2], palette: st.pal, easing: [.22, 1, .36, 1], stagger: .11 }, null, 2)}`;
    }
    return s;
  }
  function briefPanel(el, getState, compact) {
    el.innerHTML = `<div class="bar"><div class="who"><span class="tile t-chart">${ic('i-code')}</span><div><div class="label">${L('בריף ל־Claude Code', 'Brief for Claude Code')}</div><div class="mono muted" data-sum></div></div></div>
      <button class="btn btn-primary sm copy-btn" type="button">${ic('i-copy')}<span data-cl>${L('העתקה ל־Claude Code', 'Copy for Claude Code')}</span></button></div>
      <pre tabindex="0" ${compact ? 'style="max-height:220px"' : ''}></pre>`;
    const pre = $('pre', el), btn = $('.copy-btn', el), sum = $('[data-sum]', el);
    const refresh = () => {
      const st = getState();
      pre.textContent = briefText(st);
      sum.textContent = `${TPL_META[st.tpl].name} · ${st.format}`;
    };
    btn.addEventListener('click', () => {
      const text = pre.textContent;
      copyText(text).then(ok => {
        if (ok) {
          btn.dataset.state = 'copied';
          btn.querySelector('svg use').setAttribute('href', '#i-check');
          $('[data-cl]', btn).innerHTML = L('הועתק', 'Copied');
          toast('הבריף הועתק. אפשר להדביק אותו.', 'Brief copied. Ready to paste.');
          setTimeout(() => { btn.dataset.state = ''; btn.querySelector('svg use').setAttribute('href', '#i-copy'); $('[data-cl]', btn).innerHTML = L('העתקה ל־Claude Code', 'Copy for Claude Code'); }, 2200);
        } else {
          const r = document.createRange(); r.selectNodeContents(pre);
          const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
          toast('הטקסט מסומן. לחצו Ctrl+C להעתקה.', 'Text selected. Press Ctrl+C to copy.', 'i-copy', 't-peach');
        }
      });
    });
    refresh();
    onLang(refresh);
    return refresh;
  }
  briefPanel($('#homeBrief'), () => {
    const s = SAMPLE.hero[lang()];
    return { l1: s[0], l2: s[1], tpl: 'reel', format: '9:16', pal: BASE_PAL, mode: 'simple' };
  });

  /* ---------- export panel ---------- */
  function exportPanel(el, run) {
    el.innerHTML = `<div class="status"><div class="who" style="display:flex;gap:12px;align-items:center"><span class="tile t-sky">${ic('i-film')}</span><div><div class="label">${L('ייצוא', 'Export')}</div><div class="mono muted" data-spec>MP4 · H.264</div></div></div><span class="mono" data-pct>0%</span></div>
      <div class="opts" role="group"><button class="chip" type="button" aria-pressed="true" data-q="1080">1080p</button><button class="chip" type="button" aria-pressed="false" data-q="4k">4K · Pro</button><button class="chip" type="button" aria-pressed="true" data-fps="30">30fps</button><button class="chip" type="button" aria-pressed="false" data-fps="60">60fps</button></div>
      <div class="track" style="--p:0%"><div class="fill"></div><div class="ticks"></div><div class="ph"></div></div>
      <p class="caption" data-msg style="margin:0">${L('הרינדור רץ במכשיר שלכם. שום קובץ לא עוזב אותו.', 'Rendering runs on your device. No file leaves it.')}</p>
      <button class="btn btn-primary" type="button" data-go>${ic('i-down')}${L('הורדת MP4', 'Download MP4')}</button>`;
    const track = $('.track', el), pct = $('[data-pct]', el), go = $('[data-go]', el);
    $$('.opts .chip', el).forEach(c => c.addEventListener('click', () => {
      const attr = c.dataset.q ? 'data-q' : 'data-fps';
      $$(`.opts [${attr}]`, el).forEach(o => o.setAttribute('aria-pressed', String(o === c)));
    }));
    const setP = p => { track.style.setProperty('--p', (p * 100).toFixed(1) + '%'); pct.textContent = Math.round(p * 100) + '%'; };
    go.addEventListener('click', async () => {
      go.classList.add('is-loading'); go.disabled = true;
      try { await run(setP); }
      catch (err) { toast('הייצוא לא הצליח בדפדפן הזה. נסו Chrome או Edge.', 'Export failed in this browser. Try Chrome or Edge.', 'i-x', 't-peach'); }
      go.classList.remove('is-loading'); go.disabled = false;
    });
    return { setP, el };
  }
  const simulate = setP => new Promise(res => {
    let p = 0;
    const id = setInterval(() => {
      p = Math.min(1, p + .02 + Math.random() * .03); setP(p);
      if (p >= 1) { clearInterval(id); toast('הסרטון מוכן: only-story.mp4', 'Your video is ready: only-story.mp4', 'i-check'); res(); }
    }, 70);
  });

  /* ========== FOUNDATIONS ========== */
  function hexRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255); }
  function lum(h) { return hexRgb(h).map(c => (c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4))).reduce((a, c, i) => a + c * [.2126, .7152, .0722][i], 0); }
  function contrast(a, b) { const A = lum(a), B = lum(b); return (Math.max(A, B) + .05) / (Math.min(A, B) + .05); }
  function passTag(r) { return r >= 4.5 ? `<span class="pass ok">AA ${r.toFixed(2)}</span>` : r >= 3 ? `<span class="pass lg">AA Large ${r.toFixed(2)}</span>` : `<span class="pass">${r.toFixed(2)}</span>`; }
  const COLORS = [
    ['--paper', 'נייר', 'Paper', '#F6F4EF', 'רקע ראשי', 'Main background'],
    ['--ink', 'דיו', 'Ink', '#111110', 'טקסט וכפתור ראשי', 'Text and primary button'],
    ['--ink-2', 'טקסט משני', 'Secondary', '#6B6A65', 'טקסט משני על נייר', 'Secondary text on paper'],
    ['--chart', 'שרטרז', 'Chartreuse', '#D5FF5F', 'מבטא המותג, ראש הקריאה', 'Brand accent, playhead'],
    ['--lav', 'לבנדר', 'Lavender', '#CFC2FF', 'אריח אייקון', 'Icon tile'],
    ['--peach', 'אפרסק', 'Peach', '#FFC49B', 'אריח אייקון', 'Icon tile'],
    ['--sky', 'שמיים', 'Sky', '#B9DCFF', 'אריח אייקון', 'Icon tile'],
    ['--graphite', 'גרפיט', 'Graphite', '#171715', 'רקע במצב כהה', 'Dark theme background']
  ];
  $('#swatches').innerHTML = COLORS.map(([k, he, en, hex, uhe, uen]) => `
    <div class="sw glass"><div class="chipc" style="background:${hex}"></div>
      <div class="nm"><b>${L(he, en)}</b><span class="mono muted">${hex}</span></div>
      <div class="rows"><div><span class="mono">${k}</span></div><div>${L(uhe, uen)}</div>
        <div><span>${L('מול דיו', 'on Ink')}</span>${passTag(contrast(hex, '#111110'))}</div>
        <div><span>${L('מול נייר', 'on Paper')}</span>${passTag(contrast(hex, '#F6F4EF'))}</div></div></div>`).join('') +
    `<div class="sw glass"><div class="chipc" style="background:var(--paper);box-shadow:inset 0 0 0 1px rgba(17,17,16,.08)"><div style="position:absolute;inset:45% 0 auto;height:1px;background:rgba(17,17,16,.08)"></div></div>
      <div class="nm"><b>${L('קו שיער', 'Hairline')}</b><span class="mono muted">8%</span></div>
      <div class="rows"><div><span class="mono">--hair</span></div><div>rgba(17,17,16,.08)</div><div>${L('דקורטיבי, לא נושא מידע', 'Decorative, carries no meaning')}</div></div></div>`;

  const TYPE = [
    ['Display L', '88 / 92 · serif', 's-d1', 'Only your story.', 'רק הסיפור שלך.'],
    ['Display M', '72 / 76 · serif', 's-d2', 'Now in motion.', 'עכשיו בתנועה.'],
    ['Headline', '40 / 44 · serif', 's-h', 'Words in motion', 'מילים בתנועה'],
    ['Title', '22 / 28 · 500', 's-t', 'Logo in, palette out', 'לוגו נכנס, פלטה יוצאת'],
    ['Body', '17 / 27 · 400', 's-b', 'Turn one sentence and your logo into a studio-grade motion video.', 'שורה אחת והלוגו שלכם הופכים לסרטון תנועה ברמת סטודיו.'],
    ['Label', '14 / 20 · 500', 's-l', 'Download MP4', 'הורדת MP4'],
    ['Caption', '12 / 17 · 400', 's-c', 'Rendering runs on your device.', 'הרינדור רץ במכשיר שלכם.'],
    ['Mono', '12 / 18 · Code', 's-m', '00:03:12 · 1080×1920 · 30fps', '00:03:12 · 1080×1920 · 30fps']
  ];
  $('#typeScale').innerHTML = TYPE.map(([n, spec, cls, en, he]) => `<div class="type-row"><div class="k"><span class="label">${n}</span><span class="mono muted">${spec}</span></div><div class="${cls} en-s" lang="en">${en}</div><div class="${cls} he-s" lang="he">${he}</div></div>`).join('');

  $('#spacing').innerHTML = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96].map(v => `<div class="space-row"><span class="mono">${v}px · ${v / 4}u</span><i style="width:${Math.min(100, v / 96 * 100)}%"></i></div>`).join('');

  (function motion() {
    const supportsLinear = window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)');
    const el = [];
    for (let i = 0; i <= 40; i++) el.push(Eng.E.elastic(i / 40).toFixed(3));
    const elastic = supportsLinear ? `linear(${el.join(', ')})` : 'cubic-bezier(.5, 1.8, .4, .8)';
    const bez = (p1x, p1y, p2x, p2y) => { let d = ''; for (let i = 0; i <= 40; i++) { const s = i / 40, u = 1 - s; const x = 3 * u * u * s * p1x + 3 * u * s * s * p2x + s * s * s; const y = 3 * u * u * s * p1y + 3 * u * s * s * p2y + s * s * s; d += (i ? 'L' : 'M') + (x * 100).toFixed(2) + ' ' + (100 - y * 100).toFixed(2); } return d; };
    let ed = ''; for (let i = 0; i <= 80; i++) { const x = i / 80; ed += (i ? 'L' : 'M') + (x * 100).toFixed(2) + ' ' + (100 - Eng.E.elastic(x) * 100).toFixed(2); }
    const M = [
      ['ease-out', 'cubic-bezier(.22, 1, .36, 1)', bez(.22, 1, .36, 1), 'var(--e-out)', 'ממשק, מעברי עמוד, ריחוף. 300–600ms.', 'Interface, page wipes, hover. 300–600ms.'],
      ['ease-back', 'cubic-bezier(.34, 1.56, .64, 1)', bez(.34, 1.56, .64, 1), 'var(--e-back)', 'רק בתוך הסרטון: מחיר שקופץ, מדבקה.', 'Inside the video only: a price pop, a sticker.'],
      ['ease-elastic', supportsLinear ? 'linear(…41 stops)' : 'fallback bezier', ed, elastic, 'רק בתוך הסרטון, ובמשורה.', 'Inside the video only, and sparingly.']
    ];
    $('#motionGrid').innerHTML = M.map(([n, v, d, ease, he, en]) => `<div class="mcard glass"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><span class="label">${n}</span><span class="mono muted">${v}</span></div>
      <svg class="curve" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="g" d="M0 100 L100 100 M0 0 L100 0"/><path class="c" d="${d}"/></svg>
      <div class="mtrack" style="--ease:${ease}"><span class="mdot"></span></div><p class="caption" style="margin:0">${L(he, en)}</p></div>`).join('');
    let on = false, timer;
    const flip = () => { on = !on; $$('#motionGrid .mtrack').forEach(t => t.classList.toggle('go', on)); };
    const loop = () => { clearInterval(timer); if (Eng.reduce.matches) return; timer = setInterval(flip, 1900); };
    $('#replayMotion').addEventListener('click', () => { $$('#motionGrid .mtrack').forEach(t => { t.classList.remove('go'); }); on = false; setTimeout(flip, 60); loop(); });
    routeHooks.foundations = () => { setTimeout(flip, 300); loop(); };
  })();

  /* ========== COMPONENTS ========== */
  const STATES = [['default', 'ברירת מחדל', 'Default'], ['hover', 'ריחוף', 'Hover'], ['focus', 'פוקוס', 'Focus'], ['selected', 'נבחר', 'Selected'], ['disabled', 'מושבת', 'Disabled'], ['loading', 'טעינה', 'Loading']];
  const sc = s => ({ hover: 'is-hover', focus: 'is-focus', selected: 'is-selected', loading: 'is-loading' }[s] || '');
  const dis = s => (s === 'disabled' ? 'disabled' : '');
  const stateGrid = (render, list = STATES, cols = '') => `<div class="states ${cols}">${list.map(([s, he, en]) => `<div class="state">${render(s)}<span class="mono">${L(he, en)}</span></div>`).join('')}</div>`;
  const block = (id, he, en, dhe, den, body) => `<section class="block" id="${id}"><div class="bh"><h2 class="headline">${L(he, en)}</h2><p>${L(dhe, den)}</p></div><div class="bb">${body}</div></section>`;
  const spec = (inner, lbl) => `<div class="spec glass">${lbl ? `<span class="spec-label">${lbl}</span>` : ''}${inner}</div>`;

  const GOALS = [['i-rocket', 't-chart', 'השקה', 'Launch', 'מוצר או שירות חדש', 'A new product or service'], ['i-percent', 't-peach', 'מבצע', 'Sale', 'מחיר, הנחה, דדליין', 'Price, discount, deadline'], ['i-eye', 't-lav', 'חשיפת מותג', 'Brand reveal', 'הלוגו במרכז', 'Your logo, center stage'], ['i-gift', 't-sky', 'הזמנה', 'Invitation', 'אירוע, תאריך, מקום', 'Event, date, place'], ['i-quote', 't-lav', 'המלצת לקוח', 'Testimonial', 'ציטוט ושם', 'A quote and a name'], ['i-list', 't-chart', 'תפריט או מחירון', 'Menu or price list', 'פריטים ברצף', 'Items in sequence'], ['i-mega', 't-peach', 'הכרזה', 'Announcement', 'מסר אחד ברור', 'One clear message'], ['i-heart', 't-sky', 'תודה', 'Thank you', 'סוף שנה, אבן דרך', 'Year end, a milestone']];
  const goalBtn = ([icn, tile, he, en, she, sen], extra = '', pressed = false, disabled = false) => `<button class="goal ${extra}" type="button" aria-pressed="${pressed}" ${disabled ? 'disabled' : ''}><span class="tile ${tile}">${ic(icn)}</span><span class="t">${L(he, en)}</span><span class="s">${L(she, sen)}</span></button>`;
  const SWATCHES = [['#111110', 'דיו', 'Ink'], ['#D5FF5F', 'שרטרז', 'Chartreuse'], ['#CFC2FF', 'לבנדר', 'Lavender'], ['#FFC49B', 'אפרסק', 'Peach'], ['#B9DCFF', 'שמיים', 'Sky'], ['#F6F4EF', 'נייר', 'Paper']];

  const C = [];
  C.push(block('c-buttons', 'כפתורים', 'Buttons', 'גלולה שחורה לפעולה הראשית, גלולה לבנה עם אייקון הפעלה עגול לפעולה משנית, וכפתור אייקון של 44px. בטעינה, ראש הקריאה עובר לאורך הכפתור.', 'A black pill for the main action, a white pill with a round play icon for the secondary one, and a 44px icon button. While loading, the playhead sweeps across the pill.',
    spec(stateGrid(s => `<button class="btn btn-primary sm ${sc(s)}" type="button" ${dis(s)} tabindex="-1">${L('להתחיל', 'Start')}${ic('i-arrow', 'sm flip')}</button>`), L('ראשי', 'Primary')) +
    spec(stateGrid(s => `<button class="btn btn-secondary sm ${sc(s)}" type="button" ${dis(s)} tabindex="-1"><span class="play">${ic('i-play', 'fill')}</span>${L('לצפייה', 'Watch')}</button>`), L('משני', 'Secondary')) +
    spec(stateGrid(s => `<button class="btn btn-icon ${sc(s)}" type="button" ${dis(s)} ${s === 'selected' ? 'aria-pressed="true"' : ''} tabindex="-1" aria-label="Copy">${ic('i-copy')}</button>`), L('אייקון', 'Icon')) +
    spec(`<div class="spec-row"><button class="btn btn-primary" type="button" id="cLoadDemo">${L('לנסות טעינה', 'Try loading')}${ic('i-arrow', 'flip')}</button><button class="btn btn-secondary" type="button"><span class="play">${ic('i-play', 'fill')}</span>${L('לראות את זה זז', 'Watch it move')}</button><button class="btn btn-icon" type="button" aria-pressed="false" id="cPress" data-label-he="סימון" data-label-en="Toggle">${ic('i-spark')}</button></div>`, L('חי', 'Live'))));

  C.push(block('c-nav', 'ניווט קפסולה', 'Capsule navigation', 'קישורים במרכז, בתוך קפסולה דקה אחת. הקישור הפעיל מקבל מילוי רך.', 'Centered links inside one thin capsule. The active link gets a soft fill.',
    spec(`<div style="display:grid;gap:18px;justify-items:center"><div class="capsule"><a href="#components" class="is-active" onclick="return false">${L('בית', 'Home')}</a><a href="#components" class="is-hover" onclick="return false">${L('יסודות', 'Foundations')}</a><a href="#components" class="is-focus" onclick="return false">${L('רכיבים', 'Components')}</a><a href="#components" class="is-disabled" onclick="return false" aria-disabled="true">${L('סטודיו', 'Studio')}</a></div>
      <div class="states c4" style="width:100%;max-width:560px">${[['פעיל', 'Active'], ['ריחוף', 'Hover'], ['פוקוס', 'Focus'], ['מושבת', 'Disabled']].map(([h, e]) => `<span class="mono muted" style="text-align:center">${L(h, e)}</span>`).join('')}</div></div>`)));

  C.push(block('c-glass', 'כרטיס זכוכית ואריח אייקון', 'Glass card & icon tile', 'כרטיס נבחר מקבל קו שיער אלכסוני: החיתוך של הלוגו. צבע מופיע רק באריח של 40px, תמיד עם אייקון כהה.', 'A selected card gets a hairline diagonal slice: the cut from the logo. Color appears only in the 40px tile, always with a dark icon.',
    spec(stateGrid(s => `<div class="card glass ${s === 'hover' ? 'is-hover' : s === 'selected' ? 'is-selected' : s === 'disabled' ? 'is-disabled' : ''}" style="width:100%;display:grid;gap:10px;padding:16px;text-align:start"><span class="tile t-chart">${ic('i-rise')}</span><span class="label">${L('עלייה רכה', 'Soft rise')}</span><span class="caption">00:05</span></div>`, [STATES[0], STATES[1], STATES[3], STATES[4]], 'c4')) +
    spec(`<div class="spec-row">${['t-chart', 't-lav', 't-peach', 't-sky'].map((t, i) => `<span class="tile ${t}">${ic(['i-wave', 'i-palette', 'i-tag', 'i-film'][i])}</span>`).join('')}<span style="width:24px"></span><span class="tile sm t-chart">${ic('i-spark')}</span><span class="tile t-chart">${ic('i-spark')}</span><span class="tile lg t-chart">${ic('i-spark')}</span></div>`, '40 · r12 / 28 · 56')));

  C.push(block('c-composer', 'שדה כתיבה', 'Composer', '"What are you making?" עם הצעות מוכנות. לחיצה על הצעה ממלאת את השדה.', '"What are you making?" with ready suggestions. Tapping a chip fills the field.',
    spec(`<form class="composer" id="cComposer" style="max-width:620px"><input type="text" id="cComposerIn" data-ph-he="מה אתם יוצרים?" data-ph-en="What are you making?" aria-label="What are you making?"><button class="btn btn-primary" type="submit" style="width:44px;padding:0" data-label-he="יצירה" data-label-en="Create">${ic('i-arrow', 'flip')}</button></form>
      <div class="chips" id="cChips">${[['השקת מוצר', 'Product launch'], ['מבצע סוף שבוע', 'Weekend sale'], ['הזמנה לאירוע', 'Event invite'], ['תודה ללקוחות', 'Thank-you note']].map(([h, e]) => `<button class="chip" type="button" data-he="${h}" data-en="${e}"><span class="tile t-chart">${ic('i-spark')}</span>${L(h, e)}</button>`).join('')}</div>`, L('חי', 'Live')) +
    spec(stateGrid(s => `<div class="composer ${s === 'hover' ? 'is-hover' : s === 'focus' ? 'is-focus' : s === 'disabled' ? 'is-disabled' : s === 'loading' ? 'is-loading' : ''}" style="padding:4px;padding-inline-start:14px"><span style="flex:1;font-size:13px;${s === 'selected' ? '' : 'color:var(--ink-2)'}">${s === 'selected' ? L('השקה ביום חמישי', 'Launch on Thursday') : L('מה אתם יוצרים?', 'What are you making?')}</span></div>`, [STATES[0], STATES[1], STATES[2], ['selected', 'מלא', 'Filled'], STATES[4], STATES[5]]))));

  C.push(block('c-goals', 'כרטיס מטרה', 'Goal card', 'שמונה מטרות במצב פשוט. בוחרים אחת, ומקבלים שלוש הצעות מוכנות במותג שלכם.', 'Eight goals in Simple mode. Pick one and get three ready suggestions in your brand.',
    spec(`<div class="goals" id="cGoals">${GOALS.map((g, i) => goalBtn(g, 'cutsel', i === 0)).join('')}</div>`, L('חי · בחירה אחת', 'Live · single choice')) +
    spec(stateGrid(s => goalBtn(GOALS[s === 'hover' ? 1 : 2], (s === 'hover' ? 'is-hover' : s === 'focus' ? 'is-focus' : '') + ' cutsel', s === 'selected', s === 'disabled').replace('class="goal', 'style="width:100%" tabindex="-1" class="goal'), [STATES[0], STATES[1], STATES[2], STATES[3], STATES[4]], 'c3'))));

  C.push(block('c-template', 'כרטיס תבנית', 'Template card', 'תצוגה חיה שזזה בלולאה. בתצוגה של "פחות תנועה" נעצרת על הפריים המייצג.', 'A live preview looping in place. With reduced motion it rests on its key frame.',
    spec(`<div class="states c3">${[['default', 'ברירת מחדל', 'Default', 'softRise'], ['hover', 'ריחוף', 'Hover', 'pricePop'], ['selected', 'נבחר', 'Selected', 'beatSlam']].map(([s, h, e, k]) => `<div class="state" style="justify-items:stretch">${tcard(k, s === 'hover' ? 'is-hover' : s === 'selected' ? 'is-selected' : '', 'div')}<span class="mono" style="text-align:center">${L(h, e)}</span></div>`).join('')}</div>`)));

  C.push(block('c-swatch', 'דוגמית צבע', 'Color swatch', 'לכל צבע יש שם, לא רק קוד. הנבחר מקבל טבעת ואת קו החיתוך.', 'Every color has a name, not just a code. The selected one gets a ring and the cut line.',
    spec(`<div class="spec-row" id="cSwatches" role="group">${SWATCHES.map(([h, he, en], i) => `<button class="cswatch" type="button" aria-pressed="${i === 1}"><span class="dot" style="background:${h}"></span><span class="n">${L(he, en)}</span><span class="h">${h}</span></button>`).join('')}</div>`, L('חי', 'Live'))));

  C.push(block('c-drop', 'אזור גרירת לוגו', 'Logo dropzone', 'גוררים SVG או PNG. הלוגו מוצג על רקע בהיר וכהה, והפלטה נשלפת ממנו.', 'Drop an SVG or PNG. The logo shows on light and dark, and the palette is pulled from it.',
    spec(`<label class="drop" id="cDrop"><input type="file" accept="image/*" id="cDropIn"><span class="tile t-lav">${ic('i-upload')}</span><span class="t">${L('גררו לוגו לכאן', 'Drop your logo here')}</span><span class="s">${L('או לחצו לבחירת קובץ · SVG, PNG', 'or click to choose · SVG, PNG')}</span></label>`, L('חי', 'Live')) +
    spec(stateGrid(s => {
      if (s === 'selected') return `<div class="drop filled" style="min-height:130px;width:100%"><svg width="48" height="48" style="fill:var(--ink)" aria-hidden="true"><use href="#os-sym"/></svg><span class="s">logo.svg</span></div>`;
      return `<div class="drop ${s === 'hover' ? 'is-hover' : s === 'disabled' ? 'is-disabled' : s === 'loading' ? 'is-loading' : ''}" style="min-height:130px;width:100%;${s === 'focus' ? 'outline:2px solid var(--ink);outline-offset:3px' : ''}"><span class="tile sm t-lav">${ic('i-upload')}</span><span class="s">${s === 'hover' ? L('שחררו כאן', 'Release to add') : s === 'loading' ? L('קורא את הצבעים…', 'Reading colors…') : L('גררו לוגו', 'Drop a logo')}</span>${s === 'loading' ? '<span class="track" style="position:absolute;left:10%;right:10%;bottom:14px;height:6px;--p:60%"><span class="ph" style="top:0;bottom:0"></span></span>' : ''}</div>`;
    }, [STATES[0], ['hover', 'גרירה מעל', 'Drag over'], STATES[2], ['selected', 'מלא', 'Filled'], STATES[4], STATES[5]]))));

  C.push(block('c-controls', 'מתגים ובקרים', 'Segmented, toggle, slider', 'מנוע אחד, שני מצבים: פשוט ו־Pro. המתג הפעיל מתמלא בדיו עם ידית בשרטרז.', 'One engine, two modes: Simple and Pro. An active switch fills with ink and a chartreuse knob.',
    spec(`<div style="display:grid;gap:22px">
      <div class="spec-row"><div class="seg" role="group" aria-label="Simple / Pro" id="cSeg"><button type="button" aria-pressed="true">${L('פשוט', 'Simple')}</button><button type="button" aria-pressed="false">Pro</button></div>
        <div class="seg is-disabled" aria-disabled="true"><button type="button" tabindex="-1" aria-pressed="true">${L('פשוט', 'Simple')}</button><button type="button" tabindex="-1" aria-pressed="false">Pro</button></div><span class="mono muted">${L('חי · מושבת', 'Live · disabled')}</span></div>
      <div class="spec-row"><span class="switch-wrap"><button class="switch" role="switch" aria-checked="true" id="cSw1" aria-label="Beat sync"></button><span class="label">${L('פועל', 'On')}</span></span><span class="switch-wrap"><button class="switch" role="switch" aria-checked="false" id="cSw2" aria-label="Safe area"></button><span class="label">${L('כבוי', 'Off')}</span></span><span class="switch-wrap"><button class="switch" role="switch" aria-checked="true" disabled aria-label="Disabled"></button><span class="label muted">${L('מושבת', 'Disabled')}</span></span></div>
      <div class="field" style="max-width:420px"><label for="cSlider"><span>${L('משך', 'Duration')}</span><span class="mono" id="cSliderVal">00:05</span></label><input class="slider" type="range" id="cSlider" min="2" max="15" value="5"></div>
      <div class="field" style="max-width:420px"><label for="cSlider2" class="muted"><span>${L('מושבת', 'Disabled')}</span></label><input class="slider" type="range" id="cSlider2" disabled value="30"></div></div>`)));

  C.push(block('c-canvas', 'מסגרת קנבס', 'Canvas frame', 'שלושה יחסים: 9:16, 1:1 ו־16:9. הקנבס הנבחר מקבל סימני חיתוך קטנים בפינות.', 'Three ratios: 9:16, 1:1 and 16:9. The selected canvas gets small crop-mark corners.',
    spec(`<div class="frames" id="cFrames" role="group">${[['9:16', 108, 192], ['1:1', 170, 170], ['16:9', 260, 146]].map(([r, w, h], i) => `<button class="frame" type="button" aria-pressed="${i === 0}"><span class="cv" style="width:${w}px;height:${h}px;max-width:100%"><canvas data-live="softRise" aria-hidden="true"></canvas></span><span class="mono">${r}</span></button>`).join('')}</div>`, L('חי · לחצו לבחירה', 'Live · click to select'))));

  C.push(block('c-export', 'פאנל ייצוא', 'Export panel', 'ראש הקריאה בשרטרז הוא מד ההתקדמות. כאן זו הדגמה; בסטודיו הייצוא אמיתי.', 'The chartreuse playhead is the progress bar. This one is a demo; in the studio the export is real.',
    `<div class="states c3" style="align-items:stretch"><div class="export glass" id="cExport" style="grid-column:span 2"></div>
      <div class="spec glass" style="align-content:start"><span class="spec-label">${L('ראש קריאה', 'Playhead')}</span>${[0, 35, 72, 100].map(p => `<div class="track" style="--p:${p}%"><div class="fill"></div><div class="ticks"></div><div class="ph"></div></div>`).join('')}<span class="mono muted">0 · 35 · 72 · 100%</span></div></div>`));

  C.push(block('c-copy', 'העתקה ל־Claude Code', 'Copy for Claude Code', 'כפתור שמעתיק טקסט ללוח. אחרי ההעתקה הוא הופך לשרטרז ואומר "הועתק" למשך שתי שניות.', 'A button that copies text to the clipboard. After copying it turns chartreuse and says "Copied" for two seconds.',
    `<div class="brief glass" id="cBrief"></div>`));

  C.push(block('c-feedback', 'משוב ושכבות', 'Toast, dialog, sheet', 'הודעה קצרה בתחתית, דיאלוג לאישור, ומגירה תחתונה לטלפון. כולם מזכוכית ברמה 3.', 'A short toast at the bottom, a dialog to confirm, and a bottom sheet for phones. All in level-3 glass.',
    spec(`<div class="spec-row"><button class="btn btn-secondary plain sm" type="button" id="cToast">${ic('i-check')}${L('להציג הודעה', 'Show toast')}</button><button class="btn btn-secondary plain sm" type="button" id="cDlg">${ic('i-layers')}${L('לפתוח דיאלוג', 'Open dialog')}</button><button class="btn btn-secondary plain sm" type="button" id="cSheet">${ic('i-grid')}${L('לפתוח מגירה', 'Open bottom sheet')}</button></div>
      <div class="toast glass l3 static" style="justify-self:start"><span class="tile t-chart">${ic('i-check')}</span><span>${L('הבריף הועתק. אפשר להדביק אותו.', 'Brief copied. Ready to paste.')}</span></div>`)));

  C.push(block('c-orn', 'קישוטים', 'Ornaments', 'כוכב נוצץ דק בארבעה קצוות, ותג טקסט עגול שמסתובב לאט סביב הסמל. במשורה.', 'A thin four-point sparkle, and a circular text badge turning slowly around the symbol. Sparingly.',
    spec(`<div class="spec-row" style="gap:40px"><div class="badge-rot" style="position:relative;inset:auto;top:auto"><svg class="ring-text" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="badgeCircle2" d="M60 60m-47 0a47 47 0 1 1 94 0a47 47 0 1 1-94 0"/></defs><text><textPath href="#badgeCircle2">• WORDS IN MOTION • IN EVERY SCRIPT </textPath></text></svg><svg class="sym" aria-hidden="true"><use href="#os-sym"/></svg></div>
      <svg class="ic" style="width:40px;height:40px;stroke-width:1" aria-hidden="true"><use href="#i-spark"/></svg><svg class="ic" style="width:24px;height:24px;stroke-width:1.2" aria-hidden="true"><use href="#i-spark"/></svg><svg class="ic" style="width:14px;height:14px" aria-hidden="true"><use href="#i-spark"/></svg></div>`)));

  $('#compList').innerHTML = C.join('');
  mountLive($('#compList'));

  // live wiring for component specimens
  $('#cLoadDemo').addEventListener('click', e => { const b = e.currentTarget; b.classList.add('is-loading'); setTimeout(() => b.classList.remove('is-loading'), 2200); });
  $('#cPress').addEventListener('click', e => { const b = e.currentTarget; b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); });
  $('#cComposer').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#cComposerIn').value.trim();
    if (!v) { toast('כתבו שורה אחת קודם.', 'Write one line first.', 'i-type', 't-peach'); $('#cComposerIn').focus(); return; }
    const f = e.currentTarget; f.classList.add('is-loading');
    setTimeout(() => { f.classList.remove('is-loading'); Studio.setText(v, ''); location.hash = '#studio'; }, 900);
  });
  $('#cChips').addEventListener('click', e => { const c = e.target.closest('.chip'); if (!c) return; $('#cComposerIn').value = c.dataset[lang()]; $('#cComposerIn').focus(); });
  const single = (wrap, sel) => wrap.addEventListener('click', e => { const b = e.target.closest(sel); if (!b || b.disabled) return; $$(sel, wrap).forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
  single($('#cGoals'), '.goal'); single($('#cSwatches'), '.cswatch'); single($('#cSeg'), 'button'); single($('#cFrames'), '.frame');
  $$('#cSw1, #cSw2').forEach(s => s.addEventListener('click', () => s.setAttribute('aria-checked', String(s.getAttribute('aria-checked') !== 'true'))));
  const sliderFill = s => s.style.setProperty('--p', ((s.value - s.min) / (s.max - s.min) * 100) + '%');
  $$('.slider').forEach(s => { sliderFill(s); s.addEventListener('input', () => sliderFill(s)); });
  $('#cSlider').addEventListener('input', e => ($('#cSliderVal').textContent = '00:' + String(e.target.value).padStart(2, '0')));
  dropzone($('#cDrop'), $('#cDropIn'), img => Studio.setLogo(img));
  exportPanel($('#cExport'), simulate);
  $('#cToast').addEventListener('click', () => toast('נשמר במכשיר.', 'Saved on this device.'));
  const dlg = $('#dlg');
  $('#cDlg').addEventListener('click', () => { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); });
  $$('[data-close-dlg]').forEach(b => b.addEventListener('click', () => dlg.close ? dlg.close() : dlg.removeAttribute('open')));
  const sheet = $('#sheet'), scrim = $('#scrim');
  let sheetReturn = null;
  const openSheet = () => { sheetReturn = document.activeElement; sheet.classList.add('on'); scrim.classList.add('on'); setTimeout(() => $('.goal', sheet).focus(), 60); };
  const closeSheet = () => { sheet.classList.remove('on'); scrim.classList.remove('on'); if (sheetReturn) sheetReturn.focus(); };
  $('#cSheet').addEventListener('click', openSheet);
  scrim.addEventListener('click', closeSheet);
  $('[data-close-sheet]').addEventListener('click', closeSheet);
  single(sheet, '.goal');
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('on')) closeSheet(); });

  /* ---------- dropzone & palette extraction ---------- */
  function dropzone(label, input, onImg) {
    ['dragenter', 'dragover'].forEach(ev => label.addEventListener(ev, e => { e.preventDefault(); label.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => label.addEventListener(ev, () => label.classList.remove('drag')));
    label.addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) read(f); });
    input.addEventListener('change', () => { const f = input.files[0]; if (f) read(f); });
    function read(f) {
      if (!/^image\//.test(f.type)) { toast('זה לא קובץ תמונה. נסו SVG או PNG.', 'That is not an image. Try an SVG or PNG.', 'i-x', 't-peach'); return; }
      if (f.size > 5 * 1024 * 1024) { toast('הקובץ גדול מ־5MB. נסו קובץ קטן יותר.', 'The file is over 5MB. Try a smaller one.', 'i-x', 't-peach'); return; }
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          label.classList.add('filled');
          $$('.tile, .t, .s, img', label).forEach(n => n.remove());
          const pv = document.createElement('img'); pv.src = r.result; pv.alt = f.name; label.appendChild(pv);
          const s = document.createElement('span'); s.className = 's'; s.textContent = f.name; label.appendChild(s);
          onImg(img);
        };
        img.src = r.result;
      };
      r.readAsDataURL(f);
    }
  }
  function extractPalette(img) {
    const c = document.createElement('canvas'); c.width = c.height = 48;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, 48, 48);
    let d; try { d = x.getImageData(0, 0, 48, 48).data; } catch (e) { return null; }
    const buckets = {};
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue;
      const k = [d[i] >> 4, d[i + 1] >> 4, d[i + 2] >> 4].join(',');
      buckets[k] = (buckets[k] || 0) + 1;
    }
    const cols = Object.entries(buckets).sort((a, b) => b[1] - a[1]).map(([k]) => k.split(',').map(v => v * 16 + 8));
    if (!cols.length) return null;
    const hex = c3 => '#' + c3.map(v => Math.min(255, v).toString(16).padStart(2, '0')).join('').toUpperCase();
    const L3 = c3 => lum(hex(c3));
    const sat = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b);
    const dark = cols.slice().sort((a, b) => L3(a) - L3(b))[0];
    const vivid = cols.slice().sort((a, b) => sat(b) - sat(a))[0];
    let ink = hex(dark);
    if (lum(ink) > .2) ink = '#111110';
    let accent = sat(vivid) > 40 ? hex(vivid) : '#D5FF5F';
    if (contrast(accent, ink) < 3) accent = '#D5FF5F';
    return { ink, accent, paper: '#F6F4EF' };
  }

  /* ========== STUDIO ========== */
  const Studio = (function () {
    const PALS = [
      { id: 'ink', he: 'דיו ושרטרז', en: 'Ink & Chartreuse', ink: '#111110', accent: '#D5FF5F', paper: '#F6F4EF' },
      { id: 'lav', he: 'לילה לבנדר', en: 'Lavender night', ink: '#1D1A2B', accent: '#CFC2FF', paper: '#F4F1FF' },
      { id: 'peach', he: 'נייר אפרסק', en: 'Peach paper', ink: '#2A1A10', accent: '#FFC49B', paper: '#FFF6EE' },
      { id: 'sky', he: 'סטודיו שמיים', en: 'Sky studio', ink: '#0F1C2B', accent: '#B9DCFF', paper: '#F2F8FF' }
    ];
    const SCN = [['softRise', 'פתיחה', 'Hook'], ['beatSlam', 'מסר', 'Message'], ['pricePop', 'הצעה', 'Offer'], ['endCard', 'סיום', 'End card']];
    const S = {
      l1: '', l2: '', price: '', edited: false, format: '9:16', mode: 'simple', style: 'Headline & Sub',
      pal: Object.assign({}, PALS[0]), logoImg: null, playing: !Eng.reduce.matches, speed: 1,
      scenes: SCN.map(([tpl, he, en]) => ({ tpl, he, en })), sel: 0
    };
    const hist = [];
    const snap = () => { hist.push(JSON.stringify({ l1: S.l1, l2: S.l2, price: S.price, format: S.format, pal: S.pal, scenes: S.scenes, sel: S.sel })); if (hist.length > 50) hist.shift(); };
    const defaults = () => { if (!S.edited) { const s = SAMPLE.hero[lang()]; S.l1 = s[0]; S.l2 = s[1]; S.price = lang() === 'he' ? '₪49' : '$49'; } };
    defaults();
    const tpl = () => S.scenes[S.sel].tpl;
    const opts = () => ({ l1: S.l1, l2: S.l2, price: S.price, rtl: isRTLText(S.l1 + S.l2) || (!S.l1 && lang() === 'he'), ink: S.pal.ink, accent: S.pal.accent, paper: S.pal.paper, logoImg: S.logoImg });
    const state = () => ({ l1: S.l1, l2: S.l2, tpl: tpl(), format: S.format, pal: S.pal, mode: S.mode, style: S.style });

    const cv = $('#stCanvas');
    const it = Eng.mount(cv, {
      tpl, opts, speed: () => S.speed, respectReduce: false,
      onTime: (t, D) => {
        $('#scrub').style.setProperty('--p', (t / D * 100).toFixed(2) + '%');
        $('#scrub').setAttribute('aria-valuenow', Math.round(t / D * 100));
        const f = Math.floor((t % 1) * 30);
        $('#tc').textContent = `00:${String(Math.floor(t)).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
      }
    });
    it.paused = !S.playing;
    const mm = Eng.mount($('#mmCanvas'), { tpl: () => 'softRise', opts });

    function sizeCanvas() {
      const wrap = $('#canvasWrap'), box = $('#canvasBox');
      if (!wrap.clientWidth) return;
      const avail = wrap.clientWidth - 48, maxH = window.innerWidth < 820 ? Math.min(560, window.innerHeight * .62) : 540;
      const [w, h] = FORMATS[S.format];
      let bh = maxH, bw = bh * w / h;
      if (bw > avail) { bw = avail; bh = bw * h / w; }
      box.style.width = Math.round(bw) + 'px'; box.style.height = Math.round(bh) + 'px';
      $('#stMeta').textContent = `${S.format} · ${w}×${h} · 30fps`;
      Eng.invalidate();
    }
    window.addEventListener('resize', sizeCanvas);

    function renderScenes() {
      const strip = $('#sceneStrip');
      $$('canvas', strip).forEach(c => c.__os && Eng.unmount(c.__os));
      strip.innerHTML = S.scenes.map((s, i) => `<button class="scn card glass" type="button" aria-pressed="${i === S.sel}" data-i="${i}"><canvas aria-hidden="true"></canvas><span class="lbl"><span>${L(s.he, s.en)}</span><span class="mono muted">${String(i + 1).padStart(2, '0')}</span></span></button>`).join('') +
        `<button class="scn add" type="button" id="addScene" aria-label="Add scene">${ic('i-plus')}</button>`;
      $$('.scn[data-i]', strip).forEach(b => {
        const i = +b.dataset.i;
        const item = Eng.mount($('canvas', b), { tpl: () => S.scenes[i] && S.scenes[i].tpl, opts, still: () => true });
        item.fixedT = Eng.T[S.scenes[i].tpl].hold;
      });
    }
    $('#sceneStrip').addEventListener('click', e => {
      if (e.target.closest('#addScene')) {
        snap();
        const keys = Object.keys(TPL_META).filter(k => k !== 'reel');
        const k = keys[S.scenes.length % keys.length];
        S.scenes.push({ tpl: k, he: 'סצנה ' + (S.scenes.length + 1), en: 'Scene ' + (S.scenes.length + 1) });
        S.sel = S.scenes.length - 1; renderScenes(); syncTpl(); refreshAll(); return;
      }
      const b = e.target.closest('.scn[data-i]'); if (!b) return;
      S.sel = +b.dataset.i; it.t = 0;
      $$('.scn[data-i]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      syncTpl(); refreshAll();
    });

    // tabs
    $('#ptabs').addEventListener('click', e => {
      const b = e.target.closest('[data-tab]'); if (!b) return;
      $$('#ptabs [data-tab]').forEach(x => { x.setAttribute('aria-selected', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
      $$('.pbody[data-pane]').forEach(p => (p.hidden = p.dataset.pane !== b.dataset.tab));
      if (b.dataset.tab === 'tpl') Eng.invalidate();
    });
    $('#ptabs').addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const tabs = $$('#ptabs [data-tab]'), i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      const step = (e.key === 'ArrowRight') === (root.dir === 'ltr') ? 1 : -1;
      const n = tabs[(i + step + tabs.length) % tabs.length]; n.click(); n.focus();
    });

    // text
    const l1 = $('#stL1'), l2 = $('#stL2'), pr = $('#stPrice');
    function syncInputs() { l1.value = S.l1; l2.value = S.l2; pr.value = S.price; meter(); }
    function meter() {
      $('#cnt1').textContent = `${S.l1.length}/48`; $('#cnt2').textContent = `${S.l2.length}/48`;
      const words = (S.l1 + ' ' + S.l2).split(/\s+/).filter(Boolean).length;
      const need = 1.2 + .3 * words, have = Eng.T[tpl()].D * .6 / S.speed;
      $('#readMeter').innerHTML = need <= have
        ? L(`זמן קריאה ${need.toFixed(1)} שנ׳ · על המסך ${have.toFixed(1)} שנ׳. נקרא בנוחות.`, `Reads in ${need.toFixed(1)}s · on screen ${have.toFixed(1)}s. Comfortable.`)
        : L(`זמן קריאה ${need.toFixed(1)} שנ׳, אבל על המסך רק ${have.toFixed(1)} שנ׳. כדאי לקצר או לפצל לסצנה נוספת.`, `Needs ${need.toFixed(1)}s to read but shows for ${have.toFixed(1)}s. Shorten it or split it into another scene.`);
    }
    let typingSnap = null;
    [[l1, 'l1'], [l2, 'l2'], [pr, 'price']].forEach(([inp, k]) => {
      inp.addEventListener('focus', () => (typingSnap = true));
      inp.addEventListener('input', () => { if (typingSnap) { snap(); typingSnap = false; } S[k] = inp.value; S.edited = true; meter(); refreshAll(); });
    });
    const SUG = [['השקה', 'Launch', ['השקה חדשה.', 'הכל מתחיל היום.'], ['Something new.', 'It starts today.']], ['מבצע', 'Sale', ['מבצע סוף שבוע.', 'עד יום ראשון בערב.'], ['Weekend sale.', 'Ends Sunday night.']], ['הזמנה', 'Invitation', ['הדלת פתוחה.', 'בואו לבקר.'], ['Doors are open.', 'Come say hello.']], ['תודה', 'Thank you', ['תודה שבחרתם בנו.', 'נתראה בקרוב.'], ['Thank you.', 'See you soon.']]];
    $('#stChips').innerHTML = SUG.map(([he, en], i) => `<button class="chip" type="button" data-i="${i}">${L(he, en)}</button>`).join('');
    $('#stChips').addEventListener('click', e => { const c = e.target.closest('[data-i]'); if (!c) return; const s = SUG[+c.dataset.i][lang() === 'he' ? 2 : 3]; setText(s[0], s[1]); });
    function setText(a, b) { snap(); S.l1 = a; S.l2 = b; S.edited = true; it.t = 0; syncInputs(); refreshAll(); }

    // templates
    const TK = ['softRise', 'beatSlam', 'pricePop', 'diagonalWipe', 'breathing', 'marquee', 'endCard', 'reel'];
    $('#tplGrid').innerHTML = TK.map(k => `<button class="tpl-btn" type="button" data-k="${k}" aria-pressed="false"><canvas aria-hidden="true"></canvas><span>${TPL_META[k].name}<br><span class="mono muted">${dur(k)}</span></span></button>`).join('');
    $$('#tplGrid .tpl-btn').forEach(b => Eng.mount($('canvas', b), { tpl: () => b.dataset.k, opts }));
    function syncTpl() { $$('#tplGrid .tpl-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === tpl()))); meter(); }
    $('#tplGrid').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; useTemplate(b.dataset.k); });
    function useTemplate(k) { snap(); S.scenes[S.sel].tpl = k; it.t = 0; syncTpl(); renderScenes(); refreshAll(); }

    // style
    const STY = ['Headline & Sub', 'Line by Line', 'Keyword', 'Captions', 'Marker', 'Big Number', 'Quote', 'Lower Third'];
    $('#styleChips').innerHTML = STY.map((s, i) => `<button class="chip" type="button" aria-pressed="${i === 0}">${s}</button>`).join('');
    $('#styleChips').addEventListener('click', e => { const c = e.target.closest('.chip'); if (!c) return; $$('#styleChips .chip').forEach(x => x.setAttribute('aria-pressed', String(x === c))); S.style = c.textContent; refreshAll(); });
    $('#speed').addEventListener('input', e => { S.speed = e.target.value / 100; $('#speedVal').textContent = S.speed.toFixed(1) + '×'; meter(); });
    $('#safeSw').addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-checked') !== 'true'; e.currentTarget.setAttribute('aria-checked', String(on)); $('#canvasWrap').classList.toggle('show-safe', on); });
    $('#beatSw').addEventListener('click', e => { const s = e.currentTarget; s.setAttribute('aria-checked', String(s.getAttribute('aria-checked') !== 'true')); });
    $('#bpm').addEventListener('input', e => ($('#bpmVal').textContent = e.target.value));
    $('#audioFile').addEventListener('change', e => { const f = e.target.files[0]; if (f) { $('#audioName').textContent = f.name; toast('המוזיקה נוספה. הכניסות ינחתו על הפעמות.', 'Music added. Entrances will land on the beat.', 'i-music', 't-peach'); } });

    // brand
    function renderPals() {
      $('#palettes').innerHTML = PALS.map(p => `<button class="cswatch" type="button" data-p="${p.id}" aria-pressed="${S.pal.id === p.id}"><span class="dot" style="background:conic-gradient(${p.ink} 0 50%, ${p.accent} 50% 75%, ${p.paper} 75%)"></span><span class="n">${L(p.he, p.en)}</span></button>`).join('');
    }
    renderPals();
    $('#palettes').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (!b) return; snap(); S.pal = Object.assign({}, PALS.find(p => p.id === b.dataset.p)); renderPals(); refreshAll(); });
    function setLogo(img) {
      S.logoImg = img;
      const p = extractPalette(img);
      if (p) {
        const i = PALS.findIndex(x => x.id === 'logo');
        const entry = Object.assign({ id: 'logo', he: 'מהלוגו שלכם', en: 'From your logo' }, p);
        if (i >= 0) PALS[i] = entry; else PALS.unshift(entry);
        S.pal = Object.assign({}, entry); renderPals();
      }
      toast('הלוגו נכנס. הפלטה יצאה.', 'Logo in. Palette out.', 'i-palette', 't-lav');
      refreshAll();
    }
    dropzone($('#stDrop'), $('#stFile'), setLogo);

    // mode & format
    $('#modeSeg').addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (!b) return; S.mode = b.dataset.mode; $$('#modeSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); $$('.pro-only').forEach(x => (x.hidden = S.mode !== 'pro')); refreshAll(); });
    $('#fmtSeg').addEventListener('click', e => { const b = e.target.closest('[data-fmt]'); if (!b) return; snap(); S.format = b.dataset.fmt; $$('#fmtSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); sizeCanvas(); refreshAll(); });

    // transport
    function setPlaying(p) {
      S.playing = p; it.paused = !p; it.dirty = true;
      const b = $('#playBtn');
      b.querySelector('use').setAttribute('href', p ? '#i-pause' : '#i-play');
      b.dataset.labelHe = p ? 'השהיה' : 'ניגון'; b.dataset.labelEn = p ? 'Pause' : 'Play';
      b.setAttribute('aria-label', lang() === 'he' ? b.dataset.labelHe : b.dataset.labelEn);
    }
    setPlaying(S.playing);
    $('#playBtn').addEventListener('click', () => setPlaying(!S.playing));
    const scrub = $('#scrub');
    function seek(clientX) {
      const r = scrub.getBoundingClientRect();
      let p = (clientX - r.left) / r.width; if (root.dir === 'rtl') p = 1 - p;
      it.t = Math.max(0, Math.min(.999, p)) * Eng.T[tpl()].D; it.dirty = true;
    }
    let drag = false;
    scrub.addEventListener('pointerdown', e => { drag = true; scrub.setPointerCapture(e.pointerId); seek(e.clientX); });
    scrub.addEventListener('pointermove', e => drag && seek(e.clientX));
    scrub.addEventListener('pointerup', () => (drag = false));
    scrub.addEventListener('keydown', e => {
      const D = Eng.T[tpl()].D, fwd = root.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight', back = root.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === fwd) it.t = Math.min(D - .01, it.t + D / 20); else if (e.key === back) it.t = Math.max(0, it.t - D / 20); else if (e.key === ' ') { setPlaying(!S.playing); } else return;
      e.preventDefault(); it.dirty = true;
    });
    $('#canvasBox').addEventListener('click', () => $('#canvasBox').classList.toggle('sel'));

    // undo
    $('#undoBtn').addEventListener('click', () => {
      const h = hist.pop(); if (!h) { toast('אין מה לבטל.', 'Nothing to undo.', 'i-undo', 't-sky'); return; }
      const o = JSON.parse(h); Object.assign(S, o);
      if (S.sel >= S.scenes.length) S.sel = 0;
      syncInputs(); syncTpl(); renderScenes(); renderPals(); sizeCanvas(); refreshAll();
      $$('#fmtSeg button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.fmt === S.format)));
    });

    // create now: three variations of the same content
    let variant = 0;
    $('#createBtn').addEventListener('click', e => {
      const b = e.currentTarget; b.classList.add('is-loading');
      setTimeout(() => {
        b.classList.remove('is-loading');
        const V = [['softRise', 'בטוח', 'Safe'], ['beatSlam', 'נועז', 'Bold'], ['diagonalWipe', 'מפתיע', 'Surprising']][variant++ % 3];
        useTemplate(V[0]); setPlaying(true);
        toast(`נוצרה וריאציה: ${V[1]} · ${TPL_META[V[0]].name}`, `Created a ${V[2].toLowerCase()} take · ${TPL_META[V[0]].name}`, 'i-wand', 't-chart');
      }, 700);
    });

    // brief + export
    const refreshBrief = briefPanel($('#studioBrief'), state, true);
    $('#copyStudio').addEventListener('click', () => $('#studioBrief .copy-btn').click());
    async function record(setP) {
      if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) throw new Error('unsupported');
      const [w, h] = FORMATS[S.format];
      const sc = 720 / Math.min(w, h);
      const c = document.createElement('canvas'); c.width = Math.round(w * sc); c.height = Math.round(h * sc);
      const ctx = c.getContext('2d');
      const key = tpl(), T = Eng.T[key], o = opts();
      const types = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
      const mime = types.find(m => MediaRecorder.isTypeSupported(m));
      if (!mime) throw new Error('no codec');
      T.draw(ctx, c.width, c.height, 0, o);
      const rec = new MediaRecorder(c.captureStream(30), { mimeType: mime, videoBitsPerSecond: 8e6 });
      const chunks = [];
      rec.ondataavailable = e => e.data.size && chunks.push(e.data);
      const done = new Promise(res => (rec.onstop = res));
      rec.start();
      await new Promise(res => {
        const start = performance.now();
        (function loop(now) {
          const t = (now - start) / 1000;
          if (t >= T.D) { setP(1); return res(); }
          T.draw(ctx, c.width, c.height, t, o); setP(t / T.D);
          requestAnimationFrame(loop);
        })(start);
      });
      rec.stop(); await done;
      const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: mime.split(';')[0] });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `only-story-${key}.${ext}`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      if (ext === 'mp4') toast(`הקובץ מוכן: only-story-${key}.mp4`, `File ready: only-story-${key}.mp4`);
      else toast(`הדפדפן הזה מקודד WebM בלבד. הקובץ מוכן: only-story-${key}.webm`, `This browser encodes WebM only. File ready: only-story-${key}.webm`, 'i-film', 't-sky');
    }
    const exp = exportPanel($('#exportPanel'), record);
    $('#downloadBtn').addEventListener('click', () => { $('[data-go]', exp.el).click(); });

    function refreshAll() { Eng.invalidate(); refreshBrief(); $('#exportPanel [data-spec]').textContent = `MP4 · H.264 · ${FORMATS[S.format].join('×')}`; meter(); }
    onLang(() => { defaults(); syncInputs(); refreshAll(); setPlaying(S.playing); });

    syncInputs(); syncTpl(); renderScenes();
    routeHooks.studio = () => requestAnimationFrame(sizeCanvas);

    return { state, setLogo, useTemplate: k => useTemplate(k), setText };
  })();

  briefPanel($('#cBrief'), () => Studio.state());

  /* ---------- boot ---------- */
  const savedTheme = store.get('theme');
  setTheme(savedTheme === 'dark' ? 'dark' : 'light', false);
  setLang(store.get('lang') === 'en' ? 'en' : 'he', false);
  route();
  const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.all([ready, ...(document.fonts ? ['400 40px "Instrument Serif"', 'italic 400 40px "Instrument Serif"', '500 40px "Frank Ruhl Libre"', '300 40px "Frank Ruhl Libre"', '500 20px "Google Sans"', '500 20px "Google Sans Code"'].map(f => document.fonts.load(f).catch(() => null)) : [])])
    .then(() => { Eng.invalidate(); drawOrbits(); });
  requestAnimationFrame(drawOrbits);
  setTimeout(drawOrbits, 600);
})();

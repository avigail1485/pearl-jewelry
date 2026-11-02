/* ONLY STORY school: language, theme, routing, scroll motion, curriculum, lesson player, studio and design system. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const Eng = window.OSEngine;
  const RM = () => Eng.reduce.matches;
  const store = {
    get(k) { try { return localStorage.getItem('os-' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('os-' + k, v); } catch (e) { /* storage unavailable */ } }
  };
  const L = (he, en) => `<span class="he">${he}</span><span class="en">${en}</span>`;
  const RL = (he, en) => `<span class="rl he">${he}</span><span class="rl en">${en}</span>`;
  const ic = (id, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const ARR = `<span class="arr">${ic('i-arrow', 'flip')}</span>`;
  const lang = () => (root.lang === 'en' ? 'en' : 'he');
  const isRTLText = s => /[֐-׿؀-ۿ]/.test(s || '');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- rolling button labels ---------- */
  function rollify(scope = document) {
    $$('.rl', scope).forEach(el => {
      if (el.dataset.rolled) return;
      const t = el.textContent.trim();
      el.innerHTML = `<span class="roll"><span data-t="${t.replace(/"/g, '&quot;')}">${t}</span></span>`;
      el.dataset.rolled = '1';
    });
  }

  /* ---------- toast & clipboard ---------- */
  function toast(he, en, icon = 'i-check') {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="b">${ic(icon)}</span><span>${L(he, en)}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 420); }, 2800);
  }
  function copyText(text) {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); return ok;
    };
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => true, () => fallback());
    return Promise.resolve(fallback());
  }

  /* ---------- language & theme ---------- */
  const listeners = [];
  const onLang = fn => listeners.push(fn);
  function setLang(l, save = true) {
    root.lang = l; root.dir = l === 'he' ? 'rtl' : 'ltr';
    $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    $$('[data-label-he]').forEach(el => el.setAttribute('aria-label', el.dataset[l === 'he' ? 'labelHe' : 'labelEn']));
    $$('[data-ph-he]').forEach(el => (el.placeholder = el.dataset[l === 'he' ? 'phHe' : 'phEn']));
    document.title = l === 'he' ? 'ONLY STORY · בית ספר לאתרים ולמושן' : 'ONLY STORY · School of web & motion';
    if (save) store.set('lang', l);
    listeners.forEach(fn => fn(l));
    Eng.invalidate();
    requestAnimationFrame(() => { measure(); onScroll(); });
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-lang]'); if (b) setLang(b.dataset.lang); });
  function setTheme(t, save = true) {
    root.setAttribute('data-theme', t);
    $('#themeBtn').setAttribute('aria-pressed', String(t === 'dark'));
    if (save) store.set('theme', t);
  }
  $('#themeBtn').addEventListener('click', () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  function tick() {
    const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem', hour12: false }).format(new Date());
    $('#clock').textContent = (lang() === 'he' ? 'ירושלים ' : 'Jerusalem ') + time;
  }
  tick(); setInterval(tick, 20000); onLang(tick);

  const menuBtn = $('#menuBtn'), navlinks = $('#navlinks');
  menuBtn.addEventListener('click', () => { const o = !navlinks.classList.contains('open'); navlinks.classList.toggle('open', o); menuBtn.setAttribute('aria-expanded', String(o)); });
  navlinks.addEventListener('click', e => { if (e.target.closest('a')) { navlinks.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });

  /* ---------- router with the ink curtain ---------- */
  const ROUTES = ['home', 'maker', 'learn', 'studio', 'system'];
  const hooks = {};
  let current = null, busy = false;
  function target() {
    const h = (location.hash || '#home').slice(1);
    if (ROUTES.includes(h)) return { name: h, anchor: null };
    const el = h && document.getElementById(h);
    const pg = el && el.closest('.page');
    return pg ? { name: pg.dataset.page, anchor: el } : { name: 'home', anchor: null };
  }
  function show(name, anchor) {
    $$('.page').forEach(p => (p.hidden = p.dataset.page !== name));
    $$('.navlink').forEach(a => { if (a.dataset.route === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    current = name;
    if (anchor) anchor.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0);
    if (hooks[name]) hooks[name]();
    Eng.invalidate();
    requestAnimationFrame(() => { measure(); onScroll(); });
  }
  function route() {
    const { name, anchor } = target();
    if (name === current) { if (anchor) anchor.scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'start' }); return; }
    if (current === null || RM() || busy) { show(name, anchor); return; }
    busy = true;
    const c = $('#curtain');
    c.className = 'curtain cover';
    setTimeout(() => { show(name, anchor); c.className = 'curtain reveal'; setTimeout(() => { c.className = 'curtain'; busy = false; }, 560); }, 460);
  }
  window.addEventListener('hashchange', route);

  /* ---------- custom cursor ---------- */
  const cur = $('#cursor');
  let mx = -100, my = -100, cx = -100, cy = -100;
  window.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; mx = e.clientX; my = e.clientY; cur.classList.add('on'); });
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('[data-cursor-he]');
    cur.classList.toggle('big', !!t);
    if (t) $('span', cur).textContent = t.dataset[lang() === 'he' ? 'cursorHe' : 'cursorEn'];
  });
  document.documentElement.addEventListener('pointerleave', () => cur.classList.remove('on'));

  /* ---------- sample content & templates ---------- */
  const SAMPLE = {
    hero: { he: ['רק הסיפור שלך.', 'עכשיו בתנועה.'], en: ['Only your story.', 'Now in motion.'] },
    softRise: { he: ['פותחים עונה.', 'קולקציית סתיו.'], en: ['New season.', 'The autumn edit.'] },
    beatSlam: { he: ['מהר. חד.', 'מדליק.'], en: ['Fast. Sharp.', 'Alive.'] },
    pricePop: { he: ['מבצע השקה', 'רק השבוע'], en: ['Launch offer', 'This week only'] },
    diagonalWipe: { he: ['לפני.', 'אחרי.'], en: ['Before.', 'After.'] },
    breathing: { he: ['נשימה עמוקה.', 'ומתחילים.'], en: ['Breathe in.', 'Begin again.'] },
    marquee: { he: ['מילים בתנועה', ''], en: ['Words in motion', ''] },
    endCard: { he: ['', ''], en: ['', ''] }
  };
  const BASE_PAL = { ink: '#0F0F0E', accent: '#D5FF5F', paper: '#F2F0EA' };
  const sampleOpts = key => { const l = lang(), s = (SAMPLE[key] || SAMPLE.hero)[l]; return Object.assign({}, BASE_PAL, { l1: s[0], l2: s[1], rtl: l === 'he' }); };
  const TPL_META = {
    softRise: { name: 'Soft Rise', fam: ['חשיפות', 'Reveals'] }, beatSlam: { name: 'Beat Slam', fam: ['טיפוגרפיה קינטית', 'Kinetic type'] },
    pricePop: { name: 'Price Pop', fam: ['מכירה', 'Commerce'] }, diagonalWipe: { name: 'Diagonal Wipe', fam: ['מעברים', 'Transitions'] },
    breathing: { name: 'Breathing Gradient', fam: ['רקעים', 'Backgrounds'] }, marquee: { name: 'Marquee Stack', fam: ['טיפוגרפיה קינטית', 'Kinetic type'] },
    endCard: { name: 'End Card', fam: ['מותג ולוגו', 'Brand & logo'] }, reel: { name: 'Showreel', fam: ['רצף', 'Sequence'] },
    showreel: { name: 'Studio Reel', fam: ['רצף', 'Sequence'] }, siteBuild: { name: 'Site Build', fam: ['אתרים', 'Web'] }, lesson: { name: 'Lesson', fam: ['שיעור', 'Lesson'] }
  };
  const dur = k => '00:' + String(Math.round(Eng.T[k].D)).padStart(2, '0');
  function mountLive(scope) {
    $$('canvas[data-live]', scope).forEach(cv => { if (cv.__os) return; const k = cv.dataset.live; Eng.mount(cv, { tpl: () => k, opts: () => sampleOpts(k) }); });
  }

  /* ========== HOME ========== */
  const reelIt = Eng.mount($('#reelCanvas'), {
    tpl: () => 'showreel', opts: () => Object.assign({}, BASE_PAL, { rtl: lang() === 'he' }), respectReduce: false,
    onTime: t => { $('#reelTc').textContent = `00:${String(Math.floor(t)).padStart(2, '0')} / 00:17`; }
  });
  reelIt.paused = RM();
  $('#reelFrame').addEventListener('click', () => {
    reelIt.paused = !reelIt.paused; reelIt.dirty = true;
    const f = $('#reelFrame');
    f.dataset.cursorHe = reelIt.paused ? 'ניגון' : 'עצירה'; f.dataset.cursorEn = reelIt.paused ? 'Play' : 'Pause';
    $('span', cur).textContent = f.dataset[lang() === 'he' ? 'cursorHe' : 'cursorEn'];
  });
  mountLive($('#tracks'));

  function buildManifesto() {
    const el = $('#manifesto');
    el.innerHTML = el.dataset[lang()].split(' ').map(w => `<span class="wd${w.includes('*') ? ' acc' : ''}">${w.replace(/\*/g, '')}</span>`).join(' ');
  }
  buildManifesto(); onLang(buildManifesto);

  const LESSONS = [
    ['web', 'היררכיה: מה רואים ראשון', 'Hierarchy: what you see first', '18:40', 'lesson'],
    ['web', 'גריד של 12 עמודות שלא מרגיש כמו גריד', "A 12-column grid that doesn't feel like one", '22:10', 'siteBuild'],
    ['web', 'טיפוגרפיה שמחזיקה מסך', 'Type that holds a screen', '16:05', 'softRise'],
    ['web', 'תנועה בגלילה, בלי סחרחורת', 'Scroll motion without the nausea', '24:30', 'diagonalWipe'],
    ['web', 'מיקרו־אינטראקציות שמרגישות יקר', 'Micro-interactions that feel expensive', '14:20', 'breathing'],
    ['web', 'מהירות ונגישות: גם זה ליגה', 'Speed and accessibility are league-level too', '19:00', 'siteBuild'],
    ['motion', 'טיפוגרפיה קינטית: מילה אחת בכל פעם', 'Kinetic type: one word at a time', '15:30', 'beatSlam'],
    ['motion', 'קצב: לחתוך על הפעמה', 'Rhythm: cutting on the beat', '12:45', 'marquee'],
    ['motion', 'מעברים על האלכסון', 'Transitions on the diagonal', '11:10', 'diagonalWipe'],
    ['motion', 'מותג בתנועה: לוגו נכנס, פלטה יוצאת', 'Brand in motion: logo in, palette out', '17:20', 'endCard'],
    ['motion', 'מושן שמוכר: מחיר שקופץ', 'Motion that sells: a price that pops', '09:50', 'pricePop'],
    ['motion', 'שואוריל: לחבר הכל לסרטון אחד', 'Showreel: stitch it all into one film', '26:00', 'showreel']
  ];
  $('#lessonList').innerHTML = LESSONS.map(([trk, he, en, d, tpl], i) => `<a class="lrow" href="#learn" data-i="${i}" data-trk="${trk}" data-tpl="${tpl}"><span class="mono">${String(i + 1).padStart(2, '0')}</span><span class="t">${L(he, en)}</span><span class="small trk">${trk === 'web' ? L('אתרים', 'Web') : L('מושן', 'Motion')}</span><span class="mono dur">${d}</span><svg class="ic arrow flip" aria-hidden="true"><use href="#i-arrow"/></svg></a>`).join('');
  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    $$('#filters .chip').forEach(c => c.setAttribute('aria-pressed', String(c === b)));
    $$('#lessonList .lrow').forEach(r => (r.hidden = b.dataset.f !== 'all' && r.dataset.trk !== b.dataset.f));
    measure();
  });
  $('#lessonList').addEventListener('click', e => { const r = e.target.closest('.lrow'); if (r) Learn.open(+r.dataset.i); });
  const pv = $('#preview');
  let pvKey = 'lesson', px = 0, py = 0, tx = 0, ty = 0;
  const pvIt = Eng.mount($('#previewCanvas'), { tpl: () => pvKey, opts: () => sampleOpts(SAMPLE[pvKey] ? pvKey : 'hero') });
  $('#lessonList').addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { tx = e.clientX; ty = e.clientY; } });
  $('#lessonList').addEventListener('pointerover', e => {
    const r = e.target.closest('.lrow'); if (!r || e.pointerType !== 'mouse') return;
    if (pvKey !== r.dataset.tpl) { pvKey = r.dataset.tpl; pvIt.t = 0; pvIt.dirty = true; }
    if (!pv.classList.contains('on')) { px = tx = e.clientX; py = ty = e.clientY; }
    pv.classList.add('on'); pvIt.visible = true;
  });
  $('#lessonList').addEventListener('pointerleave', () => pv.classList.remove('on'));

  const BUILD = [
    ['site', 0, 'דף נחיתה לסטודיו קרמיקה', 'A landing page for a ceramics studio', 'אתר · פרק 01', 'Site · Ch. 01'],
    ['softRise', 0, 'פתיח של 5 שניות להשקה', 'A 5-second launch opener', 'מושן · פרק 07', 'Motion · Ch. 07'],
    ['site', 1, 'אתר אירוע עם גלילה שמספרת', 'An event site that tells a story on scroll', 'אתר · פרק 04', 'Site · Ch. 04'],
    ['pricePop', 0, 'פוסט מחיר שקופץ', 'A price post that pops', 'מושן · פרק 11', 'Motion · Ch. 11'],
    ['site', 2, 'תיק עבודות אישי', 'A personal portfolio', 'אתר · פרק 06', 'Site · Ch. 06'],
    ['showreel', 0, 'שואוריל של 17 שניות', 'A 17-second showreel', 'מושן · פרק 12', 'Motion · Ch. 12']
  ];
  $('#buildTrack').innerHTML = BUILD.map(([, , he, en, the, ten], i) => `<article class="bcard"><div class="pv"><canvas data-b="${i}" aria-hidden="true"></canvas></div><div class="meta"><span class="t">${L(he, en)}</span><span class="mono">${L(the, ten)}</span></div></article>`).join('');
  $$('#buildTrack canvas').forEach(cv => {
    const [k, v] = BUILD[+cv.dataset.b];
    if (k === 'site') Eng.mount(cv, { tpl: () => 'sitePage', opts: () => Object.assign(sampleOpts('hero'), { v }) });
    else Eng.mount(cv, { tpl: () => k, opts: () => sampleOpts(SAMPLE[k] ? k : 'hero') });
  });

  function buildBand() {
    const words = lang() === 'he' ? ['אתרים', 'מושן', 'גריד', 'טיפוגרפיה', 'גלילה', 'קצב', 'מותג'] : ['Websites', 'Motion', 'Grid', 'Type', 'Scroll', 'Rhythm', 'Brand'];
    const unit = words.map(w => `<span>${w}<svg aria-hidden="true"><use href="#os-sym"/></svg></span>`).join('');
    $('#band').innerHTML = unit + unit + unit;
  }
  buildBand(); onLang(buildBand);

  $('#joinForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#joinEmail').value.trim(), msg = $('#joinMsg');
    if (!/^\S+@\S+\.\S+$/.test(v)) { msg.innerHTML = L('כתובת המייל לא נראית תקינה. בדקו שיש בה @ ונקודה.', 'That email address looks off. Check it has an @ and a dot.'); $('#joinEmail').focus(); return; }
    msg.innerHTML = L('נרשמתם. השיעור הראשון בדרך אליכם.', "You're in. The first lesson is on its way.");
    toast('נרשמתם בהצלחה', 'Subscribed');
    $('#joinEmail').value = '';
  });

  /* ---------- scroll engine ---------- */
  const nav = $('#nav');
  let geo = {};
  function measure() {
    const top = el => el.getBoundingClientRect().top + window.scrollY;
    const reel = $('#reel'), build = $('#build'), man = $('#manifesto');
    geo = {
      reel: reel && reel.offsetParent ? { t: top(reel), h: reel.offsetHeight } : null,
      build: build && build.offsetParent ? { t: top(build), h: build.offsetHeight } : null,
      man: man && man.offsetParent ? { t: top(man), h: man.offsetHeight } : null
    };
  }
  window.addEventListener('resize', () => { measure(); onScroll(); });
  function onScroll() {
    const y = window.scrollY, vh = window.innerHeight;
    nav.classList.toggle('scrolled', y > 8);
    if (current !== 'home') return;
    const big = window.matchMedia('(min-width: 901px) and (hover: hover)').matches && !RM();
    const frame = $('#reelFrame');
    if (geo.reel && big) {
      const p = clamp((y - geo.reel.t + vh * .55) / (geo.reel.h - vh * .45));
      const e = 1 - Math.pow(1 - p, 3);
      frame.style.setProperty('--s', (.56 + .44 * e).toFixed(4));
      frame.style.setProperty('--rad', (24 * (1 - e)).toFixed(1) + 'px');
    } else { frame.style.removeProperty('--s'); }
    if (geo.man) {
      const words = $$('#manifesto .wd'), p = clamp((y + vh * .8 - geo.man.t) / (geo.man.h + vh * .25));
      const n = RM() ? words.length : Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    const tr = $('#buildTrack');
    if (geo.build && big) {
      const p = clamp((y - geo.build.t + 72) / (geo.build.h - vh));
      const max = Math.max(0, tr.scrollWidth - window.innerWidth + 48);
      tr.style.transform = `translate3d(${(root.dir === 'rtl' ? 1 : -1) * p * max}px,0,0)`;
      $('#buildPh').style.setProperty('--p', (p * 100).toFixed(2) + '%');
    } else tr.style.transform = '';
  }
  window.addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });

  let lastY = window.scrollY, vel = 0, bandX = 0;
  (function loop() {
    cx += (mx - cx) * .2; cy += (my - cy) * .2;
    cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    px += (tx - px) * .14; py += (ty - py) * .14;
    pv.style.left = px + 'px'; pv.style.top = py + 'px';
    const y = window.scrollY; vel = vel * .9 + (y - lastY) * .1; lastY = y;
    if (current === 'home' && !RM()) {
      const band = $('#band'), w = band.scrollWidth / 3;
      bandX -= 0.6 + Math.min(12, Math.abs(vel) * .25);
      if (w && bandX < -w) bandX += w;
      band.style.transform = `translate3d(${bandX}px,0,0)`;
    }
    requestAnimationFrame(loop);
  })();

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  $$('.rv').forEach(el => io.observe(el));
  setTimeout(() => $$('.hl.pending').forEach(h => h.classList.remove('pending')), 700);

  /* ---------- brief ---------- */
  const FORMATS = { '9:16': [1080, 1920], '1:1': [1080, 1080], '16:9': [1920, 1080] };
  function briefText(st) {
    const rtl = isRTLText(st.l1 + st.l2), m = TPL_META[st.tpl] || TPL_META.softRise, [w, h] = FORMATS[st.format];
    let s = `ONLY STORY → Claude Code
────────────────────────────────────
Project   "${st.l1}${st.l2 ? ' / ' + st.l2 : ''}"
Template  ${m.name} · ${m.fam[1]} · ${dur(st.tpl)}
Format    ${st.format} · ${w}×${h} · 30fps
Script    ${rtl ? 'Hebrew · RTL · animate by grapheme' : 'Latin · LTR · animate by word'}
Palette   Ink ${st.pal.ink} · Accent ${st.pal.accent} · Paper ${st.pal.paper}
Type      Google Sans 700 / 400 · Google Sans Code for labels
Style     ${st.style || 'Headline & Sub'}
Motion    cubic-bezier(.19,1,.22,1) · 110ms stagger · wipes at 47°
Rules     hold 1.2s + 0.3s per word · contrast ≥ 4.5:1 · safe area 8% × 7%

Build this as a deterministic HTML canvas composition where
draw(t) depends only on time, then add an MP4 export.`;
    if (st.mode === 'pro') s += `\n\ncomposition.json\n${JSON.stringify({ template: st.tpl, format: st.format, size: [w, h], fps: 30, duration: Eng.T[st.tpl].D, direction: rtl ? 'rtl' : 'ltr', text: [st.l1, st.l2], palette: st.pal, easing: [.19, 1, .22, 1] }, null, 2)}`;
    return s;
  }
  function briefPanel(el, getState) {
    el.innerHTML = `<div class="bar"><div><div class="label">${L('בריף ל־Claude Code', 'Brief for Claude Code')}</div><div class="mono" data-sum style="color:var(--ink-2)"></div></div>
      <button class="btn btn-ink sm copy-btn no-arr" type="button"><span data-cl>${RL('העתקה ל־Claude Code', 'Copy for Claude Code')}</span></button></div><pre tabindex="0"></pre>`;
    rollify(el);
    const pre = $('pre', el), btn = $('.copy-btn', el), sum = $('[data-sum]', el);
    const refresh = () => { const st = getState(); pre.textContent = briefText(st); sum.textContent = `${(TPL_META[st.tpl] || TPL_META.softRise).name} · ${st.format}`; };
    btn.addEventListener('click', () => {
      copyText(pre.textContent).then(ok => {
        if (ok) {
          btn.dataset.state = 'copied'; $('[data-cl]', btn).innerHTML = L('הועתק ✓', 'Copied ✓');
          toast('הבריף הועתק. אפשר להדביק אותו.', 'Brief copied. Ready to paste.');
          setTimeout(() => { btn.dataset.state = ''; $('[data-cl]', btn).innerHTML = RL('העתקה ל־Claude Code', 'Copy for Claude Code'); rollify(btn); }, 2200);
        } else {
          const r = document.createRange(); r.selectNodeContents(pre); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
          toast('הטקסט מסומן. לחצו Ctrl+C להעתקה.', 'Text selected. Press Ctrl+C to copy.', 'i-copy');
        }
      });
    });
    refresh(); onLang(refresh);
    return refresh;
  }

  /* ---------- export panel ---------- */
  function exportPanel(el, run) {
    el.innerHTML = `<div class="status"><div><div class="label">${L('ייצוא', 'Export')}</div><div class="mono" data-spec style="color:var(--ink-2)">MP4 · H.264</div></div><span class="mono" data-pct>0%</span></div>
      <div class="opts" role="group"><button class="chip" type="button" aria-pressed="true" data-q="1080">1080p</button><button class="chip" type="button" aria-pressed="false" data-q="4k">4K · Pro</button><button class="chip" type="button" aria-pressed="true" data-fps="30">30fps</button><button class="chip" type="button" aria-pressed="false" data-fps="60">60fps</button></div>
      <div class="track2" style="--p:0%"><div class="fill"></div><div class="ticks"></div><div class="ph"></div></div>
      <p class="small" style="margin:0">${L('הרינדור רץ במכשיר שלכם. שום קובץ לא עוזב אותו.', 'Rendering runs on your device. No file leaves it.')}</p>
      <button class="btn btn-accent" type="button" data-go>${RL('הורדת MP4', 'Download MP4')}<span class="arr">${ic('i-down')}</span></button>`;
    rollify(el);
    const track = $('.track2', el), pct = $('[data-pct]', el), go = $('[data-go]', el);
    $$('.opts .chip', el).forEach(c => c.addEventListener('click', () => { const a = c.dataset.q ? 'data-q' : 'data-fps'; $$(`.opts [${a}]`, el).forEach(o => o.setAttribute('aria-pressed', String(o === c))); }));
    const setP = p => { track.style.setProperty('--p', (p * 100).toFixed(1) + '%'); pct.textContent = Math.round(p * 100) + '%'; };
    go.addEventListener('click', async () => {
      go.classList.add('is-loading'); go.disabled = true;
      try { await run(setP); } catch (err) { toast('הייצוא לא הצליח בדפדפן הזה. נסו Chrome או Edge.', 'Export failed in this browser. Try Chrome or Edge.', 'i-x'); }
      go.classList.remove('is-loading'); go.disabled = false;
    });
    return { el };
  }
  const simulate = setP => new Promise(res => { let p = 0; const id = setInterval(() => { p = Math.min(1, p + .025 + Math.random() * .03); setP(p); if (p >= 1) { clearInterval(id); toast('הדגמה: כאן היה יורד הקובץ', 'Demo: this is where the file would download'); res(); } }, 70); });

  /* ---------- color helpers ---------- */
  function hexRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255); }
  function lum(h) { return hexRgb(h).map(c => (c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4))).reduce((a, c, i) => a + c * [.2126, .7152, .0722][i], 0); }
  function contrast(a, b) { const A = lum(a), B = lum(b); return (Math.max(A, B) + .05) / (Math.min(A, B) + .05); }

  /* ---------- dropzone & palette extraction ---------- */
  function dropzone(label, input, onImg) {
    ['dragenter', 'dragover'].forEach(ev => label.addEventListener(ev, e => { e.preventDefault(); label.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => label.addEventListener(ev, () => label.classList.remove('drag')));
    label.addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) read(f); });
    input.addEventListener('change', () => { const f = input.files[0]; if (f) read(f); });
    function read(f) {
      if (!/^image\//.test(f.type)) { toast('זה לא קובץ תמונה. נסו SVG או PNG.', 'That is not an image. Try an SVG or PNG.', 'i-x'); return; }
      if (f.size > 5 * 1024 * 1024) { toast('הקובץ גדול מ־5MB. נסו קובץ קטן יותר.', 'The file is over 5MB. Try a smaller one.', 'i-x'); return; }
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          label.classList.add('filled'); $$('svg, .t, .s, img', label).forEach(n => n.remove());
          const p = document.createElement('img'); p.src = r.result; p.alt = f.name; label.appendChild(p);
          const s = document.createElement('span'); s.className = 's'; s.textContent = f.name; label.appendChild(s);
          onImg(img);
        };
        img.src = r.result;
      };
      r.readAsDataURL(f);
    }
  }
  function extractPalette(img) {
    const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 48, 48);
    let d; try { d = x.getImageData(0, 0, 48, 48).data; } catch (e) { return null; }
    const b = {}; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; const k = [d[i] >> 4, d[i + 1] >> 4, d[i + 2] >> 4].join(','); b[k] = (b[k] || 0) + 1; }
    const cols = Object.entries(b).sort((p, q) => q[1] - p[1]).map(([k]) => k.split(',').map(v => v * 16 + 8)); if (!cols.length) return null;
    const hex = c3 => '#' + c3.map(v => Math.min(255, v).toString(16).padStart(2, '0')).join('').toUpperCase();
    const sat = ([r, g, bl]) => Math.max(r, g, bl) - Math.min(r, g, bl);
    let ink = hex(cols.slice().sort((p, q) => lum(hex(p)) - lum(hex(q)))[0]); if (lum(ink) > .2) ink = '#0F0F0E';
    let accent = hex(cols.slice().sort((p, q) => sat(q) - sat(p))[0]); if (contrast(accent, ink) < 3) accent = '#D5FF5F';
    return { ink, accent, paper: '#F2F0EA' };
  }

  /* ========== LEARN ========== */
  const Learn = (function () {
    let idx = +(store.get('lesson') || 0) || 0;
    if (!(idx >= 0 && idx < LESSONS.length)) idx = 0;
    const done = new Set((store.get('done') || '').split(',').filter(Boolean).map(Number));
    const parseDur = s => { const [m, sec] = s.split(':').map(Number); return m * 60 + sec; };
    const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const CHAPTERS = {
      he: ['בלי היררכיה, הכל צועק', 'שלוש רמות: 1, 2, 3', 'קרבה יוצרת קבוצה', 'תרגיל: סדרו את הדף'],
      en: ['No hierarchy: everything shouts', 'Three levels: 1, 2, 3', 'Proximity makes groups', 'Exercise: order the page']
    };
    const lessonTpl = () => (idx === 0 ? 'lesson' : LESSONS[idx][4]);
    const it = Eng.mount($('#lessonCanvas'), {
      tpl: lessonTpl, opts: () => sampleOpts(SAMPLE[LESSONS[idx][4]] ? LESSONS[idx][4] : 'hero'), respectReduce: false,
      onTime: (t, D) => {
        const p = t / D, total = parseDur(LESSONS[idx][3]);
        $('#lTrack').style.setProperty('--p', (p * 100).toFixed(2) + '%'); $('#lTrack').setAttribute('aria-valuenow', Math.round(p * 100));
        $('#lTime').textContent = `${fmt(p * total)} / ${LESSONS[idx][3]}`;
        const ch = Math.min(3, Math.floor(p * 4));
        $$('#chapters button').forEach((b, i) => b.setAttribute('aria-current', String(i === ch)));
        $('#cc span').textContent = CHAPTERS[lang()][ch];
      }
    });
    it.paused = RM();
    function renderChapters() {
      const total = parseDur(LESSONS[idx][3]);
      $('#chapters').innerHTML = CHAPTERS[lang()].map((t, i) => `<button type="button" data-c="${i}"><span class="mono">${fmt(total * i / 4)}</span><span class="t">${t}</span></button>`).join('');
    }
    $('#chapters').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; it.t = Eng.T[lessonTpl()].D * (+b.dataset.c) / 4 + .01; it.dirty = true; });
    function setPlay(p) {
      it.paused = !p; it.dirty = true; const b = $('#lPlay');
      b.querySelector('use').setAttribute('href', p ? '#i-pause' : '#i-play');
      b.dataset.labelHe = p ? 'השהיה' : 'ניגון'; b.dataset.labelEn = p ? 'Pause' : 'Play';
      b.setAttribute('aria-label', b.dataset[lang() === 'he' ? 'labelHe' : 'labelEn']);
    }
    $('#lPlay').addEventListener('click', () => setPlay(it.paused));
    let speed = 1;
    it.speed = () => speed;
    $('#lSpeed').addEventListener('click', e => { speed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1; $('.mono', e.currentTarget).textContent = speed + '×'; });
    $('#lCC').addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', String(on)); $('#cc').hidden = !on; });
    const tr = $('#lTrack');
    const seek = x => { const r = tr.getBoundingClientRect(); let p = (x - r.left) / r.width; if (root.dir === 'rtl') p = 1 - p; it.t = clamp(p, 0, .999) * Eng.T[lessonTpl()].D; it.dirty = true; };
    let drag = false;
    tr.addEventListener('pointerdown', e => { drag = true; tr.setPointerCapture(e.pointerId); seek(e.clientX); });
    tr.addEventListener('pointermove', e => drag && seek(e.clientX));
    tr.addEventListener('pointerup', () => (drag = false));
    tr.addEventListener('keydown', e => {
      const D = Eng.T[lessonTpl()].D, f = root.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight', b = root.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === f) it.t = Math.min(D - .01, it.t + D / 20); else if (e.key === b) it.t = Math.max(0, it.t - D / 20); else if (e.key === ' ') setPlay(it.paused); else return;
      e.preventDefault(); it.dirty = true;
    });
    $('#lTabs').addEventListener('click', e => {
      const b = e.target.closest('[data-tab]'); if (!b) return;
      $$('#lTabs [data-tab]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
      $$('.learn .tabpane').forEach(p => (p.hidden = p.dataset.pane !== b.dataset.tab));
    });
    const CHECK = [['יש דבר אחד שהוא הכי גדול במסך', 'One thing is the biggest on screen'], ['הכפתור הוא הדבר היחיד בצבע המבטא', 'The button is the only thing in the accent color'], ['אפשר לקרוא את הכותרת בשלוש שניות', 'The headline reads in three seconds'], ['רווחים קטנים בתוך קבוצה, גדולים בין קבוצות', 'Small gaps inside a group, large gaps between groups'], ['הטקסט המשני בניגודיות של 4.5:1 לפחות', 'Secondary text has at least 4.5:1 contrast'], ['הדף עובד גם ברוחב של טלפון', 'The page works at phone width']];
    $('#checklist').innerHTML = CHECK.map(([he, en], i) => `<label class="check"><input type="checkbox" id="ck${i}"><span>${L(he, en)}</span></label>`).join('');
    function renderOutline() {
      const mods = [['web', 'מסלול 01 · אתרים', 'Track 01 · Web'], ['motion', 'מסלול 02 · מושן', 'Track 02 · Motion']];
      $('#outline').innerHTML = mods.map(([k, he, en]) => `<h4>${L(he, en)}</h4>` + LESSONS.map((l, i) => (l[0] !== k ? '' : `<button type="button" class="oitem ${done.has(i) ? 'done' : ''}" data-i="${i}" aria-current="${i === idx}"><span class="st">${done.has(i) ? ic('i-check') : ''}</span><span>${L(l[1], l[2])}</span><span class="mono">${l[3]}</span></button>`)).join('')).join('');
      $('#progTxt').textContent = `${done.size}/12`;
      $('#progBar').style.setProperty('--p', (done.size / 12 * 100) + '%');
    }
    $('#outline').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { open(+b.dataset.i); window.scrollTo({ top: 0, behavior: RM() ? 'auto' : 'smooth' }); } });
    $('#markDone').addEventListener('click', () => {
      done.add(idx); store.set('done', [...done].join(','));
      toast('כל הכבוד. השיעור סומן כהושלם.', 'Nice work. Lesson marked complete.');
      renderOutline();
    });
    function render() {
      const l = LESSONS[idx], n = String(idx + 1).padStart(2, '0'), web = l[0] === 'web';
      $('#lessonTitle').innerHTML = L(l[1], l[2]);
      $('#crumbLesson').innerHTML = L(`פרק ${n}`, `Chapter ${n}`);
      $('#lessonNo').innerHTML = L(`פרק ${n} · ${web ? 'אתרים' : 'מושן'}`, `Chapter ${n} · ${web ? 'Web' : 'Motion'}`);
      $('.crumbs a').innerHTML = web ? L('מסלול 01 · אתרים ברמת ליגה', 'Track 01 · League-level websites') : L('מסלול 02 · סרטונים מדליקים', 'Track 02 · Motion that stops the scroll');
      $('#lessonDur').textContent = l[3];
      const nx = LESSONS[(idx + 1) % 12];
      $('#nextTitle').innerHTML = L(nx[1], nx[2]);
      renderChapters(); renderOutline();
      it.t = 0; it.dirty = true;
      store.set('lesson', idx);
    }
    $('#nextCard').addEventListener('click', e => { e.preventDefault(); open((idx + 1) % 12); window.scrollTo({ top: 0, behavior: RM() ? 'auto' : 'smooth' }); });
    function open(i) { idx = i; render(); }
    briefPanel($('#lessonBrief'), () => ({ l1: lang() === 'he' ? 'קרמיקה בעבודת יד.' : 'Handmade ceramics.', l2: lang() === 'he' ? 'סדנה חדשה בכל חמישי.' : 'A new workshop every Thursday.', tpl: 'softRise', format: '16:9', pal: BASE_PAL, mode: 'simple', style: 'Headline & Sub' }));
    render(); onLang(render);
    hooks.learn = () => setPlay(!RM());
    return { open };
  })();

  /* ========== STUDIO ========== */
  (function studio() {
    const PALS = [
      { id: 'ink', he: 'דיו ושרטרז', en: 'Ink & Chartreuse', ink: '#0F0F0E', accent: '#D5FF5F', paper: '#F2F0EA' },
      { id: 'lav', he: 'לילה סגול', en: 'Violet night', ink: '#1D1A2B', accent: '#C9B8FF', paper: '#F4F1FF' },
      { id: 'peach', he: 'נייר אפרסק', en: 'Peach paper', ink: '#2A1A10', accent: '#FFB990', paper: '#FFF6EE' },
      { id: 'sky', he: 'כחול סטודיו', en: 'Studio blue', ink: '#0F1C2B', accent: '#9CCBFF', paper: '#F2F8FF' }
    ];
    const SCN = [['softRise', 'פתיחה', 'Hook'], ['beatSlam', 'מסר', 'Message'], ['pricePop', 'הצעה', 'Offer'], ['endCard', 'סיום', 'End card']];
    const S = { l1: '', l2: '', price: '', edited: false, format: '9:16', mode: 'simple', style: 'Headline & Sub', pal: Object.assign({}, PALS[0]), logoImg: null, playing: !RM(), speed: 1, scenes: SCN.map(([tpl, he, en]) => ({ tpl, he, en })), sel: 0 };
    const hist = [];
    const snap = () => { hist.push(JSON.stringify({ l1: S.l1, l2: S.l2, price: S.price, format: S.format, pal: S.pal, scenes: S.scenes, sel: S.sel })); if (hist.length > 50) hist.shift(); };
    const defaults = () => { if (!S.edited) { const s = SAMPLE.hero[lang()]; S.l1 = s[0]; S.l2 = s[1]; S.price = lang() === 'he' ? '₪49' : '$49'; } };
    defaults();
    const tpl = () => S.scenes[S.sel].tpl;
    const opts = () => ({ l1: S.l1, l2: S.l2, price: S.price, rtl: isRTLText(S.l1 + S.l2) || (!S.l1 && lang() === 'he'), ink: S.pal.ink, accent: S.pal.accent, paper: S.pal.paper, logoImg: S.logoImg });
    const state = () => ({ l1: S.l1, l2: S.l2, tpl: tpl(), format: S.format, pal: S.pal, mode: S.mode, style: S.style });
    const it = Eng.mount($('#stCanvas'), {
      tpl, opts, speed: () => S.speed, respectReduce: false,
      onTime: (t, D) => {
        $('#scrub').style.setProperty('--p', (t / D * 100).toFixed(2) + '%'); $('#scrub').setAttribute('aria-valuenow', Math.round(t / D * 100));
        $('#tc').textContent = `00:${String(Math.floor(t)).padStart(2, '0')}:${String(Math.floor((t % 1) * 30)).padStart(2, '0')}`;
      }
    });
    it.paused = !S.playing;
    function sizeCanvas() {
      const wrap = $('#canvasWrap'), box = $('#canvasBox'); if (!wrap.clientWidth) return;
      const avail = wrap.clientWidth - 48, maxH = window.innerWidth < 820 ? Math.min(560, window.innerHeight * .62) : 520;
      const [w, h] = FORMATS[S.format]; let bh = maxH, bw = bh * w / h; if (bw > avail) { bw = avail; bh = bw * h / w; }
      box.style.width = Math.round(bw) + 'px'; box.style.height = Math.round(bh) + 'px';
      $('#stMeta').textContent = `${S.format} · ${w}×${h} · 30fps`; Eng.invalidate();
    }
    window.addEventListener('resize', sizeCanvas);
    function renderScenes() {
      const strip = $('#sceneStrip');
      $$('canvas', strip).forEach(c => c.__os && Eng.unmount(c.__os));
      strip.innerHTML = S.scenes.map((s, i) => `<button class="scn" type="button" aria-pressed="${i === S.sel}" data-i="${i}"><canvas aria-hidden="true"></canvas><span class="lbl"><span>${L(s.he, s.en)}</span><span class="mono">${String(i + 1).padStart(2, '0')}</span></span></button>`).join('') + `<button class="scn add" type="button" id="addScene" aria-label="Add scene">${ic('i-plus')}</button>`;
      $$('.scn[data-i]', strip).forEach(b => { const i = +b.dataset.i; const item = Eng.mount($('canvas', b), { tpl: () => S.scenes[i] && S.scenes[i].tpl, opts, still: () => true }); item.fixedT = Eng.T[S.scenes[i].tpl].hold; });
    }
    $('#sceneStrip').addEventListener('click', e => {
      if (e.target.closest('#addScene')) {
        snap(); const keys = ['softRise', 'beatSlam', 'pricePop', 'diagonalWipe', 'breathing', 'marquee', 'endCard']; const k = keys[S.scenes.length % keys.length];
        S.scenes.push({ tpl: k, he: 'סצנה ' + (S.scenes.length + 1), en: 'Scene ' + (S.scenes.length + 1) }); S.sel = S.scenes.length - 1; renderScenes(); syncTpl(); refreshAll(); return;
      }
      const b = e.target.closest('.scn[data-i]'); if (!b) return;
      S.sel = +b.dataset.i; it.t = 0; $$('.scn[data-i]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); syncTpl(); refreshAll();
    });
    $('#ptabs').addEventListener('click', e => {
      const b = e.target.closest('[data-tab]'); if (!b) return;
      $$('#ptabs [data-tab]').forEach(x => { x.setAttribute('aria-selected', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
      $$('.pbody[data-pane]').forEach(p => (p.hidden = p.dataset.pane !== b.dataset.tab)); Eng.invalidate();
    });
    $('#ptabs').addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const tabs = $$('#ptabs [data-tab]'), i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      const step = (e.key === 'ArrowRight') === (root.dir === 'ltr') ? 1 : -1; const n = tabs[(i + step + tabs.length) % tabs.length]; n.click(); n.focus();
    });
    const l1 = $('#stL1'), l2 = $('#stL2'), pr = $('#stPrice');
    function syncInputs() { l1.value = S.l1; l2.value = S.l2; pr.value = S.price; meter(); }
    function meter() {
      $('#cnt1').textContent = `${S.l1.length}/48`; $('#cnt2').textContent = `${S.l2.length}/48`;
      const words = (S.l1 + ' ' + S.l2).split(/\s+/).filter(Boolean).length, need = 1.2 + .3 * words, have = Eng.T[tpl()].D * .6 / S.speed;
      $('#readMeter').innerHTML = need <= have ? L(`זמן קריאה ${need.toFixed(1)} שנ׳ · על המסך ${have.toFixed(1)} שנ׳. נקרא בנוחות.`, `Reads in ${need.toFixed(1)}s · on screen ${have.toFixed(1)}s. Comfortable.`)
        : L(`צריך ${need.toFixed(1)} שנ׳ כדי לקרוא, אבל זה על המסך רק ${have.toFixed(1)} שנ׳. קצרו או פצלו לסצנה נוספת.`, `Needs ${need.toFixed(1)}s to read but shows for ${have.toFixed(1)}s. Shorten it or split it into another scene.`);
    }
    let fresh = null;
    [[l1, 'l1'], [l2, 'l2'], [pr, 'price']].forEach(([inp, k]) => {
      inp.addEventListener('focus', () => (fresh = true));
      inp.addEventListener('input', () => { if (fresh) { snap(); fresh = false; } S[k] = inp.value; S.edited = true; meter(); refreshAll(); });
    });
    const SUG = [['השקה', 'Launch', ['השקה חדשה.', 'הכל מתחיל היום.'], ['Something new.', 'It starts today.']], ['מבצע', 'Sale', ['מבצע סוף שבוע.', 'עד יום ראשון בערב.'], ['Weekend sale.', 'Ends Sunday night.']], ['הזמנה', 'Invitation', ['הדלת פתוחה.', 'בואו לבקר.'], ['Doors are open.', 'Come say hello.']], ['תודה', 'Thank you', ['תודה שבחרתם בנו.', 'נתראה בקרוב.'], ['Thank you.', 'See you soon.']]];
    $('#stChips').innerHTML = SUG.map(([he, en], i) => `<button class="chip" type="button" data-i="${i}">${L(he, en)}</button>`).join('');
    $('#stChips').addEventListener('click', e => { const c = e.target.closest('[data-i]'); if (!c) return; const s = SUG[+c.dataset.i][lang() === 'he' ? 2 : 3]; snap(); S.l1 = s[0]; S.l2 = s[1]; S.edited = true; it.t = 0; syncInputs(); refreshAll(); });
    const TK = ['softRise', 'beatSlam', 'pricePop', 'diagonalWipe', 'breathing', 'marquee', 'endCard', 'reel'];
    $('#tplGrid').innerHTML = TK.map(k => `<button class="tpl-btn" type="button" data-k="${k}" aria-pressed="false"><canvas aria-hidden="true"></canvas><span>${TPL_META[k].name}<br><span class="mono" style="color:var(--ink-2)">${dur(k)}</span></span></button>`).join('');
    $$('#tplGrid .tpl-btn').forEach(b => Eng.mount($('canvas', b), { tpl: () => b.dataset.k, opts }));
    function syncTpl() { $$('#tplGrid .tpl-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === tpl()))); meter(); }
    $('#tplGrid').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) useTemplate(b.dataset.k); });
    function useTemplate(k) { snap(); S.scenes[S.sel].tpl = k; it.t = 0; syncTpl(); renderScenes(); refreshAll(); }
    const STY = ['Headline & Sub', 'Line by Line', 'Keyword', 'Captions', 'Marker', 'Big Number', 'Quote', 'Lower Third'];
    $('#styleChips').innerHTML = STY.map((s, i) => `<button class="chip" type="button" aria-pressed="${i === 0}">${s}</button>`).join('');
    $('#styleChips').addEventListener('click', e => { const c = e.target.closest('.chip'); if (!c) return; $$('#styleChips .chip').forEach(x => x.setAttribute('aria-pressed', String(x === c))); S.style = c.textContent; refreshAll(); });
    $('#easeChips').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) $$('#easeChips .chip').forEach(x => x.setAttribute('aria-pressed', String(x === c))); });
    const sliderFill = s => s.style.setProperty('--p', ((s.value - s.min) / (s.max - s.min) * 100) + '%');
    $$('.studio .slider').forEach(s => { sliderFill(s); s.addEventListener('input', () => sliderFill(s)); });
    $('#speed').addEventListener('input', e => { S.speed = e.target.value / 100; $('#speedVal').textContent = S.speed.toFixed(1) + '×'; meter(); });
    $('#safeSw').addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-checked') !== 'true'; e.currentTarget.setAttribute('aria-checked', String(on)); $('#canvasWrap').classList.toggle('show-safe', on); });
    $('#beatSw').addEventListener('click', e => { const s = e.currentTarget; s.setAttribute('aria-checked', String(s.getAttribute('aria-checked') !== 'true')); });
    $('#bpm').addEventListener('input', e => ($('#bpmVal').textContent = e.target.value));
    $('#audioFile').addEventListener('change', e => { const f = e.target.files[0]; if (f) { $('#audioName').textContent = f.name; toast('המוזיקה נוספה.', 'Music added.', 'i-music'); } });
    function renderPals() { $('#palettes').innerHTML = PALS.map(p => `<button class="cswatch" type="button" data-p="${p.id}" aria-pressed="${S.pal.id === p.id}"><span class="dot2" style="background:conic-gradient(${p.ink} 0 50%, ${p.accent} 50% 75%, ${p.paper} 75%)"></span><span class="n">${L(p.he, p.en)}</span></button>`).join(''); }
    renderPals();
    $('#palettes').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (!b) return; snap(); S.pal = Object.assign({}, PALS.find(p => p.id === b.dataset.p)); renderPals(); refreshAll(); });
    dropzone($('#stDrop'), $('#stFile'), img => {
      S.logoImg = img; const p = extractPalette(img);
      if (p) { const i = PALS.findIndex(x => x.id === 'logo'); const entry = Object.assign({ id: 'logo', he: 'מהלוגו שלכם', en: 'From your logo' }, p); if (i >= 0) PALS[i] = entry; else PALS.unshift(entry); S.pal = Object.assign({}, entry); renderPals(); }
      toast('הלוגו נכנס. הפלטה יצאה.', 'Logo in. Palette out.'); refreshAll();
    });
    $('#modeSeg').addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (!b) return; S.mode = b.dataset.mode; $$('#modeSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); $$('.pro-only').forEach(x => (x.hidden = S.mode !== 'pro')); refreshAll(); });
    $('#fmtSeg').addEventListener('click', e => { const b = e.target.closest('[data-fmt]'); if (!b) return; snap(); S.format = b.dataset.fmt; $$('#fmtSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); sizeCanvas(); refreshAll(); });
    function setPlaying(p) {
      S.playing = p; it.paused = !p; it.dirty = true; const b = $('#playBtn');
      b.querySelector('use').setAttribute('href', p ? '#i-pause' : '#i-play'); b.dataset.labelHe = p ? 'השהיה' : 'ניגון'; b.dataset.labelEn = p ? 'Pause' : 'Play';
      b.setAttribute('aria-label', lang() === 'he' ? b.dataset.labelHe : b.dataset.labelEn);
    }
    setPlaying(S.playing);
    $('#playBtn').addEventListener('click', () => setPlaying(!S.playing));
    const scrub = $('#scrub');
    const seek = x => { const r = scrub.getBoundingClientRect(); let p = (x - r.left) / r.width; if (root.dir === 'rtl') p = 1 - p; it.t = clamp(p, 0, .999) * Eng.T[tpl()].D; it.dirty = true; };
    let drag = false;
    scrub.addEventListener('pointerdown', e => { drag = true; scrub.setPointerCapture(e.pointerId); seek(e.clientX); });
    scrub.addEventListener('pointermove', e => drag && seek(e.clientX));
    scrub.addEventListener('pointerup', () => (drag = false));
    scrub.addEventListener('keydown', e => {
      const D = Eng.T[tpl()].D, f = root.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight', b = root.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === f) it.t = Math.min(D - .01, it.t + D / 20); else if (e.key === b) it.t = Math.max(0, it.t - D / 20); else if (e.key === ' ') setPlaying(!S.playing); else return;
      e.preventDefault(); it.dirty = true;
    });
    $('#canvasBox').addEventListener('click', () => $('#canvasBox').classList.toggle('sel'));
    $('#undoBtn').addEventListener('click', () => {
      const h = hist.pop(); if (!h) { toast('אין מה לבטל.', 'Nothing to undo.', 'i-undo'); return; }
      Object.assign(S, JSON.parse(h)); if (S.sel >= S.scenes.length) S.sel = 0;
      syncInputs(); syncTpl(); renderScenes(); renderPals(); sizeCanvas(); refreshAll();
      $$('#fmtSeg button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.fmt === S.format)));
    });
    let variant = 0;
    $('#createBtn').addEventListener('click', e => {
      const b = e.currentTarget; b.classList.add('is-loading');
      setTimeout(() => {
        b.classList.remove('is-loading');
        const V = [['softRise', 'בטוחה', 'safe'], ['beatSlam', 'נועזת', 'bold'], ['diagonalWipe', 'מפתיעה', 'surprising']][variant++ % 3];
        useTemplate(V[0]); setPlaying(true);
        toast(`נוצרה גרסה ${V[1]}: ${TPL_META[V[0]].name}`, `Created a ${V[2]} take: ${TPL_META[V[0]].name}`, 'i-wand');
      }, 700);
    });
    const refreshBrief = briefPanel($('#studioBrief'), state);
    $('#copyStudio').addEventListener('click', () => $('#studioBrief .copy-btn').click());
    async function record(setP) {
      if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) throw new Error('unsupported');
      const [w, h] = FORMATS[S.format], k = 720 / Math.min(w, h);
      const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
      const ctx = c.getContext('2d'), key = tpl(), T = Eng.T[key], o = opts();
      const mime = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
      if (!mime) throw new Error('no codec');
      T.draw(ctx, c.width, c.height, 0, o);
      const rec = new MediaRecorder(c.captureStream(30), { mimeType: mime, videoBitsPerSecond: 8e6 }), chunks = [];
      rec.ondataavailable = e => e.data.size && chunks.push(e.data);
      const done = new Promise(res => (rec.onstop = res)); rec.start();
      await new Promise(res => { const start = performance.now(); (function lp(now) { const t = (now - start) / 1000; if (t >= T.D) { setP(1); return res(); } T.draw(ctx, c.width, c.height, t, o); setP(t / T.D); requestAnimationFrame(lp); })(start); });
      rec.stop(); await done;
      const ext = mime.includes('mp4') ? 'mp4' : 'webm', blob = new Blob(chunks, { type: mime.split(';')[0] });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `only-story-${key}.${ext}`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
      if (ext === 'mp4') toast(`הקובץ מוכן: only-story-${key}.mp4`, `File ready: only-story-${key}.mp4`);
      else toast(`הדפדפן הזה מקודד WebM בלבד. הקובץ מוכן: only-story-${key}.webm`, `This browser encodes WebM only. File ready: only-story-${key}.webm`, 'i-film');
    }
    const exp = exportPanel($('#exportPanel'), record);
    $('#downloadBtn').addEventListener('click', () => $('[data-go]', exp.el).click());
    function refreshAll() { Eng.invalidate(); refreshBrief(); $('#exportPanel [data-spec]').textContent = `MP4 · H.264 · ${FORMATS[S.format].join('×')}`; meter(); }
    onLang(() => { defaults(); syncInputs(); refreshAll(); setPlaying(S.playing); });
    syncInputs(); syncTpl(); renderScenes();
    hooks.studio = () => requestAnimationFrame(sizeCanvas);
  })();

  /* ========== SYSTEM ========== */
  (function system() {
    const STATES = [['default', 'ברירת מחדל', 'Default'], ['hover', 'ריחוף', 'Hover'], ['focus', 'פוקוס', 'Focus'], ['selected', 'נבחר', 'Selected'], ['disabled', 'מושבת', 'Disabled'], ['loading', 'טעינה', 'Loading']];
    const sc = s => ({ hover: 'is-hover', focus: 'is-focus', selected: 'is-selected', loading: 'is-loading' }[s] || '');
    const dis = s => (s === 'disabled' ? 'disabled' : '');
    const grid = (render, list = STATES, cols = '') => `<div class="states ${cols}">${list.map(([s, he, en]) => `<div class="state">${render(s)}<span class="mono">${L(he, en)}</span></div>`).join('')}</div>`;
    const blk = (id, n, he, en, dhe, den, body) => `<section class="grid blk" id="${id}"><div class="bh"><span class="label">${n}</span><h2 class="lg">${L(he, en)}</h2><p class="body">${L(dhe, den)}</p></div><div class="bb">${body}</div></section>`;
    const pass = r => `<span class="pass ${r >= 4.5 ? 'ok' : ''}">${r >= 4.5 ? 'AA ' : r >= 3 ? 'AA Large ' : ''}${r.toFixed(2)}</span>`;
    const COLORS = [['--paper', 'נייר', 'Paper', '#F2F0EA'], ['--ink', 'דיו', 'Ink', '#0F0F0E'], ['--ink-2', 'טקסט משני', 'Secondary', '#5E5D58'], ['--accent', 'שרטרז', 'Chartreuse', '#D5FF5F'], ['--paper-2', 'נייר 2', 'Paper 2', '#E8E5DC'], ['--inv-2', 'משני על דיו', 'Secondary on ink', '#9C9A92'], ['--accent-deep', 'מבטא לקווים', 'Accent for lines', '#6E8F0A'], ['--inv-bg (dark)', 'מקטע כהה, מצב כהה', 'Ink section, dark mode', '#1C1D19']];
    const C = [];
    C.push(blk('s-logo', '01', 'לוגו', 'Logo', 'הסמל תמיד לפני הלוגו, משמאל לימין, גם בעמוד בעברית. בניווט הוא יושב בצד שמאל. שחור או לבן בלבד.', 'The symbol always comes before the wordmark, left to right, even on a Hebrew page. In the navigation it sits on the left. Black or white only.',
      `<div class="logo-do">
        <div><div class="lock"><svg viewBox="0 0 963.2 156" style="fill:var(--ink)" role="img" aria-label="ONLY STORY"><use href="#os-lock"/></svg></div><span class="mono">${L('נכון · סמל ואז לוגו, בצד שמאל', 'Correct · symbol then wordmark, on the left')}</span></div>
        <div style="background:#0F0F0E"><div class="lock"><svg viewBox="0 0 963.2 156" style="fill:#F2F0EA" role="img" aria-label="ONLY STORY"><use href="#os-lock"/></svg></div><span class="mono" style="color:#9C9A92">${L('נכון · לבן על דיו', 'Correct · white on ink')}</span></div>
        <div><div class="lock" style="opacity:.3"><svg viewBox="0 0 963.2 156" style="fill:var(--ink)" aria-hidden="true"><use href="#os-wm" width="764.22" height="96.43" y="30"/><use href="#os-sym" x="806" width="156.92" height="155.88"/></svg></div><span class="mono">${L('לא · הסמל אחרי הלוגו', 'No · symbol after the wordmark')}</span></div>
        <div><div class="lock" style="opacity:.5"><svg viewBox="0 0 963.2 156" aria-hidden="true" style="fill:#D5FF5F"><use href="#os-lock"/></svg></div><span class="mono">${L('לא · בצבע המבטא', 'No · in the accent color')}</span></div>
      </div>`));
    C.push(blk('s-color', '02', 'צבע', 'Color', 'נייר, דיו ומבטא אחד. המבטא עובד כמו מדגש: מילה אחת, כפתור אחד, ראש קריאה. היחסים מחושבים כאן בזמן אמת.', 'Paper, ink and one accent. The accent works like a highlighter: one word, one button, one playhead. Ratios are computed live here.',
      `<div class="sw-grid">${COLORS.map(([k, he, en, hex]) => `<div class="sw"><div class="c" style="background:${hex}"></div><div class="r"><b style="color:var(--ink);font-weight:500;font-size:14px">${L(he, en)}</b><span class="mono">${hex}</span></div><div class="r"><span class="mono">${k}</span></div><div class="r"><span>${L('מול נייר', 'on paper')}</span>${pass(contrast(hex, '#F2F0EA'))}</div><div class="r"><span>${L('מול דיו', 'on ink')}</span>${pass(contrast(hex, '#0F0F0E'))}</div></div>`).join('')}</div>`));
    const TYPE = [['Mega', '220 / .84 · 500 · −6%', 'ts-mega', 'Start.', 'להתחיל.'], ['XL', '128 / .9 · 500 · −5%', 'ts-xl', 'League-level.', 'ברמת ליגה.'], ['L', '72 / .98 · 500 · −4%', 'ts-lg', 'Twelve chapters.', 'שנים־עשר פרקים.'], ['M', '30 / 1.15 · 500', 'ts-md', 'Type that holds a screen', 'טיפוגרפיה שמחזיקה מסך'], ['Body', '17 / 1.6 · 400', 'ts-body', 'Websites that look like studio work, and motion that stops the scroll.', 'אתרים שנראים כמו עבודה של סטודיו, וסרטונים שעוצרים את הגלילה.'], ['Small', '14 / 1.5 · 400', 'ts-small', 'Rendering runs on your device.', 'הרינדור רץ במכשיר שלכם.'], ['Label', '12 · Code · +8%', 'ts-label', 'Chapter 01 · Web', 'פרק 01 · אתרים']];
    C.push(blk('s-type', '03', 'טיפוגרפיה', 'Type', 'Google Sans לכל דבר, בעברית ובאנגלית. כותרות במשקל 500 עם ריווח הדוק, ותוויות קטנות ב־Google Sans Code. הניגוד בין ענק לזעיר הוא ההיררכיה.', 'Google Sans for everything, Hebrew and English. Headlines at weight 500 with tight tracking, small labels in Google Sans Code. The contrast between huge and tiny is the hierarchy.',
      TYPE.map(([n, spec, cls, en, he]) => `<div class="type-row"><div class="k"><span class="label">${n}</span><span class="mono" style="color:var(--ink-2)">${spec}</span></div><div class="${cls}" lang="en">${en}</div><div class="${cls}" lang="he">${he}</div></div>`).join('')));
    C.push(blk('s-grid', '04', 'גריד וריווח', 'Grid & spacing', '12 עמודות ברוחב מלא, מרווח של 24px ושוליים של 2.6vw. הריווח נבנה על בסיס 4px, עם קפיצות גדולות בין מקטעים.', 'Twelve full-bleed columns, 24px gutters and 2.6vw margins. Spacing builds on 4px, with big jumps between sections.',
      `<div class="grid-demo" aria-hidden="true">${'<i></i>'.repeat(12)}</div>` + [4, 8, 12, 16, 24, 32, 48, 64, 96, 140].map(v => `<div class="space-row"><span class="mono">${v}px</span><i style="width:${Math.min(100, v / 140 * 100)}%"></i></div>`).join('')));
    const supportsLinear = window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)');
    const pts = []; for (let i = 0; i <= 40; i++) pts.push(Eng.E.elastic(i / 40).toFixed(3));
    const elastic = supportsLinear ? `linear(${pts.join(', ')})` : 'cubic-bezier(.5, 1.8, .4, .8)';
    const bez = (a, b, c, d) => { let s = ''; for (let i = 0; i <= 40; i++) { const t = i / 40, u = 1 - t; const x = 3 * u * u * t * a + 3 * u * t * t * c + t * t * t, y = 3 * u * u * t * b + 3 * u * t * t * d + t * t * t; s += (i ? 'L' : 'M') + (x * 100).toFixed(2) + ' ' + (100 - y * 100).toFixed(2); } return s; };
    let ed = ''; for (let i = 0; i <= 80; i++) { const x = i / 80; ed += (i ? 'L' : 'M') + (x * 100).toFixed(2) + ' ' + (100 - Eng.E.elastic(x) * 100).toFixed(2); }
    const M = [['expo-out', 'cubic-bezier(.19, 1, .22, 1)', bez(.19, 1, .22, 1), 'var(--e)', 'ממשק, חשיפות, ריחוף. 600–1300ms.', 'Interface, reveals, hover. 600–1300ms.'], ['in-out', 'cubic-bezier(.77, 0, .18, 1)', bez(.77, 0, .18, 1), 'var(--e-io)', 'מעבר עמוד: מסך דיו לאורך האלכסון.', 'Page change: an ink panel along the diagonal.'], ['elastic', supportsLinear ? 'linear(… 41 stops)' : 'fallback', ed, elastic, 'רק בתוך סרטונים, ובמשורה.', 'Only inside videos, and sparingly.']];
    C.push(blk('s-motion', '05', 'תנועה', 'Motion', 'תנועה איטית ובטוחה: מהירה בהתחלה, נחה בסוף. בגלילה הכל צמוד לגלילה עצמה, כך שהקורא תמיד שולט בקצב.', 'Slow, confident motion: fast at first, settling at the end. On scroll, everything is tied to the scroll itself, so the reader always controls the pace.',
      `<div class="motion-grid" id="motionGrid">${M.map(([n, v, d, ease, he, en]) => `<div class="mcard"><div style="display:flex;justify-content:space-between;gap:8px"><span class="label">${n}</span><span class="mono" style="color:var(--ink-2)">${v}</span></div><svg class="curve" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="g" d="M0 100 L100 100 M0 0 L100 0"/><path class="c" d="${d}"/></svg><div class="mtrack" style="--ease:${ease}"><span class="mdot"></span></div><p class="small" style="margin:0">${L(he, en)}</p></div>`).join('')}</div>
       <button class="btn btn-line sm no-arr" type="button" id="replayMotion" style="justify-self:start">${RL('להריץ שוב', 'Replay')}</button>`));
    C.push(blk('s-buttons', '06', 'כפתורים', 'Buttons', 'שלושה כפתורים: מבטא לפעולה הראשית, דיו למשנית, וקו לשלישית. בריחוף, צבע עולה מלמטה, הטקסט מתגלגל והחץ מסתובב לאלכסון.', 'Three buttons: accent for the main action, ink for the second, line for the third. On hover, color rises from below, the label rolls and the arrow turns to the diagonal.',
      [['btn-accent', 'מבטא', 'Accent'], ['btn-ink', 'דיו', 'Ink'], ['btn-line', 'קו', 'Line']].map(([c, he, en]) => `<span class="spec-label">${L(he, en)}</span>` + grid(s => `<button class="btn ${c} sm ${sc(s)}" type="button" ${dis(s)} tabindex="-1">${RL('להתחיל', 'Start')}${ARR}</button>`)).join('') +
      `<span class="spec-label">${L('אייקון וקישור', 'Icon & link')}</span>` + grid(s => (s === 'loading' ? `<a class="link" href="#s-buttons">${L('לכל השיעורים', 'All lessons')}</a>` : `<button class="ibtn ${sc(s)}" type="button" ${dis(s)} tabindex="-1" aria-label="Copy">${ic('i-copy')}</button>`), [STATES[0], STATES[1], STATES[2], STATES[3], STATES[4], ['loading', 'קישור', 'Link']])));
    C.push(blk('s-inputs', '07', 'שדות ובקרים', 'Inputs & controls', 'שדות עם קו דק שמתעבה בפוקוס, צ׳יפים לבחירה מהירה, ומתג שמתמלא בדיו עם ידית במבטא.', 'Fields with a thin line that thickens on focus, chips for quick choices, and a switch that fills with ink and an accent knob.',
      grid(s => `<input class="input ${s === 'hover' ? 'is-hover' : s === 'focus' ? 'is-focus' : ''}" type="text" tabindex="-1" aria-label="Sample field" ${dis(s)} value="${s === 'selected' ? 'hello@studio.co' : ''}" placeholder="Email">`, [STATES[0], STATES[1], STATES[2], ['selected', 'מלא', 'Filled'], STATES[4]], 'c3') +
      grid(s => `<button class="chip ${sc(s)}" type="button" tabindex="-1" ${dis(s)} ${s === 'selected' ? 'aria-pressed="true"' : ''}>${L('מושן', 'Motion')}</button>`, STATES.slice(0, 5), 'c3') +
      `<div class="spec-row"><div class="seg" role="group" id="sysSeg"><button type="button" aria-pressed="true">${L('פשוט', 'Simple')}</button><button type="button" aria-pressed="false">Pro</button></div><span class="switch-wrap"><button class="switch" type="button" role="switch" aria-checked="true" id="sysSw" aria-label="Toggle"></button>${L('פועל', 'On')}</span><span class="switch-wrap"><button class="switch" type="button" role="switch" aria-checked="false" disabled aria-label="Disabled"></button><span style="color:var(--ink-2)">${L('מושבת', 'Disabled')}</span></span></div>
       <div class="field" style="max-width:420px"><label for="sysSlider"><span>${L('משך', 'Duration')}</span><span class="mono" id="sysSliderVal">00:05</span></label><input class="slider" type="range" id="sysSlider" min="2" max="15" value="5"></div>`));
    C.push(blk('s-learn', '08', 'רכיבי למידה', 'Learning parts', 'שורת שיעור שמתמלאת במבטא בריחוף, פריט בתוכן העניינים עם מצב התקדמות, וראש הקריאה של הנגן.', 'A lesson row that fills with the accent on hover, an outline item with progress state, and the player playhead.',
      `<div style="border-top:1px solid var(--line)"><a class="lrow" href="#learn"><span class="mono">01</span><span class="t">${L('היררכיה: מה רואים ראשון', 'Hierarchy: what you see first')}</span><span class="small trk">${L('אתרים', 'Web')}</span><span class="mono dur">18:40</span><svg class="ic arrow flip" aria-hidden="true"><use href="#i-arrow"/></svg></a></div>
       <div class="panel"><div class="outline" style="margin-top:-14px"><h4>${L('מצבי שיעור', 'Lesson states')}</h4><span class="oitem done"><span class="st">${ic('i-check')}</span><span>${L('הושלם', 'Complete')}</span><span class="mono">16:05</span></span><span class="oitem" aria-current="true"><span class="st"></span><span>${L('נוכחי', 'Current')}</span><span class="mono">18:40</span></span><span class="oitem"><span class="st"></span><span>${L('הבא בתור', 'Up next')}</span><span class="mono">22:10</span></span></div></div>
       <div class="pcontrols" style="border-radius:var(--r-m)"><span class="ibtn" aria-hidden="true">${ic('i-pause', 'fill')}</span><div class="ptrack" style="--p:42%" aria-hidden="true"><div class="rail"></div><div class="fill"></div><span class="mk" style="inset-inline-start:25%"></span><span class="mk" style="inset-inline-start:50%"></span><span class="mk" style="inset-inline-start:75%"></span><div class="ph"></div></div><span class="mono">07:50 / 18:40</span></div>
       <div class="progress" style="--p:33%"><i></i></div>`));
    C.push(blk('s-feedback', '09', 'משוב', 'Feedback', 'הודעה קצרה בדיו, דיאלוג לאישור, מגירה תחתונה לטלפון, ופאנל ייצוא עם ראש קריאה.', 'A short ink toast, a dialog to confirm, a bottom sheet for phones, and an export panel with a playhead.',
      `<div class="spec-row"><button class="btn btn-line sm no-arr" type="button" id="sToast">${RL('להציג הודעה', 'Show toast')}</button><button class="btn btn-line sm no-arr" type="button" id="sDlg">${RL('לפתוח דיאלוג', 'Open dialog')}</button><button class="btn btn-line sm no-arr" type="button" id="sSheet">${RL('לפתוח מגירה', 'Open bottom sheet')}</button></div>
       <div class="toast static" style="justify-self:start"><span class="b">${ic('i-check')}</span><span>${L('הבריף הועתק. אפשר להדביק אותו.', 'Brief copied. Ready to paste.')}</span></div>
       <div class="panel export" id="sysExport" style="max-width:420px"></div>`));
    $('#sysList').innerHTML = C.join('');
    rollify($('#sysList'));
    $$('#sysList .slider').forEach(s => { const f = () => s.style.setProperty('--p', ((s.value - s.min) / (s.max - s.min) * 100) + '%'); f(); s.addEventListener('input', f); });
    $('#sysSlider').addEventListener('input', e => ($('#sysSliderVal').textContent = '00:' + String(e.target.value).padStart(2, '0')));
    $('#sysSw').addEventListener('click', e => e.currentTarget.setAttribute('aria-checked', String(e.currentTarget.getAttribute('aria-checked') !== 'true')));
    $('#sysSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) $$('#sysSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    exportPanel($('#sysExport'), simulate);
    $('#sToast').addEventListener('click', () => toast('נשמר במכשיר.', 'Saved on this device.'));
    const dlg = $('#dlg');
    $('#sDlg').addEventListener('click', () => (dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '')));
    $$('[data-close-dlg]').forEach(b => b.addEventListener('click', () => (dlg.close ? dlg.close() : dlg.removeAttribute('open'))));
    const sheet = $('#sheet'), scrim = $('#scrim'); let ret = null;
    const close = () => { sheet.classList.remove('on'); scrim.classList.remove('on'); if (ret) ret.focus(); };
    $('#sSheet').addEventListener('click', () => { ret = document.activeElement; sheet.classList.add('on'); scrim.classList.add('on'); setTimeout(() => $('.opt', sheet).focus(), 80); });
    scrim.addEventListener('click', close); $('[data-close-sheet]').addEventListener('click', close);
    $('#sheetOpts').addEventListener('click', e => { const b = e.target.closest('.opt'); if (b) $$('#sheetOpts .opt').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('on')) close(); });
    let on = false, timer;
    const flip = () => { on = !on; $$('#motionGrid .mtrack').forEach(t => t.classList.toggle('go', on)); };
    const loop = () => { clearInterval(timer); if (!RM()) timer = setInterval(flip, 1900); };
    $('#replayMotion').addEventListener('click', () => { $$('#motionGrid .mtrack').forEach(t => t.classList.remove('go')); on = false; setTimeout(flip, 60); loop(); });
    hooks.system = () => { setTimeout(flip, 300); loop(); };
  })();

  window.OS = { L, RL, toast, copyText, lang, onLang, rollify, hooks };

  /* ---------- boot ---------- */
  rollify();
  setTheme(store.get('theme') === 'dark' ? 'dark' : 'light', false);
  setLang(store.get('lang') === 'en' ? 'en' : 'he', false);
  route();
  const fonts = document.fonts ? ['500 40px "Google Sans"', '700 40px "Google Sans"', '400 40px "Google Sans"', '500 20px "Google Sans Code"'].map(f => document.fonts.load(f, 'אבג abc').catch(() => null)) : [];
  Promise.all([document.fonts ? document.fonts.ready : null, ...fonts]).then(() => { Eng.invalidate(); measure(); onScroll(); });
  window.addEventListener('load', () => { measure(); onScroll(); });
})();

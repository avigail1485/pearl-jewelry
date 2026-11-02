/* ONLY STORY · Brand → Site builder.
   Reads a logo, a brand book (PDF), design tokens (JSON / CSS) or images in the browser,
   turns them into a brand (palette roles, fonts, radius, logo treatment) and drives SiteGen. */
(function () {
  'use strict';
  const OS = window.OS, G = window.SiteGen;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const { L, RL, toast, copyText, lang, onLang, rollify } = OS;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const RM = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- color math ---------- */
  const hex2rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgb2hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase();
  const lum = h => hex2rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0);
  const contrast = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A, B) + .05) / (Math.min(A, B) + .05); };
  function hsl(h) { let [r, g, b] = hex2rgb(h).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let H = 0, S = 0; const Lt = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; S = Lt > .5 ? d / (2 - mx - mn) : d / (mx + mn); H = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; H *= 60; } return [H, S, Lt]; }
  function fromHsl(H, S, Lt) { const k = n => (n + H / 30) % 12, a = S * Math.min(Lt, 1 - Lt), f = n => Lt - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return rgb2hex(f(0) * 255, f(8) * 255, f(4) * 255); }
  const dist = (a, b) => { const A = hex2rgb(a), B = hex2rgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
  function mergeColors(list) {
    const out = [];
    list.forEach(({ hex, w }) => { const m = out.find(o => dist(o.hex, hex) < 30); if (m) m.w += w; else out.push({ hex, w }); });
    return out.sort((a, b) => b.w - a.w);
  }
  function parseColorStrings(text) {
    const found = [];
    (text.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).forEach(h => found.push({ hex: rgb2hex(...hex2rgb(h)), w: 3 }));
    (text.match(/rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}/g) || []).forEach(s => { const [r, g, b] = s.match(/\d{1,3}/g).map(Number); found.push({ hex: rgb2hex(r, g, b), w: 3 }); });
    (text.match(/\bR\s*[:=]?\s*(\d{1,3})\s*G\s*[:=]?\s*(\d{1,3})\s*B\s*[:=]?\s*(\d{1,3})/gi) || []).forEach(s => { const [r, g, b] = s.match(/\d{1,3}/g).map(Number); found.push({ hex: rgb2hex(r, g, b), w: 3 }); });
    (text.match(/\bHEX\s*[:#]?\s*([0-9a-fA-F]{6})\b/gi) || []).forEach(s => found.push({ hex: '#' + s.slice(-6).toUpperCase(), w: 4 }));
    return found;
  }

  /* ---------- fonts ---------- */
  const SUBS = { helvetica: 'Inter Tight', arial: 'Inter Tight', futura: 'Archivo', gotham: 'Manrope', circular: 'Manrope', avenir: 'Manrope', proxima: 'Manrope', 'sf pro': 'Inter Tight', garamond: 'Fraunces', caslon: 'Fraunces', times: 'Playfair Display', didot: 'DM Serif Display', bodoni: 'DM Serif Display', canela: 'Instrument Serif', narkis: 'Frank Ruhl Libre', david: 'Frank Ruhl Libre', almoni: 'Heebo', ploni: 'Rubik', simona: 'Assistant', 'arial hebrew': 'Heebo', 'open sans hebrew': 'Assistant', 'noto sans': 'Noto Sans Hebrew' };
  const EXTRA = ['Montserrat', 'Poppins', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'DM Sans', 'Work Sans', 'Outfit', 'Jost', 'Lora', 'Merriweather', 'Cormorant Garamond'];
  EXTRA.forEach(f => { if (!G.FONTS[f]) G.FONTS[f] = ['wght@400;700', /Lora|Merriweather|Cormorant/.test(f) ? 'serif' : 'sans']; });
  function detectFonts(text) {
    const t = ' ' + text.toLowerCase().replace(/[_-]/g, ' ') + ' ', hits = [];
    Object.keys(G.FONTS).forEach(f => { const i = t.indexOf(f.toLowerCase()); if (i >= 0) hits.push({ font: f, i, sub: null }); });
    Object.keys(SUBS).forEach(k => { const i = t.indexOf(' ' + k); if (i >= 0 && !hits.some(h => h.font === SUBS[k])) hits.push({ font: SUBS[k], i, sub: k }); });
    return hits.sort((a, b) => a.i - b.i);
  }

  /* ---------- image analysis ---------- */
  function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }
  function analyzeImage(img, { weight = 1, logo = false } = {}) {
    const S = 72, c = document.createElement('canvas'), r = Math.min(1, S / Math.max(img.width || S, img.height || S));
    c.width = Math.max(1, Math.round((img.width || S) * r)); c.height = Math.max(1, Math.round((img.height || S) * r));
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
    let d; try { d = x.getImageData(0, 0, c.width, c.height).data; } catch (e) { return { colors: [], lum: .5, opaque: true }; }
    const buckets = {}; let opaque = true, ls = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 200) { opaque = false; if (d[i + 3] < 100) continue; }
      const k = [d[i] >> 3, d[i + 1] >> 3, d[i + 2] >> 3].join(',');
      buckets[k] = (buckets[k] || 0) + 1;
      ls += (.2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]) / 255; n++;
    }
    let colors = Object.entries(buckets).map(([k, w]) => ({ hex: rgb2hex(...k.split(',').map(v => v * 8 + 4)), w: w / Math.max(1, n) * 100 * weight }));
    colors = mergeColors(colors).slice(0, 10);
    // the logo's own ink, ignoring a white background
    const ink = colors.filter(c2 => !(lum(c2.hex) > .85 && hsl(c2.hex)[1] < .2));
    const inkLum = ink.length ? ink.reduce((a, c2) => a + lum(c2.hex) * c2.w, 0) / ink.reduce((a, c2) => a + c2.w, 0) : ls / Math.max(1, n);
    return { colors, lum: inkLum, opaque, logo };
  }
  async function removeWhiteBg(img) {
    const max = 900, r = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
    let id; try { id = x.getImageData(0, 0, c.width, c.height); } catch (e) { return null; }
    const d = id.data, corner = [0, (c.width - 1) * 4, (c.height - 1) * c.width * 4, (c.height * c.width - 1) * 4];
    const cs = corner.map(i => [d[i], d[i + 1], d[i + 2]]);
    const bg = cs[0]; if (!cs.every(p => Math.hypot(p[0] - bg[0], p[1] - bg[1], p[2] - bg[2]) < 20) || (bg[0] + bg[1] + bg[2]) / 3 < 200) return null;
    for (let i = 0; i < d.length; i += 4) { const dd = Math.hypot(d[i] - bg[0], d[i + 1] - bg[1], d[i + 2] - bg[2]); if (dd < 26) d[i + 3] = 0; else if (dd < 60) d[i + 3] = Math.round(d[i + 3] * (dd - 26) / 34); }
    x.putImageData(id, 0, 0);
    return c.toDataURL('image/png');
  }

  /* ---------- file readers ---------- */
  const readText = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(f); });
  const readURL = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
  let pdfjsP = null;
  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfjsP) return pdfjsP;
    const base = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
    pdfjsP = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = base + 'pdf.min.js';
      s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.js'; res(window.pdfjsLib); };
      s.onerror = () => rej(new Error('pdf.js'));
      document.head.appendChild(s);
    });
    return pdfjsP;
  }
  async function readPDF(file, progress) {
    const lib = await loadPdfJs();
    const pdf = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages = Math.min(pdf.numPages, 24);
    let text = ''; const colors = []; let cover = null;
    for (let i = 1; i <= pages; i++) {
      progress(i, pages);
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent(); text += ' ' + tc.items.map(t => t.str).join(' ');
      if (i <= 8) {
        const vp = page.getViewport({ scale: .35 }), c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
        await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        if (i === 1) cover = c.toDataURL('image/jpeg', .7);
        analyzeImage(c, { weight: i === 1 ? 1.4 : 1 }).colors.forEach(col => colors.push(col));
      }
    }
    return { text, colors, pages: pdf.numPages, cover };
  }
  function walkJSON(o, acc, key = '') {
    if (o == null) return;
    if (typeof o === 'string') { acc.text += ' ' + (/font|family|typeface|type/i.test(key) ? o : ''); acc.colorText += ' ' + o; if (/radius|round/i.test(key)) { const n = parseFloat(o); if (!isNaN(n)) acc.radius.push(n); } return; }
    if (typeof o === 'number') { if (/radius|round/i.test(key)) acc.radius.push(o); return; }
    if (Array.isArray(o)) { o.forEach(v => walkJSON(v, acc, key)); return; }
    Object.keys(o).forEach(k => walkJSON(o[k], acc, k));
  }

  /* ---------- the brand state ---------- */
  const SAMPLES = [
    { id: 'nordlys', name: 'NORDLYS', domain: 'nordlys.studio', industry: 'studio', style: 'fluid', mode: 'dark', fonts: ['Syne', 'Heebo'], radius: 18,
      palette: ['#0B1026', '#4BFFB0', '#8A7CFF', '#E9F1FF'],
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 120"><circle cx="60" cy="60" r="42" fill="none" stroke="#4BFFB0" stroke-width="13"/><path d="M22 76c24-34 52-34 76 0" stroke="#8A7CFF" stroke-width="13" fill="none" stroke-linecap="round"/><text x="130" y="82" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="60" letter-spacing="8" fill="#E9F1FF">NORDLYS</text></svg>' },
    { id: 'hasade', name: 'השדה', domain: 'hasade.co.il', industry: 'food', style: 'collage', mode: 'light', fonts: ['Frank Ruhl Libre', 'Heebo'], radius: 28,
      palette: ['#E8412C', '#FFE9A8', '#1C1A17', '#3F6B3A', '#FFF8EC'],
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 140"><circle cx="70" cy="70" r="62" fill="#E8412C"/><g stroke="#FFE9A8" stroke-width="7" stroke-linecap="round" fill="none"><path d="M70 112V36"/><path d="M70 52c-12-8-18-18-18-26M70 52c12-8 18-18 18-26M70 74c-14-8-22-18-22-28M70 74c14-8 22-18 22-28M70 96c-14-8-22-18-22-28M70 96c14-8 22-18 22-28"/></g><text x="400" y="96" text-anchor="end" font-family="Georgia, serif" font-weight="700" font-size="76" fill="#1C1A17">השדה</text></svg>' },
    { id: 'volt', name: 'volt', domain: 'volt.app', industry: 'tech', style: 'grid', mode: 'light', fonts: ['Space Grotesk', 'Rubik'], radius: 14,
      palette: ['#2D5BFF', '#C6FF3D', '#0C0D10', '#F4F6FB'],
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 120"><rect x="6" y="6" width="108" height="108" rx="30" fill="#2D5BFF"/><path d="M68 18 34 66h24l-8 36 36-50H62z" fill="#C6FF3D"/><text x="136" y="88" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="76" letter-spacing="-3" fill="#0C0D10">volt</text></svg>' }
  ];

  const B = {
    sources: [], extracted: [], fonts: { display: 'Syne', body: 'Heebo' }, detectedFonts: [], radius: 18, mode: 'dark',
    roles: { bg: '#0B1026', fg: '#E9F1FF', accent: '#4BFFB0', accent2: '#8A7CFF' },
    logo: '', logoOrig: '', logoClean: '', logoLum: .5, logoMode: 'auto', cleanBg: true, pick: 'accent'
  };
  const C = { name: 'NORDLYS', domain: 'nordlys.studio', industry: 'studio', lang: 'he', h1a: '', h1b: '', sub: '' };
  const D = { style: 'fluid', intensity: 1, fx: { preloader: true, cursor: true, smooth: true, grain: true }, touched: false };
  const SECTIONS = [['hero', 'פתיח', 'Hero'], ['logo', 'זום על הלוגו', 'Logo zoom'], ['manifesto', 'מניפסט', 'Manifesto'], ['services', 'כרטיסים נערמים', 'Stacking cards'], ['gallery', 'גלריה אופקית', 'Horizontal gallery'], ['bento', 'בנטו', 'Bento grid'], ['numbers', 'מספרים', 'Numbers'], ['marquee', 'פס רץ', 'Marquee'], ['cta', 'סיום', 'Final call']];
  let order = SECTIONS.map(([id]) => ({ id, on: true }));

  function assignRoles(list, mode) {
    const cols = mergeColors(list).filter(c => c.w > .4);
    const chroma = cols.filter(c => { const [, s, l] = hsl(c.hex); return s > .28 && l > .12 && l < .9; }).sort((a, b) => b.w * hsl(b.hex)[1] - a.w * hsl(a.hex)[1]);
    const accent = chroma[0] ? chroma[0].hex : '#D5FF5F';
    const ah = hsl(accent)[0];
    const a2c = chroma.find(c => { const d = Math.abs(hsl(c.hex)[0] - ah); return Math.min(d, 360 - d) > 35; });
    const accent2 = a2c ? a2c.hex : fromHsl((ah + 150) % 360, .7, .62);
    const byLum = cols.slice().sort((a, b) => lum(a.hex) - lum(b.hex));
    let dark = byLum[0] && lum(byLum[0].hex) < .05 ? byLum[0].hex : fromHsl(ah, .18, .07);
    let light = byLum.length && lum(byLum[byLum.length - 1].hex) > .8 ? byLum[byLum.length - 1].hex : fromHsl(ah, .3, .965);
    if (contrast(dark, light) < 7) { dark = fromHsl(ah, .18, .07); light = fromHsl(ah, .3, .965); }
    return mode === 'dark' ? { bg: dark, fg: light, accent, accent2 } : { bg: light, fg: dark, accent, accent2 };
  }
  const onColor = c => (contrast(c, '#0B0B0B') >= contrast(c, '#FFFFFF') ? '#0B0B0B' : '#FFFFFF');
  function logoFilterFor(bg) {
    if (B.logoMode === 'white') return 'brightness(0) invert(1)';
    if (B.logoMode === 'black') return 'brightness(0)';
    if (B.logoMode === 'original') return 'none';
    const lb = lum(bg), ratio = (Math.max(B.logoLum, lb) + .05) / (Math.min(B.logoLum, lb) + .05);
    return ratio < 2.4 ? (lb < .4 ? 'brightness(0) invert(1)' : 'brightness(0)') : 'none';
  }
  function brandObj() {
    const r = B.roles;
    return {
      name: C.name, logo: B.logo || placeholderLogo(), fonts: B.fonts, radius: B.radius,
      colors: { bg: r.bg, fg: r.fg, accent: r.accent, accent2: r.accent2, onAccent: onColor(r.accent), onAccent2: onColor(r.accent2), isDark: lum(r.bg) < .3 },
      logoFilter: logoFilterFor(r.bg), onAccentFilter: logoFilterFor(r.accent)
    };
  }
  function placeholderLogo() {
    const n = (C.name || 'Brand').slice(0, 14);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${40 + n.length * 34} 80"><circle cx="34" cy="40" r="24" fill="${B.roles.accent}"/><text x="70" y="54" font-family="Arial" font-weight="700" font-size="44" fill="${B.roles.fg}">${n.replace(/[<&]/g, '')}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function cfg() { return { brand: brandObj(), content: Object.assign({}, C), design: { style: D.style, intensity: D.intensity, fx: Object.assign({}, D.fx) }, sections: order }; }

  /* ---------- ingest ---------- */
  async function ingest(files) {
    const list = Array.from(files);
    if (!list.length) return;
    B.sources = []; B.extracted = []; B.detectedFonts = [];
    showGen(true, true);
    let fontText = '', radii = [], logoSet = false, firstName = '';
    for (const f of list) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      const src = { name: f.name, kind: '', notes: [] };
      try {
        if (f.type === 'application/pdf' || ext === 'pdf') {
          src.kind = 'pdf';
          setGenText(L('קורא את ספר המותג…', 'Reading the brand book…'));
          const r = await readPDF(f, (i, n) => setGenText(L(`קורא את ספר המותג · עמוד ${i} מתוך ${n}`, `Reading the brand book · page ${i} of ${n}`)));
          const named = parseColorStrings(r.text);
          named.forEach(c => B.extracted.push(Object.assign(c, { w: c.w * 2 })));
          r.colors.forEach(c => B.extracted.push(c));
          fontText += ' ' + r.text;
          src.notes.push(L(r.pages === 1 ? 'עמוד אחד' : `${r.pages} עמודים`, r.pages === 1 ? '1 page' : `${r.pages} pages`), L(`${named.length} קודי צבע`, `${named.length} color codes`));
          src.thumb = r.cover;
        } else if (/^image\//.test(f.type) || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
          src.kind = /logo|לוגו|mark|symbol/i.test(f.name) || !logoSet ? 'logo' : 'image';
          const url = await readURL(f), img = await loadImage(url);
          if (ext === 'svg' || f.type === 'image/svg+xml') { const txt = await readText(f); parseColorStrings(txt).forEach(c => B.extracted.push(c)); fontText += ' ' + (txt.match(/font-family\s*[:=]\s*["']?([^;"'>]+)/gi) || []).join(' '); }
          const a = analyzeImage(img, { weight: src.kind === 'logo' ? 2 : 1, logo: true });
          a.colors.forEach(c => B.extracted.push(c));
          if (src.kind === 'logo' && !logoSet) {
            logoSet = true; B.logoOrig = url; B.logoLum = a.lum; B.logoClean = '';
            if (a.opaque && ext !== 'svg') { const clean = await removeWhiteBg(img); if (clean) { B.logoClean = clean; src.notes.push(L('הרקע הלבן הוסר', 'White background removed')); } }
            B.logo = B.cleanBg && B.logoClean ? B.logoClean : url;
            firstName = f.name.replace(/\.[^.]+$/, '').replace(/[-_]?(logo|לוגו|final|v\d+)/gi, '').replace(/[-_]+/g, ' ').trim();
          }
          src.thumb = url;
          src.notes.push(L(`${a.colors.length} צבעים`, `${a.colors.length} colors`));
        } else if (ext === 'json' || f.type === 'application/json') {
          src.kind = 'tokens';
          const acc = { text: '', colorText: '', radius: [] }; walkJSON(JSON.parse(await readText(f)), acc);
          const cs = parseColorStrings(acc.colorText); cs.forEach(c => B.extracted.push(Object.assign(c, { w: 6 })));
          fontText += ' ' + acc.text; radii = radii.concat(acc.radius);
          src.notes.push(L(`${cs.length} טוקנים של צבע`, `${cs.length} color tokens`));
        } else if (['css', 'scss', 'less', 'txt', 'md'].includes(ext) || /^text\//.test(f.type)) {
          src.kind = 'tokens';
          const txt = await readText(f), cs = parseColorStrings(txt);
          cs.forEach(c => B.extracted.push(Object.assign(c, { w: 5 })));
          fontText += ' ' + (txt.match(/font-family\s*:[^;]+/gi) || []).join(' ') + ' ' + (ext === 'css' ? '' : txt);
          (txt.match(/radius[^:]*:\s*([\d.]+)px/gi) || []).forEach(m => radii.push(parseFloat(m.split(':')[1])));
          src.notes.push(L(`${cs.length} צבעים`, `${cs.length} colors`));
        } else { src.kind = 'skip'; src.notes.push(L('סוג קובץ שלא נתמך', 'Unsupported file type')); }
      } catch (err) {
        src.kind = 'error';
        src.notes.push(err && err.message === 'pdf.js' ? L('לא הצלחנו לטעון את קורא ה־PDF. נסו שוב או העלו צילומי עמודים.', "Couldn't load the PDF reader. Try again or upload page images.") : L('לא הצלחנו לקרוא את הקובץ. נסו קובץ אחר.', "Couldn't read this file. Try another one."));
      }
      B.sources.push(src);
    }
    const fonts = detectFonts(fontText);
    B.detectedFonts = fonts;
    if (fonts[0]) { B.fonts.display = fonts[0].font; B.fonts.body = (fonts[1] || fonts[0]).font; }
    if (C.lang === 'he' && !G.HEBREW_OK.includes(B.fonts.body)) B.fonts.body = 'Heebo';
    if (radii.length) B.radius = clamp(Math.round(radii.sort((a, b) => a - b)[Math.floor(radii.length / 2)]), 0, 40);
    if (!B.extracted.length && !logoSet) { showGen(false); toast('לא מצאנו בקבצים צבעים או לוגו. נסו PNG, SVG, PDF או JSON.', 'No colors or logo found. Try a PNG, SVG, PDF or JSON.', 'i-x'); renderBrand(); return; }
    if (!logoSet) B.logo = '';
    const darkLogo = B.logoLum > .55;
    B.mode = darkLogo ? 'dark' : 'light';
    B.roles = assignRoles(B.extracted, B.mode);
    if (firstName && !C.nameTouched) C.name = firstName.length > 22 ? firstName.slice(0, 22) : firstName;
    if (!C.domainTouched) C.domain = slug(C.name) + (C.lang === 'he' ? '.co.il' : '.com');
    if (!D.touched) D.style = suggestStyle();
    B.sample = null;
    syncAll();
    await runGen();
  }
  function slug(s) { const t = (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); return t || 'brand'; }
  function suggestStyle() {
    const [h, s] = hsl(B.roles.accent), dark = lum(B.roles.bg) < .3;
    if (s < .35) return 'kinetic';
    if (dark) return 'fluid';
    if ((h < 50 || h > 330) && s > .5) return 'collage';
    return 'grid';
  }
  async function loadSample(s) {
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s.svg);
    const img = await loadImage(url);
    const a = analyzeImage(img, { weight: 2, logo: true });
    B.sources = [{ name: `${s.id}-logo.svg`, kind: 'logo', thumb: url, notes: [L(`${a.colors.length} צבעים`, `${a.colors.length} colors`)] }, { name: `${s.id}-brand-book.pdf`, kind: 'pdf', notes: [L('פלטה וגופנים מספר המותג לדוגמה', 'Palette and fonts from the sample brand book')] }];
    B.extracted = s.palette.map((hex, i) => ({ hex, w: 10 - i })).concat(a.colors);
    B.logo = B.logoOrig = url; B.logoClean = ''; B.logoLum = a.lum; B.logoMode = 'auto';
    B.fonts = { display: s.fonts[0], body: s.fonts[1] }; B.radius = s.radius; B.mode = s.mode;
    B.detectedFonts = s.fonts.map(f => ({ font: f }));
    const p = s.palette, darkest = p.slice().sort((x, y) => lum(x) - lum(y))[0], lightest = p.slice().sort((x, y) => lum(y) - lum(x))[0];
    B.roles = s.mode === 'dark' ? { bg: darkest, fg: lightest, accent: p[1], accent2: p[2] } : { bg: lightest, fg: darkest, accent: p[0], accent2: p[1] === lightest ? p[3] : p[1] };
    C.name = s.name; C.domain = s.domain; C.industry = s.industry; C.h1a = C.h1b = C.sub = '';
    D.style = s.style; B.sample = s.id;
    syncAll();
  }

  /* ---------- UI: build the workspace ---------- */
  const panes = {
    brand: () => `
      <div class="mk-sec"><span class="label">${L('מה קראנו', 'What we read')}</span><div id="mkSources" class="mk-sources"></div></div>
      <div class="mk-sec"><span class="label">${L('לוגו', 'Logo')}</span><div class="mk-logos" id="mkLogos"></div>
        <div class="seg" role="group" id="mkLogoMode"><button type="button" data-v="auto">${L('אוטומטי', 'Auto')}</button><button type="button" data-v="original">${L('מקורי', 'Original')}</button><button type="button" data-v="white">${L('לבן', 'White')}</button><button type="button" data-v="black">${L('שחור', 'Black')}</button></div>
        <span class="switch-wrap" id="mkCleanWrap"><button class="switch" type="button" role="switch" id="mkClean" aria-labelledby="mkCleanL"></button><span id="mkCleanL">${L('הסרת רקע לבן מהלוגו', 'Remove the white background')}</span></span></div>
      <div class="mk-sec"><div class="mk-row"><span class="label">${L('פלטה', 'Palette')}</span><div class="seg" role="group" id="mkMode"><button type="button" data-v="light">${L('בהיר', 'Light')}</button><button type="button" data-v="dark">${L('כהה', 'Dark')}</button></div></div>
        <div id="mkRoles" class="mk-roles"></div>
        <span class="small">${L('בחרו תפקיד, ואז לחצו על צבע שמצאנו כדי להחליף:', 'Pick a role, then click a color we found to swap it in:')}</span><div id="mkFound" class="mk-found"></div></div>
      <div class="mk-sec"><span class="label">${L('גופנים', 'Type')}</span>
        <div class="field"><label for="mkFD">${L('כותרות', 'Headlines')}</label><select class="input" id="mkFD"></select></div>
        <div class="field"><label for="mkFB">${L('טקסט', 'Body')}</label><select class="input" id="mkFB"></select></div>
        <p class="small" id="mkFontNote" style="margin:0"></p></div>
      <div class="mk-sec"><div class="field"><label for="mkRadius"><span>${L('עיגול פינות', 'Corner radius')}</span><span class="mono" id="mkRadiusV"></span></label><input class="slider" type="range" id="mkRadius" min="0" max="40"></div>
        <p class="small" id="mkMood" style="margin:0"></p></div>`,
    content: () => `
      <div class="mk-sec"><div class="field"><label for="mkName">${L('שם המותג', 'Brand name')}</label><input class="input" id="mkName" maxlength="28"></div>
        <div class="field"><label for="mkDomain">${L('דומיין', 'Domain')}</label><input class="input" id="mkDomain" maxlength="40" dir="ltr"></div>
        <div class="field"><label for="mkInd">${L('תחום', 'Industry')}</label><select class="input" id="mkInd"><option value="studio">${lang() === 'he' ? 'סטודיו וקריאייטיב' : 'Studio & creative'}</option><option value="food">${lang() === 'he' ? 'אוכל ומסעדות' : 'Food & restaurants'}</option><option value="tech">${lang() === 'he' ? 'טכנולוגיה ו־SaaS' : 'Tech & SaaS'}</option><option value="fashion">${lang() === 'he' ? 'אופנה וקמעונאות' : 'Fashion & retail'}</option></select></div>
        <div class="field"><span class="lbl">${L('שפת האתר', 'Site language')}</span><div class="seg" role="group" id="mkLang"><button type="button" data-v="he">עברית</button><button type="button" data-v="en">English</button></div></div></div>
      <div class="mk-sec"><span class="label">${L('הכותרת הראשית', 'Main headline')}</span>
        <div class="field"><label for="mkH1a">${L('שורה 1', 'Line 1')}</label><input class="input" id="mkH1a" maxlength="40"></div>
        <div class="field"><label for="mkH1b">${L('שורה 2 · כוכביות סביב מילה מדגישות אותה', 'Line 2 · stars around a word highlight it')}</label><input class="input" id="mkH1b" maxlength="40"></div>
        <div class="field"><label for="mkSub">${L('משפט משנה', 'Subline')}</label><textarea class="input" id="mkSub" rows="3" maxlength="220"></textarea></div></div>
      <div class="mk-sec"><span class="label">${L('מבנה העמוד', 'Page structure')}</span><div id="mkSections" class="mk-sections"></div></div>`,
    design: () => `
      <div class="mk-sec"><span class="label">${L('כיוון עיצובי', 'Direction')}</span><div class="mk-styles" id="mkStyles" role="group">
        ${[['fluid', 'נוזלי', 'Fluid', 'גרדיאנטים חיים שזזים עם העכבר', 'Living gradients that follow the cursor'], ['kinetic', 'קינטי', 'Kinetic', 'קווי גובה, כותרות ענק שזזות בגלילה', 'Contour lines, huge type that slides on scroll'], ['grid', 'מערכתי', 'System', 'גריד, כרטיס תלת־ממדי ובנטו', 'Grid, a 3D card and bento'], ['collage', 'קולאז׳', 'Collage', 'מדבקות, צורות ופרלקסה', 'Stickers, shapes and parallax']].map(([v, he, en, dhe, den]) => `<button class="mk-style" type="button" data-v="${v}"><span class="th th-${v}"></span><b>${L(he, en)}</b><span class="small">${L(dhe, den)}</span></button>`).join('')}
      </div></div>
      <div class="mk-sec"><div class="field"><label for="mkInt"><span>${L('עוצמת האפקטים', 'Effect intensity')}</span><span class="mono" id="mkIntV"></span></label><input class="slider" type="range" id="mkInt" min="50" max="160"></div><div class="mk-row small"><span>${L('רגוע', 'Calm')}</span><span>${L('מטורף', 'Wild')}</span></div></div>
      <div class="mk-sec"><span class="label">${L('אפקטים', 'Effects')}</span>
        ${[['preloader', 'מסך פתיחה עם מונה', 'Preloader with a counter'], ['cursor', 'סמן מותאם וכפתורים מגנטיים', 'Custom cursor and magnetic buttons'], ['smooth', 'גלילה חלקה', 'Smooth scrolling'], ['grain', 'גרעיניות של פילם', 'Film grain']].map(([k, he, en]) => `<span class="switch-wrap"><button class="switch" type="button" role="switch" data-fx="${k}" aria-label="${en}"></button>${L(he, en)}</span>`).join('')}
        <p class="small" style="margin:0">${L('תמיד פעיל: כותרת שנבנית מאותיות, מניפסט שנצבע בגלילה, כרטיסים נערמים, גלריה אופקית, זום על הלוגו, פס רץ לפי מהירות הגלילה ומונים.', 'Always on: letter-by-letter headline, a manifesto that fills on scroll, stacking cards, a horizontal gallery, logo zoom, a velocity marquee and counters.')}</p></div>`,
    export: () => `
      <div class="mk-sec"><span class="label">${L('האתר מוכן', 'Your site is ready')}</span>
        <p class="body" style="margin:0">${L('קובץ HTML אחד שעומד בפני עצמו: הלוגו מוטמע בתוכו, הגופנים נטענים מ־Google Fonts, ואין ספריות חיצוניות.', 'One self-contained HTML file: the logo is embedded, fonts load from Google Fonts, and there are no external libraries.')}</p>
        <button class="btn btn-accent" type="button" id="mkDownload">${RL('הורדת index.html', 'Download index.html')}<span class="arr"><svg class="ic" aria-hidden="true"><use href="#i-down"/></svg></span></button>
        <button class="btn btn-line no-arr" type="button" id="mkCopyHtml">${RL('העתקת הקוד', 'Copy the code')}</button>
        <button class="btn btn-line no-arr" type="button" id="mkFull">${RL('תצוגה במסך מלא', 'Full-screen preview')}</button>
        <p class="mono" id="mkSize" style="color:var(--ink-2);margin:0"></p></div>
      <div class="mk-sec"><div class="mk-row"><span class="label">${L('המשך ב־Claude Code', 'Continue in Claude Code')}</span><button class="btn btn-ink sm no-arr" type="button" id="mkCopyBrief">${RL('העתקה ל־Claude Code', 'Copy for Claude Code')}</button></div><pre class="mk-brief" id="mkBrief" tabindex="0"></pre></div>`
  };

  let step = 'brand';
  function renderPane() {
    $('#mkPanel').innerHTML = panes[step]();
    rollify($('#mkPanel'));
    bindPane();
    syncPane();
  }
  function syncAll() { syncPane(); $('#mkUrl').textContent = C.domain; }

  function syncPane() {
    const P = $('#mkPanel'); if (!P || !P.firstElementChild) return;
    const pressed = (sel, v) => $$(sel + ' button', P).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    if (step === 'brand') {
      $('#mkSources').innerHTML = B.sources.length ? B.sources.map(s => `<div class="mk-src"><span class="mk-th">${s.thumb ? `<img src="${s.thumb}" alt="">` : `<span class="mono">${(s.name.split('.').pop() || '').toUpperCase()}</span>`}</span><div><b>${s.name.replace(/[<&]/g, '')}</b><span class="small">${s.notes.join(' · ')}</span></div><span class="mono kind-${s.kind}">${{ logo: 'LOGO', pdf: 'PDF', tokens: 'TOKENS', image: 'IMG', skip: '—', error: '!' }[s.kind] || ''}</span></div>`).join('') : `<p class="small" style="margin:0">${L('עוד לא העליתם קבצים.', 'No files yet.')}</p>`;
      const r = B.roles, logo = B.logo || placeholderLogo();
      $('#mkLogos').innerHTML = [['bg', r.bg], ['fg', r.fg], ['accent', r.accent]].map(([k, c]) => `<div class="mk-logo" style="background:${c}"><img src="${logo}" alt="" style="filter:${logoFilterFor(c)}"></div>`).join('');
      pressed('#mkLogoMode', B.logoMode);
      $('#mkCleanWrap').hidden = !B.logoClean;
      $('#mkClean').setAttribute('aria-checked', String(B.cleanBg));
      pressed('#mkMode', B.mode);
      const names = { bg: ['רקע', 'Background'], fg: ['טקסט', 'Text'], accent: ['מבטא', 'Accent'], accent2: ['מבטא 2', 'Accent 2'] };
      $('#mkRoles').innerHTML = Object.keys(names).map(k => {
        const c = r[k], ref = k === 'fg' ? r.bg : k === 'bg' ? r.fg : onColor(c), cr = contrast(c, ref);
        return `<div class="mk-role ${B.pick === k ? 'on' : ''}"><button type="button" class="mk-pick" data-k="${k}" aria-pressed="${B.pick === k}"><span class="sw" style="background:${c}"></span><span>${L(names[k][0], names[k][1])}</span></button><input type="color" value="${c}" data-k="${k}" aria-label="${names[k][1]}"><span class="mono">${c}</span><span class="pass ${cr >= 4.5 ? 'ok' : ''}">${cr.toFixed(1)}</span></div>`;
      }).join('');
      $('#mkFound').innerHTML = mergeColors(B.extracted).slice(0, 14).map(c => `<button type="button" class="mk-fc" data-hex="${c.hex}" style="background:${c.hex}" aria-label="${c.hex}" title="${c.hex}"></button>`).join('') || `<span class="small">—</span>`;
      const opts = (sel) => { const det = B.detectedFonts.map(f => f.font); const all = [...new Set([...det, ...Object.keys(G.FONTS)])]; return all.map(f => `<option value="${f}" ${f === sel ? 'selected' : ''}>${f}${det.includes(f) ? (lang() === 'he' ? ' · זוהה' : ' · detected') : ''}${G.HEBREW_OK.includes(f) ? ' · עב' : ''}</option>`).join(''); };
      $('#mkFD').innerHTML = opts(B.fonts.display); $('#mkFB').innerHTML = opts(B.fonts.body);
      const subs = B.detectedFonts.filter(f => f.sub);
      $('#mkFontNote').innerHTML = subs.length ? L(`בספר המותג מופיע ${subs.map(s => s.sub).join(', ')}. בחרנו חלופה חופשית ב־Google Fonts.`, `The brand book uses ${subs.map(s => s.sub).join(', ')}. We picked a free Google Fonts alternative.`) : (B.detectedFonts.length ? L('הגופנים זוהו מהקבצים שלכם.', 'Fonts detected from your files.') : L('לא זוהו גופנים בקבצים, אז בחרנו צמד שמתאים לצבעים.', 'No fonts found in your files, so we picked a pair that suits the colors.'));
      $('#mkRadius').value = B.radius; $('#mkRadiusV').textContent = B.radius + 'px'; fillSlider($('#mkRadius'));
      $('#mkMood').innerHTML = mood();
    } else if (step === 'content') {
      $('#mkName').value = C.name; $('#mkDomain').value = C.domain; $('#mkInd').value = C.industry; pressed('#mkLang', C.lang);
      const t = G.COPY[C.industry][C.lang];
      $('#mkH1a').value = C.h1a; $('#mkH1a').placeholder = t.h1[0]; $('#mkH1b').value = C.h1b; $('#mkH1b').placeholder = t.h1[1];
      $('#mkSub').value = C.sub; $('#mkSub').placeholder = t.sub.replace('{name}', C.name);
      $('#mkSections').innerHTML = order.map((s, i) => { const m = SECTIONS.find(x => x[0] === s.id); return `<div class="mk-secrow"><span class="mono">${String(i + 1).padStart(2, '0')}</span><span>${L(m[1], m[2])}</span><button class="ibtn sm" type="button" data-up="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button><button class="ibtn sm" type="button" data-down="${i}" ${i === order.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button><button class="switch" type="button" role="switch" aria-checked="${s.on}" data-on="${i}" aria-label="${m[2]}" ${s.id === 'hero' ? 'disabled' : ''}></button></div>`; }).join('');
    } else if (step === 'design') {
      pressed('#mkStyles', D.style);
      $('#mkInt').value = Math.round(D.intensity * 100); $('#mkIntV').textContent = D.intensity.toFixed(1) + '×'; fillSlider($('#mkInt'));
      $$('[data-fx]', P).forEach(b => b.setAttribute('aria-checked', String(!!D.fx[b.dataset.fx])));
      $$('.th', P).forEach(th => { th.style.setProperty('--a', B.roles.accent); th.style.setProperty('--a2', B.roles.accent2); th.style.setProperty('--b', B.roles.bg); th.style.setProperty('--f', B.roles.fg); });
    } else if (step === 'export') {
      $('#mkBrief').textContent = G.brief(cfg());
      $('#mkSize').textContent = (lastHtml.length / 1024).toFixed(0) + ' KB · ' + order.filter(s => s.on).length + (lang() === 'he' ? ' מקטעים' : ' sections');
    }
  }
  function mood() {
    const [h, s] = hsl(B.roles.accent), dark = lum(B.roles.bg) < .3;
    const warm = h < 70 || h > 300;
    const w = lang() === 'he' ? [warm ? 'חם' : 'קריר', s > .6 ? 'אנרגטי' : 'שקט', dark ? 'לילי' : 'אוורירי'] : [warm ? 'Warm' : 'Cool', s > .6 ? 'energetic' : 'calm', dark ? 'nocturnal' : 'airy'];
    const sug = { fluid: ['נוזלי', 'Fluid'], kinetic: ['קינטי', 'Kinetic'], grid: ['מערכתי', 'System'], collage: ['קולאז׳', 'Collage'] }[suggestStyle()];
    return L(`האופי שזיהינו: ${w.join(', ')}. כיוון מומלץ: ${sug[0]}.`, `The character we read: ${w.join(', ')}. Suggested direction: ${sug[1]}.`);
  }
  const fillSlider = s => s && s.style.setProperty('--p', ((s.value - s.min) / (s.max - s.min) * 100) + '%');

  function bindPane() {
    const P = $('#mkPanel');
    const seg = (sel, fn) => { const el = $(sel, P); if (el) el.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b) fn(b.dataset.v); }); };
    if (step === 'brand') {
      seg('#mkLogoMode', v => { B.logoMode = v; syncPane(); liveVars(); });
      $('#mkClean').addEventListener('click', () => { B.cleanBg = !B.cleanBg; B.logo = B.cleanBg && B.logoClean ? B.logoClean : B.logoOrig; syncPane(); regen(); });
      seg('#mkMode', v => { if (v === B.mode) return; B.mode = v; const r = B.roles; B.roles = { bg: r.fg, fg: r.bg, accent: r.accent, accent2: r.accent2 }; syncPane(); liveVars(); });
      P.addEventListener('click', e => {
        const pk = e.target.closest('.mk-pick'); if (pk) { B.pick = pk.dataset.k; syncPane(); return; }
        const fc = e.target.closest('.mk-fc'); if (fc) { B.roles[B.pick] = fc.dataset.hex; syncPane(); liveVars(); }
      });
      P.addEventListener('input', e => {
        const c = e.target.closest('input[type=color]'); if (c) { B.roles[c.dataset.k] = c.value.toUpperCase(); const row = c.closest('.mk-role'); $('.sw', row).style.background = c.value; $('.mono', row).textContent = c.value.toUpperCase(); liveVars(); }
        if (e.target.id === 'mkRadius') { B.radius = +e.target.value; $('#mkRadiusV').textContent = B.radius + 'px'; fillSlider(e.target); liveVars(); }
      });
      P.addEventListener('change', e => { if (e.target.matches('input[type=color]')) syncPane(); if (e.target.id === 'mkFD' || e.target.id === 'mkFB') { B.fonts[e.target.id === 'mkFD' ? 'display' : 'body'] = e.target.value; regen(); } });
    } else if (step === 'content') {
      const txt = (id, k, extra) => $(id, P).addEventListener('input', e => { C[k] = e.target.value; if (extra) extra(); regen(700); });
      txt('#mkName', 'name', () => { C.nameTouched = true; if (!C.domainTouched) { C.domain = slug(C.name) + (C.lang === 'he' ? '.co.il' : '.com'); $('#mkDomain').value = C.domain; } $('#mkUrl').textContent = C.domain; });
      txt('#mkDomain', 'domain', () => { C.domainTouched = true; $('#mkUrl').textContent = C.domain; });
      txt('#mkH1a', 'h1a'); txt('#mkH1b', 'h1b'); txt('#mkSub', 'sub');
      $('#mkInd', P).addEventListener('change', e => { C.industry = e.target.value; syncPane(); regen(); });
      seg('#mkLang', v => { C.lang = v; if (v === 'he' && !G.HEBREW_OK.includes(B.fonts.body)) B.fonts.body = 'Heebo'; syncPane(); regen(); });
      $('#mkSections', P).addEventListener('click', e => {
        const u = e.target.closest('[data-up]'), dn = e.target.closest('[data-down]'), on = e.target.closest('[data-on]');
        if (u) { const i = +u.dataset.up; [order[i - 1], order[i]] = [order[i], order[i - 1]]; }
        else if (dn) { const i = +dn.dataset.down; [order[i + 1], order[i]] = [order[i], order[i + 1]]; }
        else if (on) { const i = +on.dataset.on; order[i].on = !order[i].on; } else return;
        syncPane(); regen();
      });
    } else if (step === 'design') {
      seg('#mkStyles', v => { D.style = v; D.touched = true; syncPane(); runGen(); });
      $('#mkInt', P).addEventListener('input', e => { D.intensity = e.target.value / 100; $('#mkIntV').textContent = D.intensity.toFixed(1) + '×'; fillSlider(e.target); regen(500); });
      P.addEventListener('click', e => { const b = e.target.closest('[data-fx]'); if (!b) return; D.fx[b.dataset.fx] = !D.fx[b.dataset.fx]; b.setAttribute('aria-checked', String(D.fx[b.dataset.fx])); regen(); });
    } else if (step === 'export') {
      $('#mkDownload').addEventListener('click', () => {
        const blob = new Blob([lastHtml], { type: 'text/html' }), a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = (slug(C.name) || 'site') + '.html'; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 10000);
        toast('הקובץ נוצר. אם ההורדה לא התחילה, השתמשו ב"העתקת הקוד".', 'File created. If the download did not start, use "Copy the code".', 'i-down');
      });
      $('#mkCopyHtml').addEventListener('click', () => copyText(lastHtml).then(ok => ok ? toast('הקוד הועתק. הדביקו אותו בקובץ index.html.', 'Code copied. Paste it into an index.html file.') : toast('ההעתקה נחסמה בדפדפן הזה. נסו את ההורדה.', 'Copying was blocked in this browser. Try the download.', 'i-x')));
      $('#mkCopyBrief').addEventListener('click', () => copyText($('#mkBrief').textContent + '\n\n--- index.html ---\n' + lastHtml).then(ok => ok ? toast('הבריף והקוד הועתקו ל־Claude Code.', 'Brief and code copied for Claude Code.') : toast('ההעתקה נחסמה בדפדפן הזה.', 'Copying was blocked in this browser.', 'i-x')));
      $('#mkFull').addEventListener('click', fullscreen);
    }
  }

  /* ---------- preview ---------- */
  let lastHtml = '', regenT = null, device = 'desktop';
  function liveVars() {
    const b = brandObj(), f = $('#mkFrame');
    if (f && f.contentWindow) {
      f.contentWindow.postMessage({ type: 'vars', vars: { '--bg': b.colors.bg, '--fg': b.colors.fg, '--accent': b.colors.accent, '--accent2': b.colors.accent2, '--on-accent': b.colors.onAccent, '--r': b.radius + 'px', '--logo-filter': b.logoFilter, '--on-accent-filter': b.onAccentFilter } }, '*');
      f.contentWindow.postMessage({ type: 'colors', colors: b.colors }, '*');
    }
    clearTimeout(regenT); regenT = setTimeout(() => { lastHtml = G.generate(cfg()); if (step === 'export') syncPane(); }, 400);
  }
  function regen(delay = 250) { clearTimeout(regenT); regenT = setTimeout(() => { render(); }, delay); }
  function render() {
    lastHtml = G.generate(cfg());
    const f = $('#mkFrame');
    f.srcdoc = lastHtml;
    $('#mkUrl').textContent = C.domain;
    if (step === 'export') syncPane();
  }
  let genTimer = null;
  function setGenText(html) { const el = $('#mkGenNow'); if (el) el.innerHTML = html; }
  function showGen(on, indefinite) {
    const g = $('#mkGen'); g.classList.toggle('on', on);
    if (on) { $('#mkGenBar').style.setProperty('--p', indefinite ? '15%' : '0%'); }
  }
  function runGen() {
    return new Promise(res => {
      clearTimeout(genTimer);
      const steps = lang() === 'he' ? ['קורא את הצבעים', 'מתאים גופנים', `מרכיב ${order.filter(s => s.on).length} מקטעים`, 'מוסיף אפקטים', 'מלטש'] : ['Reading colors', 'Matching type', `Assembling ${order.filter(s => s.on).length} sections`, 'Adding effects', 'Polishing'];
      if (RM()) { render(); showGen(false); return res(); }
      showGen(true);
      let i = 0;
      const tick = () => {
        $('#mkGenBar').style.setProperty('--p', ((i + 1) / steps.length * 100) + '%');
        setGenText(steps.slice(0, i + 1).map((s, j) => `<span class="${j === i ? 'now' : 'done'}">${j < i ? '✓ ' : ''}${s}</span>`).join(''));
        i++;
        if (i === 3) render();
        if (i < steps.length) genTimer = setTimeout(tick, 380); else genTimer = setTimeout(() => { showGen(false); res(); }, 450);
      };
      tick();
    });
  }
  function sizeFrame() {
    const wrap = $('#mkFrameWrap'), f = $('#mkFrame'); if (!wrap || !wrap.clientWidth) return;
    const W = { desktop: 1280, tablet: 834, phone: 390 }[device], avail = wrap.clientWidth, H = wrap.clientHeight;
    const s = Math.min(1, avail / W);
    f.style.width = W + 'px'; f.style.height = (H / s) + 'px'; f.style.transform = `scale(${s})`;
    f.style.left = Math.max(0, (avail - W * s) / 2) + 'px';
  }
  window.addEventListener('resize', sizeFrame);
  function fullscreen() { const el = $('#mkFrameWrap'); if (el.requestFullscreen) el.requestFullscreen().then(() => setTimeout(sizeFrame, 100)).catch(() => toast('מסך מלא לא זמין כאן.', 'Full screen is not available here.', 'i-x')); }
  document.addEventListener('fullscreenchange', () => setTimeout(sizeFrame, 80));

  /* ---------- mount ---------- */
  function mount() {
    rollify($('[data-page="maker"]'));
    $('#mkSamples').innerHTML = SAMPLES.map(s => `<button class="mk-sample" type="button" data-s="${s.id}"><img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(s.svg)}" alt=""><span class="mono">${{ studio: 'STUDIO', food: 'BAKERY', tech: 'SAAS' }[s.industry]}</span></button>`).join('');
    $('#mkSamples').addEventListener('click', async e => { const b = e.target.closest('[data-s]'); if (!b) return; await loadSample(SAMPLES.find(s => s.id === b.dataset.s)); renderPane(); runGen(); $('#mkWork').scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'start' }); });
    const drop = $('#mkDrop'), input = $('#mkFiles');
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('drag')));
    drop.addEventListener('drop', async e => { e.preventDefault(); await ingest(e.dataTransfer.files); renderPane(); $('#mkWork').scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'start' }); });
    input.addEventListener('change', async () => { await ingest(input.files); input.value = ''; renderPane(); $('#mkWork').scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'start' }); });
    $('#mkSteps').addEventListener('click', e => { const b = e.target.closest('[data-step]'); if (!b) return; step = b.dataset.step; $$('#mkSteps [data-step]').forEach(x => x.setAttribute('aria-selected', String(x === b))); renderPane(); });
    $('#mkDevice').addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (!b) return; device = b.dataset.d; $$('#mkDevice button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); sizeFrame(); });
    $('#mkReplay').addEventListener('click', () => render());
    $('#mkFullBtn').addEventListener('click', fullscreen);
    $('#mkNext').addEventListener('click', () => { const s = ['brand', 'content', 'design', 'export'], i = s.indexOf(step); $(`#mkSteps [data-step="${s[(i + 1) % 4]}"]`).click(); $('#mkPanel').scrollTop = 0; });
    C.lang = lang();
    loadSample(SAMPLES[0]).then(() => { renderPane(); render(); sizeFrame(); });
    onLang(() => { renderPane(); });
  }
  mount();
  OS.hooks.maker = () => requestAnimationFrame(sizeFrame);
  if (location.hash === '#maker') requestAnimationFrame(sizeFrame);
})();

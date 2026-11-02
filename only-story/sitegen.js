/* ONLY STORY · Brand → Site generator.
   generate(cfg) returns a complete, standalone HTML document built from a brand
   (logo, palette, fonts, radius), content (industry copy in Hebrew or English) and a design
   direction with effects. No libraries: the runtime below is serialized into the page. */
(function () {
  'use strict';

  /* ---------- copy by industry ---------- */
  const COPY = {
    studio: {
      he: { nav: ['עבודות', 'שירותים', 'גישה', 'צור קשר'], eyebrow: 'סטודיו לעיצוב ותנועה', h1: ['אנחנו בונים', 'מותגים *שזזים.*'], sub: '{name} הוא סטודיו קטן לעיצוב, אתרים ומושן. אנחנו לוקחים רעיון אחד ונותנים לו צורה, קול ותנועה.', cta: 'בואו נדבר', manifesto: 'אנחנו לא מעצבים דפים. אנחנו מעצבים *רגעים.* את הרגע שבו מישהו נכנס לאתר ומבין, בלי מילה, *מי אתם.*', servicesTitle: 'מה אנחנו עושים', services: [['אסטרטגיה ומיתוג', 'שם, קול, לוגו ומערכת שלמה שעובדת בכל מקום.'], ['אתרים', 'אתרים מהירים עם תנועה שמספרת את הסיפור ולא מסתירה אותו.'], ['מושן', 'סרטונים קצרים, אנימציית לוגו ותוכן לרשתות שעוצר את הגלילה.']], galleryTitle: 'עבודות נבחרות', gallery: ['זהות חזותית', 'אתר השקה', 'סדרת סרטונים', 'מערכת עיצוב', 'קמפיין'], stats: [['12', 'שנות ניסיון'], ['140', 'פרויקטים'], ['9', 'פרסים']], bento: ['כל פרויקט מתחיל בשיחה', 'מהרעיון ועד ההשקה'], final: 'יש לכם *רעיון?*', button: 'לכתוב לנו', tag: 'מילים, צורות ותנועה' },
      en: { nav: ['Work', 'Services', 'Approach', 'Contact'], eyebrow: 'A design & motion studio', h1: ['We build brands', 'that *move.*'], sub: '{name} is a small studio for design, websites and motion. We take one idea and give it a shape, a voice and movement.', cta: "Let's talk", manifesto: "We don't design pages. We design *moments.* The moment someone lands on your site and knows, without a word, *who you are.*", servicesTitle: 'What we do', services: [['Strategy & identity', 'Name, voice, logo and a full system that works everywhere.'], ['Websites', 'Fast sites with motion that tells the story instead of hiding it.'], ['Motion', 'Short films, logo animation and social content that stops the scroll.']], galleryTitle: 'Selected work', gallery: ['Visual identity', 'Launch site', 'Film series', 'Design system', 'Campaign'], stats: [['12', 'years'], ['140', 'projects'], ['9', 'awards']], bento: ['Every project starts with a conversation', 'From idea to launch'], final: 'Got an *idea?*', button: 'Write to us', tag: 'Words, shapes and motion' }
    },
    food: {
      he: { nav: ['תפריט', 'הסיפור', 'סדנאות', 'הזמנות'], eyebrow: 'מאפייה שכונתית', h1: ['לחם טרי,', 'כל *בוקר.*'], sub: '{name} אופה בכל לילה מחמצת, מאפים ועוגות מחומרי גלם פשוטים. בואו לקחת משהו חם בדרך.', cta: 'להזמין מראש', manifesto: 'אין קיצורי דרך. *קמח,* מים, מלח וזמן. הרבה זמן. ככה נראה לחם שאפשר *להריח* מהרחוב.', servicesTitle: 'מה יש בחלון', services: [['מחמצת', '24 שעות התפחה, קרום פריך ובצק אוורירי.'], ['מאפים', 'קרואסונים, רוגלך ומאפי עונה שמשתנים כל שבוע.'], ['סדנאות', 'ערבי אפייה קטנים, עם הבצק שלכם הביתה.']], galleryTitle: 'מהתנור', gallery: ['מחמצת כפרית', 'בוקר בחלון', 'סדנת חמישי', 'מגש עונה', 'המאפייה בלילה'], stats: [['24', 'שעות התפחה'], ['6:30', 'פותחים'], ['30', 'סוגי מאפים']], bento: ['נאפה הלילה, נאכל היום', 'הזמנות עד 20:00'], final: 'רעבים *כבר?*', button: 'להזמין', tag: 'נאפה הלילה, נאכל היום' },
      en: { nav: ['Menu', 'Story', 'Workshops', 'Order'], eyebrow: 'A neighborhood bakery', h1: ['Fresh bread,', 'every *morning.*'], sub: '{name} bakes sourdough, pastries and cakes every night from simple ingredients. Grab something warm on your way.', cta: 'Pre-order', manifesto: 'No shortcuts. *Flour,* water, salt and time. Lots of time. That is what bread you can *smell* from the street looks like.', servicesTitle: 'In the window', services: [['Sourdough', '24-hour proof, a crisp crust and an airy crumb.'], ['Pastries', 'Croissants, rugelach and seasonal bakes that change weekly.'], ['Workshops', 'Small baking evenings. Your dough goes home with you.']], galleryTitle: 'From the oven', gallery: ['Country loaf', 'Morning window', 'Thursday class', 'Seasonal tray', 'The bakery at night'], stats: [['24', 'hour proof'], ['6:30', 'we open'], ['30', 'bakes']], bento: ['Baked tonight, eaten today', 'Orders until 8 pm'], final: 'Hungry *yet?*', button: 'Order', tag: 'Baked tonight, eaten today' }
    },
    tech: {
      he: { nav: ['מוצר', 'איך זה עובד', 'מחירים', 'כניסה'], eyebrow: 'פלטפורמה לצוותים שזזים מהר', h1: ['פחות כלים.', 'יותר *תנופה.*'], sub: '{name} מחבר את המשימות, המסמכים והנתונים של הצוות למקום אחד, ומראה לכם מה באמת זז.', cta: 'להתחיל בחינם', manifesto: 'צוותים לא נתקעים בגלל חוסר כישרון. הם נתקעים כי המידע *מפוזר.* אנחנו מחזירים לו *סדר.*', servicesTitle: 'איך זה עובד', services: [['תכנון', 'מטרות, משימות ולוחות זמנים במסך אחד שכולם מבינים.'], ['אוטומציה', 'כללים פשוטים שעושים את העבודה החוזרת בשבילכם.'], ['תובנות', 'דוחות חיים שמראים איפה הצוות מתקדם ואיפה נתקע.']], galleryTitle: 'בתוך המוצר', gallery: ['לוח בקרה', 'תצוגת מסלול', 'אוטומציות', 'דוחות', 'אפליקציה'], stats: [['3x', 'מהירות מסירה'], ['40%', 'פחות פגישות'], ['99.9%', 'זמינות']], bento: ['הכל במקום אחד', 'התקנה בחמש דקות'], final: 'מוכנים *לזוז?*', button: 'לפתוח חשבון', tag: 'הצוות שלכם, בתנופה' },
      en: { nav: ['Product', 'How it works', 'Pricing', 'Log in'], eyebrow: 'For teams that move fast', h1: ['Fewer tools.', 'More *momentum.*'], sub: "{name} brings your team's tasks, docs and data into one place, and shows you what is actually moving.", cta: 'Start free', manifesto: "Teams don't stall for lack of talent. They stall because information is *scattered.* We put it back in *order.*", servicesTitle: 'How it works', services: [['Plan', 'Goals, tasks and timelines on one screen everyone understands.'], ['Automate', 'Simple rules that do the repetitive work for you.'], ['Learn', 'Live reports that show where the team moves and where it sticks.']], galleryTitle: 'Inside the product', gallery: ['Dashboard', 'Roadmap', 'Automations', 'Reports', 'Mobile app'], stats: [['3x', 'faster delivery'], ['40%', 'fewer meetings'], ['99.9%', 'uptime']], bento: ['Everything in one place', 'Set up in five minutes'], final: 'Ready to *move?*', button: 'Create an account', tag: 'Your team, in motion' }
    },
    fashion: {
      he: { nav: ['קולקציה', 'לוקבוק', 'חנויות', 'עגלה'], eyebrow: 'קולקציית סתיו–חורף', h1: ['בגדים שנראים', 'כמו *מחשבה.*'], sub: '{name} מעצבת פריטים בכמויות קטנות מבדים טבעיים, לאנשים שקונים פחות ובוחרים יותר.', cta: 'לקולקציה', manifesto: 'אנחנו לא רודפים אחרי עונות. אנחנו תופרים פריטים *שנשארים,* ומספרים איך כל אחד *נוצר.*', servicesTitle: 'איך אנחנו עובדים', services: [['חייטות', 'גזרות מדויקות שנתפרות בסדנה שלנו.'], ['בדים', 'פשתן, צמר וכותנה ממקור ידוע.'], ['תיקונים', 'כל פריט מקבל תיקון חינם לכל החיים.']], galleryTitle: 'הקולקציה', gallery: ['מעיל צמר', 'חולצת פשתן', 'לוקבוק סתיו', 'הסדנה', 'חנות הדגל'], stats: [['120', 'פריטים בעונה'], ['4', 'חנויות'], ['0', 'מלאי עודף']], bento: ['פחות, אבל טוב יותר', 'משלוח חינם מעל ₪400'], final: 'מצאתם *משהו?*', button: 'לחנות', tag: 'פחות, אבל טוב יותר' },
      en: { nav: ['Collection', 'Lookbook', 'Stores', 'Bag'], eyebrow: 'Autumn–winter collection', h1: ['Clothes that look', 'like a *thought.*'], sub: '{name} designs small runs in natural fabrics, for people who buy less and choose more.', cta: 'Shop the collection', manifesto: "We don't chase seasons. We sew pieces that *stay,* and tell you how each one was *made.*", servicesTitle: 'How we work', services: [['Tailoring', 'Precise cuts sewn in our own workshop.'], ['Fabrics', 'Linen, wool and cotton from known sources.'], ['Repairs', 'Free repairs for every piece, for life.']], galleryTitle: 'The collection', gallery: ['Wool coat', 'Linen shirt', 'Autumn lookbook', 'The workshop', 'Flagship store'], stats: [['120', 'pieces a season'], ['4', 'stores'], ['0', 'dead stock']], bento: ['Less, but better', 'Free shipping over $100'], final: 'Found *something?*', button: 'Shop', tag: 'Less, but better' }
    }
  };

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const stars = s => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  const fill = (s, name) => String(s).replace(/\{name\}/g, name);

  // fonts: [family, weights query, category]
  const FONTS = {
    'Google Sans': ['wght@400..700', 'sans'], 'Instrument Serif': ['ital@0;1', 'serif'], 'Space Grotesk': ['wght@400..700', 'sans'], 'Syne': ['wght@400..800', 'sans'],
    'Fraunces': ['opsz,wght@9..144,300..800', 'serif'], 'DM Serif Display': ['ital@0;1', 'serif'], 'Archivo': ['wght@400..800', 'sans'], 'Bricolage Grotesque': ['opsz,wght@12..96,400..800', 'sans'],
    'Unbounded': ['wght@400..800', 'sans'], 'Playfair Display': ['wght@400..800', 'serif'], 'Manrope': ['wght@400..800', 'sans'], 'Sora': ['wght@400..700', 'sans'], 'Inter Tight': ['wght@400..800', 'sans'],
    'Heebo': ['wght@300..800', 'sans'], 'Rubik': ['wght@300..800', 'sans'], 'Assistant': ['wght@300..800', 'sans'], 'Frank Ruhl Libre': ['wght@300..800', 'serif'], 'Secular One': ['', 'sans'],
    'Suez One': ['', 'serif'], 'Karantina': ['wght@300;400;700', 'display'], 'Bellefair': ['', 'serif'], 'Noto Sans Hebrew': ['wght@300..800', 'sans'], 'Varela Round': ['', 'sans'],
    'IBM Plex Sans Hebrew': ['wght@300;400;500;600;700', 'sans'], 'Fredoka': ['wght@300..700', 'sans'], 'Amatic SC': ['wght@400;700', 'display'], 'Miriam Libre': ['wght@400..700', 'sans']
  };
  const HEBREW_OK = ['Google Sans', 'Heebo', 'Rubik', 'Assistant', 'Frank Ruhl Libre', 'Secular One', 'Suez One', 'Karantina', 'Bellefair', 'Noto Sans Hebrew', 'Varela Round', 'IBM Plex Sans Hebrew', 'Fredoka', 'Amatic SC', 'Miriam Libre'];
  function fontLink(fam) {
    const f = FONTS[fam];
    const q = f && f[0] ? ':' + f[0] : '';
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam).replace(/%20/g, '+')}${q}&display=swap`;
  }
  function fontStack(fam, rtl) {
    const cat = (FONTS[fam] || [0, 'sans'])[1];
    const he = rtl && !HEBREW_OK.includes(fam) ? (cat === 'serif' ? ", 'Frank Ruhl Libre'" : ", 'Heebo'") : '';
    return `'${fam}'${he}, ${cat === 'serif' ? "Georgia, 'Times New Roman', serif" : "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"}`;
  }

  /* ---------- the runtime that runs inside the generated site ---------- */
  function runtime(C) {
    var root = document.documentElement, RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var rtl = root.dir === 'rtl', K = C.intensity || 1;
    var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
    var mouse = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 };
    addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.nx = e.clientX / innerWidth - .5; mouse.ny = e.clientY / innerHeight - .5; });

    // live token updates from the builder
    addEventListener('message', function (e) {
      var d = e.data || {};
      if (d.type === 'vars') Object.keys(d.vars).forEach(function (k) { root.style.setProperty(k, d.vars[k]); });
      if (d.type === 'colors') { C.colors = d.colors; }
    });

    // split headlines into words and letters
    $$('.split').forEach(function (el) {
      var i = 0;
      function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (w) {
              if (!w) return;
              if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
              var ws = document.createElement('span'); ws.className = 'w';
              Array.from(w).forEach(function (ch) { var c = document.createElement('span'); c.className = 'c'; c.style.setProperty('--i', i++); c.textContent = ch; ws.appendChild(c); });
              frag.appendChild(ws);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1) walk(n);
        });
      }
      walk(el);
    });

    // preloader
    var pre = $('.pre');
    function ready() { root.classList.add('ready'); fit(); measure(); }
    if (pre && !RM) {
      var num = $('.pre-n'), t0 = performance.now();
      (function count(now) {
        var p = clamp((now - t0) / 1300, 0, 1), e = 1 - Math.pow(1 - p, 3);
        num.textContent = Math.round(e * 100);
        if (p < 1) requestAnimationFrame(count); else { pre.classList.add('out'); setTimeout(ready, 250); setTimeout(function () { pre.remove(); }, 1200); }
      })(t0);
    } else { if (pre) pre.remove(); ready(); }

    // cursor + magnetic buttons
    var cur = $('.cursor'), cx = -50, cy = -50;
    if (cur && matchMedia('(hover: hover)').matches && !RM) {
      document.addEventListener('pointerover', function (e) { cur.classList.toggle('big', !!e.target.closest('a,button,.mag')); });
    } else if (cur) cur.remove();
    $$('.mag').forEach(function (b) {
      b.addEventListener('pointermove', function (e) { if (RM) return; var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * .3 + 'px,' + (e.clientY - r.top - r.height / 2) * .4 + 'px)'; });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });

    // smooth wheel scrolling that keeps sticky sections working
    var target = scrollY, smooth = C.smooth && !RM && matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (smooth) {
      addEventListener('wheel', function (e) { if (e.ctrlKey) return; e.preventDefault(); target = clamp(target + e.deltaY, 0, document.documentElement.scrollHeight - innerHeight); }, { passive: false });
      addEventListener('scroll', function () { if (Math.abs(scrollY - target) > 200) target = scrollY; });
    }

    // fit the giant footer word to the width
    function fit() { $$('.fit').forEach(function (el) { el.style.fontSize = '100px'; var w = el.scrollWidth, pw = el.parentElement.clientWidth; el.style.fontSize = Math.max(40, 100 * pw / w * .98) + 'px'; }); }
    addEventListener('resize', function () { fit(); measure(); });

    // reveals and counters
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target);
      if (e.target.classList.contains('count')) { var end = e.target.dataset.v, m = end.match(/^([\d.]+)(.*)$/); if (!m || RM) return; var n = parseFloat(m[1]), dec = (m[1].split('.')[1] || '').length, s = performance.now();
        (function step(now) { var p = clamp((now - s) / 1600, 0, 1), v = n * (1 - Math.pow(1 - p, 4)); e.target.textContent = v.toFixed(dec) + m[2]; if (p < 1) requestAnimationFrame(step); })(s); }
    }); }, { rootMargin: '0px 0px -12% 0px' });
    $$('.rv, .count').forEach(function (el) { io.observe(el); });

    // manifesto words
    var man = $('.manifesto p');
    if (man) man.innerHTML = man.innerHTML.split(/(<em>.*?<\/em>|\s+)/).map(function (w) { if (!w || /^\s+$/.test(w)) return w; var acc = /^<em>/.test(w); return '<span class="mw' + (acc ? ' acc' : '') + '">' + w.replace(/<\/?em>/g, '') + '</span>'; }).join('');

    var G = {};
    function top(el) { return el.getBoundingClientRect().top + scrollY; }
    function measure() { $$('[data-sc]').forEach(function (el) { G[el.dataset.sc] = { t: top(el), h: el.offsetHeight, el: el }; }); }
    measure();

    function onScroll() {
      var y = scrollY, vh = innerHeight;
      root.classList.toggle('scrolled', y > 20);
      if (G.logo) { var p = clamp((y - G.logo.t) / (G.logo.h - vh), 0, 1), lg = $('.ls-logo'); if (lg) { lg.style.transform = 'scale(' + (1 + Math.pow(p, 2.2) * 26 * K) + ') rotate(' + (p * 25 * (rtl ? -1 : 1)) + 'deg)'; lg.style.opacity = 1 - clamp((p - .6) / .25, 0, 1); }
        var lt = $('.ls-text'); if (lt) { lt.style.opacity = clamp((p - .7) / .2, 0, 1); lt.style.transform = 'translateY(' + (1 - clamp((p - .7) / .3, 0, 1)) * 60 + 'px)'; } }
      if (G.man) { var ws = $$('.mw'), q = clamp((y + vh * .8 - G.man.t) / (G.man.h + vh * .2), 0, 1), n = RM ? ws.length : Math.round(q * ws.length); ws.forEach(function (w, i) { w.classList.toggle('on', i < n); }); }
      if (G.stack) { var cards = $$('.scard'); cards.forEach(function (c, i) { var next = cards[i + 1]; if (!next) return; var r = next.getBoundingClientRect(), d = clamp(1 - (r.top - vh * .12) / (vh * .8), 0, 1); c.style.transform = 'scale(' + (1 - d * .06 * K) + ')'; c.style.filter = 'brightness(' + (1 - d * .25) + ')'; }); }
      if (G.gal && matchMedia('(min-width: 900px)').matches && !RM) { var gp = clamp((y - G.gal.t) / (G.gal.h - vh), 0, 1), tr = $('.gal-track'), max = Math.max(0, tr.scrollWidth - innerWidth + 64); tr.style.transform = 'translate3d(' + (rtl ? 1 : -1) * gp * max + 'px,0,0)'; $('.gal-bar i').style.width = gp * 100 + '%'; }
      $$('[data-x]').forEach(function (el) { if (RM) return; var r = el.getBoundingClientRect(), p = (r.top + r.height / 2 - vh / 2) / vh; el.style.transform = 'translateX(' + p * parseFloat(el.dataset.x) * K + 'px)'; });
      $$('[data-py]').forEach(function (el) { if (RM) return; el.style.setProperty('--py', (y * parseFloat(el.dataset.py) * K) + 'px'); });
    }
    addEventListener('scroll', onScroll, { passive: true });

    // hero canvas per direction
    var cv = $('.hero-cv'), ctx = cv && cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, devicePixelRatio || 1);
    function size() { if (!cv) return; W = cv.clientWidth; H = cv.clientHeight; var q = C.style === 'fluid' ? .16 : C.style === 'kinetic' ? Math.min(1, dpr) : dpr; cv.width = Math.max(1, W * q); cv.height = Math.max(1, H * q); ctx.setTransform(q, 0, 0, q, 0, 0); }
    size(); addEventListener('resize', size);
    function hexA(h, a) { h = h.replace('#', ''); var n = parseInt(h, 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
    var blobs = [0, 1, 2, 3, 4].map(function (i) { return { x: Math.random(), y: Math.random(), r: .28 + Math.random() * .22, s: .5 + Math.random(), o: i * 1.7 }; });
    var sm = { x: 0, y: 0 };
    function draw(t) {
      if (!ctx || !W) return;
      var col = C.colors; sm.x += (mouse.nx - sm.x) * .05; sm.y += (mouse.ny - sm.y) * .05;
      ctx.clearRect(0, 0, W, H);
      if (C.style === 'fluid') {
        var cs = [col.accent, col.accent2, col.fg === col.bg ? col.accent : col.accent, col.accent2, col.accent];
        blobs.forEach(function (b, i) {
          var x = (b.x + .18 * Math.sin(t * .00025 * b.s * K + b.o) + sm.x * .25 * (i % 2 ? 1 : -1)) * W, y = (b.y + .16 * Math.cos(t * .0003 * b.s * K + b.o) + sm.y * .2) * H, r = b.r * Math.max(W, H) * 1.25;
          var g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, hexA(cs[i], .95)); g.addColorStop(1, hexA(cs[i], 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        });
      } else if (C.style === 'kinetic') {
        // topographic contour lines from a moving noise field
        var cols = 54, rows = Math.round(54 * H / W), cw = W / cols, ch = H / rows, tt = t * .00008 * K;
        var f = function (x, y) { return Math.sin(x * 3.1 + tt * 2 + Math.sin(y * 2.3 + tt)) + Math.cos(y * 2.7 - tt * 1.5 + Math.sin(x * 1.7)) + .6 * Math.sin((x + y) * 4.3 + tt * 3) + (sm.x * Math.cos(y * 3) + sm.y * Math.sin(x * 3)) * .8; };
        var val = []; for (var j = 0; j <= rows; j++) { val[j] = []; for (var i2 = 0; i2 <= cols; i2++) val[j][i2] = f(i2 / cols * 2, j / rows * 2 * H / W); }
        for (var lv = -2; lv <= 2; lv += .4) {
          ctx.beginPath(); ctx.strokeStyle = Math.abs(lv - .4) < .01 ? hexA(col.accent, .9) : hexA(col.fg, .13); ctx.lineWidth = Math.abs(lv - .4) < .01 ? 1.6 : 1;
          for (j = 0; j < rows; j++) for (i2 = 0; i2 < cols; i2++) {
            var a = val[j][i2], b2 = val[j][i2 + 1], c2 = val[j + 1][i2 + 1], d2 = val[j + 1][i2], pts = [];
            var ed = function (v1, v2, x1, y1, x2, y2) { if ((v1 - lv) * (v2 - lv) < 0) { var k = (lv - v1) / (v2 - v1); pts.push([x1 + (x2 - x1) * k, y1 + (y2 - y1) * k]); } };
            var X = i2 * cw, Y = j * ch;
            ed(a, b2, X, Y, X + cw, Y); ed(b2, c2, X + cw, Y, X + cw, Y + ch); ed(c2, d2, X + cw, Y + ch, X, Y + ch); ed(d2, a, X, Y + ch, X, Y);
            if (pts.length >= 2) { ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); }
          }
          ctx.stroke();
        }
      } else if (C.style === 'grid') {
        var gs = 64, ox = (t * .01 * K) % gs;
        ctx.strokeStyle = hexA(col.fg, .07); ctx.lineWidth = 1; ctx.beginPath();
        for (var gx = -gs + ox; gx < W; gx += gs) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
        for (var gy = 0; gy < H; gy += gs) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
        ctx.stroke();
        var mx = (sm.x + .5) * W, my = (sm.y + .5) * H, rg = ctx.createRadialGradient(mx, my, 0, mx, my, Math.max(W, H) * .45);
        rg.addColorStop(0, hexA(col.accent, .35)); rg.addColorStop(1, hexA(col.accent, 0)); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
        for (var q2 = 0; q2 < 18; q2++) { var px = ((q2 * 137.5) % W), py = ((q2 * 91.3 + t * .02 * K * (q2 % 3 + 1)) % H); ctx.fillStyle = hexA(q2 % 4 ? col.fg : col.accent, q2 % 4 ? .18 : .9); ctx.fillRect(Math.round(px / gs) * gs - 3, Math.round(py / gs) * gs - 3, 6, 6); }
      } else if (C.style === 'collage') {
        ctx.save(); ctx.translate(W / 2, H / 2);
        for (var k2 = 0; k2 < 3; k2++) { ctx.beginPath(); ctx.arc(0, 0, Math.min(W, H) * (.22 + k2 * .14), 0, Math.PI * 2); ctx.strokeStyle = hexA(col.fg, .12); ctx.setLineDash([2, 10 + k2 * 6]); ctx.lineDashOffset = -t * .01 * (k2 + 1) * K; ctx.stroke(); }
        ctx.restore();
      }
    }
    var tickers = [];
    // tilt card
    var card = $('.card3d');
    (function loop(t) {
      if (smooth) { var d = target - scrollY; if (Math.abs(d) > .5) scrollTo(0, scrollY + d * .1); }
      if (cur) { cx += (mouse.x - cx) * .18; cy += (mouse.y - cy) * .18; cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)'; }
      if (!RM) draw(t); else if (!loop.once) { draw(1000); loop.once = 1; }
      if (card && !RM) card.style.transform = 'rotateY(' + (sm.x * 28 + Math.sin(t * .0006) * 6) + 'deg) rotateX(' + (-sm.y * 22 + Math.cos(t * .0005) * 5) + 'deg)';
      $$('[data-mouse]').forEach(function (el) { if (RM) return; var m = parseFloat(el.dataset.mouse); el.style.translate = (sm.x * m * 60 * K) + 'px ' + (sm.y * m * 60 * K) + 'px'; });
      tickers.forEach(function (f) { f(t); });
      requestAnimationFrame(loop);
    })(0);

    // marquee with scroll velocity
    var band = $('.band-in'), bx = 0, last = scrollY, vel = 0;
    if (band && !RM) tickers.push(function () { vel = vel * .9 + (scrollY - last) * .1; last = scrollY; bx -= (.7 + Math.min(14, Math.abs(vel) * .3)) * K; var w = band.scrollWidth / 2; if (bx < -w) bx += w; band.style.transform = 'translate3d(' + bx + 'px,0,0)'; });
    onScroll();
  }

  /* ---------- CSS of the generated site ---------- */
  function css(b, d) {
    const c = b.colors;
    return `
:root{--bg:${c.bg};--fg:${c.fg};--accent:${c.accent};--accent2:${c.accent2};--on-accent:${c.onAccent};--muted:color-mix(in srgb,var(--fg) 62%,var(--bg));--line:color-mix(in srgb,var(--fg) 14%,transparent);--surface:color-mix(in srgb,var(--fg) 5%,var(--bg));--display:${fontStack(b.fonts.display, d.rtl)};--body:${fontStack(b.fonts.body, d.rtl)};--r:${b.radius}px;--k:${d.intensity};--gut:max(20px,3vw);--logo-filter:${b.logoFilter};}
*,*::before,*::after{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:400 17px/1.6 var(--body);-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit;text-decoration:none}img,canvas,svg{display:block;max-width:100%}button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
::selection{background:var(--accent);color:var(--on-accent)}:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.wrap{padding-inline:var(--gut)}
em{font-style:normal;color:var(--accent)}
.h-mega{font:${d.weight} clamp(56px,11vw,200px)/.86 var(--display);letter-spacing:${d.track};margin:0;text-transform:${d.upper ? 'uppercase' : 'none'}}
.h-xl{font:${d.weight} clamp(44px,7vw,120px)/.92 var(--display);letter-spacing:${d.track};margin:0;text-transform:${d.upper ? 'uppercase' : 'none'};text-wrap:balance}
.h-l{font:${d.weight} clamp(30px,4vw,64px)/1 var(--display);letter-spacing:${d.track};margin:0;text-wrap:balance}
.eyebrow{font:500 13px/1.3 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0;display:inline-flex;gap:10px;align-items:center}
.eyebrow::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--accent)}
.lead{font-size:clamp(17px,1.4vw,21px);line-height:1.55;color:var(--muted);max-width:30em;margin:0}
.btn{display:inline-flex;align-items:center;gap:14px;min-height:56px;padding-inline:28px 8px;border-radius:999px;background:var(--accent);color:var(--on-accent);font:600 16px/1 var(--body);transition:transform .5s cubic-bezier(.19,1,.22,1),background-color .4s;position:relative;overflow:hidden;isolation:isolate}
.btn::before{content:"";position:absolute;inset:0;background:var(--fg);transform:translateY(101%);transition:transform .6s cubic-bezier(.19,1,.22,1);z-index:-1;border-radius:inherit}
.btn:hover::before{transform:none}.btn:hover{color:var(--bg)}
.btn i{width:40px;height:40px;border-radius:50%;background:var(--on-accent);color:var(--accent);display:grid;place-items:center;font-style:normal;transition:transform .6s cubic-bezier(.19,1,.22,1)}
.btn:hover i{transform:rotate(${'-45deg'});background:var(--accent);color:var(--on-accent)}
[dir=rtl] .btn i{transform:scaleX(-1)}[dir=rtl] .btn:hover i{transform:scaleX(-1) rotate(-45deg)}
.btn.ghost{background:transparent;color:var(--fg);box-shadow:inset 0 0 0 1px var(--line);padding-inline:26px}
.pre{position:fixed;inset:0;z-index:100;background:var(--accent);color:var(--on-accent);display:grid;place-items:center;clip-path:polygon(0 0,100% 0,100% 100%,0 100%);transition:clip-path 1s cubic-bezier(.77,0,.18,1)}
.pre.out{clip-path:polygon(0 0,100% 0,100% 0,0 0)}
.pre img{width:min(36vw,200px);max-height:30vh;object-fit:contain;filter:var(--pre-filter,none);animation:prepulse 1.4s ease-in-out infinite alternate}
@keyframes prepulse{to{transform:scale(1.06)}}
.pre-n{position:absolute;bottom:24px;inset-inline-end:var(--gut);font:${d.weight} clamp(64px,12vw,180px)/.8 var(--display);letter-spacing:-.05em;font-variant-numeric:tabular-nums}
.cursor{position:fixed;left:0;top:0;z-index:90;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:var(--accent);pointer-events:none;mix-blend-mode:difference;transition:width .4s,height .4s,margin .4s}
.cursor.big{width:64px;height:64px;margin:-32px 0 0 -32px}
.nav{position:fixed;inset:0 0 auto;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px var(--gut);transition:background-color .4s,padding .4s}
.scrolled .nav{background:color-mix(in srgb,var(--bg) 82%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);padding-block:12px}
.nav .logo{height:34px;width:auto;max-width:150px;object-fit:contain;filter:var(--logo-filter)}
.nav ul{display:flex;gap:clamp(14px,2.4vw,36px);list-style:none;margin:0;padding:0;font-size:15px}
.nav ul a{position:relative;display:inline-block;padding-block:10px}.nav ul a::after{content:"";position:absolute;inset-inline:0;bottom:6px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:var(--o,left);transition:transform .5s cubic-bezier(.19,1,.22,1)}
[dir=rtl] .nav ul a{--o:right}.nav ul a:hover::after{transform:scaleX(1)}
.nav .btn{min-height:44px;font-size:14px;padding-inline:20px}
@media (max-width:760px){.nav ul{display:none}}
/* split letters */
.split .w{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em}
.split .c{display:inline-block;transform:translateY(110%) rotate(${d.upper ? 0 : 6}deg);transition:transform 1.2s cubic-bezier(.19,1,.22,1);transition-delay:calc(var(--i)*.028s + .1s)}
.ready .split .c{transform:none}
.split em .c{color:var(--accent)}
/* hero */
.hero{position:relative;min-height:100svh;display:flex;flex-direction:column;justify-content:flex-end;padding:120px var(--gut) clamp(32px,5vw,64px);overflow:hidden}
.hero-cv{position:absolute;inset:0;width:100%;height:100%;z-index:0}
.hero-in{position:relative;z-index:2;display:grid;gap:clamp(24px,3vw,44px)}
.hero-foot{display:flex;justify-content:space-between;align-items:flex-end;gap:28px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:24px}
.hero-fluid .h-mega{mix-blend-mode:${c.isDark ? 'normal' : 'multiply'}}
.krow{white-space:nowrap;will-change:transform}
.hero-kinetic .h-mega{font-size:clamp(56px,13vw,240px)}
.hero-kinetic .krow:nth-child(2){padding-inline-start:12vw}
.hero-grid{justify-content:space-between;padding-top:110px}
.stage3d{position:relative;z-index:2;perspective:1200px;display:grid;place-items:center;flex:1;min-height:42vh}
.card3d{width:min(420px,72vw);aspect-ratio:1.586;border-radius:calc(var(--r) + 10px);background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 80%,#fff),var(--accent2));box-shadow:0 50px 100px -30px color-mix(in srgb,var(--fg) 40%,transparent),inset 0 1px 0 rgba(255,255,255,.5);display:flex;flex-direction:column;justify-content:space-between;padding:26px;transform-style:preserve-3d;position:relative;overflow:hidden;color:var(--on-accent)}
.card3d::after{content:"";position:absolute;inset:-50%;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.45) 50%,transparent 60%);transform:translateX(calc(var(--shine,0) * 1%));animation:shine 5s ease-in-out infinite}
@keyframes shine{0%,100%{transform:translateX(-30%)}50%{transform:translateX(30%)}}
.card3d img{height:42px;width:auto;max-width:60%;object-fit:contain;transform:translateZ(40px)}
.card3d .chip{width:46px;height:34px;border-radius:7px;background:linear-gradient(135deg,rgba(255,255,255,.8),rgba(255,255,255,.2));transform:translateZ(30px)}
.card3d .nm{font:600 15px/1 var(--body);letter-spacing:.1em;text-transform:uppercase;transform:translateZ(30px)}
.hero-grid .ghost-word{font:${d.weight} clamp(56px,12vw,220px)/.8 var(--display);letter-spacing:-.05em;color:color-mix(in srgb,var(--fg) 22%,var(--bg));margin:0;position:relative;z-index:2}
.stk{position:absolute;z-index:1;translate:0 0;transform:translateY(calc(var(--py,0px) * -1)) rotate(var(--rot,0deg));transition:translate .2s linear}
.stk.logo{width:clamp(80px,12vw,180px);padding:18px;border-radius:var(--r);background:var(--accent)}
.stk.logo img{width:100%;height:auto;filter:var(--on-accent-filter)}
.stk.dot{border-radius:50%}
.stk.tag{font:600 13px/1 var(--body);letter-spacing:.12em;text-transform:uppercase;padding:12px 16px;border:1px solid var(--line);border-radius:999px;background:var(--bg)}
.vert{position:absolute;z-index:2;inset-inline-start:var(--gut);top:120px;writing-mode:vertical-rl;font:500 13px/1 var(--body);letter-spacing:.2em;text-transform:uppercase;color:var(--accent)}
/* logo zoom */
.logo-scroll{position:relative;height:260vh;background:var(--bg)}
.ls-sticky{position:sticky;top:0;height:100vh;display:grid;place-items:center;overflow:hidden;background:var(--accent);color:var(--on-accent)}
.ls-logo{width:min(46vw,380px);max-height:46vh;object-fit:contain;will-change:transform;filter:var(--on-accent-filter)}
.ls-text{position:absolute;text-align:center;opacity:0;padding-inline:var(--gut)}
.ls-text .h-xl em{color:var(--on-accent);text-decoration:underline;text-decoration-thickness:.06em;text-underline-offset:.12em}
/* manifesto */
.manifesto{padding:clamp(100px,14vw,220px) var(--gut);display:grid;grid-template-columns:1fr 3fr;gap:32px}
.manifesto p{font:${d.weight} clamp(30px,4.4vw,72px)/1.05 var(--display);letter-spacing:${d.track};margin:0}
.mw{opacity:.15;transition:opacity .3s}.mw.on{opacity:1}.mw.acc{color:var(--accent)}
@media (max-width:800px){.manifesto{grid-template-columns:1fr}}
/* stacking services */
.stack{padding:0 var(--gut) clamp(80px,10vw,160px)}
.stack-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;padding-bottom:48px}
.scard{position:sticky;top:calc(12vh + var(--i) * 26px);min-height:62vh;border-radius:calc(var(--r) * 1.6);padding:clamp(28px,4vw,56px);display:grid;grid-template-columns:auto 1fr;gap:clamp(24px,5vw,80px);align-content:space-between;margin-bottom:6vh;transform-origin:top center;will-change:transform}
.scard:nth-child(3n+1){background:var(--accent);color:var(--on-accent)}
.scard:nth-child(3n+2){background:var(--fg);color:var(--bg)}
.scard:nth-child(3n+3){background:var(--accent2);color:${c.onAccent2}}
.scard .n{font:${d.weight} clamp(80px,12vw,200px)/.8 var(--display);letter-spacing:-.06em}
.scard h3{font:${d.weight} clamp(32px,4.6vw,76px)/1 var(--display);letter-spacing:${d.track};margin:0 0 18px}
.scard p{font-size:clamp(17px,1.4vw,22px);max-width:26em;margin:0;opacity:.85}
.scard em{color:inherit}
@media (max-width:700px){.scard{grid-template-columns:1fr}}
/* horizontal gallery */
.gal{position:relative;height:340vh}
.gal-sticky{position:sticky;top:0;height:100vh;overflow:hidden;display:flex;flex-direction:column;justify-content:center;gap:32px}
.gal-track{display:flex;gap:24px;padding-inline:var(--gut);will-change:transform}
.gcard{flex:none;width:clamp(280px,38vw,620px);display:grid;gap:14px}
.art{position:relative;aspect-ratio:4/3;border-radius:var(--r);overflow:hidden;background:var(--surface)}
.gcard .cap{display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:12px;font-size:15px}
.gcard .cap span:last-child{color:var(--muted)}
.gal-bar{height:2px;background:var(--line);margin-inline:var(--gut)}.gal-bar i{display:block;height:100%;width:0;background:var(--accent)}
@media (max-width:899px),(prefers-reduced-motion:reduce){.gal{height:auto;padding-block:80px}.gal-sticky{position:static;height:auto}.gal-track{overflow-x:auto;scroll-snap-type:x mandatory;transform:none!important}.gcard{width:80vw;scroll-snap-align:start}}
/* generated art */
.a1{background:var(--accent);display:grid;place-items:center}.a1 img{width:45%;max-height:55%;object-fit:contain;filter:var(--on-accent-filter);animation:float 6s ease-in-out infinite}
.a2{background:radial-gradient(50% 60% at 30% 40%,var(--accent),transparent 70%),radial-gradient(50% 60% at 70% 65%,var(--accent2),transparent 70%),var(--fg)}
.a2 span{position:absolute;inset-inline-start:24px;bottom:18px;font:${d.weight} clamp(40px,6vw,96px)/.85 var(--display);color:var(--bg);letter-spacing:-.04em}
.a3{background:var(--bg);background-image:radial-gradient(circle at center,var(--accent) 0 28%,transparent 29%);background-size:25% 33.33%;animation:dots 8s linear infinite}
@keyframes dots{to{background-position:100% 0}}
.a4{background:var(--accent2);display:flex;align-items:center;overflow:hidden}.a4 span{font:${d.weight} 30vw/.8 var(--display);white-space:nowrap;color:var(--accent);letter-spacing:-.06em;animation:slide 14s linear infinite}
@keyframes slide{to{transform:translateX(-50%)}}
.a5{background:repeating-linear-gradient(133deg,var(--accent) 0 22px,var(--bg) 22px 44px)}
.a5::after{content:"";position:absolute;inset:22%;border-radius:50%;background:var(--fg)}
@keyframes float{50%{transform:translateY(-12px) rotate(-4deg)}}
/* bento */
.bento{padding:clamp(80px,10vw,160px) var(--gut);display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(220px,auto);gap:16px}
.bx{border-radius:var(--r);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);padding:24px;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;gap:16px;transition:transform .6s cubic-bezier(.19,1,.22,1)}
.bx:hover{transform:translateY(-4px)}
.bx.w2{grid-column:span 2}.bx.h2{grid-row:span 2}
.bx.acc{background:var(--accent);color:var(--on-accent);box-shadow:none}
.bx .big{font:${d.weight} clamp(40px,5vw,84px)/.9 var(--display);letter-spacing:-.04em}
.ring{width:150px;height:150px;align-self:center}
.ring circle{fill:none;stroke-width:10}.ring .bgc{stroke:var(--line)}.ring .fg{stroke:var(--accent);stroke-linecap:round;stroke-dasharray:377;stroke-dashoffset:377;transition:stroke-dashoffset 2s cubic-bezier(.19,1,.22,1)}
.in .ring .fg,.ring.in .fg{stroke-dashoffset:120}
.pal{display:flex;height:100%;min-height:120px;border-radius:calc(var(--r) * .6);overflow:hidden}.pal i{flex:1;transition:flex .6s cubic-bezier(.19,1,.22,1)}.pal i:hover{flex:2.4}
@media (max-width:900px){.bento{grid-template-columns:1fr 1fr}.bx.w2{grid-column:span 2}}
@media (max-width:560px){.bento{grid-template-columns:1fr}.bx.w2{grid-column:auto}}
/* numbers */
.nums{padding:0 var(--gut) clamp(80px,10vw,160px);display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.nums div{border-top:1px solid var(--fg);padding-top:20px;display:grid;gap:8px}
.nums .count{font:${d.weight} clamp(56px,8vw,140px)/.85 var(--display);letter-spacing:-.05em}
.nums span{color:var(--muted)}
@media (max-width:700px){.nums{grid-template-columns:1fr}}
/* marquee band */
.band{background:var(--accent);color:var(--on-accent);overflow:hidden;padding-block:20px;direction:ltr}
.band-in{display:flex;width:max-content;will-change:transform}
.band span{display:inline-flex;align-items:center;gap:.4em;padding-inline-end:.4em;font:${d.weight} clamp(44px,7vw,120px)/1 var(--display);letter-spacing:-.04em;white-space:nowrap;text-transform:${d.upper ? 'uppercase' : 'none'}}
.band img{height:.7em;width:auto;filter:var(--on-accent-filter)}
/* final */
.final{padding:clamp(100px,12vw,200px) var(--gut) 32px;display:grid;gap:clamp(40px,6vw,80px)}
.final-top{display:flex;justify-content:space-between;align-items:flex-end;gap:32px;flex-wrap:wrap}
.fitwrap{overflow:hidden}.fit{display:inline-block;white-space:nowrap;font:${d.weight} 100px/.8 var(--display);letter-spacing:-.05em;text-transform:${d.upper ? 'uppercase' : 'none'}}
.foot{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:20px;font-size:14px;color:var(--muted)}
/* reveal */
.rv{opacity:0;transform:translateY(50px);transition:opacity 1.2s cubic-bezier(.19,1,.22,1),transform 1.2s cubic-bezier(.19,1,.22,1)}.rv.in{opacity:1;transform:none}
.grain::after{content:"";position:fixed;inset:-50%;z-index:80;pointer-events:none;opacity:.07;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");animation:grain 1s steps(6) infinite}
@keyframes grain{0%{transform:translate(0,0)}20%{transform:translate(-5%,3%)}40%{transform:translate(3%,-6%)}60%{transform:translate(-2%,5%)}80%{transform:translate(6%,1%)}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}.split .c,.rv{transform:none!important;opacity:1!important}.logo-scroll{height:auto}.ls-sticky{position:static;height:70vh}.ls-text{opacity:1;position:static;margin-top:24px}}
`;
  }

  /* ---------- sections ---------- */
  function heroHTML(b, d, t) {
    const h1 = `<h1 class="h-mega split">${stars(t.h1[0])}<br>${stars(t.h1[1])}</h1>`;
    const foot = `<div class="hero-foot"><p class="lead">${esc(fill(t.sub, b.name))}</p><a class="btn mag" href="#contact">${esc(t.cta)}<i>→</i></a></div>`;
    if (d.style === 'kinetic') {
      return `<section class="hero hero-kinetic"><canvas class="hero-cv" aria-hidden="true"></canvas><div class="hero-in"><p class="eyebrow">${esc(t.eyebrow)}</p>
        <h1 class="h-mega split"><span class="krow" style="display:block" data-x="${d.rtl ? 220 : -220}">${stars(t.h1[0])}</span><span class="krow" style="display:block" data-x="${d.rtl ? -220 : 220}">${stars(t.h1[1])}</span></h1>${foot}</div></section>`;
    }
    if (d.style === 'grid') {
      return `<section class="hero hero-grid"><canvas class="hero-cv" aria-hidden="true"></canvas>
        <div class="hero-in" style="text-align:center;justify-items:center"><p class="eyebrow">${esc(t.eyebrow)}</p><h1 class="h-xl split">${stars(t.h1[0])} ${stars(t.h1[1])}</h1></div>
        <div class="stage3d"><div class="card3d"><div style="display:flex;justify-content:space-between;align-items:flex-start;transform:translateZ(30px)">${b.logo ? `<img src="${b.logo}" alt="" style="filter:var(--on-accent-filter)">` : ''}<span class="chip"></span></div><span class="nm">${esc(b.name)}</span></div></div>
        <div class="hero-in">${foot}<p class="ghost-word">${esc(b.domain)}</p></div></section>`;
    }
    if (d.style === 'collage') {
      const st = [
        `<div class="stk logo" style="top:18%;inset-inline-end:8%;--rot:-8deg" data-py=".25" data-mouse="1"><img src="${b.logo}" alt=""></div>`,
        `<div class="stk dot" style="width:12vw;height:12vw;background:var(--accent2);top:24%;inset-inline-start:30%" data-py=".5" data-mouse="-1.4"></div>`,
        `<div class="stk dot" style="width:5vw;height:5vw;background:var(--accent);top:58%;inset-inline-end:28%" data-py=".7" data-mouse="2"></div>`,
        `<div class="stk tag" style="top:40%;inset-inline-end:14%;--rot:6deg" data-py=".35" data-mouse=".8">${esc(t.tag)}</div>`,
        `<div class="stk" style="width:16vw;height:6vw;border:1.5px solid var(--accent);top:14%;inset-inline-start:46%;--rot:-24deg" data-py=".6" data-mouse="-.6"></div>`,
        `<div class="stk tag" style="top:66%;inset-inline-start:52%;--rot:-5deg;background:var(--accent);color:var(--on-accent);border:0" data-py=".2" data-mouse="1.2">EST. ${new Date().getFullYear()}</div>`
      ].join('');
      return `<section class="hero hero-collage"><canvas class="hero-cv" aria-hidden="true"></canvas>${st}<span class="vert" aria-hidden="true">${esc(b.name)} · ${esc(t.tag)}</span><div class="hero-in"><p class="eyebrow">${esc(t.eyebrow)}</p>${h1}${foot}</div></section>`;
    }
    return `<section class="hero hero-fluid"><canvas class="hero-cv" aria-hidden="true"></canvas><div class="hero-in"><p class="eyebrow">${esc(t.eyebrow)}</p>${h1}${foot}</div></section>`;
  }
  const SECTIONS = {
    hero: heroHTML,
    logo: (b, d, t) => `<section class="logo-scroll" data-sc="logo" aria-label="${esc(b.name)}"><div class="ls-sticky"><img class="ls-logo" src="${b.logo}" alt="${esc(b.name)}"><div class="ls-text"><h2 class="h-xl">${stars(t.tag)}</h2></div></div></section>`,
    manifesto: (b, d, t) => `<section class="manifesto" data-sc="man"><p class="eyebrow">${esc(b.name)}</p><p>${stars(t.manifesto)}</p></section>`,
    services: (b, d, t) => `<section class="stack" data-sc="stack" id="services"><div class="stack-head"><h2 class="h-xl rv">${esc(t.servicesTitle)}</h2><p class="lead rv">${esc(t.tag)}</p></div><div class="cards">${t.services.map(([h, p], i) => `<article class="scard" style="--i:${i}"><span class="n">0${i + 1}</span><div style="align-self:end"><h3>${esc(h)}</h3><p>${esc(p)}</p></div></article>`).join('')}</div></section>`,
    gallery: (b, d, t) => `<section class="gal" data-sc="gal" id="work"><div class="gal-sticky"><div class="wrap" style="display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap"><h2 class="h-xl">${esc(t.galleryTitle)}</h2><span class="eyebrow">0${t.gallery.length} · ${new Date().getFullYear()}</span></div>
      <div class="gal-track">${t.gallery.map((g, i) => `<figure class="gcard" style="margin:0"><div class="art a${i % 5 + 1}">${i % 5 === 0 ? `<img src="${b.logo}" alt="">` : i % 5 === 1 ? `<span>${esc(b.name)}</span>` : i % 5 === 3 ? `<span>${esc(b.name)} ${esc(b.name)} </span>` : ''}</div><figcaption class="cap"><span>${esc(g)}</span><span>0${i + 1}</span></figcaption></figure>`).join('')}</div><div class="gal-bar"><i></i></div></div></section>`,
    bento: (b, d, t) => `<section class="bento" id="about"><div class="bx w2 h2 acc rv"><span class="eyebrow" style="color:inherit">${esc(b.name)}</span><span class="big">${esc(t.bento[0])}</span></div>
      <div class="bx rv"><span class="eyebrow">${esc(t.stats[0][1])}</span><svg class="ring rv" viewBox="0 0 140 140" aria-hidden="true"><circle class="bgc" cx="70" cy="70" r="60"/><circle class="fg" cx="70" cy="70" r="60" transform="rotate(-90 70 70)"/></svg><span class="big" style="font-size:44px">${esc(t.stats[0][0])}</span></div>
      <div class="bx rv" style="display:grid;place-items:center"><img src="${b.logo}" alt="" style="max-width:70%;max-height:120px;object-fit:contain;filter:var(--logo-filter);animation:float 6s ease-in-out infinite"></div>
      <div class="bx w2 rv"><span class="eyebrow">${esc(b.fonts.display)} · ${esc(b.fonts.body)}</span><div class="pal"><i style="background:var(--accent)"></i><i style="background:var(--accent2)"></i><i style="background:var(--fg)"></i><i style="background:var(--surface)"></i></div></div>
      <div class="bx w2 rv" style="background:var(--fg);color:var(--bg)"><span class="big">${esc(t.bento[1])}</span><a class="btn mag" href="#contact" style="align-self:flex-start">${esc(t.cta)}<i>→</i></a></div></section>`,
    numbers: (b, d, t) => `<section class="nums">${t.stats.map(([v, l]) => `<div class="rv"><span class="count" data-v="${esc(v)}">${esc(v)}</span><span>${esc(l)}</span></div>`).join('')}</section>`,
    marquee: (b, d, t) => { const u = `<span>${esc(b.name)}<img src="${b.logo}" alt=""></span><span>${esc(t.tag)}<img src="${b.logo}" alt=""></span>`; return `<div class="band" aria-hidden="true"><div class="band-in">${u.repeat(4)}</div></div>`; },
    cta: (b, d, t) => `<section class="final" id="contact"><div class="final-top"><h2 class="h-xl rv">${stars(t.final)}</h2><a class="btn mag" href="mailto:hello@${esc(b.domain)}">${esc(t.button)}<i>→</i></a></div><div class="fitwrap"><span class="fit">${esc(b.name)}</span></div><div class="foot"><span>hello@${esc(b.domain)}</span><span>${t.nav.map(esc).join(' · ')}</span><span>© ${new Date().getFullYear()} ${esc(b.name)}</span></div></section>`
  };

  function generate(cfg) {
    const b = cfg.brand, c = cfg.content, d = Object.assign({}, cfg.design);
    d.rtl = c.lang === 'he';
    const t = COPY[c.industry][c.lang];
    const name = c.name || b.name || 'Brand';
    const brand = Object.assign({}, b, { name, domain: c.domain || 'brand.com' });
    const tt = Object.assign({}, t, {
      h1: c.h1a || c.h1b ? [c.h1a || t.h1[0], c.h1b || t.h1[1]] : t.h1,
      sub: c.sub || t.sub
    });
    const STY = { fluid: { weight: 500, track: '-.045em', upper: false }, kinetic: { weight: 800, track: '-.03em', upper: true }, grid: { weight: 500, track: '-.04em', upper: false }, collage: { weight: 700, track: '-.035em', upper: false } }[d.style];
    Object.assign(d, STY);
    if (d.rtl) d.upper = false;
    const fams = [...new Set([b.fonts.display, b.fonts.body].concat(d.rtl ? [b.fonts.display, b.fonts.body].filter(f => !HEBREW_OK.includes(f)).map(f => (FONTS[f] || [0, 'sans'])[1] === 'serif' ? 'Frank Ruhl Libre' : 'Heebo') : []))];
    const order = cfg.sections.filter(s => s.on).map(s => s.id);
    const body = order.map(id => SECTIONS[id] ? SECTIONS[id](brand, d, tt) : '').join('\n');
    const C = { style: d.style, intensity: d.intensity, smooth: d.fx.smooth, colors: b.colors };
    return `<!doctype html>
<html lang="${c.lang}" dir="${d.rtl ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)}</title>
<meta name="description" content="${esc(fill(tt.sub, name))}">
<meta name="generator" content="ONLY STORY · Brand to Site">
${fams.map(f => `<link rel="stylesheet" href="${fontLink(f)}">`).join('\n')}
<style>${css(brand, d)}
:root{--on-accent-filter:${b.onAccentFilter};--pre-filter:${b.onAccentFilter}}</style>
</head>
<body class="${d.fx.grain ? 'grain' : ''}">
${d.fx.preloader ? `<div class="pre" aria-hidden="true"><img src="${b.logo}" alt=""><span class="pre-n">0</span></div>` : ''}
${d.fx.cursor ? '<div class="cursor" aria-hidden="true"></div>' : ''}
<header class="nav"><a href="#" aria-label="${esc(name)}"><img class="logo" src="${b.logo}" alt="${esc(name)}"></a><ul>${tt.nav.slice(0, 3).map((n, i) => `<li><a href="#${['work', 'services', 'about'][i]}">${esc(n)}</a></li>`).join('')}</ul><a class="btn mag" href="#contact">${esc(tt.nav[3])}</a></header>
<main>
${body}
</main>
<script>(${runtime.toString()})(${JSON.stringify(C)});</script>
</body>
</html>`;
  }

  function brief(cfg) {
    const b = cfg.brand, c = cfg.content, d = cfg.design;
    const on = Object.keys(d.fx).filter(k => d.fx[k]);
    return `ONLY STORY · Brand → Site → Claude Code
────────────────────────────────────────
Brand      ${c.name} (${c.domain})
Industry   ${c.industry} · language ${c.lang} · ${c.lang === 'he' ? 'RTL' : 'LTR'}
Palette    bg ${b.colors.bg} · fg ${b.colors.fg} · accent ${b.colors.accent} · accent-2 ${b.colors.accent2}
Type       display "${b.fonts.display}" · body "${b.fonts.body}" (Google Fonts)
Radius     ${b.radius}px
Direction  ${d.style} · intensity ${d.intensity}
Sections   ${cfg.sections.filter(s => s.on).map(s => s.id).join(' → ')}
Effects    ${on.join(', ')}, split-letter headline, word-fill manifesto,
           sticky stacking cards, pinned horizontal gallery, logo zoom on scroll,
           velocity marquee, magnetic buttons, counters
Rules      respect prefers-reduced-motion · contrast ≥ 4.5:1 · keep sticky sections on native scroll

Rebuild the attached generated HTML as a production site (Next.js or Astro),
keeping the tokens, section order and motion above. Replace the sample copy
and numbers with the real ones before launch.`;
  }

  window.SiteGen = { generate, brief, COPY, FONTS, HEBREW_OK, fontLink };
})();

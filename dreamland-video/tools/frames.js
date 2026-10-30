// רינדור פריימים בודדים / בדיקת QA מתוך אותו מנוע.
// שימוש: node tools/frames.js sheet <outDir>     — פריים כל 2 שניות
//        node tools/frames.js qa                 — בדיקת חפיפות/חיתוכים בכל פריים
//        node tools/frames.js at <outDir> t1 t2… — פריימים בזמנים נבחרים
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');

function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
  const srv = http.createServer((req, res) => {
    const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(d); });
  });
  return new Promise(r => srv.listen(0, () => r(srv)));
}

async function open() {
  const srv = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`http://localhost:${srv.address().port}/index.html`);
  await page.evaluate(() => DREAM.init(document.getElementById('cv')));
  return { srv, browser, page };
}

async function grab(page, t, file) {
  const url = await page.evaluate(t => { DREAM.render(t); return document.getElementById('cv').toDataURL('image/png'); }, t);
  fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
}

(async () => {
  const [mode, out, ...rest] = process.argv.slice(2);
  const { srv, browser, page } = await open();
  if (mode === 'sheet' || mode === 'at') {
    fs.mkdirSync(out, { recursive: true });
    const times = mode === 'sheet' ? Array.from({ length: 51 }, (_, i) => i * 2) : rest.map(Number);
    for (const t of times) await grab(page, t, path.join(out, `t${t.toFixed(2).padStart(6, '0')}.png`));
    console.log('frames:', times.length);
  } else if (mode === 'qa') {
    const res = await page.evaluate(() => {
      const bad = [];
      const N = Math.ceil(DREAM.DUR * 30);
      for (let f = 0; f < N; f++) {
        const r = DREAM.qa(f / 30);
        if (r.issues.length) bad.push({ f, t: +(f / 30).toFixed(2), issues: r.issues.slice(0, 4) });
      }
      return { N, bad };
    });
    console.log(`frames checked: ${res.N}, frames with issues: ${res.bad.length}`);
    for (const b of res.bad) console.log(`#${b.f} t=${b.t}`, b.issues.join(' | '));
  }
  await browser.close(); srv.close();
})();

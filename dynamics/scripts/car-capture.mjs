// צילומי הרכב: מנוחה, חלון חיתוך בכמה נקודות, ונייד. node scripts/car-capture.mjs
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = process.env.BASE ?? 'http://localhost:4173';
mkdirSync('shots', { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const video = process.argv.includes('--video');
for (const [w, h, touch] of [[1440, 900, false], [390, 844, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch,
    recordVideo: video && !touch ? { dir: 'shots/video', size: { width: 1280, height: 800 } } : undefined });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3200);
  await page.screenshot({ path: `shots/car_${w}_idle.png` });
  if (!touch) {
    const pts = [[0.62, 0.42], [0.5, 0.45], [0.35, 0.47]];
    for (const [i, [px, py]] of pts.entries()) {
      for (let k = 0; k <= 30; k++) await page.mouse.move(w * px + (30 - k) * 4, h * py, { steps: 1 }), await page.waitForTimeout(16);
      await page.waitForTimeout(700);
      await page.screenshot({ path: `shots/car_${w}_lens${i + 1}.png` });
    }
    if (video) { for (let k = 0; k <= 120; k++) { await page.mouse.move(w * (0.75 - k / 240), h * (0.44 + 0.04 * Math.sin(k / 12))); await page.waitForTimeout(16); } }
    for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(80); }
    await page.waitForTimeout(800);
    await page.screenshot({ path: `shots/car_${w}_scroll.png` });
  }
  const info = await page.evaluate(() => window.__car?.stats());
  console.log(w, JSON.stringify(info), 'errors', errors.length ? errors.slice(0, 5) : 'none');
  await ctx.close();
}
await browser.close();

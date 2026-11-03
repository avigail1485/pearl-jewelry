// צילום ווידאו של הפתיחה עם תנועת עכבר מדומה. node scripts/hero-capture.mjs
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = process.env.BASE ?? 'http://localhost:4173';
mkdirSync('shots', { recursive: true });

const browser = await chromium.launch();
for (const [w, h, touch] of [[1440, 900, false], [390, 844, true]]) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch,
    recordVideo: w > 1000 ? { dir: 'shots/video', size: { width: 1280, height: 800 } } : undefined,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `shots/hero_${w}_intro.png` });
  await page.waitForTimeout(2600);
  if (!touch) {
    // תנועת S רחבה של הסמן
    for (let i = 0; i <= 90; i++) {
      const t = i / 90;
      await page.mouse.move(w * (0.85 - 0.7 * t), h * (0.5 + 0.3 * Math.sin(t * Math.PI * 2)));
      await page.waitForTimeout(16);
    }
  } else {
    await page.waitForTimeout(2500); // תנועה אוטומטית בלי מגע
  }
  await page.screenshot({ path: `shots/hero_${w}_trail.png` });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `shots/hero_${w}_fade.png` });
  for (let i = 0; i < 9; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(60); }
  await page.waitForTimeout(700);
  await page.evaluate(() => document.querySelector('.band').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `shots/hero_${w}_band.png` });
  for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(60); }
  await page.waitForTimeout(900);
  await page.screenshot({ path: `shots/hero_${w}_statement.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log(w, 'overflowX', overflow, 'errors', errors.length ? errors : 'none');
  await ctx.close();
}
await browser.close();

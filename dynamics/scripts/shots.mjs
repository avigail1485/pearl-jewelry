// צילומי Playwright. שימוש: node scripts/shots.mjs [path] [widths...]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const base = process.env.BASE ?? 'http://localhost:4173';
const path = process.argv[2] ?? '/specimen.html';
const widths = (process.argv.slice(3).length ? process.argv.slice(3) : ['360', '1024', '1440']).map(Number);
mkdirSync('shots', { recursive: true });

const browser = await chromium.launch();
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: Math.round(w < 768 ? w * 2.1 : w * 0.6) } });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const name = `shots/${path.replace(/[^a-z0-9]+/gi, '_')}_${w}.png`;
  await page.screenshot({ path: name, fullPage: true });
  console.log(name, 'overflowX:', overflow, 'errors:', errors.length ? errors : 'none');
  await page.close();
}
await browser.close();

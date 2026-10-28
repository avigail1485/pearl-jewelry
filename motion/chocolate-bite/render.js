// Renders index.html frame-by-frame to an MP4 (1920x1080, 30fps).
// Usage: node render.js [narration.wav] [out.mp4]
// If a narration file is given (or narration.wav sits next to this script) it is muxed in.
const { chromium } = require('playwright');
const { mkdtempSync, existsSync, rmSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { pathToFileURL } = require('node:url');

const here = __dirname;
const FPS = 30, DURATION = 14;
const audio = process.argv[2] ? resolve(process.argv[2]) : (existsSync(join(here, 'narration.wav')) ? join(here, 'narration.wav') : null);
const out = resolve(process.argv[3] || join(here, 'chocolate-bite.mp4'));
const frames = mkdtempSync(join(tmpdir(), 'choc-frames-'));

(async () => {
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(join(here, 'index.html')).href + '?render');
await page.evaluate(() => window.__ready);

const total = Math.round(FPS * DURATION);
for (let i = 0; i < total; i++) {
  await page.evaluate(t => window.__render(t), i / FPS);
  await page.screenshot({ path: join(frames, `f${String(i).padStart(4, '0')}.png`) });
  if (i % 30 === 0) process.stdout.write(`frame ${i}/${total}\n`);
}
await browser.close();

const args = ['-y', '-framerate', String(FPS), '-i', join(frames, 'f%04d.png')];
if (audio) args.push('-i', audio, '-c:a', 'aac', '-b:a', '192k', '-shortest');
args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out);
execFileSync('ffmpeg', args, { stdio: 'inherit' });
rmSync(frames, { recursive: true, force: true });
console.log('wrote', out);
})();

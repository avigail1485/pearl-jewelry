// Renders index.html frame-by-frame to an MP4 (1920x1080, 30fps).
// Usage: node render.js [narration.wav] [out.mp4]
// The generated music (music.js) is always mixed in; a narration file, if given
// (or narration.wav next to this script), is laid on top with the music ducked under it.
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
// the score is rendered by the same code that plays live, against the same markers
const music = join(frames, 'music.wav');
require('node:fs').writeFileSync(music, Buffer.from(await page.evaluate(() => window.__music()), 'base64'));
require('node:fs').copyFileSync(music, join(here, 'music.wav'));
await browser.close();

const args = ['-y', '-framerate', String(FPS), '-i', join(frames, 'f%04d.png'), '-i', music];
if (audio) args.push('-i', audio, '-filter_complex', '[1:a]volume=0.45[m];[m][2:a]amix=inputs=2:duration=first:normalize=0[a]', '-map', '0:v', '-map', '[a]');
args.push('-c:a', 'aac', '-b:a', '192k', '-t', String(DURATION));
args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out);
execFileSync('ffmpeg', args, { stdio: 'inherit' });
rmSync(frames, { recursive: true, force: true });
console.log('wrote', out);
})();

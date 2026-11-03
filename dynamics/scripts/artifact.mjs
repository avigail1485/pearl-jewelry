// אורז את הבנייה לעמוד לייב מתארח (Artifact): גוף העמוד בלי שלד html, וכל הקבצים לצידו.
// שימוש: node scripts/artifact.mjs <תיקיית יעד>
import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2];
if (!out) throw new Error('חסרה תיקיית יעד');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync('dist/assets', join(out, 'assets'), { recursive: true });
cpSync('dist/contact', join(out, 'contact'), { recursive: true });

// הפונט Tel Aviv עוד לא סופק: מסירים את ה-@font-face שלו כדי לא לייצר בקשות שנכשלות
for (const f of readdirSync(join(out, 'assets')).filter((f) => f.endsWith('.css'))) {
  const p = join(out, 'assets', f);
  writeFileSync(p, readFileSync(p, 'utf8').replace(/@font-face\{[^}]*TelAvivBrutalist[^}]*\}/g, ''));
}

const html = readFileSync('dist/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const css = [...head.matchAll(/<link rel="stylesheet"[^>]*>/g)].map((m) => m[0]);
const preloads = [...head.matchAll(/<link rel="modulepreload"[^>]*>/g)].map((m) => m[0]);
const scripts = [...head.matchAll(/<script type="module"[^>]*><\/script>/g)].map((m) => m[0]);

const page = `<title>DYNAMICS לייב</title>
<meta name="description" content="סטודיו DYNAMICS. זהות מותג, קריאייטיב, פרסום, קופי, ובנייה ועיצוב של אתרים. בואו לנסוע.">
<meta name="theme-color" content="#1D1D1B">
${css.join('\n')}
${preloads.join('\n')}
<style>:root{color-scheme:dark}html,body{background:#1D1D1B}</style>
<div lang="he" dir="rtl">
${body.replace(/href="\.\/contact\/"/g, 'href="contact/index.html"')}
</div>
${scripts.join('\n')}
`;
writeFileSync(join(out, 'index.html'), page);
console.log('נארז אל', out);

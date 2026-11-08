// Builds one self-contained page (JS + CSS + fonts inlined) for the private hosted version;
// animations, photos and models are published next to it as files.
//   node scripts/make-artifact.mjs [distDir] [outFile] [title]
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const dist = process.argv[2] ?? "dist-artifact";
const outFile = process.argv[3] ?? "artifact/index.html";
const title = process.argv[4] ?? "אגורה";
const files = readdirSync(join(dist, "assets"));
const js = readFileSync(join(dist, "assets", files.find((f) => f.endsWith(".js"))), "utf8");
let css = readFileSync(join(dist, "assets", files.find((f) => f.endsWith(".css"))), "utf8");
for (const w of ["light", "demibold"]) {
  const b64 = readFileSync(`public/assets/fonts/gloria-${w}-aaa.woff2`).toString("base64");
  css = css.replaceAll(`../assets/fonts/gloria-${w}-aaa.woff2`, `data:font/woff2;base64,${b64}`);
}
const page = `<title>${title}</title>
<meta name="description" content="אגורה · לוח קהילתי למסירת חפצים בחינם. לתת זה לקבל.">
<style>html{color-scheme:light}body{background:#FFFFFF;color:#1E1E1E}</style>
<style>${css}</style>
<div id="root" dir="rtl" lang="he"></div>
<script>document.documentElement.lang="he";document.documentElement.dir="rtl";</script>
<script type="module">${js.replaceAll("</script", "<\\/script")}</script>
`;
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, page);
console.log(outFile, (page.length / 1024).toFixed(0) + " KB");

// Builds artifact/index.html: one self-contained page (JS + CSS + fonts inlined);
// the animations/illustrations/icons are published next to it as files.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dist = "dist-artifact";
const files = readdirSync(join(dist, "assets"));
const js = readFileSync(join(dist, "assets", files.find((f) => f.endsWith(".js"))), "utf8");
let css = readFileSync(join(dist, "assets", files.find((f) => f.endsWith(".css"))), "utf8");
for (const w of ["light", "demibold"]) {
  const b64 = readFileSync(`public/assets/fonts/gloria-${w}-aaa.woff2`).toString("base64");
  css = css.replaceAll(`../assets/fonts/gloria-${w}-aaa.woff2`, `data:font/woff2;base64,${b64}`);
}
const page = `<title>אגורה</title>
<meta name="description" content="אגורה · לוח קהילתי למסירת חפצים בחינם. לתת זה לקבל.">
<style>html{color-scheme:light}body{background:#FFFFFF;color:#1E1E1E}</style>
<style>${css}</style>
<div id="root" dir="rtl" lang="he"></div>
<script>document.documentElement.lang="he";document.documentElement.dir="rtl";</script>
<script type="module">${js.replaceAll("</script", "<\\/script")}</script>
`;
mkdirSync("artifact", { recursive: true });
writeFileSync("artifact/index.html", page);
console.log("artifact/index.html", (page.length / 1024).toFixed(0) + " KB");

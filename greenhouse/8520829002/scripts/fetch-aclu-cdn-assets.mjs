/**
 * Докачивает ресурсы из url(...) в локальных entry-*.css / vendor-*.css
 * (шрифты ../fonts/*, спрайты флагов в assets/) с job-boards.cdn.greenhouse.io.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cdnRoot = path.join(__dirname, "../job-boards.cdn.greenhouse.io");
const assetsDir = path.join(cdnRoot, "assets");

function extractUrls(cssText) {
  const out = [];
  for (const m of cssText.matchAll(/url\(([^)]+)\)/g)) {
    const raw = m[1].trim().replace(/^["']|["']$/g, "");
    if (raw.startsWith("data:")) continue;
    out.push(raw);
  }
  return out;
}

const cssNames = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".css"));
if (cssNames.length === 0) throw new Error(`No CSS in ${assetsDir}`);

const seen = new Set();

for (const name of cssNames) {
  const cssPath = path.join(assetsDir, name);
  const css = fs.readFileSync(cssPath, "utf8");
  const baseHref = `https://job-boards.cdn.greenhouse.io/assets/${name}`;

  for (const rel of extractUrls(css)) {
    const absolute = new URL(rel, baseHref).href;
    if (seen.has(absolute)) continue;
    seen.add(absolute);

    const { pathname } = new URL(absolute);
    const localPath = path.join(cdnRoot, pathname.replace(/^\//, ""));

    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    const res = await fetch(absolute);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${absolute}`);
    fs.writeFileSync(localPath, Buffer.from(await res.arrayBuffer()));
    console.log("OK", path.relative(cdnRoot, localPath));
  }
}

console.log("Done,", seen.size, "files");

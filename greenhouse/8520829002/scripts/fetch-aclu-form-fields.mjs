/**
 * Скачивает актуальную страницу вакансии ACLU и сохраняет только questions + eeoc_sections
 * в каталог рядом с 8520829002.html (для aclu-hydrate-selects.js).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../job-boards.greenhouse.io/aclu/jobs");
const url = "https://job-boards.greenhouse.io/aclu/jobs/8520829002";

const res = await fetch(url);
if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
const html = await res.text();
const marker = "window.__remixContext = ";
const start = html.indexOf(marker);
if (start === -1) throw new Error("remix context not found");
const slice = html.slice(start + marker.length);
const end = slice.indexOf(";</script>");
if (end === -1) throw new Error("remix end not found");
const ctx = JSON.parse(slice.slice(0, end));
const route = ctx.state.loaderData["routes/$url_token_.jobs_.$job_post_id"];
const { questions, eeoc_sections } = route.jobPost;

const payload = { questions, eeoc_sections, fetchedAt: new Date().toISOString() };
fs.writeFileSync(path.join(outDir, "aclu-form-fields.json"), JSON.stringify(payload, null, 2), "utf8");
console.log("Wrote aclu-form-fields.json", questions?.length, "questions,", eeoc_sections?.length, "eeoc_sections");

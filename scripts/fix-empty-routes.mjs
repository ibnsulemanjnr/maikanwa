import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "apps/web/app");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(p));
    else files.push(p);
  }
  return files;
}

function hasAnyExport(content) {
  return /\bexport\b/.test(content);
}

function shouldRewrite(content) {
  const trimmed = content.trim();
  if (!trimmed) return true;               // empty
  if (!hasAnyExport(trimmed)) return true; // not a module
  return false;
}

function endpointName(filePath) {
  const rel = path.relative(APP_DIR, filePath).replaceAll("\\", "/");
  // e.g. api/cart/items/route.ts -> /api/cart/items
  const parts = rel.split("/");
  const apiIndex = parts.indexOf("api");
  const rest = apiIndex >= 0 ? parts.slice(apiIndex + 1) : parts;
  rest.pop(); // remove route.ts
  return "/api/" + rest.join("/");
}

function placeholderRoute(urlPath) {
  return `/** AUTO-GENERATED PLACEHOLDER ROUTE
 * Replace with real implementation in the corresponding epic.
 */\n\nimport { NextResponse } from "next/server";\n\nexport const runtime = "nodejs";\n\nexport async function GET() {\n  return NextResponse.json(\n    { ok: false, message: "Not implemented", endpoint: "${urlPath}" },\n    { status: 501 }\n  );\n}\n\nexport async function POST() {\n  return NextResponse.json(\n    { ok: false, message: "Not implemented", endpoint: "${urlPath}" },\n    { status: 501 }\n  );\n}\n`;
}

const all = walk(APP_DIR).filter((p) => p.endsWith(`${path.sep}route.ts`) || p.endsWith("/route.ts"));

let changed = 0;
for (const file of all) {
  const content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (!shouldRewrite(content)) continue;

  const url = endpointName(file);
  fs.writeFileSync(file, placeholderRoute(url), "utf8");
  changed++;
}

console.log(`✅ Placeholder routes generated/updated: ${changed}`);

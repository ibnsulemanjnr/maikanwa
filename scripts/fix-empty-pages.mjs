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

function isRouteGroup(seg) {
  return seg.startsWith("(") && seg.endsWith(")");
}

function titleCase(s) {
  return s
    .split(/[-_]/g)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getTitle(filePath) {
  const rel = path.relative(APP_DIR, filePath).replaceAll("\\", "/");
  const parts = rel.split("/");

  // Remove trailing page.tsx
  parts.pop();

  // Remove route groups like (store), (admin)
  const clean = parts.filter(p => !isRouteGroup(p));

  // If includes admin route segment
  const adminIndex = clean.indexOf("admin");
  if (adminIndex >= 0) {
    const rest = clean.slice(adminIndex + 1);
    const label = rest.length ? rest.map(titleCase).join(" • ") : "Dashboard";
    return `Admin • ${label}`;
  }

  // Store / normal routes
  if (clean.length === 0) return "Home";
  return clean.map(titleCase).join(" • ");
}

function placeholderTSX(title) {
  return `/** AUTO-GENERATED PLACEHOLDER
 * Replace with real implementation when starting the feature epic.
 */\n\nexport default function Page() {\n  return (\n    <div className="rounded-2xl bg-white p-6 shadow-sm">\n      <h1 className="text-xl font-semibold">${title}</h1>\n      <p className="mt-2 text-gray-600">Placeholder page (safe export). Implement feature here.</p>\n    </div>\n  );\n}\n`;
}

function hasAnyExport(content) {
  return /\bexport\b/.test(content);
}

function shouldRewrite(content) {
  const trimmed = content.trim();
  if (!trimmed) return true;                 // empty file
  if (!hasAnyExport(trimmed)) return true;   // TS says "not a module"
  return false;
}

const all = walk(APP_DIR).filter(p => p.endsWith(`${path.sep}page.tsx`) || p.endsWith("/page.tsx"));
let changed = 0;

for (const file of all) {
  const content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (!shouldRewrite(content)) continue;

  const title = getTitle(file);
  fs.writeFileSync(file, placeholderTSX(title), "utf8");
  changed++;
}

console.log(`✅ Placeholder pages generated/updated: ${changed}`);

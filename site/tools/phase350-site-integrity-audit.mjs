import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const REGISTRY_PATH = 'site/data/public-page-registry.json';
const REPORT_PATH = 'artifacts/phase350-site-integrity-report.json';
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
const canonical = new Set(registry.canonicalPages.filter((entry) => entry.required !== false).map((entry) => entry.path));
const excluded = registry.excludedPrefixes || [];
const errors = [];
const warnings = [];
const pages = [];
const stats = { htmlFiles: 0, canonicalPages: canonical.size, links: 0, assets: 0, forms: 0, buttons: 0, staleVersions: 0 };

function exists(file) { try { return fs.statSync(path.join(ROOT, file)).isFile(); } catch { return false; } }
function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }
function clean(value) { return String(value || '').trim().replace(/&amp;/g, '&'); }
function ignored(value) { return /^(?:https?:|mailto:|tel:|sms:|data:|javascript:|blob:|about:|intent:)/i.test(value) || /^\{\{|^\$\{/.test(value); }
function excludedPath(file) { return excluded.some((prefix) => file.startsWith(prefix)); }
function walk(directory, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    const rel = path.relative(ROOT, full).replaceAll('\\', '/');
    if (excludedPath(rel)) continue;
    if (entry.isDirectory()) walk(full, output);
    else if (/\.html?$/i.test(entry.name)) output.push(rel);
  }
  return output;
}
function candidatesFor(currentFile, rawPath) {
  let target = rawPath;
  if (target.startsWith('/')) target = target.slice(1);
  else target = path.posix.normalize(path.posix.join(path.posix.dirname(currentFile), target));
  target = target.replace(/^\.\//, '');
  const candidates = [];
  const push = (value) => { value = path.posix.normalize(value).replace(/^\.\.\//, ''); if (!candidates.includes(value)) candidates.push(value); };
  if (!target || target === '.') push(currentFile);
  else if (target.endsWith('/')) push(`${target}index.html`);
  else {
    push(target);
    if (!path.posix.extname(target)) {
      push(`${target}.html`);
      push(`${target}/index.html`);
    }
  }
  if (rawPath.startsWith('/')) {
    const siteTarget = target.startsWith('site/') ? target : `site/${target}`;
    if (siteTarget.endsWith('/')) push(`${siteTarget}index.html`);
    else {
      push(siteTarget);
      if (!path.posix.extname(siteTarget)) { push(`${siteTarget}.html`); push(`${siteTarget}/index.html`); }
    }
  }
  return candidates;
}
function resolveTarget(currentFile, raw) {
  const withoutQuery = raw.split(/[?#]/)[0];
  if (!withoutQuery) return { target: currentFile, exists: true, candidates: [currentFile] };
  const candidates = candidatesFor(currentFile, withoutQuery);
  const target = candidates.find(exists) || null;
  return { target, exists: Boolean(target), candidates };
}
function anchorExists(file, fragment) {
  if (!fragment || !exists(file) || !/\.html?$/i.test(file)) return true;
  const html = read(file);
  const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:id|name)=["']${escaped}["']`, 'i').test(html);
}
function issue(list, type, file, value, detail = {}) { list.push({ type, file, value, ...detail }); }
function extractAttributes(html) {
  const attributes = [];
  const regex = /\b(href|src|action)\s*=\s*(["'])(.*?)\2/gi;
  let match;
  while ((match = regex.exec(html))) attributes.push({ attr: match[1].toLowerCase(), value: clean(match[3]), index: match.index });
  return attributes;
}
function checkPage(file) {
  const html = read(file);
  const isCanonical = canonical.has(file);
  const page = { file, canonical: isCanonical, links: 0, assets: 0, forms: 0, buttons: 0, errors: 0, warnings: 0 };
  if (!/<title[\s>]/i.test(html)) issue(isCanonical ? errors : warnings, 'missing-title', file, '');
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) issue(warnings, 'missing-viewport', file, '');
  const attrs = extractAttributes(html);
  for (const item of attrs) {
    if (item.attr === 'href') { stats.links += 1; page.links += 1; }
    if (item.attr === 'src') { stats.assets += 1; page.assets += 1; }
    if (item.attr === 'action') { stats.forms += 1; page.forms += 1; }
    const value = item.value;
    if (!value) {
      issue(isCanonical ? errors : warnings, `empty-${item.attr}`, file, value);
      continue;
    }
    if (value === '#') {
      issue(isCanonical ? errors : warnings, `placeholder-${item.attr}`, file, value);
      continue;
    }
    if (ignored(value)) continue;
    const fragment = value.includes('#') ? decodeURIComponent(value.slice(value.indexOf('#') + 1)) : '';
    const resolved = resolveTarget(file, value);
    if (!resolved.exists) {
      issue(isCanonical ? errors : warnings, `missing-${item.attr}-target`, file, value, { candidates: resolved.candidates });
      continue;
    }
    if (fragment && !anchorExists(resolved.target, fragment)) {
      issue(isCanonical ? errors : warnings, 'missing-anchor', file, value, { target: resolved.target, fragment });
    }
    const phaseMatch = value.match(/[?&]v=phase(\d+)/i);
    if (phaseMatch && Number(phaseMatch[1]) < 350 && /(?:game\/|matrix\.js|profile\.html|avatar\.html)/i.test(value)) {
      stats.staleVersions += 1;
      issue(warnings, 'stale-cache-version', file, value, { phase: Number(phaseMatch[1]) });
    }
  }
  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let button;
  while ((button = buttonRegex.exec(html))) {
    stats.buttons += 1; page.buttons += 1;
    const attrsText = button[1];
    const label = button[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const actionable = /\b(type\s*=\s*["'](?:submit|reset|button)["']|id\s*=|onclick\s*=|data-[\w-]+\s*=|form\s*=)/i.test(attrsText);
    if (!actionable) issue(warnings, 'button-without-explicit-action', file, label.slice(0, 80));
  }
  if (/<form\b/i.test(html)) {
    const formRegex = /<form\b([^>]*)>/gi;
    let form;
    while ((form = formRegex.exec(html))) {
      if (!/\b(action|id|onsubmit)\s*=/i.test(form[1])) issue(warnings, 'form-without-action-or-handler', file, form[0].slice(0, 160));
    }
  }
  page.errors = errors.filter((entry) => entry.file === file).length;
  page.warnings = warnings.filter((entry) => entry.file === file).length;
  pages.push(page);
}

for (const page of canonical) {
  if (!exists(page)) issue(errors, 'missing-canonical-page', page, page);
}
for (const optional of registry.optionalPages || []) {
  if (!exists(optional.path)) issue(warnings, 'optional-page-not-yet-built', optional.path, optional.role || '');
}

const htmlFiles = [...new Set([
  ...walk(path.join(ROOT, 'site')),
  ...['index.html', '404.html', 'offline.html', 'game/index.html', 'game/android.html', 'game/camera3.html', 'game/avatar.html'].filter(exists)
])].sort();
stats.htmlFiles = htmlFiles.length;
for (const file of htmlFiles) checkPage(file);

const report = {
  build: registry.build,
  generatedAt: new Date().toISOString(),
  pass: errors.length === 0,
  stats,
  canonicalPages: [...canonical],
  errors,
  warnings,
  pages
};
fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ pass: report.pass, stats, errorCount: errors.length, warningCount: warnings.length, report: REPORT_PATH }, null, 2));
if (errors.length) {
  console.error(JSON.stringify(errors.slice(0, 100), null, 2));
  process.exit(1);
}

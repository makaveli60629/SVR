import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const source = path.resolve(process.argv[2] || 'game/assets');
const output = path.resolve(process.argv[3] || 'phase342_asset_audit.json');
const MODEL = new Set(['.fbx','.obj','.dae','.gltf','.glb']);
const TEXTURE = new Set(['.png','.jpg','.jpeg','.webp','.avif','.ktx','.ktx2','.basis']);
const AUDIO = new Set(['.mp3','.wav','.ogg','.m4a']);

async function walk(dir, files = []) {
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return files; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, files);
    else if (entry.isFile()) files.push(full);
  }
  return files;
}
function category(ext) {
  if (MODEL.has(ext)) return 'models';
  if (TEXTURE.has(ext)) return 'textures';
  if (AUDIO.has(ext)) return 'audio';
  return 'other';
}
const paths = await walk(source);
const records = [];
const hashGroups = new Map();
for (const file of paths) {
  const stat = await fs.stat(file);
  const ext = path.extname(file).toLowerCase();
  const buffer = await fs.readFile(file);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const relative = path.relative(source, file).replaceAll(path.sep, '/');
  const record = { path: relative, ext, category: category(ext), bytes: stat.size, sha256: hash };
  records.push(record);
  const list = hashGroups.get(hash) || [];
  list.push(relative);
  hashGroups.set(hash, list);
}
const totals = { files: records.length, bytes: records.reduce((sum, item) => sum + item.bytes, 0), models: 0, textures: 0, audio: 0, other: 0 };
const extensions = {};
for (const item of records) {
  totals[item.category] += 1;
  extensions[item.ext || '(none)'] = (extensions[item.ext || '(none)'] || 0) + 1;
}
const duplicates = [...hashGroups.entries()].filter(([, files]) => files.length > 1).map(([sha256, files]) => ({ sha256, files }));
const largest = [...records].sort((a, b) => b.bytes - a.bytes).slice(0, 30);
const legacyModels = records.filter((item) => ['.fbx','.obj','.dae'].includes(item.ext));
const uncompressedTextures = records.filter((item) => ['.png','.jpg','.jpeg'].includes(item.ext));
const optimized = records.filter((item) => ['.glb','.ktx2','.webp','.avif'].includes(item.ext));
const report = {
  schema: 1,
  build: 'PHASE-342-ADAPTIVE-PERFORMANCE-ASSET-PIPELINE-LOCK',
  generatedAt: new Date().toISOString(),
  source: source.replaceAll(path.sep, '/'),
  totals,
  extensions,
  largest,
  duplicates,
  conversionQueue: {
    legacyModels: legacyModels.map(({ path, bytes }) => ({ path, bytes, target: path.replace(/\.(fbx|obj|dae)$/i, '.glb') })),
    uncompressedTextures: uncompressedTextures.map(({ path, bytes }) => ({ path, bytes, targets: [path.replace(/\.(png|jpe?g)$/i, '.webp'), path.replace(/\.(png|jpe?g)$/i, '.ktx2')] }))
  },
  optimizedAssets: optimized.map(({ path, bytes }) => ({ path, bytes })),
  recommendations: [
    'Convert runtime FBX/OBJ/DAE assets to GLB and apply Meshopt compression.',
    'Generate KTX2/Basis texture variants for Android and Quest.',
    'Retain WebP fallback textures for browsers without KTX2 transcoding.',
    'Remove exact binary duplicates after verifying references.',
    'Keep source assets outside the production route once optimized replacements are verified.'
  ]
};
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ output, totals, duplicateGroups: duplicates.length, legacyModels: legacyModels.length, uncompressedTextures: uncompressedTextures.length }, null, 2));

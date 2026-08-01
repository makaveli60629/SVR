import fs from 'node:fs';

const catalog = JSON.parse(fs.readFileSync('site/data/avatar-catalog.json', 'utf8'));
const errors = [];
const categories = ['headwear', 'eyewear', 'top', 'shoes', 'accessory'];
if (catalog.build !== 'PHASE-346-AVATAR-CREATOR-DRESSING-ROOM-LOCK') errors.push('build');
if (!Array.isArray(catalog.avatarModels) || !catalog.avatarModels.length) errors.push('avatar-models');
for (const model of catalog.avatarModels || []) {
  const path = String(model.assetUrl || '').replace(/^\//, '');
  if (!path || !fs.existsSync(path)) errors.push(`model-missing-${model.id}`);
  if (!['fbx', 'glb', 'gltf'].includes(String(model.format || '').toLowerCase())) errors.push(`model-format-${model.id}`);
  if (!(Number(model.targetHeightMeters) > 0)) errors.push(`model-height-${model.id}`);
}
if (!Array.isArray(catalog.palettes) || catalog.palettes.length < 3) errors.push('palettes');
for (const category of categories) {
  const items = catalog.categories?.[category];
  if (!Array.isArray(items) || !items.length) errors.push(`${category}-empty`);
  const ids = items?.map((item) => item.id) || [];
  if (new Set(ids).size !== ids.length) errors.push(`${category}-duplicate-id`);
  if (!ids.includes(catalog.defaultOutfit?.[category])) errors.push(`${category}-default-missing`);
}
const modelIds = new Set(catalog.avatarModels.map((item) => item.id));
if (!modelIds.has(catalog.defaultOutfit?.modelId)) errors.push('default-model-missing');
const paletteIds = new Set(catalog.palettes.map((item) => item.id));
if (!paletteIds.has(catalog.defaultOutfit?.palette)) errors.push('default-palette-missing');
for (const preset of catalog.presets || []) {
  if (!modelIds.has(preset.outfit?.modelId)) errors.push(`preset-${preset.id}-model`);
  if (!paletteIds.has(preset.outfit?.palette)) errors.push(`preset-${preset.id}-palette`);
  for (const category of categories) if (!(catalog.categories?.[category] || []).some((item) => item.id === preset.outfit?.[category])) errors.push(`preset-${preset.id}-${category}`);
}
if (errors.length) { console.error(JSON.stringify({ pass: false, errors }, null, 2)); process.exit(1); }
console.log(JSON.stringify({ pass: true, models: catalog.avatarModels.map(({ id, format, assetUrl }) => ({ id, format, assetUrl })), palettes: catalog.palettes.length, categories: Object.fromEntries(categories.map((key) => [key, catalog.categories[key].length])), presets: catalog.presets.length }, null, 2));

import fs from 'node:fs';

const catalog = JSON.parse(fs.readFileSync('site/data/avatar-catalog.json', 'utf8'));
const errors = [];
const categories = ['headwear', 'eyewear', 'top', 'shoes', 'accessory'];
if (catalog.build !== 'PHASE-346-AVATAR-CREATOR-DRESSING-ROOM-LOCK') errors.push('build');
if (!Array.isArray(catalog.avatarModels) || !catalog.avatarModels.length) errors.push('avatar-models');
if (!fs.existsSync('game/assets/models/player.glb')) errors.push('player-glb-missing');
if (!Array.isArray(catalog.palettes) || catalog.palettes.length < 3) errors.push('palettes');
for (const category of categories) {
  const items = catalog.categories?.[category];
  if (!Array.isArray(items) || !items.length) errors.push(`${category}-empty`);
  const ids = items?.map((item) => item.id) || [];
  if (new Set(ids).size !== ids.length) errors.push(`${category}-duplicate-id`);
  if (!ids.includes(catalog.defaultOutfit?.[category])) errors.push(`${category}-default-missing`);
}
const paletteIds = new Set(catalog.palettes.map((item) => item.id));
if (!paletteIds.has(catalog.defaultOutfit?.palette)) errors.push('default-palette-missing');
for (const preset of catalog.presets || []) {
  if (!paletteIds.has(preset.outfit?.palette)) errors.push(`preset-${preset.id}-palette`);
  for (const category of categories) {
    if (!(catalog.categories?.[category] || []).some((item) => item.id === preset.outfit?.[category])) errors.push(`preset-${preset.id}-${category}`);
  }
}
if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ pass: true, models: catalog.avatarModels.length, palettes: catalog.palettes.length, categories: Object.fromEntries(categories.map((key) => [key, catalog.categories[key].length])), presets: catalog.presets.length }, null, 2));

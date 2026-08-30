export const AVATAR_SCHEMA_VERSION = 2;
export const AVATAR_BUILD = 'SVR-AVATAR-KIT-V1';

const clone = (value) => JSON.parse(JSON.stringify(value));
const clamp01 = (value, fallback = 0.5) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(1, number));
};

export function catalogIndex(catalog) {
  const itemById = new Map();
  for (const item of catalog?.starterItems || []) itemById.set(item.itemId, item);
  for (const item of catalog?.appearance?.hairStyles || []) itemById.set(item.id, { ...item, itemId: item.id, storeCategory: 'avatar.hair' });
  return {
    bodyById: new Map((catalog?.bodyFamilies || []).map((item) => [item.id, item])),
    itemById,
    slotSet: new Set(catalog?.equipmentSlots || []),
    skinToneSet: new Set((catalog?.appearance?.skinTones || []).map((item) => item.id)),
    eyeColorSet: new Set((catalog?.appearance?.eyeColors || []).map((item) => item.id)),
    hairColorSet: new Set((catalog?.appearance?.hairColors || []).map((item) => item.id)),
    hairStyleSet: new Set((catalog?.appearance?.hairStyles || []).map((item) => item.id)),
    nailStyleSet: new Set((catalog?.appearance?.nailStyles || []).map((item) => item.id)),
    nailColorSet: new Set((catalog?.appearance?.nailColors || []).map((item) => item.id))
  };
}

export function createDefaultAvatar(catalog) {
  if (!catalog?.defaultAvatar) throw new Error('SVR_AVATAR_DEFAULT_MISSING');
  return normalizeAvatar(catalog.defaultAvatar, catalog);
}

export function normalizeAvatar(input = {}, catalog) {
  const defaults = clone(catalog?.defaultAvatar || {});
  const appearanceDefaults = defaults.appearance || {};
  const morphDefaults = defaults.morphs || {};
  const equipmentDefaults = defaults.equipment || {};
  const slots = catalog?.equipmentSlots || Object.keys(equipmentDefaults);

  const avatar = {
    schemaVersion: AVATAR_SCHEMA_VERSION,
    baseBodyId: input.baseBodyId || defaults.baseBodyId,
    appearance: {
      skinToneId: input.appearance?.skinToneId || appearanceDefaults.skinToneId,
      eyeColorId: input.appearance?.eyeColorId || appearanceDefaults.eyeColorId,
      hairStyleId: input.appearance?.hairStyleId || appearanceDefaults.hairStyleId,
      hairColorId: input.appearance?.hairColorId || appearanceDefaults.hairColorId,
      nailStyleId: input.appearance?.nailStyleId || appearanceDefaults.nailStyleId,
      nailColorId: input.appearance?.nailColorId || appearanceDefaults.nailColorId
    },
    morphs: {},
    equipment: {},
    profileCosmetics: { ...(defaults.profileCosmetics || {}), ...(input.profileCosmetics || {}) }
  };

  for (const key of Object.keys(catalog?.morphs || morphDefaults)) {
    avatar.morphs[key] = clamp01(input.morphs?.[key], clamp01(morphDefaults[key], 0.5));
  }
  for (const slot of slots) avatar.equipment[slot] = input.equipment?.[slot] || equipmentDefaults[slot] || 'none';
  if (avatar.equipment.hair && avatar.equipment.hair !== 'none') avatar.appearance.hairStyleId = avatar.equipment.hair;
  return avatar;
}

export function bodyFamily(avatar, catalog) {
  const body = catalogIndex(catalog).bodyById.get(avatar?.baseBodyId);
  return body?.family || null;
}

export function equipItem(avatarInput, itemId, catalog, requestedSlot = null) {
  const avatar = normalizeAvatar(avatarInput, catalog);
  const index = catalogIndex(catalog);
  const item = index.itemById.get(itemId);
  if (!item) throw new Error(`SVR_AVATAR_ITEM_UNKNOWN:${itemId}`);
  const slot = requestedSlot || item.equipSlot;
  if (!slot || !index.slotSet.has(slot)) throw new Error(`SVR_AVATAR_SLOT_INVALID:${slot || 'missing'}`);
  const family = bodyFamily(avatar, catalog);
  if (Array.isArray(item.compatibleBodyFamilies) && family && !item.compatibleBodyFamilies.includes(family)) {
    throw new Error(`SVR_AVATAR_ITEM_INCOMPATIBLE:${itemId}:${family}`);
  }
  avatar.equipment[slot] = itemId;
  if (slot === 'hair') avatar.appearance.hairStyleId = itemId;
  return avatar;
}

export function unequipSlot(avatarInput, slot, catalog) {
  const avatar = normalizeAvatar(avatarInput, catalog);
  if (!catalogIndex(catalog).slotSet.has(slot)) throw new Error(`SVR_AVATAR_SLOT_INVALID:${slot}`);
  avatar.equipment[slot] = 'none';
  if (slot === 'hair') {
    avatar.appearance.hairStyleId = 'hair-none';
    avatar.equipment.hair = 'hair-none';
  }
  return avatar;
}

export function setAppearance(avatarInput, patch, catalog) {
  const avatar = normalizeAvatar(avatarInput, catalog);
  avatar.appearance = { ...avatar.appearance, ...(patch || {}) };
  if (patch?.hairStyleId) avatar.equipment.hair = patch.hairStyleId;
  return normalizeAvatar(avatar, catalog);
}

export function setMorph(avatarInput, morphName, value, catalog) {
  const avatar = normalizeAvatar(avatarInput, catalog);
  if (!(morphName in (catalog?.morphs || {}))) throw new Error(`SVR_AVATAR_MORPH_UNKNOWN:${morphName}`);
  avatar.morphs[morphName] = clamp01(value);
  return avatar;
}

export function switchBaseBody(avatarInput, baseBodyId, catalog) {
  const avatar = normalizeAvatar(avatarInput, catalog);
  const index = catalogIndex(catalog);
  const target = index.bodyById.get(baseBodyId);
  if (!target) throw new Error(`SVR_AVATAR_BODY_UNKNOWN:${baseBodyId}`);
  avatar.baseBodyId = baseBodyId;
  for (const [slot, itemId] of Object.entries(avatar.equipment)) {
    if (!itemId || itemId === 'none') continue;
    const item = index.itemById.get(itemId);
    if (item?.compatibleBodyFamilies && !item.compatibleBodyFamilies.includes(target.family)) avatar.equipment[slot] = 'none';
  }
  return avatar;
}

export function validateAvatar(avatarInput, catalog) {
  const avatar = normalizeAvatar(avatarInput, catalog);
  const index = catalogIndex(catalog);
  const errors = [];
  if (!index.bodyById.has(avatar.baseBodyId)) errors.push(`unknown base body: ${avatar.baseBodyId}`);
  if (!index.skinToneSet.has(avatar.appearance.skinToneId)) errors.push(`unknown skin tone: ${avatar.appearance.skinToneId}`);
  if (!index.eyeColorSet.has(avatar.appearance.eyeColorId)) errors.push(`unknown eye color: ${avatar.appearance.eyeColorId}`);
  if (!index.hairStyleSet.has(avatar.appearance.hairStyleId)) errors.push(`unknown hair style: ${avatar.appearance.hairStyleId}`);
  if (!index.hairColorSet.has(avatar.appearance.hairColorId)) errors.push(`unknown hair color: ${avatar.appearance.hairColorId}`);
  if (!index.nailStyleSet.has(avatar.appearance.nailStyleId)) errors.push(`unknown nail style: ${avatar.appearance.nailStyleId}`);
  if (!index.nailColorSet.has(avatar.appearance.nailColorId)) errors.push(`unknown nail color: ${avatar.appearance.nailColorId}`);
  const family = bodyFamily(avatar, catalog);
  for (const [slot, itemId] of Object.entries(avatar.equipment)) {
    if (!index.slotSet.has(slot)) errors.push(`unknown equipment slot: ${slot}`);
    if (!itemId || itemId === 'none') continue;
    const item = index.itemById.get(itemId);
    if (!item) errors.push(`unknown item: ${itemId}`);
    else if (item.compatibleBodyFamilies && family && !item.compatibleBodyFamilies.includes(family)) errors.push(`incompatible item: ${itemId} for ${family}`);
  }
  for (const [name, value] of Object.entries(avatar.morphs)) {
    if (!Number.isFinite(value) || value < 0 || value > 1) errors.push(`morph out of range: ${name}`);
  }
  return { pass: errors.length === 0, errors, avatar };
}

export function storeCategoryForSlot(slot, catalog) {
  return (catalog?.storeCategories || []).find((category) => category.slots?.includes(slot)) || null;
}

export function toLegacyOutfit(avatarInput, catalog) {
  const avatar = normalizeAvatar(avatarInput, catalog);
  const body = catalogIndex(catalog).bodyById.get(avatar.baseBodyId);
  const top = avatar.equipment.outerwear !== 'none' ? avatar.equipment.outerwear : avatar.equipment.top;
  return {
    schemaVersion: 1,
    modelId: body?.sourceModelId || 'eric',
    palette: 'midnight',
    headwear: avatar.equipment.headwear === 'hat-svr-neon-cap' ? 'cap' : 'none',
    eyewear: avatar.equipment.eyewear === 'glasses-neon-frame' ? 'neon' : 'none',
    top: top === 'top-svr-purple-hoodie' ? 'hoodie' : top === 'none' ? 'none' : 'none',
    shoes: avatar.equipment.shoes === 'none' ? 'none' : 'none',
    accessory: avatar.equipment.wristRight === 'watch-svr-classic' ? 'watch' : avatar.equipment.neck === 'chain-svr-gold' ? 'chain' : 'none'
  };
}

export function fromLegacyOutfit(legacy = {}, catalog) {
  const defaults = createDefaultAvatar(catalog);
  const body = (catalog?.bodyFamilies || []).find((entry) => entry.sourceModelId === legacy.modelId);
  if (body) defaults.baseBodyId = body.id;
  if (legacy.headwear === 'cap') defaults.equipment.headwear = 'hat-svr-neon-cap';
  if (legacy.eyewear === 'neon') defaults.equipment.eyewear = 'glasses-neon-frame';
  if (legacy.top === 'hoodie') defaults.equipment.outerwear = 'top-svr-purple-hoodie';
  if (legacy.accessory === 'watch') defaults.equipment.wristRight = 'watch-svr-classic';
  if (legacy.accessory === 'chain') defaults.equipment.neck = 'chain-svr-gold';
  return normalizeAvatar(defaults, catalog);
}

export function buildStoreRows(catalog) {
  const categoryById = new Map((catalog?.storeCategories || []).map((category) => [category.id, category]));
  return (catalog?.starterItems || []).map((item) => ({
    ...item,
    categoryLabel: categoryById.get(item.storeCategory)?.label || item.storeCategory,
    wearable: Boolean(item.equipSlot),
    productionReady: item.assetStatus === 'ready'
  }));
}

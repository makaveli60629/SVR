import leaf1 from './reiki_leaf_1.js?v=phase385';
import leaf2 from './reiki_leaf_2.js?v=phase385';
import leaf3 from './reiki_leaf_3.js?v=phase385';
import leaf4 from './reiki_leaf_4.js?v=phase385';
import bark from './reiki_bark.js?v=phase385';

export const REIKI_PLANT_TEXTURES = Object.freeze({ leaf1, leaf2, leaf3, leaf4, bark });
export const REIKI_PLANT_ASSET_META = Object.freeze({
  sourceArchive: 'Collection plant vol 297cg.rar',
  sourceLabel: 'Collection plant vol 297',
  integration: 'optimized procedural botanical cards',
  leafVariants: 4,
  barkVariantsUsed: 1,
  originalMeshPayloadIncluded: false,
  reason: 'Quest-safe size and draw-call control',
  approvalSafe: true
});

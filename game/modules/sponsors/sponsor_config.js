export const sponsorTiers = [
  {
    id: 'espresso-tier-placeholder',
    name: 'Espresso Sponsor Placeholder',
    tier: 'espresso',
    logoUrl: null,
    bannerUrl: null,
    description: 'Example sponsor content — awaiting approval.',
    active: true,
    approved: false,
    placementZone: 'lobby-sponsor-grid-espresso-01',
    approvalStatus: 'Example content — awaiting approval',
    orientation: 'face-main-lobby-approach',
    portalEnabled: false,
    analyticsEvent: 'sponsor_espresso_placeholder_view',
  },
];

export const sponsorBuildingRules = {
  modular: true,
  duplicateSafe: true,
  signageMustFaceLobby: true,
  placeholderGraphicsOnlyUntilApproved: true,
};

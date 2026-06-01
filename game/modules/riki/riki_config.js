export const RIKI_APPROVAL_LABEL = 'Awaiting approval by Shyann Royston';

export const rikiModuleConfig = {
  id: 'riki-phase92-placeholder',
  title: 'Riki/Reiki Wellness Placeholder',
  providerName: 'Shyann Royston',
  approved: false,
  approvalStatus: RIKI_APPROVAL_LABEL,
  profileEnabled: true,
  hologramEnabled: true,
  bookingEnabled: false,
  storeEnabled: false,
  vrRoomEnabled: true,
  productionSafeDefault: true,
  contentRule: 'Example content only until approved. No medical claims, guaranteed healing claims, final pricing, live booking, or purchasable products.',
};

export const chakraClassPlaceholders = [
  { id: 'root', title: 'Root', color: '#C62828', description: 'Placeholder description', approved: false, approvalStatus: RIKI_APPROVAL_LABEL },
  { id: 'sacral', title: 'Sacral', color: '#EF6C00', description: 'Placeholder description', approved: false, approvalStatus: RIKI_APPROVAL_LABEL },
  { id: 'solar', title: 'Solar Plexus', color: '#F9A825', description: 'Placeholder description', approved: false, approvalStatus: RIKI_APPROVAL_LABEL },
  { id: 'heart', title: 'Heart', color: '#2E7D32', description: 'Placeholder description', approved: false, approvalStatus: RIKI_APPROVAL_LABEL },
  { id: 'throat', title: 'Throat', color: '#0277BD', description: 'Placeholder description', approved: false, approvalStatus: RIKI_APPROVAL_LABEL },
  { id: 'third-eye', title: 'Third Eye', color: '#4527A0', description: 'Placeholder description', approved: false, approvalStatus: RIKI_APPROVAL_LABEL },
  { id: 'crown', title: 'Crown', color: '#6A1B9A', description: 'Placeholder description', approved: false, approvalStatus: RIKI_APPROVAL_LABEL },
];

export const bookingScaffold = {
  serviceId: 'riki-session-placeholder',
  title: 'Example Riki/Reiki Session',
  provider: 'Shyann Royston',
  durationMinutes: 30,
  price: null,
  approvalStatus: RIKI_APPROVAL_LABEL,
  enabled: false,
  buttonText: 'Booking coming soon — awaiting approval',
};

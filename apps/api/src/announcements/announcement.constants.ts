export const announcementAudienceValues = [
  'public',
  'auth',
  'tenant',
  'platform',
] as const;

export const announcementSeverityValues = [
  'info',
  'success',
  'warning',
  'critical',
] as const;

export const announcementStatusValues = ['draft', 'published', 'archived'] as const;

export const announcementStateValues = [
  'draft',
  'scheduled',
  'active',
  'ended',
  'archived',
] as const;

export type AnnouncementAudience = (typeof announcementAudienceValues)[number];
export type AnnouncementSeverity = (typeof announcementSeverityValues)[number];
export type AnnouncementStatus = (typeof announcementStatusValues)[number];
export type AnnouncementState = (typeof announcementStateValues)[number];

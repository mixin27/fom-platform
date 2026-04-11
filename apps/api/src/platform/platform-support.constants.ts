export const platformSupportIssueKinds = [
  'billing',
  'renewal',
  'onboarding',
  'adoption',
  'operations',
  'technical',
  'account',
  'other',
] as const;

export const platformSupportIssueSeverities = ['high', 'medium', 'low'] as const;

export const platformSupportIssueStatuses = [
  'open',
  'in_progress',
  'resolved',
  'dismissed',
] as const;

export const platformSupportIssueSources = ['system', 'manual'] as const;

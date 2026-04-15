export const subscriptionLimits = {
  activeStaffMembers: 'team.active_staff_members',
  managedShops: 'shops.managed_workspaces',
  monthlyApiRequests: 'api.monthly_requests',
  activeAutomationRules: 'automation.active_rules',
} as const;

export type SubscriptionLimitCode =
  (typeof subscriptionLimits)[keyof typeof subscriptionLimits];

export const subscriptionLimitCatalog: ReadonlyArray<{
  code: SubscriptionLimitCode;
  category: string;
  name: string;
  description: string;
  launchPhase: 'phase_one' | 'future';
}> = [
  {
    code: subscriptionLimits.activeStaffMembers,
    category: 'team',
    name: 'Active staff seats',
    description:
      'Maximum number of non-owner active shop members allowed on the plan.',
    launchPhase: 'phase_one',
  },
  {
    code: subscriptionLimits.managedShops,
    category: 'enterprise',
    name: 'Managed shop workspaces',
    description:
      'Reserved for future centralized multi-shop workspace controls.',
    launchPhase: 'future',
  },
  {
    code: subscriptionLimits.monthlyApiRequests,
    category: 'integrations',
    name: 'Monthly API requests',
    description: 'Reserved for future API and webhook usage quotas.',
    launchPhase: 'future',
  },
  {
    code: subscriptionLimits.activeAutomationRules,
    category: 'automation',
    name: 'Active automation rules',
    description: 'Reserved for future automation workflow quotas.',
    launchPhase: 'future',
  },
] as const;

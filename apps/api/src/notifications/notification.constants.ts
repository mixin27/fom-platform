export const notificationCategoryCatalog = [
  {
    code: 'order_activity',
    label: 'Order reminders',
    description:
      'New orders, confirmations, delivery progress, and cancellations.',
    defaultInAppEnabled: true,
    defaultEmailEnabled: true,
  },
  {
    code: 'daily_summary',
    label: 'Daily summary',
    description: 'Daily sales and delivery recap for the active shop.',
    defaultInAppEnabled: true,
    defaultEmailEnabled: true,
  },
  {
    code: 'promotional_tips',
    label: 'Promotional tips',
    description: 'Helpful selling tips, product updates, and release notes.',
    defaultInAppEnabled: false,
    defaultEmailEnabled: false,
  },
  {
    code: 'billing_updates',
    label: 'Billing updates',
    description: 'Plan renewals, invoices, payment failures, and trial expiry.',
    defaultInAppEnabled: true,
    defaultEmailEnabled: true,
  },
  {
    code: 'support_updates',
    label: 'Support updates',
    description: 'Support issue assignments, notes, and resolution changes.',
    defaultInAppEnabled: true,
    defaultEmailEnabled: true,
  },
] as const;

export const notificationCategoryCodes = notificationCategoryCatalog.map(
  (item) => item.code,
);

export type NotificationCategoryCode =
  (typeof notificationCategoryCatalog)[number]['code'];

export function getNotificationCategoryDefinition(
  code: string,
): (typeof notificationCategoryCatalog)[number] | null {
  return notificationCategoryCatalog.find((item) => item.code === code) ?? null;
}

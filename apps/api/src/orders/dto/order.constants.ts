export const orderStatuses = [
  'new',
  'confirmed',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

export const orderFilterStatuses = ['pending', ...orderStatuses] as const;

export const orderSources = ['messenger', 'manual'] as const;

export type OrderStatusValue = (typeof orderStatuses)[number];
export type OrderFilterStatusValue = (typeof orderFilterStatuses)[number];
export type OrderSourceValue = (typeof orderSources)[number];

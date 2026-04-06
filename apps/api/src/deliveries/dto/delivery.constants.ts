export const deliveryStatuses = [
  'scheduled',
  'out_for_delivery',
  'delivered',
] as const;

export type DeliveryStatusValue = (typeof deliveryStatuses)[number];

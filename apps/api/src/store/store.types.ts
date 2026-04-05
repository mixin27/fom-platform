export type LocaleCode = 'en' | 'my';

export type ShopRole = 'owner' | 'staff';

export type ShopMemberStatus = 'active' | 'invited' | 'disabled';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type OrderSource = 'messenger' | 'manual';

export interface UserRecord {
  id: string;
  name: string;
  phone: string;
  locale: LocaleCode;
  createdAt: string;
}

export interface ShopRecord {
  id: string;
  ownerUserId: string;
  name: string;
  timezone: string;
  createdAt: string;
}

export interface ShopMemberRecord {
  id: string;
  shopId: string;
  userId: string;
  role: ShopRole;
  status: ShopMemberStatus;
  createdAt: string;
}

export interface CustomerRecord {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  township: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  shopId: string;
  customerId: string;
  orderNo: string;
  status: OrderStatus;
  totalPrice: number;
  currency: string;
  deliveryFee: number;
  note: string | null;
  source: OrderSource;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderStatusEventRecord {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedByUserId: string;
  changedAt: string;
  note: string | null;
}

export interface AuthChallengeRecord {
  id: string;
  phone: string;
  otpCode: string;
  expiresAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
}

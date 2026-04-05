import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  AuthChallengeRecord,
  CustomerRecord,
  LocaleCode,
  OrderItemRecord,
  OrderRecord,
  OrderStatusEventRecord,
  SessionRecord,
  ShopMemberRecord,
  ShopRecord,
  ShopRole,
  UserRecord,
} from './store.types';

type SeedOrderInput = {
  id: string;
  customerId: string;
  orderNo: string;
  status: OrderRecord['status'];
  totalPrice: number;
  deliveryFee: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productName: string;
    qty: number;
    unitPrice: number;
  }>;
  events: Array<{
    id: string;
    fromStatus: OrderStatusEventRecord['fromStatus'];
    toStatus: OrderStatusEventRecord['toStatus'];
    changedAt: string;
    note?: string;
  }>;
};

@Injectable()
export class InMemoryStoreService {
  readonly users: UserRecord[] = [];
  readonly shops: ShopRecord[] = [];
  readonly shopMembers: ShopMemberRecord[] = [];
  readonly customers: CustomerRecord[] = [];
  readonly orders: OrderRecord[] = [];
  readonly orderItems: OrderItemRecord[] = [];
  readonly orderStatusEvents: OrderStatusEventRecord[] = [];
  readonly authChallenges: AuthChallengeRecord[] = [];
  readonly sessions: SessionRecord[] = [];

  constructor() {
    this.seed();
  }

  generateId(prefix: string): string {
    return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }

  now(): string {
    return new Date().toISOString();
  }

  findUserById(userId: string): UserRecord | undefined {
    return this.users.find((user) => user.id === userId);
  }

  findUserByPhone(phone: string): UserRecord | undefined {
    return this.users.find((user) => user.phone === phone);
  }

  findShopById(shopId: string): ShopRecord | undefined {
    return this.shops.find((shop) => shop.id === shopId);
  }

  findCustomerById(customerId: string): CustomerRecord | undefined {
    return this.customers.find((customer) => customer.id === customerId);
  }

  findOrderById(orderId: string): OrderRecord | undefined {
    return this.orders.find((order) => order.id === orderId);
  }

  findSessionByToken(token: string): SessionRecord | undefined {
    return this.sessions.find((session) => session.token === token);
  }

  findChallengeById(challengeId: string): AuthChallengeRecord | undefined {
    return this.authChallenges.find(
      (challenge) => challenge.id === challengeId,
    );
  }

  createUser(input: {
    name: string;
    phone: string;
    locale?: LocaleCode;
  }): UserRecord {
    const user: UserRecord = {
      id: this.generateId('usr'),
      name: input.name.trim(),
      phone: input.phone.trim(),
      locale: input.locale ?? 'my',
      createdAt: this.now(),
    };
    this.users.push(user);
    return user;
  }

  createShop(input: {
    ownerUserId: string;
    name: string;
    timezone: string;
  }): ShopRecord {
    const shop: ShopRecord = {
      id: this.generateId('shop'),
      ownerUserId: input.ownerUserId,
      name: input.name.trim(),
      timezone: input.timezone.trim(),
      createdAt: this.now(),
    };
    this.shops.push(shop);
    return shop;
  }

  addShopMember(input: {
    shopId: string;
    userId: string;
    role: ShopRole;
    status?: ShopMemberRecord['status'];
  }): ShopMemberRecord {
    const member: ShopMemberRecord = {
      id: this.generateId('mem'),
      shopId: input.shopId,
      userId: input.userId,
      role: input.role,
      status: input.status ?? 'active',
      createdAt: this.now(),
    };
    this.shopMembers.push(member);
    return member;
  }

  createCustomer(input: {
    shopId: string;
    name: string;
    phone: string;
    township?: string | null;
    address?: string | null;
    notes?: string | null;
  }): CustomerRecord {
    const customer: CustomerRecord = {
      id: this.generateId('cus'),
      shopId: input.shopId,
      name: input.name.trim(),
      phone: input.phone.trim(),
      township: input.township?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      createdAt: this.now(),
    };
    this.customers.push(customer);
    return customer;
  }

  createAuthChallenge(phone: string, otpCode = '123456'): AuthChallengeRecord {
    const challenge: AuthChallengeRecord = {
      id: this.generateId('chl'),
      phone,
      otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
    this.authChallenges.push(challenge);
    return challenge;
  }

  createSession(userId: string): SessionRecord {
    const session: SessionRecord = {
      token: this.generateId('tok'),
      userId,
      createdAt: this.now(),
    };
    this.sessions.push(session);
    return session;
  }

  revokeSession(token: string): void {
    const index = this.sessions.findIndex((session) => session.token === token);
    if (index >= 0) {
      this.sessions.splice(index, 1);
    }
  }

  nextOrderNumber(shopId: string): string {
    const count =
      this.orders.filter((order) => order.shopId === shopId).length + 1;
    return `ORD-${String(240 + count).padStart(4, '0')}`;
  }

  private seed(): void {
    const owner: UserRecord = {
      id: 'usr_ma_aye',
      name: 'Ma Aye',
      phone: '09 7800 1111',
      locale: 'my',
      createdAt: '2026-03-20T09:00:00.000Z',
    };
    const helper: UserRecord = {
      id: 'usr_ko_min',
      name: 'Ko Min',
      phone: '09 7800 2222',
      locale: 'my',
      createdAt: '2026-03-21T09:00:00.000Z',
    };
    this.users.push(owner, helper);

    const shop: ShopRecord = {
      id: 'shop_ma_aye',
      ownerUserId: owner.id,
      name: 'Ma Aye Shop',
      timezone: 'Asia/Yangon',
      createdAt: '2026-03-20T09:05:00.000Z',
    };
    this.shops.push(shop);

    this.shopMembers.push(
      {
        id: 'mem_owner',
        shopId: shop.id,
        userId: owner.id,
        role: 'owner',
        status: 'active',
        createdAt: '2026-03-20T09:05:00.000Z',
      },
      {
        id: 'mem_staff',
        shopId: shop.id,
        userId: helper.id,
        role: 'staff',
        status: 'active',
        createdAt: '2026-03-22T09:05:00.000Z',
      },
    );

    const customers: CustomerRecord[] = [
      {
        id: 'cus_daw_aye_aye',
        shopId: shop.id,
        name: 'Daw Aye Aye',
        phone: '09 9871 2345',
        township: 'Hlaing',
        address: 'No. 12, Shwe Taung Gyar St, Hlaing, Yangon',
        notes: 'Loyal repeat customer',
        createdAt: '2026-01-05T10:00:00.000Z',
      },
      {
        id: 'cus_daw_khin_myat',
        shopId: shop.id,
        name: 'Daw Khin Myat',
        phone: '09 7812 3456',
        township: 'Sanchaung',
        address: 'No. 45, Bo Gyoke St, Sanchaung, Yangon',
        notes: null,
        createdAt: '2026-03-14T10:00:00.000Z',
      },
      {
        id: 'cus_ko_zaw_lin',
        shopId: shop.id,
        name: 'Ko Zaw Lin',
        phone: '09 4556 7890',
        township: 'Tarmwe',
        address: '12/B, Thitsar Rd, Tarmwe, Yangon',
        notes: null,
        createdAt: '2026-04-02T09:00:00.000Z',
      },
      {
        id: 'cus_ma_thin_zar',
        shopId: shop.id,
        name: 'Ma Thin Zar',
        phone: '09 2234 5678',
        township: 'Hlaing',
        address: 'No. 18, Hlaing Main Road, Yangon',
        notes: 'Prefers afternoon delivery',
        createdAt: '2026-02-12T09:00:00.000Z',
      },
      {
        id: 'cus_u_kyaw_zin',
        shopId: shop.id,
        name: 'U Kyaw Zin',
        phone: '09 5678 9012',
        township: 'Tarmwe',
        address: '15/1, Tarmwe Township, Yangon',
        notes: null,
        createdAt: '2026-03-30T09:00:00.000Z',
      },
    ];
    this.customers.push(...customers);

    const seededOrders: SeedOrderInput[] = [
      {
        id: 'ord_0244',
        customerId: 'cus_daw_khin_myat',
        orderNo: 'ORD-0244',
        status: 'new',
        totalPrice: 39000,
        deliveryFee: 3000,
        createdAt: '2026-04-02T04:02:00.000Z',
        updatedAt: '2026-04-02T04:02:00.000Z',
        items: [
          {
            id: 'item_0244_1',
            productName: 'Silk Longyi Set (Green, Size M)',
            qty: 2,
            unitPrice: 18000,
          },
        ],
        events: [
          {
            id: 'evt_0244_1',
            fromStatus: null,
            toStatus: 'new',
            changedAt: '2026-04-02T04:02:00.000Z',
            note: 'Added manually from Messenger chat',
          },
        ],
      },
      {
        id: 'ord_0243',
        customerId: 'cus_u_kyaw_zin',
        orderNo: 'ORD-0243',
        status: 'new',
        totalPrice: 54000,
        deliveryFee: 0,
        createdAt: '2026-04-02T04:40:00.000Z',
        updatedAt: '2026-04-02T04:40:00.000Z',
        items: [
          {
            id: 'item_0243_1',
            productName: 'Formal Shirt',
            qty: 3,
            unitPrice: 18000,
          },
        ],
        events: [
          {
            id: 'evt_0243_1',
            fromStatus: null,
            toStatus: 'new',
            changedAt: '2026-04-02T04:40:00.000Z',
            note: 'Pending confirmation',
          },
        ],
      },
      {
        id: 'ord_0240',
        customerId: 'cus_ko_zaw_lin',
        orderNo: 'ORD-0240',
        status: 'out_for_delivery',
        totalPrice: 21500,
        deliveryFee: 3000,
        createdAt: '2026-04-02T02:44:00.000Z',
        updatedAt: '2026-04-02T04:35:00.000Z',
        items: [
          {
            id: 'item_0240_1',
            productName: 'Men Shirt (L)',
            qty: 1,
            unitPrice: 18500,
          },
        ],
        events: [
          {
            id: 'evt_0240_1',
            fromStatus: null,
            toStatus: 'new',
            changedAt: '2026-04-02T02:44:00.000Z',
          },
          {
            id: 'evt_0240_2',
            fromStatus: 'new',
            toStatus: 'confirmed',
            changedAt: '2026-04-02T02:58:00.000Z',
            note: 'Confirmed by Ma Aye',
          },
          {
            id: 'evt_0240_3',
            fromStatus: 'confirmed',
            toStatus: 'out_for_delivery',
            changedAt: '2026-04-02T04:35:00.000Z',
            note: 'En route to Tarmwe',
          },
        ],
      },
      {
        id: 'ord_0239',
        customerId: 'cus_ma_thin_zar',
        orderNo: 'ORD-0239',
        status: 'confirmed',
        totalPrice: 35000,
        deliveryFee: 3000,
        createdAt: '2026-04-02T02:20:00.000Z',
        updatedAt: '2026-04-02T03:50:00.000Z',
        items: [
          {
            id: 'item_0239_1',
            productName: 'Handbag (Black)',
            qty: 1,
            unitPrice: 32000,
          },
        ],
        events: [
          {
            id: 'evt_0239_1',
            fromStatus: null,
            toStatus: 'new',
            changedAt: '2026-04-02T02:20:00.000Z',
          },
          {
            id: 'evt_0239_2',
            fromStatus: 'new',
            toStatus: 'confirmed',
            changedAt: '2026-04-02T03:50:00.000Z',
            note: 'Ready to ship',
          },
        ],
      },
      {
        id: 'ord_0238',
        customerId: 'cus_daw_aye_aye',
        orderNo: 'ORD-0238',
        status: 'delivered',
        totalPrice: 54000,
        deliveryFee: 0,
        createdAt: '2026-04-01T09:52:00.000Z',
        updatedAt: '2026-04-01T10:22:00.000Z',
        items: [
          {
            id: 'item_0238_1',
            productName: 'Summer Dress',
            qty: 3,
            unitPrice: 18000,
          },
        ],
        events: [
          {
            id: 'evt_0238_1',
            fromStatus: null,
            toStatus: 'new',
            changedAt: '2026-04-01T09:52:00.000Z',
          },
          {
            id: 'evt_0238_2',
            fromStatus: 'new',
            toStatus: 'confirmed',
            changedAt: '2026-04-01T10:05:00.000Z',
          },
          {
            id: 'evt_0238_3',
            fromStatus: 'confirmed',
            toStatus: 'delivered',
            changedAt: '2026-04-01T10:22:00.000Z',
            note: 'Delivered successfully',
          },
        ],
      },
      {
        id: 'ord_0221',
        customerId: 'cus_daw_aye_aye',
        orderNo: 'ORD-0221',
        status: 'delivered',
        totalPrice: 36000,
        deliveryFee: 0,
        createdAt: '2026-03-28T03:35:00.000Z',
        updatedAt: '2026-03-28T04:10:00.000Z',
        items: [
          {
            id: 'item_0221_1',
            productName: 'Silk Longyi Set',
            qty: 2,
            unitPrice: 18000,
          },
        ],
        events: [
          {
            id: 'evt_0221_1',
            fromStatus: null,
            toStatus: 'new',
            changedAt: '2026-03-28T03:35:00.000Z',
          },
          {
            id: 'evt_0221_2',
            fromStatus: 'new',
            toStatus: 'delivered',
            changedAt: '2026-03-28T04:10:00.000Z',
          },
        ],
      },
      {
        id: 'ord_0198',
        customerId: 'cus_daw_aye_aye',
        orderNo: 'ORD-0198',
        status: 'delivered',
        totalPrice: 32000,
        deliveryFee: 0,
        createdAt: '2026-03-20T07:44:00.000Z',
        updatedAt: '2026-03-20T08:14:00.000Z',
        items: [
          {
            id: 'item_0198_1',
            productName: 'Handbag (Red)',
            qty: 1,
            unitPrice: 32000,
          },
        ],
        events: [
          {
            id: 'evt_0198_1',
            fromStatus: null,
            toStatus: 'new',
            changedAt: '2026-03-20T07:44:00.000Z',
          },
          {
            id: 'evt_0198_2',
            fromStatus: 'new',
            toStatus: 'delivered',
            changedAt: '2026-03-20T08:14:00.000Z',
          },
        ],
      },
      {
        id: 'ord_0210',
        customerId: 'cus_ma_thin_zar',
        orderNo: 'ORD-0210',
        status: 'delivered',
        totalPrice: 45000,
        deliveryFee: 3000,
        createdAt: '2026-03-25T05:30:00.000Z',
        updatedAt: '2026-03-25T06:15:00.000Z',
        items: [
          {
            id: 'item_0210_1',
            productName: 'Silk Longyi Set',
            qty: 1,
            unitPrice: 42000,
          },
        ],
        events: [
          {
            id: 'evt_0210_1',
            fromStatus: null,
            toStatus: 'new',
            changedAt: '2026-03-25T05:30:00.000Z',
          },
          {
            id: 'evt_0210_2',
            fromStatus: 'new',
            toStatus: 'delivered',
            changedAt: '2026-03-25T06:15:00.000Z',
          },
        ],
      },
      {
        id: 'ord_0203',
        customerId: 'cus_daw_khin_myat',
        orderNo: 'ORD-0203',
        status: 'delivered',
        totalPrice: 52000,
        deliveryFee: 4000,
        createdAt: '2026-03-22T03:05:00.000Z',
        updatedAt: '2026-03-22T05:05:00.000Z',
        items: [
          {
            id: 'item_0203_1',
            productName: 'Silk Longyi Set',
            qty: 2,
            unitPrice: 24000,
          },
        ],
        events: [
          {
            id: 'evt_0203_1',
            fromStatus: null,
            toStatus: 'new',
            changedAt: '2026-03-22T03:05:00.000Z',
          },
          {
            id: 'evt_0203_2',
            fromStatus: 'new',
            toStatus: 'delivered',
            changedAt: '2026-03-22T05:05:00.000Z',
          },
        ],
      },
    ];

    for (const order of seededOrders) {
      this.orders.push({
        id: order.id,
        shopId: shop.id,
        customerId: order.customerId,
        orderNo: order.orderNo,
        status: order.status,
        totalPrice: order.totalPrice,
        currency: 'MMK',
        deliveryFee: order.deliveryFee,
        note: order.note ?? null,
        source: 'messenger',
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });

      for (const item of order.items) {
        this.orderItems.push({
          id: item.id,
          orderId: order.id,
          productId: null,
          productName: item.productName,
          qty: item.qty,
          unitPrice: item.unitPrice,
          lineTotal: item.qty * item.unitPrice,
        });
      }

      for (const event of order.events) {
        this.orderStatusEvents.push({
          id: event.id,
          orderId: order.id,
          fromStatus: event.fromStatus,
          toStatus: event.toStatus,
          changedByUserId: owner.id,
          changedAt: event.changedAt,
          note: event.note ?? null,
        });
      }
    }

    this.sessions.push({
      token: 'tok_demo_owner',
      userId: owner.id,
      createdAt: '2026-04-02T00:00:00.000Z',
    });
  }
}

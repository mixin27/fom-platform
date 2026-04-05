import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/common/auth/password';
import {
  defaultRoleCatalog,
  permissionCatalog,
} from '../src/common/http/rbac.constants';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/fom_platform_api?schema=public';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  await prisma.orderStatusEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.session.deleteMany();
  await prisma.authChallenge.deleteMany();
  await prisma.shopMemberRoleAssignment.deleteMany();
  await prisma.shopMember.deleteMany();
  await prisma.authIdentity.deleteMany();
  await prisma.passwordCredential.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.rolePermissionAssignment.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();

  await prisma.permission.createMany({
    data: permissionCatalog.map((permission) => ({
      id: `perm_${permission.code.replace(/[^\w]+/g, '_')}`,
      code: permission.code,
      name: permission.name,
      description: permission.description,
      createdAt: new Date('2026-03-20T08:50:00.000Z'),
      updatedAt: new Date('2026-03-20T08:50:00.000Z'),
    })),
  });

  await prisma.role.createMany({
    data: defaultRoleCatalog.map((role) => ({
      id: `role_${role.code}`,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: true,
      createdAt: new Date('2026-03-20T08:55:00.000Z'),
      updatedAt: new Date('2026-03-20T08:55:00.000Z'),
    })),
  });

  await prisma.rolePermissionAssignment.createMany({
    data: defaultRoleCatalog.flatMap((role) =>
      role.permissionCodes.map((permissionCode) => ({
        id: `rpa_${role.code}_${permissionCode.replace(/[^\w]+/g, '_')}`,
        roleId: `role_${role.code}`,
        permissionId: `perm_${permissionCode.replace(/[^\w]+/g, '_')}`,
        createdAt: new Date('2026-03-20T08:58:00.000Z'),
      })),
    ),
  });

  await prisma.user.createMany({
    data: [
      {
        id: 'usr_ma_aye',
        name: 'Ma Aye',
        email: 'maaye@example.com',
        phone: '09 7800 1111',
        locale: 'my',
        emailVerifiedAt: new Date('2026-03-20T09:00:00.000Z'),
        phoneVerifiedAt: new Date('2026-03-20T09:00:00.000Z'),
        createdAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
      },
      {
        id: 'usr_ko_min',
        name: 'Ko Min',
        email: 'komin@example.com',
        phone: '09 7800 2222',
        locale: 'my',
        emailVerifiedAt: new Date('2026-03-21T09:00:00.000Z'),
        phoneVerifiedAt: new Date('2026-03-21T09:00:00.000Z'),
        createdAt: new Date('2026-03-21T09:00:00.000Z'),
        updatedAt: new Date('2026-03-21T09:00:00.000Z'),
      },
    ],
  });

  const demoPasswordHash = await hashPassword('Password123!');

  await prisma.passwordCredential.createMany({
    data: [
      {
        userId: 'usr_ma_aye',
        passwordHash: demoPasswordHash,
        createdAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
      },
      {
        userId: 'usr_ko_min',
        passwordHash: demoPasswordHash,
        createdAt: new Date('2026-03-21T09:00:00.000Z'),
        updatedAt: new Date('2026-03-21T09:00:00.000Z'),
      },
    ],
  });

  await prisma.authIdentity.createMany({
    data: [
      {
        id: 'aid_pwd_owner',
        userId: 'usr_ma_aye',
        provider: 'password',
        providerUserId: 'maaye@example.com',
        email: 'maaye@example.com',
        phone: '09 7800 1111',
        displayName: 'Ma Aye',
        createdAt: new Date('2026-03-20T09:00:00.000Z'),
        updatedAt: new Date('2026-03-20T09:00:00.000Z'),
        lastLoginAt: new Date('2026-04-02T00:00:00.000Z'),
      },
      {
        id: 'aid_phone_owner',
        userId: 'usr_ma_aye',
        provider: 'phone',
        providerUserId: '09 7800 1111',
        email: 'maaye@example.com',
        phone: '09 7800 1111',
        displayName: 'Ma Aye',
        createdAt: new Date('2026-03-20T09:01:00.000Z'),
        updatedAt: new Date('2026-03-20T09:01:00.000Z'),
        lastLoginAt: new Date('2026-04-02T00:00:00.000Z'),
      },
      {
        id: 'aid_pwd_staff',
        userId: 'usr_ko_min',
        provider: 'password',
        providerUserId: 'komin@example.com',
        email: 'komin@example.com',
        phone: '09 7800 2222',
        displayName: 'Ko Min',
        createdAt: new Date('2026-03-21T09:00:00.000Z'),
        updatedAt: new Date('2026-03-21T09:00:00.000Z'),
        lastLoginAt: new Date('2026-04-02T00:30:00.000Z'),
      },
      {
        id: 'aid_phone_staff',
        userId: 'usr_ko_min',
        provider: 'phone',
        providerUserId: '09 7800 2222',
        email: 'komin@example.com',
        phone: '09 7800 2222',
        displayName: 'Ko Min',
        createdAt: new Date('2026-03-21T09:01:00.000Z'),
        updatedAt: new Date('2026-03-21T09:01:00.000Z'),
        lastLoginAt: new Date('2026-04-02T00:30:00.000Z'),
      },
    ],
  });

  await prisma.shop.create({
    data: {
      id: 'shop_ma_aye',
      ownerUserId: 'usr_ma_aye',
      name: 'Ma Aye Shop',
      timezone: 'Asia/Yangon',
      createdAt: new Date('2026-03-20T09:05:00.000Z'),
    },
  });

  await prisma.shopMember.createMany({
    data: [
      {
        id: 'mem_owner',
        shopId: 'shop_ma_aye',
        userId: 'usr_ma_aye',
        status: 'active',
        createdAt: new Date('2026-03-20T09:05:00.000Z'),
      },
      {
        id: 'mem_staff',
        shopId: 'shop_ma_aye',
        userId: 'usr_ko_min',
        status: 'active',
        createdAt: new Date('2026-03-22T09:05:00.000Z'),
      },
    ],
  });

  await prisma.shopMemberRoleAssignment.createMany({
    data: [
      {
        id: 'smra_owner_owner',
        shopMemberId: 'mem_owner',
        roleId: 'role_owner',
        createdAt: new Date('2026-03-20T09:05:00.000Z'),
      },
      {
        id: 'smra_staff_staff',
        shopMemberId: 'mem_staff',
        roleId: 'role_staff',
        createdAt: new Date('2026-03-22T09:05:00.000Z'),
      },
    ],
  });

  await prisma.customer.createMany({
    data: [
      {
        id: 'cus_daw_aye_aye',
        shopId: 'shop_ma_aye',
        name: 'Daw Aye Aye',
        phone: '09 9871 2345',
        township: 'Hlaing',
        address: 'No. 12, Shwe Taung Gyar St, Hlaing, Yangon',
        notes: 'Loyal repeat customer',
        createdAt: new Date('2026-01-05T10:00:00.000Z'),
      },
      {
        id: 'cus_daw_khin_myat',
        shopId: 'shop_ma_aye',
        name: 'Daw Khin Myat',
        phone: '09 7812 3456',
        township: 'Sanchaung',
        address: 'No. 45, Bo Gyoke St, Sanchaung, Yangon',
        createdAt: new Date('2026-03-14T10:00:00.000Z'),
      },
      {
        id: 'cus_ko_zaw_lin',
        shopId: 'shop_ma_aye',
        name: 'Ko Zaw Lin',
        phone: '09 4556 7890',
        township: 'Tarmwe',
        address: '12/B, Thitsar Rd, Tarmwe, Yangon',
        createdAt: new Date('2026-04-02T09:00:00.000Z'),
      },
      {
        id: 'cus_ma_thin_zar',
        shopId: 'shop_ma_aye',
        name: 'Ma Thin Zar',
        phone: '09 2234 5678',
        township: 'Hlaing',
        address: 'No. 18, Hlaing Main Road, Yangon',
        notes: 'Prefers afternoon delivery',
        createdAt: new Date('2026-02-12T09:00:00.000Z'),
      },
      {
        id: 'cus_u_kyaw_zin',
        shopId: 'shop_ma_aye',
        name: 'U Kyaw Zin',
        phone: '09 5678 9012',
        township: 'Tarmwe',
        address: '15/1, Tarmwe Township, Yangon',
        createdAt: new Date('2026-03-30T09:00:00.000Z'),
      },
    ],
  });

  await prisma.order.createMany({
    data: [
      {
        id: 'ord_0244',
        shopId: 'shop_ma_aye',
        customerId: 'cus_daw_khin_myat',
        orderNo: 'ORD-0244',
        status: 'new',
        totalPrice: 39000,
        currency: 'MMK',
        deliveryFee: 3000,
        source: 'messenger',
        createdAt: new Date('2026-04-02T04:02:00.000Z'),
        updatedAt: new Date('2026-04-02T04:02:00.000Z'),
      },
      {
        id: 'ord_0243',
        shopId: 'shop_ma_aye',
        customerId: 'cus_u_kyaw_zin',
        orderNo: 'ORD-0243',
        status: 'new',
        totalPrice: 54000,
        currency: 'MMK',
        deliveryFee: 0,
        source: 'messenger',
        createdAt: new Date('2026-04-02T04:40:00.000Z'),
        updatedAt: new Date('2026-04-02T04:40:00.000Z'),
      },
      {
        id: 'ord_0240',
        shopId: 'shop_ma_aye',
        customerId: 'cus_ko_zaw_lin',
        orderNo: 'ORD-0240',
        status: 'out_for_delivery',
        totalPrice: 21500,
        currency: 'MMK',
        deliveryFee: 3000,
        source: 'messenger',
        createdAt: new Date('2026-04-02T02:44:00.000Z'),
        updatedAt: new Date('2026-04-02T04:35:00.000Z'),
      },
      {
        id: 'ord_0239',
        shopId: 'shop_ma_aye',
        customerId: 'cus_ma_thin_zar',
        orderNo: 'ORD-0239',
        status: 'confirmed',
        totalPrice: 35000,
        currency: 'MMK',
        deliveryFee: 3000,
        source: 'messenger',
        createdAt: new Date('2026-04-02T02:20:00.000Z'),
        updatedAt: new Date('2026-04-02T03:50:00.000Z'),
      },
      {
        id: 'ord_0238',
        shopId: 'shop_ma_aye',
        customerId: 'cus_daw_aye_aye',
        orderNo: 'ORD-0238',
        status: 'delivered',
        totalPrice: 54000,
        currency: 'MMK',
        deliveryFee: 0,
        source: 'messenger',
        createdAt: new Date('2026-04-01T09:52:00.000Z'),
        updatedAt: new Date('2026-04-01T10:22:00.000Z'),
      },
      {
        id: 'ord_0221',
        shopId: 'shop_ma_aye',
        customerId: 'cus_daw_aye_aye',
        orderNo: 'ORD-0221',
        status: 'delivered',
        totalPrice: 36000,
        currency: 'MMK',
        deliveryFee: 0,
        source: 'messenger',
        createdAt: new Date('2026-03-28T03:35:00.000Z'),
        updatedAt: new Date('2026-03-28T04:10:00.000Z'),
      },
      {
        id: 'ord_0198',
        shopId: 'shop_ma_aye',
        customerId: 'cus_daw_aye_aye',
        orderNo: 'ORD-0198',
        status: 'delivered',
        totalPrice: 32000,
        currency: 'MMK',
        deliveryFee: 0,
        source: 'messenger',
        createdAt: new Date('2026-03-20T07:44:00.000Z'),
        updatedAt: new Date('2026-03-20T08:14:00.000Z'),
      },
      {
        id: 'ord_0210',
        shopId: 'shop_ma_aye',
        customerId: 'cus_ma_thin_zar',
        orderNo: 'ORD-0210',
        status: 'delivered',
        totalPrice: 45000,
        currency: 'MMK',
        deliveryFee: 3000,
        source: 'messenger',
        createdAt: new Date('2026-03-25T05:30:00.000Z'),
        updatedAt: new Date('2026-03-25T06:15:00.000Z'),
      },
      {
        id: 'ord_0203',
        shopId: 'shop_ma_aye',
        customerId: 'cus_daw_khin_myat',
        orderNo: 'ORD-0203',
        status: 'delivered',
        totalPrice: 52000,
        currency: 'MMK',
        deliveryFee: 4000,
        source: 'messenger',
        createdAt: new Date('2026-03-22T03:05:00.000Z'),
        updatedAt: new Date('2026-03-22T05:05:00.000Z'),
      },
    ],
  });

  await prisma.orderItem.createMany({
    data: [
      {
        id: 'item_0244_1',
        orderId: 'ord_0244',
        productName: 'Silk Longyi Set (Green, Size M)',
        qty: 2,
        unitPrice: 18000,
        lineTotal: 36000,
      },
      {
        id: 'item_0243_1',
        orderId: 'ord_0243',
        productName: 'Formal Shirt',
        qty: 3,
        unitPrice: 18000,
        lineTotal: 54000,
      },
      {
        id: 'item_0240_1',
        orderId: 'ord_0240',
        productName: 'Men Shirt (L)',
        qty: 1,
        unitPrice: 18500,
        lineTotal: 18500,
      },
      {
        id: 'item_0239_1',
        orderId: 'ord_0239',
        productName: 'Handbag (Black)',
        qty: 1,
        unitPrice: 32000,
        lineTotal: 32000,
      },
      {
        id: 'item_0238_1',
        orderId: 'ord_0238',
        productName: 'Summer Dress',
        qty: 3,
        unitPrice: 18000,
        lineTotal: 54000,
      },
      {
        id: 'item_0221_1',
        orderId: 'ord_0221',
        productName: 'Silk Longyi Set',
        qty: 2,
        unitPrice: 18000,
        lineTotal: 36000,
      },
      {
        id: 'item_0198_1',
        orderId: 'ord_0198',
        productName: 'Handbag (Red)',
        qty: 1,
        unitPrice: 32000,
        lineTotal: 32000,
      },
      {
        id: 'item_0210_1',
        orderId: 'ord_0210',
        productName: 'Silk Longyi Set',
        qty: 1,
        unitPrice: 42000,
        lineTotal: 42000,
      },
      {
        id: 'item_0203_1',
        orderId: 'ord_0203',
        productName: 'Silk Longyi Set',
        qty: 2,
        unitPrice: 24000,
        lineTotal: 48000,
      },
    ],
  });

  await prisma.orderStatusEvent.createMany({
    data: [
      {
        id: 'evt_0244_1',
        orderId: 'ord_0244',
        toStatus: 'new',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-04-02T04:02:00.000Z'),
        note: 'Added manually from Messenger chat',
      },
      {
        id: 'evt_0243_1',
        orderId: 'ord_0243',
        toStatus: 'new',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-04-02T04:40:00.000Z'),
        note: 'Pending confirmation',
      },
      {
        id: 'evt_0240_1',
        orderId: 'ord_0240',
        toStatus: 'new',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-04-02T02:44:00.000Z'),
      },
      {
        id: 'evt_0240_2',
        orderId: 'ord_0240',
        fromStatus: 'new',
        toStatus: 'confirmed',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-04-02T02:58:00.000Z'),
        note: 'Confirmed by Ma Aye',
      },
      {
        id: 'evt_0240_3',
        orderId: 'ord_0240',
        fromStatus: 'confirmed',
        toStatus: 'out_for_delivery',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-04-02T04:35:00.000Z'),
        note: 'En route to Tarmwe',
      },
      {
        id: 'evt_0239_1',
        orderId: 'ord_0239',
        toStatus: 'new',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-04-02T02:20:00.000Z'),
      },
      {
        id: 'evt_0239_2',
        orderId: 'ord_0239',
        fromStatus: 'new',
        toStatus: 'confirmed',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-04-02T03:50:00.000Z'),
        note: 'Ready to ship',
      },
      {
        id: 'evt_0238_1',
        orderId: 'ord_0238',
        toStatus: 'new',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-04-01T09:52:00.000Z'),
      },
      {
        id: 'evt_0238_2',
        orderId: 'ord_0238',
        fromStatus: 'new',
        toStatus: 'confirmed',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-04-01T10:05:00.000Z'),
      },
      {
        id: 'evt_0238_3',
        orderId: 'ord_0238',
        fromStatus: 'confirmed',
        toStatus: 'delivered',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-04-01T10:22:00.000Z'),
        note: 'Delivered successfully',
      },
      {
        id: 'evt_0221_1',
        orderId: 'ord_0221',
        toStatus: 'new',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-03-28T03:35:00.000Z'),
      },
      {
        id: 'evt_0221_2',
        orderId: 'ord_0221',
        fromStatus: 'new',
        toStatus: 'delivered',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-03-28T04:10:00.000Z'),
      },
      {
        id: 'evt_0198_1',
        orderId: 'ord_0198',
        toStatus: 'new',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-03-20T07:44:00.000Z'),
      },
      {
        id: 'evt_0198_2',
        orderId: 'ord_0198',
        fromStatus: 'new',
        toStatus: 'delivered',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-03-20T08:14:00.000Z'),
      },
      {
        id: 'evt_0210_1',
        orderId: 'ord_0210',
        toStatus: 'new',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-03-25T05:30:00.000Z'),
      },
      {
        id: 'evt_0210_2',
        orderId: 'ord_0210',
        fromStatus: 'new',
        toStatus: 'delivered',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-03-25T06:15:00.000Z'),
      },
      {
        id: 'evt_0203_1',
        orderId: 'ord_0203',
        toStatus: 'new',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-03-22T03:05:00.000Z'),
      },
      {
        id: 'evt_0203_2',
        orderId: 'ord_0203',
        fromStatus: 'new',
        toStatus: 'delivered',
        changedByUserId: 'usr_ma_aye',
        changedAt: new Date('2026-03-22T05:05:00.000Z'),
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

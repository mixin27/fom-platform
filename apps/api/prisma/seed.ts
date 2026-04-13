import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/common/auth/password';
import {
  defaultRoleCatalog,
  permissionCatalog,
} from '../src/common/http/rbac.constants';
import {
  DEFAULT_TRIAL_PLAN_CODE,
  defaultPlanCatalog,
} from '../src/platform/platform-billing.constants';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/fom_platform_api?schema=public';

const prisma: any = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const seedMode = process.env.SEED_MODE === 'demo' ? 'demo' : 'rbac';

function getPlatformOwnerSeed() {
  return {
    email:
      process.env.PLATFORM_OWNER_EMAIL?.trim().toLowerCase() ||
      process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase() ||
      'owner@fom-platform.local',
    password: process.env.PLATFORM_OWNER_PASSWORD ?? 'Password123!',
    name: process.env.PLATFORM_OWNER_NAME?.trim() || 'Platform Owner',
  };
}

function requireMapValue<T>(map: Map<string, T>, key: string): T {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`Missing seeded record for key: ${key}`);
  }

  return value;
}

async function seedPlanCatalog() {
  const plansByCode = new Map<string, { id: string }>();

  for (const plan of defaultPlanCatalog) {
    const record = await prisma.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingPeriod: plan.billingPeriod,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
      },
      create: {
        code: plan.code,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingPeriod: plan.billingPeriod,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
      },
      select: {
        id: true,
        code: true,
      },
    });

    await prisma.planItem.deleteMany({
      where: {
        planId: record.id,
      },
    });

    if (plan.items.length > 0) {
      await prisma.planItem.createMany({
        data: plan.items.map((item) => ({
          planId: record.id,
          code: item.code,
          label: item.label,
          description: item.description,
          availabilityStatus: item.availabilityStatus,
          sortOrder: item.sortOrder,
        })),
      });
    }

    plansByCode.set(record.code, record);
  }

  return { plansByCode };
}

async function seedRbacCatalog() {
  const permissionsByCode = new Map<string, { id: string }>();

  for (const permission of permissionCatalog) {
    const record = await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        scope: permission.scope,
        name: permission.name,
        description: permission.description,
      },
      create: {
        code: permission.code,
        scope: permission.scope,
        name: permission.name,
        description: permission.description,
      },
      select: {
        id: true,
        code: true,
      },
    });

    permissionsByCode.set(record.code, record);
  }

  const rolesByCode = new Map<string, { id: string }>();

  for (const role of defaultRoleCatalog) {
    const record = await prisma.role.upsert({
      where: { code: role.code },
      update: {
        scope: role.scope,
        name: role.name,
        description: role.description,
        isSystem: true,
      },
      create: {
        code: role.code,
        scope: role.scope,
        name: role.name,
        description: role.description,
        isSystem: true,
      },
      select: {
        id: true,
        code: true,
      },
    });

    rolesByCode.set(record.code, record);
  }

  await prisma.rolePermissionAssignment.deleteMany({
    where: {
      roleId: {
        in: [...rolesByCode.values()].map((role) => role.id),
      },
    },
  });

  await prisma.rolePermissionAssignment.createMany({
    data: defaultRoleCatalog.flatMap((role) =>
      role.permissionCodes.map((permissionCode) => ({
        roleId: requireMappedId(rolesByCode, role.code),
        permissionId: requireMappedId(permissionsByCode, permissionCode),
      })),
    ),
  });

  return { rolesByCode };
}

function requireMappedId(
  map: Map<string, { id: string }>,
  code: string,
): string {
  return requireMapValue(map, code).id;
}

async function resetDemoData() {
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.emailMessage.deleteMany();
  await prisma.emailActionToken.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.messageTemplate.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.orderStatusEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.platformSupportIssue.deleteMany();
  await prisma.session.deleteMany();
  await prisma.authChallenge.deleteMany();
  await prisma.shopMemberRoleAssignment.deleteMany();
  await prisma.userRoleAssignment.deleteMany();
  await prisma.shopMember.deleteMany();
  await prisma.authIdentity.deleteMany();
  await prisma.passwordCredential.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();
}

async function seedDemoData(roleIds: Map<string, { id: string }>) {
  const demoPasswordHash = await hashPassword('Password123!');
  const platformOwnerSeed = getPlatformOwnerSeed();

  const maAye = await prisma.user.create({
    data: {
      name: 'Ma Aye',
      email: 'maaye@example.com',
      phone: '09 7800 1111',
      locale: 'my',
      emailVerifiedAt: new Date('2026-03-20T09:00:00.000Z'),
      phoneVerifiedAt: new Date('2026-03-20T09:00:00.000Z'),
      createdAt: new Date('2026-03-20T09:00:00.000Z'),
      updatedAt: new Date('2026-03-20T09:00:00.000Z'),
    },
  });

  const koMin = await prisma.user.create({
    data: {
      name: 'Ko Min',
      email: 'komin@example.com',
      phone: '09 7800 2222',
      locale: 'my',
      emailVerifiedAt: new Date('2026-03-21T09:00:00.000Z'),
      phoneVerifiedAt: new Date('2026-03-21T09:00:00.000Z'),
      createdAt: new Date('2026-03-21T09:00:00.000Z'),
      updatedAt: new Date('2026-03-21T09:00:00.000Z'),
    },
  });

  let platformOwner = [maAye, koMin].find(
    (user) => user.email === platformOwnerSeed.email,
  );

  if (!platformOwner) {
    platformOwner = await prisma.user.create({
      data: {
        name: platformOwnerSeed.name,
        email: platformOwnerSeed.email,
        locale: 'en',
        emailVerifiedAt: new Date('2026-03-19T09:00:00.000Z'),
        createdAt: new Date('2026-03-19T09:00:00.000Z'),
        updatedAt: new Date('2026-03-19T09:00:00.000Z'),
      },
    });
  }

  const loginUsers = [
    {
      userId: maAye.id,
      email: maAye.email!,
      phone: maAye.phone,
      name: maAye.name,
      passwordHash: demoPasswordHash,
      createdAt: new Date('2026-03-20T09:00:00.000Z'),
      updatedAt: new Date('2026-03-20T09:00:00.000Z'),
      lastLoginAt: new Date('2026-04-02T00:00:00.000Z'),
      includePhoneIdentity: true,
    },
    {
      userId: koMin.id,
      email: koMin.email!,
      phone: koMin.phone,
      name: koMin.name,
      passwordHash: demoPasswordHash,
      createdAt: new Date('2026-03-21T09:00:00.000Z'),
      updatedAt: new Date('2026-03-21T09:00:00.000Z'),
      lastLoginAt: new Date('2026-04-02T00:30:00.000Z'),
      includePhoneIdentity: true,
    },
  ];

  if (!loginUsers.some((item) => item.userId === platformOwner.id)) {
    loginUsers.push({
      userId: platformOwner.id,
      email: platformOwner.email!,
      phone: platformOwner.phone,
      name: platformOwner.name,
      passwordHash: await hashPassword(platformOwnerSeed.password),
      createdAt: new Date('2026-03-19T09:00:00.000Z'),
      updatedAt: new Date('2026-03-19T09:00:00.000Z'),
      lastLoginAt: new Date('2026-04-02T01:00:00.000Z'),
      includePhoneIdentity: false,
    });
  }

  await prisma.passwordCredential.createMany({
    data: loginUsers.map((item) => ({
      userId: item.userId,
      passwordHash: item.passwordHash,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  });

  await prisma.authIdentity.createMany({
    data: loginUsers.flatMap((item) => [
      {
        userId: item.userId,
        provider: 'password',
        providerUserId: item.email,
        email: item.email,
        phone: item.phone,
        displayName: item.name,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        lastLoginAt: item.lastLoginAt,
      },
      ...(item.includePhoneIdentity && item.phone
        ? [
            {
              userId: item.userId,
              provider: 'phone',
              providerUserId: item.phone,
              email: item.email,
              phone: item.phone,
              displayName: item.name,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              lastLoginAt: item.lastLoginAt,
            },
          ]
        : []),
    ]),
  });

  await prisma.userRoleAssignment.create({
    data: {
      userId: platformOwner.id,
      roleId: requireMappedId(roleIds, 'platform_owner'),
    },
  });

  const trialPlanId = (
    await prisma.plan.findUnique({
      where: { code: DEFAULT_TRIAL_PLAN_CODE },
      select: { id: true },
    })
  )?.id;
  const proPlanId = (
    await prisma.plan.findUnique({
      where: { code: 'pro_monthly' },
      select: { id: true },
    })
  )?.id;
  const yearlyPlanId = (
    await prisma.plan.findUnique({
      where: { code: 'pro_yearly' },
      select: { id: true },
    })
  )?.id;

  const shop = await prisma.shop.create({
    data: {
      ownerUserId: maAye.id,
      name: 'Ma Aye Shop',
      timezone: 'Asia/Yangon',
      createdAt: new Date('2026-03-20T09:05:00.000Z'),
    },
  });

  if (proPlanId) {
    const subscription = await prisma.subscription.create({
      data: {
        shopId: shop.id,
        planId: proPlanId,
        status: 'active',
        startAt: new Date('2026-03-20T09:05:00.000Z'),
        endAt: new Date('2026-05-01T00:00:00.000Z'),
        autoRenews: true,
        createdAt: new Date('2026-03-20T09:05:00.000Z'),
        updatedAt: new Date('2026-04-02T05:30:00.000Z'),
      },
    });

    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        invoiceNo: 'INV-0089',
        amount: 7000,
        currency: 'MMK',
        status: 'paid',
        paymentMethod: 'KBZ Pay',
        providerRef: 'KBZ-INV-0089',
        dueAt: new Date('2026-04-01T00:00:00.000Z'),
        paidAt: new Date('2026-04-01T08:00:00.000Z'),
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        updatedAt: new Date('2026-04-01T08:00:00.000Z'),
      },
    });
  }

  const ownerMember = await prisma.shopMember.create({
    data: {
      shopId: shop.id,
      userId: maAye.id,
      status: 'active',
      createdAt: new Date('2026-03-20T09:05:00.000Z'),
    },
  });

  const staffMember = await prisma.shopMember.create({
    data: {
      shopId: shop.id,
      userId: koMin.id,
      status: 'active',
      createdAt: new Date('2026-03-22T09:05:00.000Z'),
    },
  });

  await prisma.shopMemberRoleAssignment.createMany({
    data: [
      {
        shopMemberId: ownerMember.id,
        roleId: requireMappedId(roleIds, 'owner'),
        createdAt: new Date('2026-03-20T09:05:00.000Z'),
      },
      {
        shopMemberId: staffMember.id,
        roleId: requireMappedId(roleIds, 'staff'),
        createdAt: new Date('2026-03-22T09:05:00.000Z'),
      },
    ],
  });

  await prisma.messageTemplate.createMany({
    data: [
      {
        shopId: shop.id,
        title: 'Payment confirmation',
        shortcut: '/paid',
        body: 'မင်္ဂလာပါရှင်။ ငွေလွှဲလက်ခံရရှိပါတယ်။ မနက်ဖြန်အတွင်းပို့ပေးပါမယ်ရှင်။',
        isActive: true,
        createdAt: new Date('2026-03-20T09:10:00.000Z'),
        updatedAt: new Date('2026-04-01T08:00:00.000Z'),
      },
      {
        shopId: shop.id,
        title: 'Out for delivery',
        shortcut: '/delivery',
        body: 'အော်ဒါကို ပို့ဆောင်နေပါပြီရှင်။ ဒီနေ့အတွင်း ရောက်ရှိဖို့ ခန့်မှန်းထားပါတယ်။',
        isActive: true,
        createdAt: new Date('2026-03-20T09:12:00.000Z'),
        updatedAt: new Date('2026-04-02T05:30:00.000Z'),
      },
      {
        shopId: shop.id,
        title: 'Need address details',
        shortcut: '/address',
        body: 'ပို့ရန်အတွက် Township နဲ့ လိပ်စာအသေးစိတ်ကို ပြန်ပို့ပေးပါရှင်။',
        isActive: true,
        createdAt: new Date('2026-03-20T09:15:00.000Z'),
        updatedAt: new Date('2026-03-28T06:00:00.000Z'),
      },
    ],
  });

  await prisma.customer.createMany({
    data: [
      {
        shopId: shop.id,
        name: 'Daw Aye Aye',
        phone: '09 9871 2345',
        township: 'Hlaing',
        address: 'No. 12, Shwe Taung Gyar St, Hlaing, Yangon',
        notes: 'Loyal repeat customer',
        createdAt: new Date('2026-01-05T10:00:00.000Z'),
      },
      {
        shopId: shop.id,
        name: 'Daw Khin Myat',
        phone: '09 7812 3456',
        township: 'Sanchaung',
        address: 'No. 45, Bo Gyoke St, Sanchaung, Yangon',
        createdAt: new Date('2026-03-14T10:00:00.000Z'),
      },
      {
        shopId: shop.id,
        name: 'Ko Zaw Lin',
        phone: '09 4556 7890',
        township: 'Tarmwe',
        address: '12/B, Thitsar Rd, Tarmwe, Yangon',
        createdAt: new Date('2026-04-02T09:00:00.000Z'),
      },
      {
        shopId: shop.id,
        name: 'Ma Thin Zar',
        phone: '09 2234 5678',
        township: 'Hlaing',
        address: 'No. 18, Hlaing Main Road, Yangon',
        notes: 'Prefers afternoon delivery',
        createdAt: new Date('2026-02-12T09:00:00.000Z'),
      },
      {
        shopId: shop.id,
        name: 'U Kyaw Zin',
        phone: '09 5678 9012',
        township: 'Tarmwe',
        address: '15/1, Tarmwe Township, Yangon',
        createdAt: new Date('2026-03-30T09:00:00.000Z'),
      },
    ],
  });

  const customers = await prisma.customer.findMany({
    where: {
      shopId: shop.id,
    },
    select: {
      id: true,
      phone: true,
    },
  });
  const customerIdByPhone = new Map<string, string>(
    customers.map((customer: any) => [customer.phone, customer.id]),
  );

  await prisma.order.createMany({
    data: [
      {
        shopId: shop.id,
        customerId: requireMapValue(customerIdByPhone, '09 7812 3456'),
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
        shopId: shop.id,
        customerId: requireMapValue(customerIdByPhone, '09 5678 9012'),
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
        shopId: shop.id,
        customerId: requireMapValue(customerIdByPhone, '09 4556 7890'),
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
        shopId: shop.id,
        customerId: requireMapValue(customerIdByPhone, '09 2234 5678'),
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
        shopId: shop.id,
        customerId: requireMapValue(customerIdByPhone, '09 9871 2345'),
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
        shopId: shop.id,
        customerId: requireMapValue(customerIdByPhone, '09 9871 2345'),
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
        shopId: shop.id,
        customerId: requireMapValue(customerIdByPhone, '09 9871 2345'),
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
        shopId: shop.id,
        customerId: requireMapValue(customerIdByPhone, '09 2234 5678'),
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
        shopId: shop.id,
        customerId: requireMapValue(customerIdByPhone, '09 7812 3456'),
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

  const orders = await prisma.order.findMany({
    where: {
      shopId: shop.id,
    },
    select: {
      id: true,
      orderNo: true,
    },
  });
  const orderIdByNo = new Map<string, string>(
    orders.map((order: any) => [order.orderNo, order.id]),
  );

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0244'),
        productName: 'Silk Longyi Set (Green, Size M)',
        qty: 2,
        unitPrice: 18000,
        lineTotal: 36000,
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0243'),
        productName: 'Formal Shirt',
        qty: 3,
        unitPrice: 18000,
        lineTotal: 54000,
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0240'),
        productName: 'Men Shirt (L)',
        qty: 1,
        unitPrice: 18500,
        lineTotal: 18500,
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0239'),
        productName: 'Handbag (Black)',
        qty: 1,
        unitPrice: 32000,
        lineTotal: 32000,
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0238'),
        productName: 'Summer Dress',
        qty: 3,
        unitPrice: 18000,
        lineTotal: 54000,
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0221'),
        productName: 'Silk Longyi Set',
        qty: 2,
        unitPrice: 18000,
        lineTotal: 36000,
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0198'),
        productName: 'Handbag (Red)',
        qty: 1,
        unitPrice: 32000,
        lineTotal: 32000,
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0210'),
        productName: 'Silk Longyi Set',
        qty: 1,
        unitPrice: 42000,
        lineTotal: 42000,
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0203'),
        productName: 'Silk Longyi Set',
        qty: 2,
        unitPrice: 24000,
        lineTotal: 48000,
      },
    ],
  });

  await prisma.delivery.createMany({
    data: [
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0240'),
        driverUserId: koMin.id,
        status: 'out_for_delivery',
        deliveryFee: 3000,
        addressSnapshot: '12/B, Thitsar Rd, Tarmwe, Yangon',
        scheduledAt: new Date('2026-04-02T03:30:00.000Z'),
        createdAt: new Date('2026-04-02T03:00:00.000Z'),
        updatedAt: new Date('2026-04-02T04:35:00.000Z'),
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0239'),
        driverUserId: koMin.id,
        status: 'scheduled',
        deliveryFee: 3000,
        addressSnapshot: 'No. 18, Hlaing Main Road, Yangon',
        scheduledAt: new Date('2026-04-02T06:30:00.000Z'),
        createdAt: new Date('2026-04-02T03:55:00.000Z'),
        updatedAt: new Date('2026-04-02T03:55:00.000Z'),
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0238'),
        driverUserId: maAye.id,
        status: 'delivered',
        deliveryFee: 0,
        addressSnapshot: 'No. 12, Shwe Taung Gyar St, Hlaing, Yangon',
        scheduledAt: new Date('2026-04-01T09:30:00.000Z'),
        deliveredAt: new Date('2026-04-01T10:22:00.000Z'),
        createdAt: new Date('2026-04-01T09:10:00.000Z'),
        updatedAt: new Date('2026-04-01T10:22:00.000Z'),
      },
    ],
  });

  await prisma.orderStatusEvent.createMany({
    data: [
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0244'),
        toStatus: 'new',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-04-02T04:02:00.000Z'),
        note: 'Added manually from Messenger chat',
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0243'),
        toStatus: 'new',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-04-02T04:40:00.000Z'),
        note: 'Pending confirmation',
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0240'),
        toStatus: 'new',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-04-02T02:44:00.000Z'),
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0240'),
        fromStatus: 'new',
        toStatus: 'confirmed',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-04-02T02:58:00.000Z'),
        note: 'Confirmed by Ma Aye',
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0240'),
        fromStatus: 'confirmed',
        toStatus: 'out_for_delivery',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-04-02T04:35:00.000Z'),
        note: 'En route to Tarmwe',
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0239'),
        toStatus: 'new',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-04-02T02:20:00.000Z'),
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0239'),
        fromStatus: 'new',
        toStatus: 'confirmed',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-04-02T03:50:00.000Z'),
        note: 'Ready to ship',
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0238'),
        toStatus: 'new',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-04-01T09:52:00.000Z'),
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0238'),
        fromStatus: 'new',
        toStatus: 'confirmed',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-04-01T10:05:00.000Z'),
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0238'),
        fromStatus: 'confirmed',
        toStatus: 'delivered',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-04-01T10:22:00.000Z'),
        note: 'Delivered successfully',
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0221'),
        toStatus: 'new',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-03-28T03:35:00.000Z'),
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0221'),
        fromStatus: 'new',
        toStatus: 'delivered',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-03-28T04:10:00.000Z'),
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0198'),
        toStatus: 'new',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-03-20T07:44:00.000Z'),
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0198'),
        fromStatus: 'new',
        toStatus: 'delivered',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-03-20T08:14:00.000Z'),
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0210'),
        toStatus: 'new',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-03-25T05:30:00.000Z'),
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0210'),
        fromStatus: 'new',
        toStatus: 'delivered',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-03-25T06:15:00.000Z'),
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0203'),
        toStatus: 'new',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-03-22T03:05:00.000Z'),
      },
      {
        orderId: requireMapValue(orderIdByNo, 'ORD-0203'),
        fromStatus: 'new',
        toStatus: 'delivered',
        changedByUserId: maAye.id,
        changedAt: new Date('2026-03-22T05:05:00.000Z'),
      },
    ],
  });

  await prisma.notificationPreference.createMany({
    data: [
      {
        userId: maAye.id,
        category: 'order_activity',
        inAppEnabled: true,
        emailEnabled: true,
        createdAt: new Date('2026-03-20T09:05:00.000Z'),
        updatedAt: new Date('2026-04-02T05:30:00.000Z'),
      },
      {
        userId: maAye.id,
        category: 'daily_summary',
        inAppEnabled: true,
        emailEnabled: true,
        createdAt: new Date('2026-03-20T09:05:00.000Z'),
        updatedAt: new Date('2026-04-02T05:30:00.000Z'),
      },
      {
        userId: maAye.id,
        category: 'promotional_tips',
        inAppEnabled: false,
        emailEnabled: false,
        createdAt: new Date('2026-03-20T09:05:00.000Z'),
        updatedAt: new Date('2026-04-02T05:30:00.000Z'),
      },
      {
        userId: koMin.id,
        category: 'order_activity',
        inAppEnabled: true,
        emailEnabled: true,
        createdAt: new Date('2026-03-22T09:05:00.000Z'),
        updatedAt: new Date('2026-04-02T05:30:00.000Z'),
      },
      {
        userId: koMin.id,
        category: 'daily_summary',
        inAppEnabled: true,
        emailEnabled: false,
        createdAt: new Date('2026-03-22T09:05:00.000Z'),
        updatedAt: new Date('2026-04-02T05:30:00.000Z'),
      },
    ],
  });

  const seededNotifications = await prisma.notification.createManyAndReturn({
    data: [
      {
        userId: maAye.id,
        shopId: shop.id,
        shopNameSnapshot: shop.name,
        category: 'order_activity',
        title: 'New order — Daw Khin Myat',
        body: 'ORD-0244 · 39,000 MMK · Sanchaung',
        actionType: 'order',
        actionTarget: `/orders/${requireMapValue(orderIdByNo, 'ORD-0244')}`,
        createdAt: new Date('2026-04-02T04:02:30.000Z'),
      },
      {
        userId: maAye.id,
        shopId: shop.id,
        shopNameSnapshot: shop.name,
        category: 'order_activity',
        title: 'Out for delivery — Ko Zaw Lin',
        body: 'ORD-0240 moved to out for delivery',
        actionType: 'order',
        actionTarget: `/orders/${requireMapValue(orderIdByNo, 'ORD-0240')}`,
        createdAt: new Date('2026-04-02T04:35:30.000Z'),
      },
      {
        userId: maAye.id,
        shopId: shop.id,
        shopNameSnapshot: shop.name,
        category: 'daily_summary',
        title: 'Daily summary ready',
        body: 'Yesterday closed with 22 orders and 413,000 MMK revenue.',
        actionType: 'report',
        actionTarget: '/reports',
        createdAt: new Date('2026-04-02T01:00:00.000Z'),
      },
      {
        userId: koMin.id,
        shopId: shop.id,
        shopNameSnapshot: shop.name,
        category: 'order_activity',
        title: 'New order — Daw Khin Myat',
        body: 'ORD-0244 · 39,000 MMK · Sanchaung',
        actionType: 'order',
        actionTarget: `/orders/${requireMapValue(orderIdByNo, 'ORD-0244')}`,
        createdAt: new Date('2026-04-02T04:02:30.000Z'),
      },
      {
        userId: koMin.id,
        shopId: shop.id,
        shopNameSnapshot: shop.name,
        category: 'order_activity',
        title: 'Delivery scheduled — Ma Thin Zar',
        body: 'ORD-0239 is ready for dispatch this afternoon.',
        actionType: 'order',
        actionTarget: `/orders/${requireMapValue(orderIdByNo, 'ORD-0239')}`,
        createdAt: new Date('2026-04-02T03:55:30.000Z'),
      },
    ],
  });

  const notificationByCompositeKey = new Map<string, any>(
    seededNotifications.map((notification: any) => [
      `${notification.userId}:${notification.title}`,
      notification,
    ]),
  );

  await prisma.emailMessage.createMany({
    data: [
      {
        userId: koMin.id,
        notificationId: requireMapValue(
          notificationByCompositeKey,
          `${koMin.id}:New order — Daw Khin Myat`,
        ).id,
        shopId: shop.id,
        category: 'order_activity',
        toEmail: koMin.email!,
        recipientName: koMin.name,
        subject: `[${shop.name}] New order ORD-0244`,
        textBody:
          'Daw Khin Myat placed ORD-0244 for 39,000 MMK. Open the order to confirm details.',
        status: 'sent',
        providerKey: 'log',
        queuedAt: new Date('2026-04-02T04:02:31.000Z'),
        processedAt: new Date('2026-04-02T04:02:31.000Z'),
        updatedAt: new Date('2026-04-02T04:02:31.000Z'),
      },
      {
        userId: maAye.id,
        notificationId: requireMapValue(
          notificationByCompositeKey,
          `${maAye.id}:Daily summary ready`,
        ).id,
        shopId: shop.id,
        category: 'daily_summary',
        toEmail: maAye.email!,
        recipientName: maAye.name,
        subject: `[${shop.name}] Daily summary ready`,
        textBody:
          'Yesterday closed with 22 orders and 413,000 MMK revenue. Open reports for the full breakdown.',
        status: 'sent',
        providerKey: 'log',
        queuedAt: new Date('2026-04-02T01:00:01.000Z'),
        processedAt: new Date('2026-04-02T01:00:01.000Z'),
        updatedAt: new Date('2026-04-02T01:00:01.000Z'),
      },
    ],
  });

  const extraOwners = await prisma.user.createManyAndReturn({
    data: [
      {
        name: 'Daw Thiri',
        email: 'thiri@example.com',
        phone: '09 7000 3333',
        locale: 'my',
        emailVerifiedAt: new Date('2026-01-15T09:00:00.000Z'),
        createdAt: new Date('2026-01-15T09:00:00.000Z'),
        updatedAt: new Date('2026-04-01T06:00:00.000Z'),
      },
      {
        name: 'Ko Zaw Electronics',
        email: 'kozaw@example.com',
        phone: '09 7000 4444',
        locale: 'my',
        emailVerifiedAt: new Date('2026-03-26T08:00:00.000Z'),
        createdAt: new Date('2026-03-26T08:00:00.000Z'),
        updatedAt: new Date('2026-04-03T05:00:00.000Z'),
      },
      {
        name: 'Phyo Cosmetics Owner',
        email: 'phyo@example.com',
        phone: '09 7000 5555',
        locale: 'my',
        emailVerifiedAt: new Date('2026-02-10T08:30:00.000Z'),
        createdAt: new Date('2026-02-10T08:30:00.000Z'),
        updatedAt: new Date('2026-04-01T04:00:00.000Z'),
      },
      {
        name: 'Thida',
        email: 'thida@example.com',
        phone: '09 7000 6666',
        locale: 'my',
        emailVerifiedAt: new Date('2026-02-01T09:30:00.000Z'),
        createdAt: new Date('2026-02-01T09:30:00.000Z'),
        updatedAt: new Date('2026-04-01T03:30:00.000Z'),
      },
    ],
  });
  const extraOwnerByEmail = new Map<string, any>(
    extraOwners.map((user: any) => [user.email ?? '', user]),
  );

  const aungBeautyShop = await prisma.shop.create({
    data: {
      ownerUserId: requireMapValue(extraOwnerByEmail, 'thiri@example.com').id,
      name: 'Aung Beauty Store',
      timezone: 'Asia/Yangon',
      createdAt: new Date('2025-12-20T09:00:00.000Z'),
    },
  });
  const koZawShop = await prisma.shop.create({
    data: {
      ownerUserId: requireMapValue(extraOwnerByEmail, 'kozaw@example.com').id,
      name: 'Ko Zaw Electronics',
      timezone: 'Asia/Yangon',
      createdAt: new Date('2026-03-26T08:30:00.000Z'),
    },
  });
  const phyoShop = await prisma.shop.create({
    data: {
      ownerUserId: requireMapValue(extraOwnerByEmail, 'phyo@example.com').id,
      name: 'Phyo Cosmetics',
      timezone: 'Asia/Yangon',
      createdAt: new Date('2026-02-10T08:45:00.000Z'),
    },
  });
  const thidaShop = await prisma.shop.create({
    data: {
      ownerUserId: requireMapValue(extraOwnerByEmail, 'thida@example.com').id,
      name: 'Thida Food Express',
      timezone: 'Asia/Yangon',
      createdAt: new Date('2026-02-01T10:00:00.000Z'),
    },
  });

  const extraMemberships = await prisma.shopMember.createManyAndReturn({
    data: [
      {
        shopId: aungBeautyShop.id,
        userId: requireMapValue(extraOwnerByEmail, 'thiri@example.com').id,
        status: 'active',
        createdAt: new Date('2025-12-20T09:00:00.000Z'),
      },
      {
        shopId: koZawShop.id,
        userId: requireMapValue(extraOwnerByEmail, 'kozaw@example.com').id,
        status: 'active',
        createdAt: new Date('2026-03-26T08:30:00.000Z'),
      },
      {
        shopId: phyoShop.id,
        userId: requireMapValue(extraOwnerByEmail, 'phyo@example.com').id,
        status: 'active',
        createdAt: new Date('2026-02-10T08:45:00.000Z'),
      },
      {
        shopId: thidaShop.id,
        userId: requireMapValue(extraOwnerByEmail, 'thida@example.com').id,
        status: 'active',
        createdAt: new Date('2026-02-01T10:00:00.000Z'),
      },
    ],
  });

  await prisma.shopMemberRoleAssignment.createMany({
    data: extraMemberships.map((membership) => ({
      shopMemberId: membership.id,
      roleId: requireMappedId(roleIds, 'owner'),
      createdAt: membership.createdAt,
    })),
  });

  const extraSubscriptions: any[] = [];

  if (yearlyPlanId) {
    extraSubscriptions.push({
      shopId: aungBeautyShop.id,
      planId: yearlyPlanId,
      status: 'active',
      startAt: new Date('2025-12-20T09:00:00.000Z'),
      endAt: new Date('2026-12-20T00:00:00.000Z'),
      autoRenews: true,
      createdAt: new Date('2025-12-20T09:00:00.000Z'),
      updatedAt: new Date('2026-04-01T06:00:00.000Z'),
    });
  }

  if (trialPlanId) {
    extraSubscriptions.push({
      shopId: koZawShop.id,
      planId: trialPlanId,
      status: 'trialing',
      startAt: new Date('2026-03-26T08:30:00.000Z'),
      endAt: new Date('2026-04-08T00:00:00.000Z'),
      autoRenews: false,
      createdAt: new Date('2026-03-26T08:30:00.000Z'),
      updatedAt: new Date('2026-04-03T05:00:00.000Z'),
    });
  }

  if (proPlanId) {
    extraSubscriptions.push(
      {
        shopId: phyoShop.id,
        planId: proPlanId,
        status: 'active',
        startAt: new Date('2026-02-10T08:45:00.000Z'),
        endAt: new Date('2026-04-01T00:00:00.000Z'),
        autoRenews: true,
        createdAt: new Date('2026-02-10T08:45:00.000Z'),
        updatedAt: new Date('2026-04-01T04:00:00.000Z'),
      },
      {
        shopId: thidaShop.id,
        planId: proPlanId,
        status: 'active',
        startAt: new Date('2026-02-01T10:00:00.000Z'),
        endAt: new Date('2026-05-01T00:00:00.000Z'),
        autoRenews: true,
        createdAt: new Date('2026-02-01T10:00:00.000Z'),
        updatedAt: new Date('2026-04-01T03:30:00.000Z'),
      },
    );
  }

  const createdSubscriptions = await prisma.subscription.createManyAndReturn({
    data: extraSubscriptions,
  });
  const subscriptionIdByShopId = new Map<string, string>(
    createdSubscriptions.map((subscription: any) => [
      subscription.shopId,
      subscription.id,
    ]),
  );

  const paymentData: any[] = [];

  const aungSubscriptionId = subscriptionIdByShopId.get(aungBeautyShop.id);
  if (aungSubscriptionId) {
    paymentData.push({
      subscriptionId: aungSubscriptionId,
      invoiceNo: 'INV-0084',
      amount: 70000,
      currency: 'MMK',
      status: 'paid',
      paymentMethod: 'KBZ Pay',
      providerRef: 'KBZ-INV-0084',
      dueAt: new Date('2025-12-20T00:00:00.000Z'),
      paidAt: new Date('2025-12-20T10:00:00.000Z'),
      createdAt: new Date('2025-12-20T00:00:00.000Z'),
      updatedAt: new Date('2025-12-20T10:00:00.000Z'),
    });
  }

  const phyoSubscriptionId = subscriptionIdByShopId.get(phyoShop.id);
  if (phyoSubscriptionId) {
    paymentData.push({
      subscriptionId: phyoSubscriptionId,
      invoiceNo: 'INV-0086',
      amount: 7000,
      currency: 'MMK',
      status: 'overdue',
      paymentMethod: null,
      providerRef: null,
      dueAt: new Date('2026-03-01T00:00:00.000Z'),
      paidAt: null,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-04-01T04:00:00.000Z'),
    });
  }

  const thidaSubscriptionId = subscriptionIdByShopId.get(thidaShop.id);
  if (thidaSubscriptionId) {
    paymentData.push({
      subscriptionId: thidaSubscriptionId,
      invoiceNo: 'INV-0088',
      amount: 7000,
      currency: 'MMK',
      status: 'paid',
      paymentMethod: 'Wave Money',
      providerRef: 'WAVE-INV-0088',
      dueAt: new Date('2026-04-01T00:00:00.000Z'),
      paidAt: new Date('2026-04-01T09:00:00.000Z'),
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
      updatedAt: new Date('2026-04-01T09:00:00.000Z'),
    });
  }

  if (paymentData.length > 0) {
    await prisma.payment.createMany({
      data: paymentData,
    });
  }
}

async function main() {
  const { rolesByCode } = await seedRbacCatalog();
  await seedPlanCatalog();

  if (seedMode === 'demo') {
    await resetDemoData();
    await seedDemoData(rolesByCode);
  }

  console.log(`[seed] completed in ${seedMode} mode`);
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

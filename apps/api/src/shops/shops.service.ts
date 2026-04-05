import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/http/request-context';
import {
  conflictError,
  forbiddenError,
  notFoundError,
} from '../common/http/app-http.exception';
import { paged } from '../common/http/api-result';
import { paginate } from '../common/utils/pagination';
import {
  assertValid,
  asEnum,
  optionalString,
  requiredString,
} from '../common/utils/validation';
import { PrismaService } from '../common/prisma/prisma.service';
import { permissionsForRole } from '../common/http/rbac.constants';
import { generateId } from '../common/utils/id';

type ShopWithCount = any & {
  _count: {
    members: number;
  };
};

type MemberWithUser = any;

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async listUserShops(userId: string) {
    const memberships = await this.prisma.shopMember.findMany({
      where: {
        userId,
        status: 'active',
      },
      include: {
        shop: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((member) => ({
      ...this.serializeShopRecord(member.shop),
      membership: {
        id: member.id,
        role: member.role,
        status: member.status,
        permissions: [...permissionsForRole(member.role)],
      },
    }));
  }

  async createShop(
    currentUser: AuthenticatedUser,
    body: Record<string, unknown>,
  ) {
    const errors: Array<{ field: string; errors: string[] }> = [];
    const name = requiredString(body.name, 'name', errors, 'shop name');
    const timezone =
      optionalString(body.timezone, 'timezone', errors, 'timezone') ??
      'Asia/Yangon';
    assertValid(errors);

    const shopId = generateId('shop');
    await this.prisma.$transaction([
      this.prisma.shop.create({
        data: {
          id: shopId,
          ownerUserId: currentUser.id,
          name,
          timezone,
        },
      }),
      this.prisma.shopMember.create({
        data: {
          id: generateId('mem'),
          shopId,
          userId: currentUser.id,
          role: 'owner',
          status: 'active',
        },
      }),
    ]);

    return this.serializeShop(shopId);
  }

  async getShop(currentUser: AuthenticatedUser, shopId: string) {
    await this.assertShopAccess(currentUser.id, shopId);
    return this.serializeShop(shopId);
  }

  async updateShop(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: Record<string, unknown>,
  ) {
    await this.assertOwnerAccess(currentUser.id, shopId);
    const errors: Array<{ field: string; errors: string[] }> = [];
    const name = optionalString(body.name, 'name', errors, 'shop name');
    const timezone = optionalString(
      body.timezone,
      'timezone',
      errors,
      'timezone',
    );
    assertValid(errors);

    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        ...(name ? { name } : {}),
        ...(timezone ? { timezone } : {}),
      },
    });

    return this.serializeShop(shopId);
  }

  async listMembers(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: Record<string, unknown>,
  ) {
    await this.assertShopAccess(currentUser.id, shopId);
    const members = (
      await this.prisma.shopMember.findMany({
        where: { shopId },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      })
    ).map((member) => this.serializeMemberRecord(member));

    const page = paginate(
      members,
      query.limit as string | undefined,
      query.cursor as string | undefined,
    );
    return paged(page.items, page.pagination);
  }

  async addMember(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: Record<string, unknown>,
  ) {
    await this.assertOwnerAccess(currentUser.id, shopId);

    const errors: Array<{ field: string; errors: string[] }> = [];
    const userId = optionalString(body.user_id, 'user_id', errors, 'user ID');
    const phone = optionalString(body.phone, 'phone', errors, 'phone number');
    const name = optionalString(body.name, 'name', errors, 'name');
    const role =
      asEnum(body.role, 'role', ['owner', 'staff'] as const, errors, {
        required: true,
        label: 'role',
      }) ?? 'staff';
    assertValid(errors);

    let targetUser =
      (userId &&
        (await this.prisma.user.findUnique({
          where: { id: userId },
        }))) ||
      (phone &&
        (await this.prisma.user.findUnique({
          where: { phone },
        })));

    if (!targetUser) {
      if (!phone || !name) {
        throw conflictError(
          'Existing user was not found. Provide phone and name to create one',
        );
      }

      targetUser = await this.prisma.user.create({
        data: {
          id: generateId('usr'),
          name,
          phone,
        },
      });
    }

    const existingMember = await this.prisma.shopMember.findUnique({
      where: {
        shopId_userId: {
          shopId,
          userId: targetUser.id,
        },
      },
    });
    if (existingMember) {
      throw conflictError('User is already a member of this shop');
    }

    const member = await this.prisma.shopMember.create({
      data: {
        id: generateId('mem'),
        shopId,
        userId: targetUser.id,
        role,
        status: 'active',
      },
      include: {
        user: true,
      },
    });

    return this.serializeMemberRecord(member);
  }

  async updateMember(
    currentUser: AuthenticatedUser,
    shopId: string,
    memberId: string,
    body: Record<string, unknown>,
  ) {
    await this.assertOwnerAccess(currentUser.id, shopId);
    const member = await this.prisma.shopMember.findFirst({
      where: {
        id: memberId,
        shopId,
      },
    });
    if (!member) {
      throw notFoundError('Shop member not found');
    }

    const errors: Array<{ field: string; errors: string[] }> = [];
    const role = asEnum(
      body.role,
      'role',
      ['owner', 'staff'] as const,
      errors,
      {
        label: 'role',
      },
    );
    const status = asEnum(
      body.status,
      'status',
      ['active', 'invited', 'disabled'] as const,
      errors,
      {
        label: 'status',
      },
    );
    assertValid(errors);

    const updated = await this.prisma.shopMember.update({
      where: { id: member.id },
      data: {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        user: true,
      },
    });

    return this.serializeMemberRecord(updated);
  }

  async assertShopAccess(userId: string, shopId: string) {
    const member = await this.prisma.shopMember.findUnique({
      where: {
        shopId_userId: {
          shopId,
          userId,
        },
      },
      include: {
        shop: true,
      },
    });
    if (!member || member.status !== 'active') {
      throw forbiddenError();
    }

    return { shop: member.shop, member };
  }

  async assertOwnerAccess(userId: string, shopId: string) {
    const { shop, member } = await this.assertShopAccess(userId, shopId);
    if (member.role !== 'owner') {
      throw forbiddenError('Only shop owners can perform this action');
    }

    return { shop, member };
  }

  async serializeShop(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
    if (!shop) {
      throw notFoundError('Shop not found');
    }

    return this.serializeShopRecord(shop);
  }

  async serializeMember(memberId: string) {
    const member = await this.prisma.shopMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });
    if (!member) {
      throw notFoundError('Shop member not found');
    }

    return this.serializeMemberRecord(member);
  }

  private serializeShopRecord(shop: ShopWithCount) {
    return {
      id: shop.id,
      owner_user_id: shop.ownerUserId,
      name: shop.name,
      timezone: shop.timezone,
      member_count: shop._count.members,
      created_at: shop.createdAt.toISOString(),
    };
  }

  private serializeMemberRecord(member: MemberWithUser) {
    return {
      id: member.id,
      shop_id: member.shopId,
      user_id: member.userId,
      role: member.role,
      status: member.status,
      created_at: member.createdAt.toISOString(),
      user: {
        id: member.user.id,
        name: member.user.name,
        phone: member.user.phone,
        locale: member.user.locale,
      },
      permissions: [...permissionsForRole(member.role)],
    };
  }
}

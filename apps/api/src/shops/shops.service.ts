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
import { permissions, type Permission } from '../common/http/rbac.constants';
import { generateId } from '../common/utils/id';

type ShopWithCount = any & {
  _count: {
    members: number;
  };
};

type MemberWithAccess = any;

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
        roleAssignments: {
          include: {
            role: {
              include: {
                permissionAssignments: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return memberships.map((member) => {
      const access = this.extractMemberAccess(member);

      return {
        ...this.serializeShopRecord(member.shop),
        membership: {
          id: member.id,
          role: access.primaryRole,
          roles: access.roles,
          status: member.status,
          permissions: access.permissions,
        },
      };
    });
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

    const ownerRole = await this.requireRolesByCodes(['owner']);

    const created = await this.prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          ownerUserId: currentUser.id,
          name,
          timezone,
        },
      });

      const member = await tx.shopMember.create({
        data: {
          shopId: shop.id,
          userId: currentUser.id,
          status: 'active',
        },
      });

      await tx.shopMemberRoleAssignment.createMany({
        data: ownerRole.map((role) => ({
          shopMemberId: member.id,
          roleId: role.id,
        })),
      });

      return shop;
    });

    return this.serializeShop(created.id);
  }

  async getShop(currentUser: AuthenticatedUser, shopId: string) {
    await this.assertPermission(currentUser.id, shopId, permissions.shopsRead);
    return this.serializeShop(shopId);
  }

  async updateShop(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: Record<string, unknown>,
  ) {
    await this.assertPermission(currentUser.id, shopId, permissions.shopsWrite);
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
    await this.assertPermission(
      currentUser.id,
      shopId,
      permissions.membersRead,
    );
    const members = (
      await this.prisma.shopMember.findMany({
        where: { shopId },
        include: {
          user: true,
          roleAssignments: {
            include: {
              role: {
                include: {
                  permissionAssignments: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
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
    await this.assertPermission(
      currentUser.id,
      shopId,
      permissions.membersManage,
    );

    const errors: Array<{ field: string; errors: string[] }> = [];
    const userId = optionalString(body.user_id, 'user_id', errors, 'user ID');
    const phone = optionalString(body.phone, 'phone', errors, 'phone number');
    const email = optionalString(body.email, 'email', errors, 'email');
    const name = optionalString(body.name, 'name', errors, 'name');
    const roleCodes = this.extractRequestedRoleCodes(body, errors, ['staff']);
    assertValid(errors);

    let targetUser =
      (userId &&
        (await this.prisma.user.findUnique({
          where: { id: userId },
        }))) ||
      (email &&
        (await this.prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() },
        }))) ||
      (phone &&
        (await this.prisma.user.findUnique({
          where: { phone: phone.replace(/\s+/g, ' ').trim() },
        })));

    if (!targetUser) {
      if (!name || (!email && !phone)) {
        throw conflictError(
          'Existing user was not found. Provide name with email or phone to create one',
        );
      }

      targetUser = await this.prisma.user.create({
        data: {
          name,
          email: email?.trim().toLowerCase() ?? null,
          phone: phone?.replace(/\s+/g, ' ').trim() ?? null,
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

    const roles = await this.requireRolesByCodes(roleCodes ?? ['staff']);
    const member = await this.prisma.$transaction(async (tx) => {
      const createdMember = await tx.shopMember.create({
        data: {
          shopId,
          userId: targetUser.id,
          status: 'active',
        },
      });

      await tx.shopMemberRoleAssignment.createMany({
        data: roles.map((role) => ({
          shopMemberId: createdMember.id,
          roleId: role.id,
        })),
      });

      return tx.shopMember.findUnique({
        where: { id: createdMember.id },
        include: {
          user: true,
          roleAssignments: {
            include: {
              role: {
                include: {
                  permissionAssignments: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    return this.serializeMemberRecord(member);
  }

  async updateMember(
    currentUser: AuthenticatedUser,
    shopId: string,
    memberId: string,
    body: Record<string, unknown>,
  ) {
    await this.assertPermission(
      currentUser.id,
      shopId,
      permissions.membersManage,
    );
    const member = await this.prisma.shopMember.findFirst({
      where: {
        id: memberId,
        shopId,
      },
      include: {
        user: true,
        roleAssignments: {
          include: {
            role: {
              include: {
                permissionAssignments: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!member) {
      throw notFoundError('Shop member not found');
    }

    const errors: Array<{ field: string; errors: string[] }> = [];
    const status = asEnum(
      body.status,
      'status',
      ['active', 'invited', 'disabled'] as const,
      errors,
      {
        label: 'status',
      },
    );
    const roleCodes = this.extractRequestedRoleCodes(body, errors);
    assertValid(errors);

    const roles = roleCodes ? await this.requireRolesByCodes(roleCodes) : null;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (status) {
        await tx.shopMember.update({
          where: { id: member.id },
          data: {
            status,
          },
        });
      }

      if (roles) {
        await tx.shopMemberRoleAssignment.deleteMany({
          where: { shopMemberId: member.id },
        });
        await tx.shopMemberRoleAssignment.createMany({
          data: roles.map((role) => ({
            shopMemberId: member.id,
            roleId: role.id,
          })),
        });
      }

      return tx.shopMember.findUnique({
        where: { id: member.id },
        include: {
          user: true,
          roleAssignments: {
            include: {
              role: {
                include: {
                  permissionAssignments: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
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
        user: true,
        roleAssignments: {
          include: {
            role: {
              include: {
                permissionAssignments: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!member || member.status !== 'active') {
      throw forbiddenError();
    }

    return {
      shop: member.shop,
      member,
      access: this.extractMemberAccess(member),
    };
  }

  async assertPermission(
    userId: string,
    shopId: string,
    requiredPermissions: Permission | Permission[],
  ) {
    const result = await this.assertShopAccess(userId, shopId);
    const required = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const missing = required.filter(
      (permission) => !result.access.permissions.includes(permission),
    );
    if (missing.length > 0) {
      throw forbiddenError('You do not have permission to perform this action');
    }

    return result;
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
      include: {
        user: true,
        roleAssignments: {
          include: {
            role: {
              include: {
                permissionAssignments: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!member) {
      throw notFoundError('Shop member not found');
    }

    return this.serializeMemberRecord(member);
  }

  private async requireRolesByCodes(roleCodes: string[]) {
    const uniqueRoleCodes = [
      ...new Set(roleCodes.map((role) => role.trim())),
    ].sort();
    const roles = await this.prisma.role.findMany({
      where: {
        code: {
          in: uniqueRoleCodes,
        },
      },
    });

    const missingRoleCodes = uniqueRoleCodes.filter(
      (code) => !roles.some((role) => role.code === code),
    );
    if (missingRoleCodes.length > 0) {
      throw notFoundError(
        `Roles not found: ${missingRoleCodes.join(', ')}. Seed RBAC defaults first.`,
      );
    }

    return roles.sort((left, right) => left.code.localeCompare(right.code));
  }

  private extractRequestedRoleCodes(
    body: Record<string, unknown>,
    errors: Array<{ field: string; errors: string[] }>,
    defaultRoleCodes?: string[],
  ): string[] | undefined {
    const directRole =
      optionalString(body.role, 'role', errors, 'role') ??
      optionalString(body.role_code, 'role_code', errors, 'role code');

    const roleCodesRaw =
      body.role_codes ?? body.roles ?? (directRole ? [directRole] : undefined);

    if (roleCodesRaw === undefined || roleCodesRaw === null) {
      return defaultRoleCodes;
    }

    if (!Array.isArray(roleCodesRaw)) {
      errors.push({
        field: 'role_codes',
        errors: ['Role codes must be an array of role codes'],
      });
      return defaultRoleCodes;
    }

    const roleCodes = roleCodesRaw
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (roleCodes.length !== roleCodesRaw.length || roleCodes.length === 0) {
      errors.push({
        field: 'role_codes',
        errors: ['Role codes must be a non-empty array of strings'],
      });
      return defaultRoleCodes;
    }

    return [...new Set(roleCodes)];
  }

  private extractMemberAccess(member: MemberWithAccess) {
    const roles = [...member.roleAssignments]
      .map((assignment) => assignment.role)
      .sort((left, right) => left.code.localeCompare(right.code))
      .map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
      }));

    const permissionCodes = [
      ...new Set(
        member.roleAssignments.flatMap((assignment) =>
          assignment.role.permissionAssignments.map(
            (permissionAssignment) => permissionAssignment.permission.code,
          ),
        ),
      ),
    ].sort();

    return {
      primaryRole: roles[0]?.code ?? null,
      roles,
      permissions: permissionCodes,
    };
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

  private serializeMemberRecord(member: MemberWithAccess | null) {
    if (!member) {
      throw notFoundError('Shop member not found');
    }

    const access = this.extractMemberAccess(member);

    return {
      id: member.id,
      shop_id: member.shopId,
      user_id: member.userId,
      role: access.primaryRole,
      roles: access.roles,
      status: member.status,
      created_at: member.createdAt.toISOString(),
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        phone: member.user.phone,
        locale: member.user.locale,
      },
      permissions: access.permissions,
    };
  }
}

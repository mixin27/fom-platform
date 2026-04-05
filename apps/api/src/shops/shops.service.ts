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
import { InMemoryStoreService } from '../store/in-memory-store.service';
import { permissionsForRole } from '../common/http/rbac.constants';

@Injectable()
export class ShopsService {
  constructor(private readonly store: InMemoryStoreService) {}

  listUserShops(userId: string) {
    return this.store.shopMembers
      .filter(
        (member) => member.userId === userId && member.status === 'active',
      )
      .map((member) => {
        const shop = this.requireShop(member.shopId);
        return {
          ...this.serializeShop(shop.id),
          membership: {
            id: member.id,
            role: member.role,
            status: member.status,
            permissions: [...permissionsForRole(member.role)],
          },
        };
      });
  }

  createShop(currentUser: AuthenticatedUser, body: Record<string, unknown>) {
    const errors: Array<{ field: string; errors: string[] }> = [];
    const name = requiredString(body.name, 'name', errors, 'shop name');
    const timezone =
      optionalString(body.timezone, 'timezone', errors, 'timezone') ??
      'Asia/Yangon';
    assertValid(errors);

    const shop = this.store.createShop({
      ownerUserId: currentUser.id,
      name,
      timezone,
    });
    this.store.addShopMember({
      shopId: shop.id,
      userId: currentUser.id,
      role: 'owner',
    });

    return this.serializeShop(shop.id);
  }

  getShop(currentUser: AuthenticatedUser, shopId: string) {
    this.assertShopAccess(currentUser.id, shopId);
    return this.serializeShop(shopId);
  }

  updateShop(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: Record<string, unknown>,
  ) {
    const { shop } = this.assertOwnerAccess(currentUser.id, shopId);
    const errors: Array<{ field: string; errors: string[] }> = [];
    const name = optionalString(body.name, 'name', errors, 'shop name');
    const timezone = optionalString(
      body.timezone,
      'timezone',
      errors,
      'timezone',
    );
    assertValid(errors);

    if (name) {
      shop.name = name;
    }

    if (timezone) {
      shop.timezone = timezone;
    }

    return this.serializeShop(shopId);
  }

  listMembers(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: Record<string, unknown>,
  ) {
    this.assertShopAccess(currentUser.id, shopId);
    const members = this.store.shopMembers
      .filter((member) => member.shopId === shopId)
      .map((member) => this.serializeMember(member.id))
      .sort((left, right) => left.created_at.localeCompare(right.created_at));

    const page = paginate(
      members,
      query.limit as string | undefined,
      query.cursor as string | undefined,
    );
    return paged(page.items, page.pagination);
  }

  addMember(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: Record<string, unknown>,
  ) {
    this.assertOwnerAccess(currentUser.id, shopId);

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
      (userId && this.store.findUserById(userId)) ||
      (phone && this.store.findUserByPhone(phone));

    if (!targetUser) {
      if (!phone || !name) {
        throw conflictError(
          'Existing user was not found. Provide phone and name to create one',
        );
      }

      targetUser = this.store.createUser({
        name,
        phone,
      });
    }

    const existingMember = this.store.shopMembers.find(
      (member) => member.shopId === shopId && member.userId === targetUser.id,
    );
    if (existingMember) {
      throw conflictError('User is already a member of this shop');
    }

    const member = this.store.addShopMember({
      shopId,
      userId: targetUser.id,
      role,
      status: 'active',
    });

    return this.serializeMember(member.id);
  }

  updateMember(
    currentUser: AuthenticatedUser,
    shopId: string,
    memberId: string,
    body: Record<string, unknown>,
  ) {
    this.assertOwnerAccess(currentUser.id, shopId);
    const member = this.store.shopMembers.find(
      (item) => item.id === memberId && item.shopId === shopId,
    );
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

    if (role) {
      member.role = role;
    }

    if (status) {
      member.status = status;
    }

    return this.serializeMember(member.id);
  }

  assertShopAccess(userId: string, shopId: string) {
    const shop = this.requireShop(shopId);
    const member = this.store.shopMembers.find(
      (item) =>
        item.shopId === shopId &&
        item.userId === userId &&
        item.status === 'active',
    );
    if (!member) {
      throw forbiddenError();
    }

    return { shop, member };
  }

  assertOwnerAccess(userId: string, shopId: string) {
    const { shop, member } = this.assertShopAccess(userId, shopId);
    if (member.role !== 'owner') {
      throw forbiddenError('Only shop owners can perform this action');
    }

    return { shop, member };
  }

  serializeShop(shopId: string) {
    const shop = this.requireShop(shopId);
    const members = this.store.shopMembers.filter(
      (member) => member.shopId === shopId,
    );
    return {
      id: shop.id,
      owner_user_id: shop.ownerUserId,
      name: shop.name,
      timezone: shop.timezone,
      member_count: members.length,
      created_at: shop.createdAt,
    };
  }

  serializeMember(memberId: string) {
    const member = this.store.shopMembers.find((item) => item.id === memberId);
    if (!member) {
      throw notFoundError('Shop member not found');
    }

    const user = this.store.findUserById(member.userId);
    if (!user) {
      throw notFoundError('User not found');
    }

    return {
      id: member.id,
      shop_id: member.shopId,
      user_id: member.userId,
      role: member.role,
      status: member.status,
      created_at: member.createdAt,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        locale: user.locale,
      },
      permissions: [...permissionsForRole(member.role)],
    };
  }

  private requireShop(shopId: string) {
    const shop = this.store.findShopById(shopId);
    if (!shop) {
      throw notFoundError('Shop not found');
    }
    return shop;
  }
}

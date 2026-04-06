import { Injectable } from '@nestjs/common';
import {
  conflictError,
  notFoundError,
  validationError,
} from '../common/http/app-http.exception';
import { paged } from '../common/http/api-result';
import type { AuthenticatedUser } from '../common/http/request-context';
import { PrismaService } from '../common/prisma/prisma.service';
import { paginate } from '../common/utils/pagination';
import { ShopsService } from '../shops/shops.service';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { ListMessageTemplatesQueryDto } from './dto/list-message-templates-query.dto';
import { UpdateMessageTemplateDto } from './dto/update-message-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
  ) {}

  async listTemplates(
    currentUser: AuthenticatedUser,
    shopId: string,
    query: ListMessageTemplatesQueryDto,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);

    const state = query.state ?? 'all';
    const search = query.search?.trim() ?? '';

    const templates = await this.prisma.messageTemplate.findMany({
      where: {
        shopId,
        ...(state === 'active'
          ? { isActive: true }
          : state === 'inactive'
            ? { isActive: false }
            : {}),
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  shortcut: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  body: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ updatedAt: 'desc' }, { title: 'asc' }],
    });

    const serialized = templates.map((template) =>
      this.serializeTemplateRecord(template),
    );
    const page = paginate(serialized, query.limit, query.cursor);
    return paged(page.items, page.pagination);
  }

  async createTemplate(
    currentUser: AuthenticatedUser,
    shopId: string,
    body: CreateMessageTemplateDto,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);

    await this.assertTemplateUniqueness(shopId, body.title, body.shortcut);

    const template = await this.prisma.messageTemplate.create({
      data: {
        shopId,
        title: body.title,
        body: body.body,
        shortcut: body.shortcut ?? null,
        isActive: body.is_active ?? true,
      },
    });

    return this.serializeTemplateRecord(template);
  }

  async updateTemplate(
    currentUser: AuthenticatedUser,
    shopId: string,
    templateId: string,
    body: UpdateMessageTemplateDto,
  ) {
    await this.shopsService.assertShopAccess(currentUser.id, shopId);

    const template = await this.prisma.messageTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template || template.shopId !== shopId) {
      throw notFoundError('Message template not found');
    }

    if (
      body.title === undefined &&
      body.body === undefined &&
      body.shortcut === undefined &&
      body.is_active === undefined
    ) {
      throw validationError([
        {
          field: 'body',
          errors: ['Provide at least one field to update'],
        },
      ]);
    }

    await this.assertTemplateUniqueness(
      shopId,
      body.title,
      body.shortcut,
      template.id,
    );

    const updated = await this.prisma.messageTemplate.update({
      where: { id: template.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.body !== undefined ? { body: body.body } : {}),
        ...(body.shortcut !== undefined ? { shortcut: body.shortcut } : {}),
        ...(body.is_active !== undefined ? { isActive: body.is_active } : {}),
      },
    });

    return this.serializeTemplateRecord(updated);
  }

  private async assertTemplateUniqueness(
    shopId: string,
    title?: string,
    shortcut?: string | null,
    currentTemplateId?: string,
  ) {
    if (title !== undefined) {
      const existingWithTitle = await this.prisma.messageTemplate.findFirst({
        where: {
          shopId,
          title,
          ...(currentTemplateId ? { id: { not: currentTemplateId } } : {}),
        },
        select: { id: true },
      });

      if (existingWithTitle) {
        throw conflictError('Another message template already uses this title');
      }
    }

    if (shortcut !== undefined && shortcut !== null) {
      const existingWithShortcut = await this.prisma.messageTemplate.findFirst({
        where: {
          shopId,
          shortcut,
          ...(currentTemplateId ? { id: { not: currentTemplateId } } : {}),
        },
        select: { id: true },
      });

      if (existingWithShortcut) {
        throw conflictError(
          'Another message template already uses this shortcut',
        );
      }
    }
  }

  private serializeTemplateRecord(template: {
    id: string;
    shopId: string;
    title: string;
    shortcut: string | null;
    body: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: template.id,
      shop_id: template.shopId,
      title: template.title,
      shortcut: template.shortcut,
      body: template.body,
      preview:
        template.body.length > 120
          ? `${template.body.slice(0, 117).trimEnd()}...`
          : template.body,
      character_count: template.body.length,
      is_active: template.isActive,
      created_at: template.createdAt.toISOString(),
      updated_at: template.updatedAt.toISOString(),
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { EmailTemplateService } from './email-template.service';
import { EmailTransportService } from './email-transport.service';
import type { QueueEmailInput, QueueTemplatedEmailInput } from './email.types';

@Injectable()
export class EmailOutboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailTransport: EmailTransportService,
    private readonly emailTemplates: EmailTemplateService,
  ) {}

  async queueEmail(input: QueueEmailInput) {
    const sender = this.emailTransport.getDefaultSender();

    return this.prisma.emailMessage.create({
      data: {
        userId: input.userId ?? null,
        notificationId: input.notificationId ?? null,
        shopId: input.shopId ?? null,
        category: input.category,
        templateKey: input.templateKey ?? null,
        toEmail: input.toEmail,
        recipientName: input.recipientName ?? null,
        fromEmail: input.fromEmail ?? sender.fromEmail,
        fromName: input.fromName ?? sender.fromName,
        replyToEmail: input.replyToEmail ?? null,
        replyToName: input.replyToName ?? null,
        subject: input.subject,
        textBody: input.textBody,
        htmlBody: input.htmlBody ?? null,
        providerKey: this.emailTransport.getActiveProviderKey(),
        ...(input.metadata
          ? {
              metadata: input.metadata as Prisma.InputJsonValue,
            }
          : {}),
      },
    });
  }

  async queueTemplatedEmail(input: QueueTemplatedEmailInput) {
    const rendered = this.emailTemplates.render({
      templateKey: input.templateKey,
      locale: input.locale,
      variables: input.variables,
    });

    return this.queueEmail({
      userId: input.userId,
      notificationId: input.notificationId,
      shopId: input.shopId,
      category: input.category ?? rendered.category,
      templateKey: rendered.templateKey,
      toEmail: input.toEmail,
      recipientName: input.recipientName,
      fromEmail: input.fromEmail,
      fromName: input.fromName,
      replyToEmail: input.replyToEmail,
      replyToName: input.replyToName,
      subject: rendered.subject,
      textBody: rendered.textBody,
      htmlBody: rendered.htmlBody,
      metadata: input.metadata,
    });
  }

  async queueAndSendEmail(input: QueueEmailInput) {
    const queued = await this.queueEmail(input);
    return this.sendQueuedEmail(queued.id);
  }

  async queueAndSendTemplatedEmail(input: QueueTemplatedEmailInput) {
    const queued = await this.queueTemplatedEmail(input);
    return this.sendQueuedEmail(queued.id);
  }

  async sendQueuedEmails(emailMessageIds: string[]) {
    for (const emailMessageId of emailMessageIds) {
      await this.sendQueuedEmail(emailMessageId);
    }
  }

  async sendQueuedEmail(emailMessageId: string) {
    const email = await this.prisma.emailMessage.findUnique({
      where: { id: emailMessageId },
    });
    if (!email) {
      return null;
    }

    if (!['queued', 'failed'].includes(email.status)) {
      return email;
    }

    try {
      const result = await this.emailTransport.send({
        messageId: email.id,
        toEmail: email.toEmail,
        recipientName: email.recipientName,
        fromEmail: email.fromEmail ?? this.emailTransport.getDefaultSender().fromEmail,
        fromName: email.fromName ?? this.emailTransport.getDefaultSender().fromName,
        replyToEmail: email.replyToEmail,
        replyToName: email.replyToName,
        subject: email.subject,
        textBody: email.textBody,
        htmlBody: email.htmlBody,
      });
      const nextMetadata = result.metadata
        ? (result.metadata as Prisma.InputJsonValue)
        : undefined;

      return this.prisma.emailMessage.update({
        where: { id: email.id },
        data: {
          status: result.status,
          providerKey: result.providerKey,
          providerMessageId: result.providerMessageId,
          attemptCount: {
            increment: 1,
          },
          sentAt: result.status === 'sent' ? new Date() : email.sentAt,
          processedAt: new Date(),
          failureReason: result.failureReason ?? null,
          ...(nextMetadata !== undefined ? { metadata: nextMetadata } : {}),
        },
      });
    } catch (error) {
      return this.prisma.emailMessage.update({
        where: { id: email.id },
        data: {
          status: 'failed',
          attemptCount: {
            increment: 1,
          },
          processedAt: new Date(),
          failureReason:
            error instanceof Error ? error.message : 'Unknown email failure',
        },
      });
    }
  }
}

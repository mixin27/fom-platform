import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  notFoundError,
  validationError,
} from '../common/http/app-http.exception';
import type { RequestWithContext } from '../common/http/request-context';
import { ensureRequestContext } from '../common/http/request-context';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { EmailOutboxService } from '../email/email-outbox.service';
import { CreatePublicContactSubmissionDto } from './dto/create-public-contact-submission.dto';
import { UpdatePublicContactSubmissionDto } from './dto/update-public-contact-submission.dto';
import { PublicContactRateLimitService } from './public-contact-rate-limit.service';

@Injectable()
export class PublicContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailOutbox: EmailOutboxService,
    private readonly rateLimit: PublicContactRateLimitService,
    private readonly config: AppConfigService,
  ) {}

  async submitFromPublic(
    body: CreatePublicContactSubmissionDto,
    request: RequestWithContext,
  ) {
    ensureRequestContext(request);

    const honeypot = body.website?.trim() ?? '';
    if (honeypot.length > 0) {
      return { received: true as const, reference_id: null as string | null };
    }

    const email = body.email.trim().toLowerCase();
    const name = body.name?.trim() || null;
    const subject = body.subject?.trim() || null;
    const message = body.message.trim();

    if (message.length < 10) {
      throw validationError([
        { field: 'message', errors: ['Message is too short.'] },
      ]);
    }

    const ip = request.ipAddress?.trim() || 'unknown';
    const contactConfig = this.config.getPublicContactConfig();
    this.rateLimit.consumeIp(ip, {
      limit: contactConfig.ipRateLimit.limit,
      windowMs: contactConfig.ipRateLimit.windowMs,
    });
    this.rateLimit.consumeEmail(email, {
      limit: contactConfig.emailRateLimit.limit,
      windowMs: contactConfig.emailRateLimit.windowMs,
    });

    const ipFingerprint = this.fingerprintIp(request.ipAddress);
    const userAgent = this.truncate(request.userAgent?.trim() || null, 512);

    const submission = await this.prisma.publicContactSubmission.create({
      data: {
        email,
        name,
        subject,
        message,
        emailStatus: 'queued',
        ipFingerprint,
        userAgent,
      },
    });

    const inbox = this.resolveInboxEmail();
    const line = (label: string, value: string) => `${label}: ${value}\n`;
    const textBody =
      line('Submission ID', submission.id) +
      line('From email', email) +
      (name ? line('Name', name) : '') +
      (subject ? line('Subject', subject) : '') +
      '\n' +
      message;

    const emailRow = await this.emailOutbox.queueAndSendEmail({
      category: 'public_contact',
      toEmail: inbox,
      subject: `[FOM Contact] ${subject || 'Website message'}`,
      textBody,
      replyToEmail: email,
      replyToName: name,
      metadata: {
        public_contact_submission_id: submission.id,
      },
    });

    if (!emailRow) {
      await this.prisma.publicContactSubmission.update({
        where: { id: submission.id },
        data: { emailStatus: 'failed' },
      });
    } else {
      const nextStatus =
        emailRow.status === 'sent'
          ? 'sent'
          : emailRow.status === 'failed'
            ? 'failed'
            : 'queued';

      await this.prisma.publicContactSubmission.update({
        where: { id: submission.id },
        data: {
          emailMessageId: emailRow.id,
          emailStatus: nextStatus,
        },
      });
    }

    return {
      received: true as const,
      reference_id: submission.id,
    };
  }

  async listInboxForPlatform(options?: { includeArchived?: boolean }) {
    const includeArchived = options?.includeArchived ?? false;
    const rows = await this.prisma.publicContactSubmission.findMany({
      where: includeArchived ? {} : { archived: false },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const openCount = await this.prisma.publicContactSubmission.count({
      where: { archived: false },
    });

    return {
      open_count: openCount,
      submissions: rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        subject: row.subject,
        message: row.message,
        email_status: row.emailStatus,
        ip_fingerprint: row.ipFingerprint,
        user_agent: row.userAgent,
        archived: row.archived,
        admin_note: row.adminNote,
        created_at: row.createdAt.toISOString(),
      })),
    };
  }

  async updateSubmissionAsPlatform(
    submissionId: string,
    body: UpdatePublicContactSubmissionDto,
  ) {
    const existing = await this.prisma.publicContactSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!existing) {
      throw notFoundError('Contact submission not found');
    }

    if (body.archived === undefined && body.admin_note === undefined) {
      throw validationError([
        {
          field: 'body',
          errors: ['Provide at least one of archived or admin_note'],
        },
      ]);
    }

    const row = await this.prisma.publicContactSubmission.update({
      where: { id: submissionId },
      data: {
        ...(body.archived !== undefined ? { archived: body.archived } : {}),
        ...(body.admin_note !== undefined
          ? { adminNote: body.admin_note.trim() || null }
          : {}),
      },
    });

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      subject: row.subject,
      message: row.message,
      email_status: row.emailStatus,
      ip_fingerprint: row.ipFingerprint,
      user_agent: row.userAgent,
      archived: row.archived,
      admin_note: row.adminNote,
      created_at: row.createdAt.toISOString(),
    };
  }

  async getSubmissionForPlatform(submissionId: string) {
    const row = await this.prisma.publicContactSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!row) {
      throw notFoundError('Contact submission not found');
    }

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      subject: row.subject,
      message: row.message,
      email_status: row.emailStatus,
      ip_fingerprint: row.ipFingerprint,
      user_agent: row.userAgent,
      archived: row.archived,
      admin_note: row.adminNote,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    };
  }

  private resolveInboxEmail() {
    return this.config.getPublicContactConfig().inboxEmail;
  }

  private fingerprintIp(ip: string | null | undefined) {
    const raw = ip?.trim();
    if (!raw || raw === 'unknown') {
      return null;
    }
    const salt = this.config.getPublicContactConfig().ipSalt;
    return createHash('sha256')
      .update(`${salt}:${raw}`)
      .digest('hex')
      .slice(0, 32);
  }

  private truncate(value: string | null, max: number) {
    if (!value) {
      return null;
    }
    return value.length <= max ? value : value.slice(0, max);
  }
}

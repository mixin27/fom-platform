import { Injectable } from '@nestjs/common';
import type {
  EmailTemplateRenderInput,
  EmailTemplateKey,
  RenderedEmailTemplate,
} from './email.types';

@Injectable()
export class EmailTemplateService {
  render(input: EmailTemplateRenderInput): RenderedEmailTemplate {
    switch (input.templateKey) {
      case 'auth.welcome':
        return this.renderWelcome(input.variables);
      case 'auth.verify_email':
        return this.renderVerifyEmail(input.variables);
      case 'auth.forgot_password':
        return this.renderForgotPassword(input.variables);
      case 'auth.password_reset_success':
        return this.renderPasswordResetSuccess(input.variables);
      case 'platform.invoice_notice':
        return this.renderInvoiceNotice(input.variables);
      case 'platform.trial_notice':
        return this.renderTrialNotice(input.variables);
      case 'platform.billing_notice':
        return this.renderBillingNotice(input.variables);
      case 'platform.promotion':
        return this.renderPromotion(input.variables);
      default:
        return this.renderFallback(input.templateKey, input.variables);
    }
  }

  private renderWelcome(
    variables: Record<string, string | number | boolean | null | undefined>,
  ): RenderedEmailTemplate {
    return this.compose({
      category: 'auth',
      templateKey: 'auth.welcome',
      subject: 'Welcome to FOM Order Manager',
      eyebrow: 'Welcome',
      title: `Welcome${this.withNameSuffix(variables.recipientName)}.`,
      intro:
        'Your account is ready. You can now sign in to your shop workspace and start managing orders, customers, and deliveries.',
      bodyLines: [
        String(
          variables.shopName
            ? `Initial workspace: ${variables.shopName}`
            : 'Set up your first shop workspace after sign-in if it is not ready yet.',
        ),
      ],
      ctaLabel: variables.ctaLabel ?? 'Open dashboard',
      ctaUrl: variables.ctaUrl,
      footerLines: [
        'Keep this email for future account reference.',
      ],
    });
  }

  private renderVerifyEmail(
    variables: Record<string, string | number | boolean | null | undefined>,
  ): RenderedEmailTemplate {
    return this.compose({
      category: 'auth',
      templateKey: 'auth.verify_email',
      subject: 'Verify your email address',
      eyebrow: 'Email verification',
      title: 'Confirm your email address.',
      intro:
        'Use the link below to verify this email address for your FOM Order Manager account.',
      bodyLines: [
        String(
          variables.expiryText ??
            'This verification link will expire soon. If it expires, request a new one from the portal.',
        ),
      ],
      ctaLabel: variables.ctaLabel ?? 'Verify email',
      ctaUrl: variables.ctaUrl,
      footerLines: [
        'If you did not create this account, you can ignore this message.',
      ],
    });
  }

  private renderForgotPassword(
    variables: Record<string, string | number | boolean | null | undefined>,
  ): RenderedEmailTemplate {
    return this.compose({
      category: 'security',
      templateKey: 'auth.forgot_password',
      subject: 'Reset your password',
      eyebrow: 'Password reset',
      title: 'Reset your password.',
      intro:
        'A password reset was requested for your FOM Order Manager account.',
      bodyLines: [
        String(
          variables.expiryText ??
            'For security, this reset link expires soon and can only be used once.',
        ),
      ],
      ctaLabel: variables.ctaLabel ?? 'Reset password',
      ctaUrl: variables.ctaUrl,
      footerLines: [
        'If you did not request this change, you can ignore this email.',
      ],
    });
  }

  private renderPasswordResetSuccess(
    variables: Record<string, string | number | boolean | null | undefined>,
  ): RenderedEmailTemplate {
    return this.compose({
      category: 'security',
      templateKey: 'auth.password_reset_success',
      subject: 'Your password was updated',
      eyebrow: 'Security update',
      title: 'Password updated.',
      intro:
        'Your password was changed successfully. Existing sessions were revoked and must sign in again.',
      bodyLines: [
        String(
          variables.supportText ??
            'If you did not perform this action, contact platform support immediately.',
        ),
      ],
      ctaLabel: variables.ctaLabel ?? 'Sign in',
      ctaUrl: variables.ctaUrl,
    });
  }

  private renderInvoiceNotice(
    variables: Record<string, string | number | boolean | null | undefined>,
  ): RenderedEmailTemplate {
    return this.compose({
      category: 'platform_billing',
      templateKey: 'platform.invoice_notice',
      subject: String(
        variables.subject ??
          `Invoice ${variables.invoiceNo ?? ''} from FOM Order Manager`.trim(),
      ),
      eyebrow: 'Billing',
      title: String(
        variables.title ??
          `Invoice ${variables.invoiceNo ?? ''} is ready.`.trim(),
      ),
      intro: String(
        variables.intro ??
          'A new invoice has been issued for your shop subscription.',
      ),
      bodyLines: [
        String(variables.amountLine ?? ''),
        String(variables.dueAtLine ?? ''),
        String(variables.planLine ?? ''),
      ].filter(Boolean),
      ctaLabel: variables.ctaLabel ?? 'Review billing',
      ctaUrl: variables.ctaUrl,
      footerLines: [String(variables.footerText ?? '')].filter(Boolean),
    });
  }

  private renderTrialNotice(
    variables: Record<string, string | number | boolean | null | undefined>,
  ): RenderedEmailTemplate {
    return this.compose({
      category: 'platform_billing',
      templateKey: 'platform.trial_notice',
      subject: String(
        variables.subject ?? 'Your trial is ending soon',
      ),
      eyebrow: 'Trial notice',
      title: String(variables.title ?? 'Trial ending soon.'),
      intro: String(
        variables.intro ??
          'Your FOM Order Manager trial is nearing its end date.',
      ),
      bodyLines: [
        String(variables.expiryLine ?? ''),
        String(variables.planLine ?? ''),
      ].filter(Boolean),
      ctaLabel: variables.ctaLabel ?? 'Choose a plan',
      ctaUrl: variables.ctaUrl,
    });
  }

  private renderBillingNotice(
    variables: Record<string, string | number | boolean | null | undefined>,
  ): RenderedEmailTemplate {
    return this.compose({
      category: 'platform_billing',
      templateKey: 'platform.billing_notice',
      subject: String(
        variables.subject ?? 'Billing follow-up required',
      ),
      eyebrow: 'Billing notice',
      title: String(variables.title ?? 'Action required for billing.'),
      intro: String(
        variables.intro ??
          'There is a billing item that needs attention for your shop subscription.',
      ),
      bodyLines: [
        String(variables.amountLine ?? ''),
        String(variables.statusLine ?? ''),
        String(variables.dueAtLine ?? ''),
      ].filter(Boolean),
      ctaLabel: variables.ctaLabel ?? 'Review billing',
      ctaUrl: variables.ctaUrl,
    });
  }

  private renderPromotion(
    variables: Record<string, string | number | boolean | null | undefined>,
  ): RenderedEmailTemplate {
    return this.compose({
      category: 'platform_marketing',
      templateKey: 'platform.promotion',
      subject: String(variables.subject ?? 'Update from FOM Order Manager'),
      eyebrow: String(variables.eyebrow ?? 'Platform update'),
      title: String(variables.title ?? 'Platform update'),
      intro: String(variables.intro ?? variables.body ?? ''),
      bodyLines: [String(variables.detail ?? '')].filter(Boolean),
      ctaLabel: variables.ctaLabel ?? 'Open platform',
      ctaUrl: variables.ctaUrl,
      footerLines: [String(variables.footerText ?? '')].filter(Boolean),
    });
  }

  private renderFallback(
    templateKey: EmailTemplateKey,
    variables: Record<string, string | number | boolean | null | undefined>,
  ) {
    return this.compose({
      category: 'system',
      templateKey,
      subject: String(variables.subject ?? 'FOM Order Manager update'),
      eyebrow: 'System email',
      title: String(variables.title ?? 'Update'),
      intro: String(variables.body ?? ''),
      ctaLabel: variables.ctaLabel ?? null,
      ctaUrl: variables.ctaUrl,
    });
  }

  private compose(input: {
    category: string;
    templateKey: EmailTemplateKey;
    subject: string;
    eyebrow: string;
    title: string;
    intro: string;
    previewText?: string;
    bodyLines?: string[];
    ctaLabel?: string | number | boolean | null | undefined;
    ctaUrl?: string | number | boolean | null | undefined;
    footerLines?: string[];
  }): RenderedEmailTemplate {
    const bodyLines = (input.bodyLines ?? []).filter((line) => line.trim().length > 0);
    const footerLines = [
      ...(input.footerLines ?? []),
      `Support: ${this.getSupportEmail()}`,
      `Product: ${this.getProductName()}`,
    ].filter((line) => line.trim().length > 0);
    const ctaLabel = this.asOptionalString(input.ctaLabel);
    const ctaUrl = this.asOptionalString(input.ctaUrl);
    const textSections = [input.title, input.intro];

    if (bodyLines.length > 0) {
      textSections.push(bodyLines.join('\n'));
    }

    if (ctaLabel && ctaUrl) {
      textSections.push(`${ctaLabel}: ${ctaUrl}`);
    }

    if (footerLines.length > 0) {
      textSections.push(footerLines.join('\n'));
    }

    return {
      category: input.category,
      templateKey: input.templateKey,
      subject: input.subject,
      textBody: textSections.join('\n\n'),
      htmlBody: this.renderHtml({
        previewText: input.previewText ?? input.intro,
        eyebrow: input.eyebrow,
        title: input.title,
        intro: input.intro,
        bodyLines,
        footerLines,
        ctaLabel,
        ctaUrl,
      }),
    };
  }

  private renderHtml(input: {
    previewText: string;
    eyebrow: string;
    title: string;
    intro: string;
    bodyLines: string[];
    footerLines: string[];
    ctaLabel: string | null;
    ctaUrl: string | null;
  }) {
    const bodyMarkup = input.bodyLines
      .map((line) => `<p style="margin:0 0 12px;color:#4a5563;font-size:15px;line-height:1.7;">${this.escapeHtml(line)}</p>`)
      .join('');
    const footerMarkup = input.footerLines
      .map((line) => `<p style="margin:0 0 8px;color:#7a8594;font-size:13px;line-height:1.6;">${this.escapeHtml(line)}</p>`)
      .join('');
    const ctaMarkup =
      input.ctaLabel && input.ctaUrl
        ? `<p style="margin:24px 0 0;"><a href="${this.escapeAttribute(input.ctaUrl)}" style="display:inline-block;border-radius:999px;background:#f97a1f;padding:12px 20px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${this.escapeHtml(input.ctaLabel)}</a></p>`
        : '';
    const productName = this.getProductName();
    const productUrl = this.getWebBaseUrl();

    return [
      '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">',
      this.escapeHtml(input.previewText),
      '</div>',
      '<div style="margin:0;background:#f6f2eb;padding:32px 16px;font-family:Georgia, ui-serif, serif;">',
      '<div style="margin:0 auto 16px;max-width:640px;">',
      `<p style="margin:0;color:#6a7786;font-size:12px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;">${this.escapeHtml(productName)}</p>`,
      '</div>',
      '<div style="margin:0 auto;max-width:640px;border-radius:24px;background:#ffffff;padding:32px;border:1px solid rgba(15,23,42,0.08);box-shadow:0 20px 50px rgba(15,23,42,0.06);">',
      `<p style="margin:0 0 12px;color:#6a7786;font-size:12px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;">${this.escapeHtml(input.eyebrow)}</p>`,
      `<h1 style="margin:0 0 16px;color:#0f172a;font-size:30px;line-height:1.15;">${this.escapeHtml(input.title)}</h1>`,
      `<p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.75;">${this.escapeHtml(input.intro)}</p>`,
      bodyMarkup,
      ctaMarkup,
      footerMarkup
        ? `<div style="margin-top:24px;border-top:1px solid rgba(15,23,42,0.08);padding-top:18px;">${footerMarkup}</div>`
        : '',
      '</div>',
      `<div style="margin:16px auto 0;max-width:640px;color:#7a8594;font-size:12px;line-height:1.7;">Open app: <a href="${this.escapeAttribute(productUrl)}" style="color:#7a8594;">${this.escapeHtml(productUrl)}</a></div>`,
      '</div>',
    ].join('');
  }

  private withNameSuffix(value: string | number | boolean | null | undefined) {
    const name = this.asOptionalString(value);
    return name ? `, ${name}` : '';
  }

  private asOptionalString(value: string | number | boolean | null | undefined) {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private escapeAttribute(value: string) {
    return this.escapeHtml(value);
  }

  private getProductName() {
    return process.env.EMAIL_PRODUCT_NAME?.trim() || 'FOM Order Manager';
  }

  private getSupportEmail() {
    return process.env.EMAIL_SUPPORT_EMAIL?.trim() || 'support@fom-platform.local';
  }

  private getWebBaseUrl() {
    return (
      process.env.WEB_APP_BASE_URL?.trim() ||
      process.env.APP_WEB_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
  }
}

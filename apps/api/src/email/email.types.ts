export type EmailTemplateKey =
  | 'auth.welcome'
  | 'auth.verify_email'
  | 'auth.staff_invitation'
  | 'auth.forgot_password'
  | 'auth.password_reset_success'
  | 'platform.invoice_notice'
  | 'platform.trial_notice'
  | 'platform.billing_notice'
  | 'platform.promotion';

export type EmailTemplateRenderInput = {
  templateKey: EmailTemplateKey;
  locale?: string | null;
  variables: Record<string, string | number | boolean | null | undefined>;
};

export type RenderedEmailTemplate = {
  category: string;
  templateKey: EmailTemplateKey;
  subject: string;
  textBody: string;
  htmlBody: string;
};

export type QueueEmailInput = {
  userId?: string | null;
  notificationId?: string | null;
  shopId?: string | null;
  category: string;
  templateKey?: EmailTemplateKey | null;
  toEmail: string;
  recipientName?: string | null;
  fromEmail?: string | null;
  fromName?: string | null;
  replyToEmail?: string | null;
  replyToName?: string | null;
  subject: string;
  textBody: string;
  htmlBody?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type QueueTemplatedEmailInput = Omit<
  QueueEmailInput,
  'category' | 'subject' | 'textBody' | 'htmlBody' | 'templateKey'
> & {
  templateKey: EmailTemplateKey;
  locale?: string | null;
  variables: Record<string, string | number | boolean | null | undefined>;
  category?: string;
};

export type EmailProviderSendInput = {
  messageId: string;
  toEmail: string;
  recipientName?: string | null;
  fromEmail: string;
  fromName?: string | null;
  replyToEmail?: string | null;
  replyToName?: string | null;
  subject: string;
  textBody: string;
  htmlBody?: string | null;
};

export type EmailProviderSendResult = {
  providerKey: string;
  providerMessageId: string | null;
  status: 'sent' | 'skipped';
  failureReason?: string | null;
  metadata?: Record<string, unknown> | null;
};

export interface EmailProvider {
  readonly key: string;
  send(message: EmailProviderSendInput): Promise<EmailProviderSendResult>;
}

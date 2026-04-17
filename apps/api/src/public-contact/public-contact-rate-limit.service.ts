import { Injectable } from '@nestjs/common';
import { tooManyRequestsError } from '../common/http/app-http.exception';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

/**
 * In-memory rate limiting for unauthenticated public contact submissions.
 * Keys are scoped (e.g. IP hash, email). For multi-instance deployments,
 * replace with a shared store (Redis) using the same key shape.
 */
@Injectable()
export class PublicContactRateLimitService {
  private readonly buckets = new Map<string, RateLimitBucket>();

  consumeIp(subject: string, options: RateLimitOptions) {
    this.consume('public_contact_ip', subject, options);
  }

  consumeEmail(subject: string, options: RateLimitOptions) {
    this.consume('public_contact_email', subject, options);
  }

  private consume(scope: string, subject: string, options: RateLimitOptions) {
    const normalizedSubject = subject.trim().toLowerCase();
    if (!normalizedSubject) {
      return;
    }

    const key = `${scope}:${normalizedSubject}`;
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      this.compact(now);
      return;
    }

    if (bucket.count >= options.limit) {
      throw tooManyRequestsError(
        'Too many contact requests. Please wait and try again.',
        {
          scope,
          retry_after_seconds: Math.max(
            1,
            Math.ceil((bucket.resetAt - now) / 1000),
          ),
        },
      );
    }

    bucket.count += 1;
    this.buckets.set(key, bucket);
  }

  private compact(now: number) {
    if (this.buckets.size < 1024) {
      return;
    }

    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}

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

@Injectable()
export class AuthRateLimitService {
  private readonly buckets = new Map<string, RateLimitBucket>();

  consume(scope: string, subject: string, options: RateLimitOptions) {
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
        'Too many authentication attempts. Please wait and try again.',
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
    this.compact(now);
  }

  private compact(now: number) {
    if (this.buckets.size < 512) {
      return;
    }

    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}

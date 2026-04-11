import type { ErrorDetail } from '../http/app-http.exception';
import { validationError } from '../http/app-http.exception';

export function assertValid(errors: ErrorDetail[]): void {
  if (errors.length > 0) {
    throw validationError(errors);
  }
}

export function requiredString(
  value: unknown,
  field: string,
  errors: ErrorDetail[],
  label = field,
): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push({
      field,
      errors: [`${humanize(label)} is required`],
    });
    return '';
  }

  return value.trim();
}

export function optionalString(
  value: unknown,
  field: string,
  errors: ErrorDetail[],
  label = field,
): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    errors.push({
      field,
      errors: [`${humanize(label)} must be a string`],
    });
    return undefined;
  }

  return value.trim();
}

export function requiredNumber(
  value: unknown,
  field: string,
  errors: ErrorDetail[],
  options?: { min?: number; integer?: boolean; label?: string },
): number {
  const label = options?.label ?? field;
  const parsed = parseNumber(value);
  if (parsed === null) {
    errors.push({
      field,
      errors: [`${humanize(label)} must be a number`],
    });
    return 0;
  }

  if (options?.integer && !Number.isInteger(parsed)) {
    errors.push({
      field,
      errors: [`${humanize(label)} must be an integer`],
    });
  }

  if (options?.min !== undefined && parsed < options.min) {
    errors.push({
      field,
      errors: [`${humanize(label)} must be at least ${options.min}`],
    });
  }

  return parsed;
}

export function optionalNumber(
  value: unknown,
  field: string,
  errors: ErrorDetail[],
  options?: { min?: number; integer?: boolean; label?: string },
): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return requiredNumber(value, field, errors, options);
}

export function requiredRecord(
  value: unknown,
  field: string,
  errors: ErrorDetail[],
  label = field,
): Record<string, unknown> {
  if (!isRecord(value)) {
    errors.push({
      field,
      errors: [`${humanize(label)} must be an object`],
    });
    return {};
  }

  return value;
}

export function requiredArray(
  value: unknown,
  field: string,
  errors: ErrorDetail[],
  label = field,
): unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push({
      field,
      errors: [`${humanize(label)} must be a non-empty array`],
    });
    return [];
  }

  return value;
}

export function asEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  errors: ErrorDetail[],
  options?: { required?: boolean; label?: string },
): T | undefined {
  const label = options?.label ?? field;

  if (value === undefined || value === null || value === '') {
    if (options?.required) {
      errors.push({
        field,
        errors: [`${humanize(label)} is required`],
      });
    }
    return undefined;
  }

  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    errors.push({
      field,
      errors: [`${humanize(label)} must be one of: ${allowed.join(', ')}`],
    });
    return undefined;
  }

  return value as T;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function humanize(field: string): string {
  return field
    .replaceAll('_', ' ')
    .replaceAll('.', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

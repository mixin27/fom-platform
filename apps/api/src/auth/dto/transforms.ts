import type { TransformFnParams } from 'class-transformer';

export function trimString({ value }: TransformFnParams) {
  return typeof value === 'string' ? value.trim() : value;
}

export function trimLowercaseString({ value }: TransformFnParams) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export function toBoolean({ value }: TransformFnParams) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true;
    }
    if (
      normalized === 'false' ||
      normalized === '0' ||
      normalized === 'no' ||
      normalized.length === 0
    ) {
      return false;
    }
  }

  return value;
}

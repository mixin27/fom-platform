import type { TransformFnParams } from 'class-transformer';

export function trimString({ value }: TransformFnParams) {
  return typeof value === 'string' ? value.trim() : value;
}

export function trimLowercaseString({ value }: TransformFnParams) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

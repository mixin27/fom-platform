import type { PaginationMeta } from '../http/api-result';
import { validationError } from '../http/app-http.exception';

type CursorInput = string | string[] | undefined;
type LimitInput = number | string | string[] | undefined;

export function paginate<T>(
  items: T[],
  limitInput?: LimitInput,
  cursorInput?: CursorInput,
): { items: T[]; pagination: PaginationMeta } {
  const limit = parseLimit(limitInput);
  const cursor = parseCursor(cursorInput);
  const offset = decodeCursor(cursor);
  const pagedItems = items.slice(offset, offset + limit);
  const nextOffset = offset + pagedItems.length;
  const nextCursor =
    nextOffset < items.length ? encodeCursor(nextOffset) : null;

  return {
    items: pagedItems,
    pagination: {
      limit,
      cursor,
      next_cursor: nextCursor,
      total: items.length,
    },
  };
}

function parseLimit(limitInput?: LimitInput): number {
  const raw =
    typeof limitInput === 'string'
      ? limitInput
      : Array.isArray(limitInput)
        ? limitInput[0]
        : limitInput;

  if (raw === undefined) {
    return 20;
  }

  const parsed = typeof raw === 'number' ? raw : Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) {
    throw validationError([
      {
        field: 'limit',
        errors: ['Limit must be an integer between 1 and 100'],
      },
    ]);
  }

  return parsed;
}

function parseCursor(cursorInput?: CursorInput): string | null {
  if (Array.isArray(cursorInput)) {
    return cursorInput[0] ?? null;
  }
  return cursorInput ?? null;
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset)).toString('base64url');
}

function decodeCursor(cursor: string | null): number {
  if (!cursor) {
    return 0;
  }

  try {
    const parsed = Number.parseInt(
      Buffer.from(cursor, 'base64url').toString('utf8'),
      10,
    );
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error('Invalid cursor');
    }
    return parsed;
  } catch {
    throw validationError([
      {
        field: 'cursor',
        errors: ['Cursor is invalid'],
      },
    ]);
  }
}

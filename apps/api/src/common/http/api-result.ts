export interface PaginationMeta {
  limit: number;
  cursor: string | null;
  next_cursor: string | null;
  total: number;
}

export class ApiResult<T> {
  constructor(
    public readonly data: T,
    public readonly meta?: Record<string, unknown>,
  ) {}
}

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiResult<T> {
  return new ApiResult(data, meta);
}

export function paged<T>(
  data: T[],
  pagination: PaginationMeta,
): ApiResult<T[]> {
  return new ApiResult(data, { pagination });
}

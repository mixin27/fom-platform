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

export async function ok<T>(
  data: T | Promise<T>,
  meta?: Record<string, unknown>,
): Promise<ApiResult<Awaited<T>>> {
  return new ApiResult(await data, meta);
}

export function paged<T>(
  data: T[],
  pagination: PaginationMeta,
): ApiResult<T[]> {
  return new ApiResult(data, { pagination });
}

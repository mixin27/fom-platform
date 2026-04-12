type SearchParamsValue = string | string[] | undefined

export type ShopSearchParams = Record<string, SearchParamsValue>

export function getSingleSearchParam(value: SearchParamsValue) {
  return Array.isArray(value) ? value[0] : value
}

export function buildQueryHref(
  pathname: string,
  currentSearchParams: ShopSearchParams,
  updates: Record<string, string | null | undefined>
) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(currentSearchParams)) {
    const normalized = getSingleSearchParam(value)
    if (normalized) {
      query.set(key, normalized)
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      query.delete(key)
      continue
    }

    query.set(key, value)
  }

  const serialized = query.toString()
  return serialized.length > 0 ? `${pathname}?${serialized}` : pathname
}

export function getPreviousCursor(
  cursor: string | null | undefined,
  limit: number
) {
  if (!cursor) {
    return null
  }

  try {
    const currentOffset = Number.parseInt(
      Buffer.from(cursor, "base64url").toString("utf8"),
      10
    )

    if (!Number.isFinite(currentOffset) || currentOffset <= 0) {
      return null
    }

    const previousOffset = Math.max(0, currentOffset - limit)
    return previousOffset > 0
      ? Buffer.from(String(previousOffset)).toString("base64url")
      : null
  } catch {
    return null
  }
}

export function formatCurrency(amount: number | null | undefined, currency = "MMK") {
  if (amount === null || amount === undefined) {
    return "—"
  }

  return `${amount.toLocaleString()} ${currency}`
}

export function formatCompactNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—"
  }

  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value)
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—"
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatRelativeDate(value: string | null | undefined) {
  if (!value) {
    return "—"
  }

  const target = new Date(value).getTime()
  const diffMs = Date.now() - target
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) {
    return "Just now"
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} hr ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  }

  return formatDate(value)
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

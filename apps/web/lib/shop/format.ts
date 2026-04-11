export function formatCodeLabel(value: string | null | undefined) {
  if (!value) {
    return "—"
  }

  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export function formatList(items: string[], emptyLabel = "—") {
  if (items.length === 0) {
    return emptyLabel
  }

  return items.join(", ")
}

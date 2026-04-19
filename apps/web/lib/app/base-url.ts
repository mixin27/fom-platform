import "server-only"

export function getConfiguredAppBaseUrl() {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() ||
    process.env.WEB_APP_BASE_URL?.trim() ||
    null

  if (configuredBaseUrl) {
    try {
      return new URL(configuredBaseUrl)
    } catch {
      // Fall through to request-derived origin.
    }
  }

  return null
}

export function buildAppUrl(pathname: string, requestUrl?: string) {
  const configuredBaseUrl = getConfiguredAppBaseUrl()
  if (configuredBaseUrl) {
    return new URL(pathname, configuredBaseUrl)
  }

  if (requestUrl) {
    return new URL(pathname, requestUrl)
  }

  return new URL(pathname, "http://localhost:3000")
}

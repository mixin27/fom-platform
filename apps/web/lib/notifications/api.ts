import "server-only"

import { type ApiSuccess } from "@/lib/auth/api"
import { requestAuthenticatedApiEnvelope } from "@/lib/auth/request"

type SearchParamsValue = string | string[] | undefined
type SearchParamsRecord = Record<string, SearchParamsValue>
type NotificationAccessScope = "platform" | "shop"

export type NotificationCursorPagination = {
  limit: number
  cursor: string | null
  next_cursor: string | null
  total: number
}

export type PortalNotification = {
  id: string
  user_id: string
  shop_id: string | null
  shop_name: string | null
  category: string
  title: string
  body: string
  action_type: string | null
  action_target: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export type NotificationPreference = {
  id: string | null
  user_id: string
  category: string
  label: string
  description: string | null
  in_app_enabled: boolean
  email_enabled: boolean
  updated_at: string | null
}

function buildQueryString(searchParams?: SearchParamsRecord) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          query.append(key, item)
        }
      }
      continue
    }

    if (value) {
      query.set(key, value)
    }
  }

  const serialized = query.toString()
  return serialized.length > 0 ? `?${serialized}` : ""
}

async function notificationsRequest<T>(
  path: string,
  requiredAccess: NotificationAccessScope,
  retryPath: string,
  searchParams?: SearchParamsRecord
): Promise<ApiSuccess<T>> {
  return requestAuthenticatedApiEnvelope<T>({
    path: `${path}${buildQueryString(searchParams)}`,
    retryPath,
    requiredAccess,
  })
}

export async function getPortalNotifications(input: {
  requiredAccess: NotificationAccessScope
  retryPath: string
  searchParams?: SearchParamsRecord
}) {
  return notificationsRequest<Array<PortalNotification>>(
    "/api/v1/notifications",
    input.requiredAccess,
    input.retryPath,
    input.searchParams
  )
}

export async function getNotificationUnreadCount(input: {
  requiredAccess: NotificationAccessScope
  retryPath: string
  searchParams?: SearchParamsRecord
}) {
  return notificationsRequest<{
    unread_count: number
  }>(
    "/api/v1/notifications/unread-count",
    input.requiredAccess,
    input.retryPath,
    input.searchParams
  )
}

export async function getNotificationPreferences(input: {
  requiredAccess: NotificationAccessScope
  retryPath: string
}) {
  return notificationsRequest<{
    preferences: NotificationPreference[]
  }>(
    "/api/v1/notification-preferences",
    input.requiredAccess,
    input.retryPath
  )
}

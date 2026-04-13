"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

type PortalRealtimeBellButtonProps = {
  href: string
  initialUnreadCount: number
  scope: "platform" | "shop"
  shopId?: string
  surfaceClassName?: string
}

type TicketEnvelope = {
  success: true
  data: {
    ticket: string
    expires_at: string
    websocket_url: string
  }
}

type RealtimePayload = {
  type?: string
  scope?: "platform" | "shop"
  shop_id?: string | null
  unread_count?: number
  notification?: {
    title: string
    body: string
  }
  resource?: string
}

export function PortalRealtimeBellButton({
  href,
  initialUnreadCount,
  scope,
  shopId,
  surfaceClassName = "bg-[var(--fom-portal-surface)]",
}: PortalRealtimeBellButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const reconnectTimerRef = useRef<number | null>(null)
  const refreshTimerRef = useRef<number | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const isDisposedRef = useRef(false)

  useEffect(() => {
    setUnreadCount(initialUnreadCount)
  }, [initialUnreadCount])

  useEffect(() => {
    isDisposedRef.current = false

    async function connect() {
      try {
        const query = new URLSearchParams({
          scope,
          ...(scope === "shop" && shopId ? { shop_id: shopId } : {}),
        })
        const response = await fetch(`/api/realtime-ticket?${query.toString()}`, {
          cache: "no-store",
        })
        const payload = (await response.json()) as TicketEnvelope | { success: false }
        if (!response.ok || !("success" in payload) || payload.success !== true) {
          scheduleReconnect()
          return
        }

        const url = new URL(payload.data.websocket_url)
        url.searchParams.set("ticket", payload.data.ticket)

        const socket = new WebSocket(url)
        socketRef.current = socket

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as RealtimePayload
            handleRealtimeMessage(message)
          } catch {
            return
          }
        }

        socket.onclose = () => {
          socketRef.current = null
          scheduleReconnect()
        }

        socket.onerror = () => {
          socket.close()
        }
      } catch {
        scheduleReconnect()
      }
    }

    function scheduleReconnect() {
      if (isDisposedRef.current || reconnectTimerRef.current !== null) {
        return
      }

      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null
        void connect()
      }, 3000)
    }

    function handleRealtimeMessage(message: RealtimePayload) {
      if (
        scope === "shop" &&
        shopId &&
        message.scope === "shop" &&
        message.shop_id !== shopId
      ) {
        return
      }

      if (
        (message.type === "notification.created" || message.type === "notification.read") &&
        typeof message.unread_count === "number"
      ) {
        setUnreadCount(message.unread_count)
      }

      if (message.type === "notification.created" && message.notification) {
        maybeShowBrowserNotification(message.notification.title, message.notification.body)
      }

      if (message.type === "data.invalidate") {
        scheduleRefresh()
      }

      if (
        (message.type === "notification.created" || message.type === "notification.read") &&
        pathname &&
        pathname.includes("/notifications")
      ) {
        scheduleRefresh()
      }
    }

    function scheduleRefresh() {
      if (refreshTimerRef.current !== null) {
        return
      }

      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null
        router.refresh()
      }, 350)
    }

    function maybeShowBrowserNotification(title: string, body: string) {
      if (typeof window === "undefined" || typeof Notification === "undefined") {
        return
      }

      if (document.visibilityState === "visible") {
        return
      }

      if (Notification.permission === "granted") {
        new Notification(title, { body })
      }
    }

    void connect()

    return () => {
      isDisposedRef.current = true
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
      }
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current)
      }
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [pathname, router, scope, shopId])

  return (
    <Button
      asChild
      variant="outline"
      size="icon"
      className={`relative size-8 rounded-xl border-[var(--fom-border-strong)] ${surfaceClassName} text-muted-foreground`}
    >
      <Link href={href}>
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--fom-orange)] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Link>
    </Button>
  )
}

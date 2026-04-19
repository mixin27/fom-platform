"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import {
  platformPortalNav,
  shopPortalNav,
  type NavSection,
} from "@/lib/navigation"

interface PortalBreadcrumbProps {
  mode: "platform" | "shop"
}

export function PortalBreadcrumb({ mode }: PortalBreadcrumbProps) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const navSections = mode === "platform" ? platformPortalNav : shopPortalNav
  const rootLabel = mode === "platform" ? "Admin Portal" : "Shop Portal"
  const rootHref = mode === "platform" ? "/platform" : "/dashboard"

  // Function to find label for a path
  const getLabel = (path: string, segment: string) => {
    // Check in navigation config
    for (const section of navSections) {
      const item = section.items.find((i) => i.href === path)
      if (item) return item.label
    }

    // Fallback: capitalize segment
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
  }

  const breadcrumbs = React.useMemo(() => {
    const items = []

    // Always add the root
    items.push({
      label: rootLabel,
      href: rootHref,
      isPage: pathname === rootHref,
    })

    let currentPath = ""

    // segments[0] is always "platform" or "dashboard" in these layouts
    // So we iterate from the second segment onwards
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i]!
      currentPath = `/${segments.slice(0, i + 1).join("/")}`

      items.push({
        label: getLabel(currentPath, segment),
        href: currentPath,
        isPage: i === segments.length - 1,
      })
    }

    return items
  }, [pathname, mode, rootLabel, rootHref, segments])

  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.href}>
            <BreadcrumbItem>
              {item.isPage ? (
                <BreadcrumbPage className="text-[13px] font-medium">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    href={item.href}
                    className="text-[12px] text-muted-foreground"
                  >
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

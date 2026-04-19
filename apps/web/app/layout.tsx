import type { Metadata } from "next"
import {
  DM_Sans,
  DM_Serif_Display,
  Noto_Sans_Myanmar,
  Plus_Jakarta_Sans,
} from "next/font/google"

import "@workspace/ui/globals.css"
import "./app.css"
import { AppProviders } from "@/features/core/providers/app-providers"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-web-sans",
})

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-web-heading",
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-web-admin",
})

const notoSansMyanmar = Noto_Sans_Myanmar({
  subsets: ["myanmar"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-web-myanmar",
})

const metadataBase = (() => {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() ||
    process.env.WEB_APP_BASE_URL?.trim() ||
    "http://localhost:3000"

  try {
    return new URL(rawBaseUrl)
  } catch {
    return new URL("http://localhost:3000")
  }
})()

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "FOM Order Manager",
    template: "%s | FOM Order Manager",
  },
  description:
    "Order management for Facebook-first shops: capture Messenger orders, track deliveries, manage customers, and run each shop with simple monthly or yearly pricing.",
  icons: {
    icon: [
      {
        url: "/brand/png/favicon-16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/brand/png/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/brand/png/favicon.png",
        sizes: "64x64",
        type: "image/png",
      },
    ],
    shortcut: [
      {
        url: "/brand/png/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/brand/png/apple-touch-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "FOM Order Manager",
    description:
      "Order management for Facebook-first shops: capture Messenger orders, track deliveries, manage customers, and run each shop with simple monthly or yearly pricing.",
    images: [
      {
        url: "/brand/png/og-image-1200x630.png",
        width: 1200,
        height: 630,
        alt: "FOM Order Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/png/og-image-1200x630.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${dmSerifDisplay.variable} ${plusJakartaSans.variable} ${notoSansMyanmar.variable} antialiased`}
    >
      <body className="theme-fom-web">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}

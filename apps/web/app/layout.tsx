import type { Metadata } from "next"
import {
  DM_Sans,
  DM_Serif_Display,
  Noto_Sans_Myanmar,
  Plus_Jakarta_Sans,
} from "next/font/google"

import "@workspace/ui/globals.css"
import "./app.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { Toaster } from "@workspace/ui/components/sonner"

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

export const metadata: Metadata = {
  title: {
    default: "FOM Platform",
    template: "%s | FOM Platform",
  },
  description:
    "Web surfaces for the FOM SaaS platform: landing page, platform admin console, and shop owner workspace.",
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
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

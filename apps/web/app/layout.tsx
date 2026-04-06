import type { Metadata } from "next"

import "@workspace/ui/globals.css"
import "./app.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { Toaster } from "@workspace/ui/components/sonner"

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
    <html lang="en" suppressHydrationWarning className="antialiased font-sans">
      <body className="theme-fom-web">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

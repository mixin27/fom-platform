import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "FOM Docs",
    template: "%s | FOM Docs",
  },
  description:
    "Internal product, implementation, and API documentation for FOM Order Manager.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="theme-fom-docs">{children}</body>
    </html>
  )
}

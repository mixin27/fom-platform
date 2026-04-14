import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Footer } from '@/components/navigation/footer'
import { Navbar } from '@/components/navigation/navbar'
import { Providers } from '@/providers'
import { Settings } from '@/types/settings'

import '@/styles/globals.css'

const docsSans = localFont({
  variable: '--font-docs-sans',
  display: 'swap',
  src: [
    {
      path: '../../mobile/packages/app_ui_kit/assets/fonts/Nunito/Nunito-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../mobile/packages/app_ui_kit/assets/fonts/Nunito/Nunito-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../mobile/packages/app_ui_kit/assets/fonts/Nunito/Nunito-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../mobile/packages/app_ui_kit/assets/fonts/Nunito/Nunito-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
})

const docsHeading = localFont({
  variable: '--font-docs-heading',
  display: 'swap',
  src: [
    {
      path: '../../mobile/packages/app_ui_kit/assets/fonts/Nunito/Nunito-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../mobile/packages/app_ui_kit/assets/fonts/Nunito/Nunito-Black.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
})

const baseUrl = Settings.metadataBase

export const metadata: Metadata = {
  title: Settings.title,
  metadataBase: new URL(baseUrl),
  description: Settings.description,
  keywords: Settings.keywords,
  openGraph: {
    type: Settings.openGraph.type,
    url: baseUrl,
    title: Settings.openGraph.title,
    description: Settings.openGraph.description,
    siteName: Settings.openGraph.siteName,
    images: Settings.openGraph.images.map((image) => ({
      ...image,
      url: `${baseUrl}${image.url}`,
    })),
  },
  twitter: {
    card: Settings.twitter.card,
    title: Settings.twitter.title,
    description: Settings.twitter.description,
    site: Settings.twitter.site,
    images: Settings.twitter.images.map((image) => ({
      ...image,
      url: `${baseUrl}${image.url}`,
    })),
  },
  publisher: Settings.name,
  alternates: {
    canonical: baseUrl,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="en" suppressHydrationWarning>
      <body className={`${docsSans.variable} ${docsHeading.variable} antialiased`}>
        <Providers>
          <Navbar />
          <main className="h-auto px-5 sm:px-8">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

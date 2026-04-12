import type { Metadata } from "next"
import {
  DM_Sans,
  DM_Serif_Display,
  Noto_Sans_Myanmar,
  Plus_Jakarta_Sans,
} from "next/font/google"
import { Footer, Layout, Navbar } from "nextra-theme-docs"
import { Head } from "nextra/components"
import { getPageMap } from "nextra/page-map"
import config from "../../../theme.config"
import "nextra-theme-docs/style.css"
import "@workspace/ui/globals.css"
import "./docs.css"

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
    template: "%s | FOM Docs",
    default: "FOM Order Manager Documentation",
  },
  description:
    "Official documentation for FOM Order Manager - Built for Myanmar Facebook Sellers.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pageMap = await getPageMap()

  return (
    <html
      lang="my"
      dir="ltr"
      suppressHydrationWarning
      className={`${dmSans.variable} ${dmSerifDisplay.variable} ${plusJakartaSans.variable} ${notoSansMyanmar.variable} antialiased`}
    >
      <Head />
      <body className="theme-fom-web bg-[var(--fom-marketing-bg)] text-[var(--fom-marketing-fg)] transition-colors duration-300">
        <Layout
          navbar={
            <Navbar logo={config.logo} projectLink={config.project.link} />
          }
          footer={
            <Footer>
              <div className="flex flex-col gap-2">
                {config.footer.text}
                <p className="font-myanmar text-xs text-muted-foreground">
                  မြန်မာနိုင်ငံရှိ Facebook တစ်ဆင့်ရောင်းချသူများအတွက်
                  အထူးထုတ်လုပ်ထားပါသည်။
                </p>
              </div>
            </Footer>
          }
          pageMap={pageMap}
          docsRepositoryBase={config.docsRepositoryBase}
          //   i18n={config.i18n}
          nextThemes={{ defaultTheme: "system" }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}

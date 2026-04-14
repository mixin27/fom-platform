import { Card, CardGrid } from '@/components/markdown/card'
import { buttonVariants } from '@/components/ui/button'
import { PageRoutes } from '@/lib/pageroutes'
import { Link } from '@/lib/transition'

export default function Home() {
  const firstRoute = PageRoutes[0]?.href || '/getting-started'

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8.5rem)] w-full max-w-6xl flex-col gap-12 py-12 sm:py-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 px-6 py-10 shadow-[0_30px_120px_rgba(15,23,34,0.08)] sm:px-10 sm:py-14">
        <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgba(244,98,42,0.22),transparent_42%),radial-gradient(circle_at_top_right,rgba(30,158,150,0.18),transparent_36%)]" />
        <div className="relative flex flex-col gap-6">
          <div className="inline-flex w-fit items-center rounded-full border border-border bg-background/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            FOM Platform Documentation
          </div>
          <div className="max-w-4xl space-y-5">
            <h1 className="font-[var(--font-docs-heading)] text-5xl leading-none tracking-tight text-foreground sm:text-7xl">
              Operating guides now. Integration docs next.
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              Use this documentation site for daily shop workflows, platform reference, and the
              evolving API surface for future third-party integrations.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/docs${firstRoute}`}
              className={buttonVariants({ className: 'px-6', size: 'lg' })}
            >
              Browse the Docs
            </Link>
            <Link
              href="/docs/api-integrations"
              className={buttonVariants({
                className: 'px-6',
                size: 'lg',
                variant: 'outline',
              })}
            >
              View API Coverage
            </Link>
          </div>
          <div className="grid gap-4 pt-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/80 bg-background/80 p-4">
              <p className="text-sm font-semibold text-foreground">User Manual</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Shop-owner guidance for orders, customers, deliveries, billing, and everyday
                operations.
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-background/80 p-4">
              <p className="text-sm font-semibold text-foreground">API & Integrations</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The current backend surface plus the direction for future partner integrations.
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-background/80 p-4">
              <p className="text-sm font-semibold text-foreground">Platform Reference</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Product scope, architecture, roadmap, and security context from the existing repo
                documentation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Explore
          </p>
          <h2 className="font-[var(--font-docs-heading)] text-3xl text-foreground sm:text-4xl">
            Start with the section that matches the work you need to do.
          </h2>
        </div>
        <CardGrid>
          <Card
            title="User Manual"
            description="Learn the current operator workflow across order intake, customer handling, deliveries, exports, roles, and billing."
            href="/docs/user-manual"
          />
          <Card
            title="API & Integrations"
            description="Review the current API reference and see how the future third-party integration surface is being framed."
            href="/docs/api-integrations"
          />
          <Card
            title="Platform Reference"
            description="Go deeper into product goals, technical architecture, roadmap, feature planning, and security assumptions."
            href="/docs/platform-reference"
          />
        </CardGrid>
      </section>
    </div>
  )
}

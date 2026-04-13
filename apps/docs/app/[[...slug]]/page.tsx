import Link from "next/link"
import { ArrowRight, BookOpenText } from "lucide-react"
import { notFound } from "next/navigation"

import { docsSections, getDocsSection } from "@/lib/content"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type DocsPageProps = {
  params: Promise<{
    slug?: string[]
  }>
}

export default async function DocsPage({ params }: DocsPageProps) {
  const slug = (await params).slug ?? []
  const sectionId = slug[0] ?? "overview"
  const section = getDocsSection(sectionId)

  if (!section) {
    notFound()
  }

  return (
    <div className="docs-shell">
      <div className="mx-auto grid min-h-screen w-full max-w-[1380px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-[var(--docs-sidebar-border)] bg-[var(--docs-sidebar)] px-5 py-6 text-white">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/50">
              FOM Docs
            </p>
            <h1 className="mt-2 text-xl font-semibold text-white">
              Implementation handbook
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Internal product, API, and workspace documentation for the current launch phase.
            </p>
          </div>

          <nav className="mt-6 flex flex-col gap-1">
            {docsSections.map((entry) => {
              const isActive = entry.id === section.id

              return (
                <Link
                  key={entry.id}
                  href={entry.id === "overview" ? "/" : `/${entry.id}`}
                  className={
                    isActive
                      ? "rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white"
                      : "rounded-xl px-3 py-2.5 text-sm font-medium text-white/62 hover:bg-white/8 hover:text-white"
                  }
                >
                  {entry.title}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="px-6 py-8 lg:px-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Badge className="w-fit border border-[rgba(249,122,31,0.18)] bg-[rgba(249,122,31,0.08)] text-[var(--fom-orange)] hover:bg-[rgba(249,122,31,0.08)]">
                Documentation
              </Badge>
              <div>
                <h1 className="text-[2.4rem] leading-tight font-semibold tracking-[-0.04em] text-slate-950">
                  {section.title}
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                  {section.summary}
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-4">
                {section.content.map((block) => (
                  <Card key={block.heading} className="border border-[var(--docs-border)] bg-[var(--docs-card)] shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <BookOpenText className="size-5 text-[var(--fom-orange)]" />
                        {block.heading}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      {block.paragraphs.map((paragraph) => (
                        <p
                          key={paragraph}
                          className="text-sm leading-7 text-slate-700"
                        >
                          {paragraph}
                        </p>
                      ))}
                      {block.bullets ? (
                        <div className="space-y-2">
                          {block.bullets.map((bullet) => (
                            <div
                              key={bullet}
                              className="flex items-start gap-2 rounded-xl border border-[var(--docs-border)] bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                            >
                              <ArrowRight className="mt-0.5 size-4 text-[var(--fom-orange)]" />
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="h-fit border border-[var(--docs-border)] bg-[var(--docs-card)] shadow-none">
                <CardHeader className="pb-3">
                  <CardDescription>In this section</CardDescription>
                  <CardTitle>Quick navigation</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 pt-0">
                  {section.content.map((block) => (
                    <div
                      key={block.heading}
                      className="rounded-xl border border-[var(--docs-border)] bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                    >
                      {block.heading}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

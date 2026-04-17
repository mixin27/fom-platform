import type { ReactNode } from "react"

type LegalDocumentProps = {
  eyebrow?: string
  title: string
  description?: ReactNode
  children: ReactNode
}

export function LegalDocument({
  eyebrow = "Legal",
  title,
  description,
  children,
}: LegalDocumentProps) {
  return (
    <article className="mx-auto w-full max-w-2xl px-6 py-14 sm:py-16">
      <header className="mb-10 border-b border-[var(--fom-border-subtle)] pb-8 sm:mb-12 sm:pb-10">
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--fom-orange)] uppercase">
          {eyebrow}
        </p>
        <h1 className="fom-display mt-2 text-3xl text-[var(--fom-ink)] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <div className="mt-4 max-w-prose text-base leading-8 text-[var(--fom-slate)]">
            {description}
          </div>
        ) : null}
      </header>
      <div className="flex flex-col gap-10 sm:gap-12 [&_a:not(.legal-skip)]:font-semibold [&_a:not(.legal-skip)]:text-[var(--fom-orange)] [&_a:not(.legal-skip)]:underline [&_a:not(.legal-skip)]:underline-offset-4">
        {children}
      </div>
    </article>
  )
}

type LegalSectionProps = {
  id?: string
  title: string
  children: ReactNode
}

export function LegalSection({ id, title, children }: LegalSectionProps) {
  const sectionId = id ?? slugifyHeading(title)
  return (
    <section aria-labelledby={sectionId} className="scroll-mt-20">
      <h2
        id={sectionId}
        className="fom-display text-lg font-semibold tracking-tight text-[var(--fom-ink)] sm:text-xl"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-[var(--fom-slate)] [&_strong]:font-semibold [&_strong]:text-[var(--fom-ink)] [&_ul]:mt-1 [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:marker:text-[var(--fom-slate)]/80">
        {children}
      </div>
    </section>
  )
}

type LegalDocumentFooterProps = {
  title: string
  children: ReactNode
}

export function LegalDocumentFooter({ title, children }: LegalDocumentFooterProps) {
  return (
    <footer className="mt-2 border-t border-[var(--fom-border-subtle)] pt-10">
      <h2 className="fom-display text-lg font-semibold text-[var(--fom-ink)]">
        {title}
      </h2>
      <div className="mt-4 text-[15px] leading-7 text-[var(--fom-slate)]">{children}</div>
    </footer>
  )
}

function slugifyHeading(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\u00C0-\u024f]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "section"
  )
}

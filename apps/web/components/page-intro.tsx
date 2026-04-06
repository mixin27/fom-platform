import type { ReactNode } from "react"

type PageIntroProps = {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: PageIntroProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-2xl flex-col gap-2">
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
          {title}
        </h1>
        <p className="text-sm leading-7 text-muted-foreground md:text-base">
          {description}
        </p>
      </div>
      {actions}
    </div>
  )
}

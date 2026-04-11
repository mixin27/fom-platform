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
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="flex max-w-3xl flex-col gap-1.5">
        {eyebrow ? (
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.04em] text-foreground md:text-[2.35rem]">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {actions}
    </div>
  )
}

import { Fragment } from 'react'
import { LuHouse } from 'react-icons/lu'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { PageRoutes } from '@/lib/pageroutes'
import { Link } from '@/lib/transition'
import { toTitleCase } from '@/utils/toTitleCase'

export function ArticleBreadcrumb({ paths }: { paths: string[] }) {
  const firstRoute = PageRoutes[0]?.href || '/getting-started'
  const firstSegment = paths[0] || 'docs'

  return (
    <Breadcrumb className="pb-5">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              title="Documentation Home"
              aria-label="Documentation Home"
              href={`/docs${firstRoute}`}
            >
              <LuHouse className="h-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {paths.length > 2 ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  title={toTitleCase(firstSegment)}
                  aria-label={toTitleCase(firstSegment)}
                  href={`/docs/${firstSegment}`}
                >
                  {toTitleCase(firstSegment)}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis className="h-1" />
            </BreadcrumbItem>

            {paths.slice(-1).map((path, i) => {
              const index = paths.length - 1 + i
              const href = `/docs/${paths.slice(0, index + 1).join('/')}`

              return (
                <Fragment key={path}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {index < paths.length - 1 ? (
                      <BreadcrumbLink asChild>
                        <Link title={toTitleCase(path)} aria-label={toTitleCase(path)} href={href}>
                          {toTitleCase(path)}
                        </Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="b">{toTitleCase(path)}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              )
            })}
          </>
        ) : (
          paths.map((path, index) => {
            const href = `/docs/${paths.slice(0, index + 1).join('/')}`

            return (
              <Fragment key={path}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index < paths.length - 1 ? (
                    <BreadcrumbLink asChild>
                      <Link title={toTitleCase(path)} aria-label={toTitleCase(path)} href={href}>
                        {toTitleCase(path)}
                      </Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="b">{toTitleCase(path)}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            )
          })
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

import Link from 'next/link'
import { GitHubLink } from '@/settings/navigation'

import { Settings } from '@/types/settings'

export function Footer() {
  return (
    <footer className="flex w-full flex-wrap items-center justify-center gap-3 border-t px-2 py-4 text-sm text-foreground sm:justify-between sm:px-4 lg:px-8">
      <p>
        &copy; {new Date().getFullYear()}{' '}
        <Link
          title={Settings.name}
          aria-label={Settings.name}
          className="font-semibold"
          href={Settings.link}
        >
          {Settings.name}
        </Link>
        . Documentation for Facebook-first shops.
      </p>
      <Link
        className="font-semibold text-muted-foreground transition-colors hover:text-foreground"
        href={GitHubLink.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        View source
      </Link>
    </footer>
  )
}

import Image from 'next/image'
import { Link } from '@/lib/transition'

import { Settings } from '@/types/settings'

export const Logo = () => {
  return (
    <Link
      href="/"
      title={`${Settings.title} main logo`}
      aria-label={`${Settings.title} main logo`}
      className="hidden items-center gap-3 md:flex"
    >
      <Image
        src={Settings.siteicon}
        alt={`${Settings.title} main logo`}
        title={`${Settings.title} main logo`}
        aria-label={`${Settings.title} main logo`}
        width={36}
        height={36}
        loading="lazy"
        decoding="async"
        className="rounded-xl shadow-[0_10px_30px_rgba(244,98,42,0.18)]"
      />
      <span className="text-md font-semibold tracking-tight">{Settings.title}</span>
    </Link>
  )
}

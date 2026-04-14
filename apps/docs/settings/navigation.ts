import { PageRoutes } from '@/lib/pageroutes'

const firstRoute = PageRoutes[0]?.href || '/getting-started'

export const Navigations = [
  {
    title: 'Docs',
    href: `/docs${firstRoute}`,
  },
  {
    title: 'User Manual',
    href: '/docs/user-manual',
  },
  {
    title: 'API',
    href: '/docs/api-integrations',
  },
  {
    title: 'Website',
    href: 'https://getfom.com',
    external: true,
  },
]

export const GitHubLink = {
  href: 'https://github.com/mixin27/fom-platform',
}

import { Paths } from '@/lib/pageroutes'

export const Documents: Paths[] = [
  {
    heading: 'Start Here',
    title: 'Getting Started',
    href: '/getting-started',
  },
  {
    spacer: true,
  },
  {
    heading: 'Guides',
    title: 'User Manual',
    href: '/user-manual',
    items: [
      {
        title: 'Orders & Daily Workflow',
        href: '/orders',
      },
      {
        title: 'Customers, Deliveries & Exports',
        href: '/customers-deliveries',
      },
      {
        title: 'Team Access & Billing',
        href: '/team-billing',
      },
    ],
  },
  {
    title: 'API & Integrations',
    href: '/api-integrations',
    items: [
      {
        title: 'Messenger Integration',
        href: '/messenger-integration',
      },
      {
        title: 'Backend API Endpoints',
        href: '/backend-endpoints',
      },
      {
        title: 'Response Envelope',
        href: '/response-envelope',
      },
    ],
  },
  {
    spacer: true,
  },
  {
    heading: 'Reference',
    title: 'Platform Reference',
    href: '/platform-reference',
    items: [
      {
        title: 'Product Overview',
        href: '/product-overview',
      },
      {
        title: 'Feature Set',
        href: '/features',
      },
      {
        title: 'Architecture',
        href: '/architecture',
      },
      {
        title: 'Roadmap',
        href: '/roadmap',
      },
      {
        title: 'Security & Privacy',
        href: '/security-privacy',
      },
    ],
  },
]

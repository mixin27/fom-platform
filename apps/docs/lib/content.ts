export type DocsSection = {
  id: string
  title: string
  summary: string
  content: Array<{
    heading: string
    paragraphs: string[]
    bullets?: string[]
  }>
}

export const docsSections: DocsSection[] = [
  {
    id: "overview",
    title: "Overview",
    summary: "What ships in phase one and how the product is structured today.",
    content: [
      {
        heading: "Current product scope",
        paragraphs: [
          "FOM Order Manager launches as an operational workspace for Facebook-first shops. The current release covers orders, customers, deliveries, templates, summaries, billing visibility, notifications, and RBAC-backed staff access.",
          "The launch catalog intentionally stays narrower than the future enterprise positioning document. Phase one focuses on one-shop subscriptions, strong day-to-day operations, and self-serve onboarding with a free trial.",
        ],
      },
      {
        heading: "Applications in the monorepo",
        paragraphs: [
          "The monorepo contains a NestJS API, a Next.js web app, a Flutter mobile app, and this docs app.",
        ],
        bullets: [
          "apps/api: authentication, RBAC, subscriptions, exports, and operational APIs",
          "apps/web: marketing site plus platform-owner and shop-owner portals",
          "apps/mobile: shop-owner operational mobile experience",
          "apps/docs: implementation and product documentation",
        ],
      },
    ],
  },
  {
    id: "subscription-guards",
    title: "Subscription Guards",
    summary: "How plan items, feature codes, and runtime access enforcement work.",
    content: [
      {
        heading: "Stable feature codes",
        paragraphs: [
          "Plan items are now more than marketing bullets. Each item carries a stable feature code such as orders.management, team.members, or exports.csv so backend guards can enforce real capabilities even if the display label changes later.",
        ],
        bullets: [
          "Core operational routes are mapped to feature codes",
          "Export routes require exports.csv",
          "Member exports require both exports.csv and team.members",
          "Future enterprise features already have reserved codes for later plans",
        ],
      },
      {
        heading: "Subscription status rules",
        paragraphs: [
          "Operational access is currently allowed for trialing, active, and overdue subscriptions. Expired, cancelled, and inactive subscriptions are blocked from plan-gated operational features.",
          "Billing and account recovery routes remain reachable so a shop can still inspect billing state and recover access.",
        ],
      },
    ],
  },
  {
    id: "exports",
    title: "Exports",
    summary: "CSV export coverage across API, web, and mobile.",
    content: [
      {
        heading: "Backend export endpoints",
        paragraphs: [
          "Shop export routes provide CSV downloads for orders, customers, deliveries, and staffs. Platform export routes provide CSV downloads for shops, users, subscriptions, and invoices.",
        ],
      },
      {
        heading: "Portal integration",
        paragraphs: [
          "Both web portals include dedicated Exports pages that proxy authenticated CSV downloads through route handlers. The shop portal reads the active plan item set and disables export actions when the current subscription does not allow them.",
          "The mobile app includes a dedicated exports page under Settings and saves CSV files into the local application documents directory.",
        ],
      },
    ],
  },
  {
    id: "api",
    title: "API Surface",
    summary: "High-level guide to the main backend domains.",
    content: [
      {
        heading: "Core domains",
        paragraphs: [
          "The API is organized around auth, shops, customers, orders, deliveries, templates, summaries, notifications, platform workspace, billing, and exports.",
          "JWT access tokens carry platform and shop-scoped RBAC claims for client-side access decisions, while backend guards remain the source of truth for all protected actions.",
        ],
      },
      {
        heading: "Response conventions",
        paragraphs: [
          "JSON APIs use the common success/error envelope and include request metadata such as request IDs. CSV export routes are raw file responses and bypass the envelope for download compatibility.",
        ],
      },
    ],
  },
  {
    id: "portals",
    title: "Web Portals",
    summary: "Structure of the marketing site and the two operational web workspaces.",
    content: [
      {
        heading: "Portal split",
        paragraphs: [
          "The web app contains three experiences: the public landing page, the internal platform-owner workspace, and the shop-owner workspace.",
          "Shop and platform portals each use their own navigation shell, data layer, and route hierarchy. Export pages live inside those portal route trees rather than as ad-hoc dialogs.",
        ],
      },
    ],
  },
  {
    id: "mobile",
    title: "Mobile App",
    summary: "Current mobile scope and the export implementation.",
    content: [
      {
        heading: "Current mobile coverage",
        paragraphs: [
          "The mobile app covers authentication, shop selection, orders, customers, reports, notifications, and settings for the active shop.",
          "CSV export is exposed from Settings so the owner can save operational records for the active shop without going through the web portal.",
        ],
      },
    ],
  },
]

export function getDocsSection(id?: string) {
  return docsSections.find((section) => section.id === (id || "overview")) ?? null
}

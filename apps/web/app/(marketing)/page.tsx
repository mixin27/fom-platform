import Link from "next/link"
import {
  ArrowRight,
  Check,
  ScanSearch,
  Search,
  Store,
  Truck,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const problemCards = [
  {
    title: "Messenger chaos",
    description:
      "Important customer details disappear into long chat threads and rushed follow-up.",
  },
  {
    title: "Manual status tracking",
    description:
      "Teams bounce between notebooks, spreadsheets, and chat to know what is delivered.",
  },
  {
    title: "No daily visibility",
    description:
      "Owners finish the day without a clear summary of revenue, pending orders, or delivery rate.",
  },
  {
    title: "Customer memory only",
    description:
      "Repeat buyers, frequent phones, and address history live in someone's head instead of the system.",
  },
]

const featureCards = [
  {
    title: "Paste from Messenger",
    description:
      "Copy a customer's message, paste into the app, and fields auto-fill. No retyping, fewer mistakes, and faster order entry.",
    icon: ScanSearch,
  },
  {
    title: "One-tap status updates",
    description:
      "New to confirmed to shipping to delivered. Keep the whole day moving without digging through multiple tools.",
    icon: Truck,
  },
  {
    title: "Daily revenue summary",
    description:
      "See today's order count, revenue, and delivery rate in one clean screen made for shop owners.",
    icon: Store,
  },
  {
    title: "Smart search and customer memory",
    description:
      "Find by name, phone, or product and keep lightweight customer history attached to every order.",
    icon: Search,
  },
]

const workflowSteps = [
  {
    title: "Create your shop",
    body: "Set up your workspace quickly and start capturing orders without technical onboarding.",
  },
  {
    title: "Get an order on Messenger",
    body: "Customers continue messaging you the same way they already do on Facebook.",
  },
  {
    title: "Add it in seconds",
    body: "Paste chat or type the details, then save and move on to the next customer.",
  },
  {
    title: "Track until delivered",
    body: "Keep delivery and status updates moving until the order is fully completed.",
  },
]

const pricingCards = [
  {
    name: "Starter",
    price: "5,000",
    detail: "For smaller shops getting started",
    features: [
      "Up to 200 orders per month",
      "Full order management",
      "Customer profiles",
      "Daily summary",
    ],
    cta: "Get started",
    featured: false,
  },
  {
    name: "Professional",
    price: "10,000",
    detail: "For growing Facebook-first shops",
    features: [
      "Unlimited orders",
      "Weekly and monthly reports",
      "Message templates",
      "Advanced search and filters",
    ],
    cta: "Start 7-day free trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Let's talk",
    detail: "For larger shops and teams",
    features: [
      "Multi-user staff accounts",
      "Custom onboarding",
      "Operational support",
      "Future integration options",
    ],
    cta: "Contact us",
    featured: false,
  },
]

const faqItems = [
  {
    q: "Does it connect to Facebook or Messenger automatically?",
    a: "Not yet. The current product is intentionally optimized for fast manual capture, including paste parsing from Messenger chats.",
  },
  {
    q: "Can I use it for owner and staff accounts?",
    a: "Yes. The backend already supports RBAC and shop member roles so owners can control staff access.",
  },
  {
    q: "Does it support reports and daily summaries?",
    a: "Yes. Daily summaries are core, and weekly and monthly reporting are already part of the backend scope.",
  },
  {
    q: "Is this only for mobile?",
    a: "No. The platform can support both shop-owner workspace flows and a platform admin console on the web.",
  },
]

export default function LandingPage() {
  return (
    <div className="bg-[#fafaf8]">
      <section className="fom-marketing-hero relative overflow-hidden text-white">
        <div className="fom-marketing-grid absolute inset-0" />
        <div className="fom-marketing-glow absolute inset-0" />
        <div className="relative mx-auto grid w-full max-w-[1120px] gap-14 px-6 py-24 lg:grid-cols-[1fr_256px] lg:py-40">
          <div className="flex max-w-[560px] flex-col gap-7">
            <Badge className="w-fit border border-[rgba(244,98,42,0.28)] bg-[rgba(244,98,42,0.14)] text-[#ffb088] hover:bg-[rgba(244,98,42,0.14)]">
              Order management for Facebook-first shops
            </Badge>
            <div className="flex flex-col gap-4">
              <h1 className="fom-display text-5xl leading-[1.06] md:text-[4.1rem]">
                Turn Facebook orders into a real operating workflow.
              </h1>
              <p className="text-lg leading-8 text-white/56">
                FOM gives shop owners a proper SaaS experience: landing page,
                sign in, registration, and a protected shop workspace for orders,
                customers, deliveries, templates, and reporting.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
              >
                <Link href="/register">
                  Create shop account
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/14 bg-transparent text-white hover:bg-white/6"
              >
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm text-white/40">
              <span>Shop owner sign in</span>
              <span className="h-4 w-px bg-white/12" />
              <span>Registration flow</span>
              <span className="h-4 w-px bg-white/12" />
              <span>Email/password auth</span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-[256px] rounded-[36px] border border-white/10 bg-[#1a1a28] p-4 shadow-[0_48px_96px_rgba(0,0,0,0.7)]">
              <div className="mb-3 flex items-center justify-between text-[10px] font-bold text-white/45">
                <span>9:41</span>
                <span>Ma Aye Shop</span>
              </div>
              <div className="mb-3 rounded-xl bg-white/7 p-3">
                <p className="text-xs font-bold text-white">Today's summary</p>
                <p className="mt-1 text-[9px] text-white/38">
                  Orders moving right now
                </p>
              </div>
              <div className="mb-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-white/6 p-2 text-center">
                  <p className="text-sm font-extrabold text-white">23</p>
                  <p className="text-[8px] text-white/35">Orders</p>
                </div>
                <div className="rounded-lg bg-white/6 p-2 text-center">
                  <p className="text-sm font-extrabold text-white">11</p>
                  <p className="text-[8px] text-white/35">Delivered</p>
                </div>
                <div className="rounded-lg bg-white/6 p-2 text-center">
                  <p className="text-sm font-extrabold text-white">8</p>
                  <p className="text-[8px] text-white/35">Pending</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { name: "Silk Longyi x2", color: "bg-[var(--fom-orange)]", badge: "NEW" },
                  { name: "Men Shirt x1", color: "bg-[var(--fom-teal)]", badge: "OK" },
                  { name: "Handbag x1", color: "bg-[#22C55E]", badge: "DONE" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 rounded-[10px] bg-white/6 p-2.5"
                  >
                    <span className={`h-9 w-1 rounded-full ${item.color}`} />
                    <span className="flex-1 text-[10px] font-bold text-white">
                      {item.name}
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-[7px] font-extrabold text-white/72">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="border-t border-[var(--fom-marketing-border)] bg-white">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-12 px-6 py-24">
          <div className="max-w-[520px]">
            <p className="mb-3 text-xs font-semibold tracking-[0.08em] uppercase text-[var(--fom-orange)]">
              Product shape
            </p>
            <h2 className="fom-display text-4xl leading-[1.12] text-[var(--fom-ink)] md:text-5xl">
              A cleaner structure than one oversized dashboard page.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--fom-slate)]">
              The public web product stays focused on shops: landing, registration,
              sign in, and a protected shop workspace. The internal operator surface
              stays private and out of the public navigation.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {problemCards.map((problem) => (
              <Card key={problem.title} className="border border-[var(--fom-marketing-border)] bg-[#fafaf8]">
                <CardHeader>
                  <CardTitle className="text-xl">{problem.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-[var(--fom-slate)]">
                    {problem.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#fafaf8]">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-12 px-6 py-24">
          <div className="max-w-[560px]">
            <p className="mb-3 text-xs font-semibold tracking-[0.08em] uppercase text-[var(--fom-orange)]">
              Core capability
            </p>
            <h2 className="fom-display text-4xl leading-[1.12] text-[var(--fom-ink)] md:text-5xl">
              Focused on the actual operating model.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--fom-slate)]">
              The shop workspace is built around orders, customers, deliveries,
              templates, and reports instead of flattening everything into one screen.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Card className="md:col-span-2 border border-[var(--fom-marketing-border)] bg-white">
              <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_220px]">
                <div className="flex flex-col gap-4">
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--fom-orange)]/10 text-[var(--fom-orange)]">
                    <ScanSearch className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-2xl font-semibold text-[var(--fom-ink)]">
                      Paste from Messenger
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--fom-slate)]">
                      Copy a customer message, paste into the app, and fields
                      auto-fill. Adding an order takes seconds instead of a slow,
                      error-prone re-entry process.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-[#fafaf8] p-4">
                  <div className="flex flex-col gap-3">
                    {["Name", "Phone", "Address"].map((label, index) => (
                      <div key={label} className="flex items-center gap-3">
                        <span
                          className={`size-3 rounded-full ${
                            index === 0
                              ? "bg-[var(--fom-orange)]"
                              : index === 1
                                ? "bg-[var(--fom-teal)]"
                                : "bg-[#22C55E]"
                          }`}
                        />
                        <span className="h-2 flex-1 rounded-full bg-[var(--fom-marketing-border)]" />
                      </div>
                    ))}
                    <p className="pt-2 text-center text-[10px] font-medium text-muted-foreground">
                      10 sec to add an order
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {featureCards.slice(1).map((feature) => (
              <Card key={feature.title} className="border border-[var(--fom-marketing-border)] bg-white">
                <CardHeader>
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--fom-orange)]/8 text-[var(--fom-orange)]">
                    <feature.icon className="size-5" />
                  </span>
                  <CardTitle className="pt-2 text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-[var(--fom-slate)]">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-white">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-12 px-6 py-24">
          <div className="mx-auto max-w-[520px] text-center">
            <p className="mb-3 text-xs font-semibold tracking-[0.08em] uppercase text-[var(--fom-orange)]">
              Access model
            </p>
            <h2 className="fom-display text-4xl leading-[1.12] text-[var(--fom-ink)] md:text-5xl">
              A real SaaS flow for shop owners
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--fom-slate)]">
              Public pages lead into sign in or registration, and signed-in owners
              land in the shop workspace with dedicated routes for each core job.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <Card key={step.title} className="border border-[var(--fom-marketing-border)] bg-[#fafaf8]">
                <CardHeader>
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--fom-orange)] text-white">
                    {index + 1}
                  </span>
                  <CardTitle className="pt-3 text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-[var(--fom-slate)]">
                    {step.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#fafaf8]">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-12 px-6 py-24">
          <div className="mx-auto max-w-[520px] text-center">
            <p className="mb-3 text-xs font-semibold tracking-[0.08em] uppercase text-[var(--fom-orange)]">
              Pricing
            </p>
            <h2 className="fom-display text-4xl leading-[1.12] text-[var(--fom-ink)] md:text-5xl">
              Simple, local-friendly pricing
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--fom-slate)]">
              Shop owners enter through registration and sign in, then continue
              into the subscribed workspace.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {pricingCards.map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.featured
                    ? "border-0 bg-[var(--fom-ink)] text-white"
                    : "border border-[var(--fom-marketing-border)] bg-white"
                }
              >
                <CardHeader>
                  {tier.featured ? (
                    <Badge className="w-fit bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange)]">
                      Most popular
                    </Badge>
                  ) : null}
                  <CardDescription className={tier.featured ? "text-white/58" : ""}>
                    {tier.name}
                  </CardDescription>
                  <CardTitle className={tier.featured ? "text-white" : ""}>
                    {tier.featured ? "Professional" : tier.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div>
                    <p
                      className={`text-4xl font-semibold tracking-[-0.03em] ${
                        tier.featured ? "text-white" : "text-[var(--fom-ink)]"
                      }`}
                    >
                      {tier.price}
                      {tier.price !== "Let's talk" ? (
                        <span className={tier.featured ? "text-white/62" : "text-muted-foreground"}>
                          {" "}
                          MMK
                        </span>
                      ) : null}
                    </p>
                    <p className={tier.featured ? "mt-2 text-white/62" : "mt-2 text-muted-foreground"}>
                      {tier.detail}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check
                          className={
                            tier.featured
                              ? "mt-0.5 size-4 text-[var(--fom-orange)]"
                              : "mt-0.5 size-4 text-[var(--fom-teal)]"
                          }
                        />
                        <span className={tier.featured ? "text-white/72" : "text-[var(--fom-slate)]"}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className={
                      tier.featured
                        ? "bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
                        : ""
                    }
                    variant={tier.featured ? "default" : "outline"}
                  >
                    {tier.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-[var(--fom-marketing-border)] bg-[#fafaf8]">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-12 px-6 py-24">
          <div className="mx-auto max-w-[520px] text-center">
            <p className="mb-3 text-xs font-semibold tracking-[0.08em] uppercase text-[var(--fom-orange)]">
              FAQ
            </p>
            <h2 className="fom-display text-4xl leading-[1.12] text-[var(--fom-ink)] md:text-5xl">
              Common questions from sellers
            </h2>
          </div>
          <div className="mx-auto flex w-full max-w-[660px] flex-col">
            {faqItems.map((item) => (
              <div
                key={item.q}
                className="border-t border-[var(--fom-marketing-border)] py-5 first:border-t"
              >
                <h3 className="text-lg font-semibold text-[var(--fom-ink)]">
                  {item.q}
                </h3>
                <p className="mt-3 leading-8 text-[var(--fom-slate)]">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]">
              <Link href="/sign-in">
                Sign in
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Register your shop</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

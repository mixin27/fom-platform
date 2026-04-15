import Link from "next/link"
import {
  ArrowRight,
  Check,
  CircleSlash2,
  LayoutDashboard,
  ScanSearch,
  Search,
  Store,
  Truck,
} from "lucide-react"

import { defaultPathForSession, getSession } from "@/lib/auth/session"
import { getMarketingPlans, type MarketingPlan } from "@/lib/marketing/api"
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
    title: "Create your account",
    body: "Register with email and set up your first shop in a few minutes.",
  },
  {
    title: "Capture Messenger orders",
    body: "Keep selling through Facebook and Messenger while the app handles the operational side.",
  },
  {
    title: "Save clean order data",
    body: "Paste chat or type the details once, then keep customer, item, and address records together.",
  },
  {
    title: "Track delivery and payment",
    body: "Move from new to confirmed to delivered with a clear daily view of what still needs attention.",
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
    q: "Can one owner manage more than one shop?",
    a: "Yes. One account can switch between multiple shops, while each shop keeps its own subscription and billing state.",
  },
]

function formatPlanPrice(plan: MarketingPlan) {
  if (plan.price === 0) {
    return "Free"
  }

  return new Intl.NumberFormat("en-US").format(plan.price)
}

function getPlanPeriodLabel(plan: MarketingPlan) {
  switch (plan.billing_period) {
    case "trial":
      return "Free trial"
    case "monthly":
      return "Monthly billing"
    case "yearly":
      return "Yearly billing"
    default:
      return plan.billing_period
  }
}

function getPlanSummary(
  plan: MarketingPlan,
  monthlyPlan: MarketingPlan | null
) {
  if (plan.description?.trim()) {
    return plan.description.trim()
  }

  if (plan.billing_period === "trial") {
    return "Start using the shop workflow before moving into paid billing."
  }

  if (
    plan.billing_period === "yearly" &&
    monthlyPlan &&
    monthlyPlan.currency === plan.currency
  ) {
    const savings = monthlyPlan.price * 12 - plan.price

    if (savings > 0) {
      return `Save ${new Intl.NumberFormat("en-US").format(savings)} ${plan.currency} compared with paying monthly for a year.`
    }
  }

  if (plan.billing_period === "monthly") {
    return "Flexible month-to-month billing for a single active shop subscription."
  }

  if (plan.billing_period === "yearly") {
    return "Lower total yearly pricing for shops that run every day."
  }

  return "Simple pricing for one shop subscription."
}

function getFallbackPlanItems(
  plan: MarketingPlan,
  monthlyPlan: MarketingPlan | null
) {
  if (plan.billing_period === "trial") {
    return {
      available: [
        "7-day access for one shop workspace",
        "Orders, customers, deliveries, templates, and reporting",
        "Upgrade later without losing shop data",
      ],
      unavailable: ["Continuous access after the trial window"],
    }
  }

  const available = [
    "One subscription belongs to one active shop",
    "Orders, customers, deliveries, templates, and reporting",
    "Email notices for billing and account recovery",
  ]

  const unavailable: string[] = []

  if (
    plan.billing_period === "yearly" &&
    monthlyPlan &&
    monthlyPlan.currency === plan.currency &&
    monthlyPlan.price * 12 > plan.price
  ) {
    available.push("Discounted annual billing compared with month-to-month")
  } else if (plan.billing_period === "monthly") {
    unavailable.push("Discounted annual billing")
  }

  return { available, unavailable }
}

function getPlanItems(plan: MarketingPlan, monthlyPlan: MarketingPlan | null) {
  const available = plan.items
    .filter((item) => item.availability_status === "available")
    .map((item) => item.label)
  const unavailable = plan.items
    .filter((item) => item.availability_status === "unavailable")
    .map((item) => item.label)

  if (available.length > 0 || unavailable.length > 0) {
    return { available, unavailable }
  }

  return getFallbackPlanItems(plan, monthlyPlan)
}

function getPlanActionLabel(plan: MarketingPlan, dashboardHref: string | null) {
  if (dashboardHref) {
    return "Open dashboard"
  }

  if (plan.billing_period === "trial") {
    return "Start free trial"
  }

  return "Create shop account"
}

export default async function LandingPage() {
  const [session, plans] = await Promise.all([
    getSession(),
    getMarketingPlans(),
  ])
  const dashboardHref = session ? defaultPathForSession(session) : null
  const monthlyPlan =
    plans.find((plan) => plan.billing_period === "monthly") ?? null
  const featuredPlanCode =
    plans.find((plan) => plan.billing_period === "yearly")?.code ??
    plans.find((plan) => plan.billing_period === "monthly")?.code ??
    plans[0]?.code ??
    ""

  return (
    <div className="bg-[var(--fom-marketing-bg)] transition-colors duration-300">
      <section className="fom-marketing-hero relative overflow-hidden text-white">
        <div className="fom-marketing-grid absolute inset-0" />
        <div className="fom-marketing-glow absolute inset-0" />
        <div className="relative mx-auto grid w-full max-w-[1120px] gap-14 px-6 py-24 lg:grid-cols-[1fr_256px] lg:py-40">
          <div className="flex max-w-[560px] flex-col gap-7">
            <Badge className="w-fit border border-[rgba(244,98,42,0.28)] bg-[rgba(244,98,42,0.14)] text-[#ffb088] hover:bg-[rgba(244,98,42,0.14)]">
              Order management for Facebook-first shops
              {/* <span className="ml-2 border-l border-[rgba(244,98,42,0.3)] pl-2 opacity-80">
                Facebook အခြေပြု အွန်လိုင်းစျေးသည်များအတွက်
                အော်ဒါစီမံခန့်ခွဲမှုစနစ်
              </span> */}
            </Badge>
            <div className="flex flex-col gap-4">
              <h1 className="fom-display text-5xl leading-[1.06] md:text-[4.1rem]">
                Turn Facebook orders into a real operating workflow.
                {/* <span className="mt-4 block text-2xl font-medium tracking-tight opacity-70 md:text-4xl">
                  Facebook အော်ဒါများကို စနစ်တကျ လုပ်ငန်းအဖြစ် ပြောင်းလဲလိုက်ပါ။
                </span> */}
              </h1>
              <p className="text-lg leading-8 text-white/56">
                Capture Messenger orders, track delivery progress, keep customer
                history, and see daily results from one workspace built for
                Myanmar shops selling on Facebook.
                {/* <span className="mt-3 block text-sm leading-relaxed text-white/40 md:text-base">
                  Messenger အော်ဒါများကို မှတ်တမ်းတင်ခြင်း၊ ပို့ဆောင်မှုကို
                  ခြေရာခံခြင်းနှင့် နေ့စဉ် အရောင်းအနှစ်ချုပ်များကို
                  မြန်မာနိုင်ငံရှိ Facebook စျေးသည်များအတွက်
                  သီးသန့်ထုတ်လုပ်ထားသည့် နေရာတစ်ခုတည်းမှ လုပ်ဆောင်နိုင်ပါသည်။
                </span> */}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {dashboardHref ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
                >
                  <Link href={dashboardHref}>
                    <LayoutDashboard data-icon="inline-start" />
                    Dashboard
                  </Link>
                </Button>
              ) : (
                <>
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
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm text-white/40">
              <span>One subscription per shop</span>
              <span className="h-4 w-px bg-white/12" />
              <span>Monthly or yearly billing</span>
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
                  {
                    name: "Silk Longyi x2",
                    color: "bg-[var(--fom-orange)]",
                    badge: "NEW",
                  },
                  {
                    name: "Men Shirt x1",
                    color: "bg-[var(--fom-teal)]",
                    badge: "OK",
                  },
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

      <section
        id="problem"
        className="border-t border-[var(--fom-marketing-border)] bg-[var(--fom-marketing-surface)]"
      >
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-12 px-6 py-24">
          <div className="max-w-[520px]">
            <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-[var(--fom-orange)] uppercase">
              Why FOM
            </p>
            <h2 className="fom-display text-4xl leading-[1.12] text-[var(--fom-ink)] md:text-5xl">
              Built for the work that starts after the message arrives.
              {/* <span className="mt-3 block text-xl font-medium text-[var(--fom-slate)] opacity-80 md:text-3xl">
                မတ်ဆေ့ချ် ရောက်လာပြီးနောက်ပိုင်း လုပ်ဆောင်ရမည့် အလုပ်များအတွက်
                အထူးပြုလုပ်ထားသည်။
              </span> */}
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--fom-slate)]">
              Most Facebook shops already know how to sell. The hard part is
              keeping orders, customer details, delivery progress, and payment
              follow-up organized once the inbox gets busy.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {problemCards.map((problem) => (
              <Card
                key={problem.title}
                className="border border-[var(--fom-marketing-border)] bg-[var(--fom-marketing-surface)]"
              >
                <CardHeader>
                  <CardTitle className="text-xl text-[var(--fom-marketing-fg)]">
                    {problem.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-[var(--fom-marketing-muted)]">
                    {problem.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-[var(--fom-marketing-bg)]">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-12 px-6 py-24">
          <div className="max-w-[560px]">
            <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-[var(--fom-orange)] uppercase">
              Core capability
            </p>
            <h2 className="fom-display text-4xl leading-[1.12] text-[var(--fom-ink)] md:text-5xl">
              Everything a Facebook-first shop needs in one place.
              {/* <span className="mt-3 block text-xl font-medium text-[var(--fom-slate)] opacity-80 md:text-3xl">
                Facebook စျေးသည်တစ်ယောက် လိုအပ်သမျှ အရာအားလုံး တစ်နေရာတည်းတွင်
              </span> */}
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--fom-slate)]">
              FOM keeps order capture, customer memory, delivery follow-up,
              templates, and reporting close together so owners and staff can
              work faster without losing context.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Card className="border border-[var(--fom-marketing-border)] bg-[var(--fom-marketing-surface)] md:col-span-2">
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
                      auto-fill. Adding an order takes seconds instead of a
                      slow, error-prone re-entry process.
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
              <Card
                key={feature.title}
                className="border border-[var(--fom-marketing-border)] bg-[var(--fom-marketing-surface)]"
              >
                <CardHeader>
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[var(--fom-orange)]/8 text-[var(--fom-orange)]">
                    <feature.icon className="size-5" />
                  </span>
                  <CardTitle className="pt-2 text-xl">
                    {feature.title}
                  </CardTitle>
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

      <section id="how" className="bg-[var(--fom-marketing-surface)]">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-12 px-6 py-24">
          <div className="mx-auto max-w-[520px] text-center">
            <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-[var(--fom-orange)] uppercase">
              Workflow
            </p>
            <h2 className="fom-display text-4xl leading-[1.12] text-[var(--fom-ink)] md:text-5xl">
              Start fast and keep the day moving
              {/* <span className="mt-3 block text-xl font-medium text-[var(--fom-slate)] opacity-80 md:text-3xl">
                မြန်မြန်ဆန်ဆန် စတင်ပြီး အလုပ်များကို အရှိန်မပျက် လုပ်ဆောင်ပါ
              </span> */}
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--fom-slate)]">
              Set up the shop once, then use the workspace every day for order
              entry, customer tracking, delivery updates, and closing summaries.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <Card
                key={step.title}
                className="border border-[var(--fom-marketing-border)] bg-[var(--fom-marketing-surface)]"
              >
                <CardHeader>
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--fom-orange)] text-white">
                    {index + 1}
                  </span>
                  <CardTitle className="pt-3 text-xl text-[var(--fom-marketing-fg)]">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-[var(--fom-marketing-muted)]">
                    {step.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[var(--fom-marketing-bg)]">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-12 px-6 py-24">
          <div className="mx-auto max-w-[520px] text-center">
            <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-[var(--fom-orange)] uppercase">
              Pricing
            </p>
            <h2 className="fom-display text-4xl leading-[1.12] text-[var(--fom-ink)] md:text-5xl">
              Simple pricing for each shop you run
              {/* <span className="mt-3 block text-xl font-medium text-[var(--fom-slate)] opacity-80 md:text-3xl">
                ဆိုင်တိုင်းအတွက် ရိုးရှင်းသော စျေးနှုန်းသတ်မှတ်ချက်များ
              </span> */}
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--fom-slate)]">
              Plans come from the active subscription catalog. One subscription
              belongs to one shop, and owners can switch between shops from the
              same account.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const isFeatured = plan.code === featuredPlanCode
              const href = dashboardHref ?? "/register"
              const actionLabel = getPlanActionLabel(plan, dashboardHref)
              const summary = getPlanSummary(plan, monthlyPlan)
              const items = getPlanItems(plan, monthlyPlan)

              return (
                <Card
                  key={plan.id}
                  className={
                    isFeatured
                      ? "border-0 bg-[var(--fom-marketing-featured-bg)] text-[var(--fom-marketing-featured-fg)]"
                      : "border border-[var(--fom-marketing-border)] bg-[var(--fom-marketing-surface)]"
                  }
                >
                  <CardHeader>
                    {isFeatured ? (
                      <Badge className="w-fit bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange)]">
                        Recommended
                      </Badge>
                    ) : null}
                    <CardDescription
                      className={
                        isFeatured
                          ? "text-white/70"
                          : "text-[var(--fom-marketing-muted)]"
                      }
                    >
                      {getPlanPeriodLabel(plan)}
                    </CardDescription>
                    <CardTitle
                      className={
                        isFeatured
                          ? "text-white"
                          : "text-[var(--fom-marketing-fg)]"
                      }
                    >
                      {plan.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    <div>
                      <p
                        className={`text-4xl font-semibold tracking-[-0.03em] ${
                          isFeatured ? "text-white" : "text-[var(--fom-ink)]"
                        }`}
                      >
                        {formatPlanPrice(plan)}
                        {plan.price > 0 ? (
                          <span
                            className={
                              isFeatured
                                ? "text-white/62"
                                : "text-muted-foreground"
                            }
                          >
                            {" "}
                            {plan.currency}
                          </span>
                        ) : null}
                      </p>
                      <p
                        className={
                          isFeatured
                            ? "mt-2 text-white/70"
                            : "mt-2 text-[var(--fom-marketing-muted)]"
                        }
                      >
                        {summary}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      {items.available.map((feature) => (
                        <div
                          key={`available-${feature}`}
                          className="flex items-start gap-3"
                        >
                          <Check
                            className={
                              isFeatured
                                ? "mt-0.5 size-4 text-[var(--fom-orange)]"
                                : "mt-0.5 size-4 text-[var(--fom-teal)]"
                            }
                          />
                          <span
                            className={
                              isFeatured
                                ? "text-white/80"
                                : "text-[var(--fom-marketing-muted)]"
                            }
                          >
                            {feature}
                          </span>
                        </div>
                      ))}
                      {items.unavailable.map((feature) => (
                        <div
                          key={`unavailable-${feature}`}
                          className="flex items-start gap-3"
                        >
                          <CircleSlash2
                            className={
                              isFeatured
                                ? "mt-0.5 size-4 text-white/38"
                                : "mt-0.5 size-4 text-muted-foreground/70"
                            }
                          />
                          <span
                            className={
                              isFeatured
                                ? "text-white/52"
                                : "text-[var(--fom-marketing-muted)]/75"
                            }
                          >
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button
                      asChild
                      className={
                        isFeatured
                          ? "bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
                          : ""
                      }
                      variant={isFeatured ? "default" : "outline"}
                    >
                      <Link href={href}>{actionLabel}</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <p className="text-center text-sm leading-7 text-[var(--fom-slate)]">
            One owner account can manage multiple shops, but each shop keeps its
            own subscription, invoices, and renewal cycle.
          </p>
        </div>
      </section>

      <section
        id="faq"
        className="border-t border-[var(--fom-marketing-border)] bg-[var(--fom-marketing-bg)]"
      >
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-12 px-6 py-24">
          <div className="mx-auto max-w-[520px] text-center">
            <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-[var(--fom-orange)] uppercase">
              FAQ
            </p>
            <h2 className="fom-display text-4xl leading-[1.12] text-[var(--fom-ink)] md:text-5xl">
              Common questions from sellers
              {/* <span className="mt-3 block text-xl font-medium text-[var(--fom-slate)] opacity-80 md:text-3xl">
                စျေးသည်များ မကြာခဏ မေးလေ့ရှိသည့် မေးခွန်းများ
              </span> */}
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
                <p className="mt-3 leading-8 text-[var(--fom-marketing-muted)]">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
          <div className="mx-auto flex flex-wrap justify-center gap-3">
            {dashboardHref ? (
              <Button
                asChild
                className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
              >
                <Link href={dashboardHref}>
                  <LayoutDashboard data-icon="inline-start" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
                >
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/register">Register your shop</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

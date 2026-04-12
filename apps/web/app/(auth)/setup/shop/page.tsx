import { ArrowRight, Building2, Store } from "lucide-react"
import { redirect } from "next/navigation"

import { createInitialShopAction } from "@/app/actions"
import { BrandMark } from "@/components/brand-mark"
import {
  defaultPathForSession,
  getSession,
  hasPlatformAccess,
} from "@/lib/auth/session"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type SetupShopPageProps = {
  searchParams?: Promise<{
    error?: string
  }>
}

export default async function SetupShopPage({
  searchParams,
}: SetupShopPageProps) {
  const session = await getSession()

  if (!session) {
    redirect("/sign-in")
  }

  if (session.shops.length > 0 || hasPlatformAccess(session)) {
    redirect(defaultPathForSession(session))
  }

  const params = await searchParams
  const invalidSetup = params?.error === "invalid_setup"
  const shopNameUnavailable = params?.error === "shop_name_unavailable"
  const trialUnavailable = params?.error === "trial_unavailable"
  const setupFailed = params?.error === "shop_setup_failed"

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fcfaf6_0%,#f4efe7_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="border border-black/6 bg-white">
              <CardHeader>
                <CardDescription>Initial shop setup</CardDescription>
                <CardTitle>Create the first shop for this account</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {invalidSetup ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    Shop name is required.
                  </div>
                ) : null}
                {shopNameUnavailable ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    That shop name is already in use. Choose a different name
                    and try again.
                  </div>
                ) : null}
                {trialUnavailable ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    The self-serve free trial plan is currently disabled. Ask
                    the platform owner to enable the trial plan before creating
                    the first shop.
                  </div>
                ) : null}
                {setupFailed ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    Shop setup could not be completed right now. Check the API
                    connection and try again.
                  </div>
                ) : null}

                <form
                  action={createInitialShopAction}
                  className="flex flex-col gap-5"
                >
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="setup-shop-name">
                        Shop name
                      </FieldLabel>
                      <Input
                        id="setup-shop-name"
                        name="shopName"
                        placeholder="Aye Fashion House"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="setup-shop-timezone">
                        Timezone
                      </FieldLabel>
                      <Input
                        id="setup-shop-timezone"
                        name="timezone"
                        defaultValue="Asia/Yangon"
                        placeholder="Asia/Yangon"
                        required
                      />
                      <FieldDescription>
                        This creates the first shop membership for{" "}
                        {session.user.name} and starts the shop on the self-serve
                        free trial.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>

                  <Button
                    type="submit"
                    size="lg"
                    className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]"
                  >
                    Create shop
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border border-black/6 bg-[linear-gradient(180deg,#fff8f2_0%,#fff_100%)]">
              <CardHeader>
                <CardDescription>What happens next</CardDescription>
                <CardTitle className="text-4xl leading-tight">
                  Finish the first workspace setup, then move directly into the
                  dashboard.
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {[
                  {
                    icon: Store,
                    title: "Shop workspace",
                    detail:
                      "The account becomes the owner of the new shop and gets full shop permissions immediately.",
                  },
                  {
                    icon: Building2,
                    title: "Per-shop billing",
                    detail:
                      "Each shop keeps its own subscription. The first self-serve shop starts on a free trial and additional shops can be added later without mixing billing state.",
                  },
                ].map(({ icon: Icon, title, detail }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-black/6 bg-white p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-[rgba(249,122,31,0.12)] text-[var(--fom-orange)]">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{title}</p>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          {detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

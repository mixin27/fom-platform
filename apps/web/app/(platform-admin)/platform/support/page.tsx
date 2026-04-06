import { AlertTriangle, CheckCircle2, MessagesSquare } from "lucide-react"

import { PageIntro } from "@/components/page-intro"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function PlatformSupportPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Support"
        title="Support queue and operational follow-up"
        description="This section is for tenant issues, onboarding blockers, and product incidents that the platform owner needs to track."
      />

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-black/6 shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Open queue</CardDescription>
            <CardTitle>Current operator tasks</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 pt-0">
            {[
              "One Pro shop has overdue payment follow-up this week.",
              "Two trial shops need activation help after registration.",
              "One tenant reported parsing issues with pasted multi-item chats.",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-black/6 bg-white px-3.5 py-3 text-sm leading-6 text-muted-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-black/6 shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Release posture</CardDescription>
            <CardTitle>Current platform health</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 pt-0">
            <div className="flex items-start gap-3 rounded-xl bg-[var(--fom-admin-surface)] px-3.5 py-3">
              <CheckCircle2 className="mt-0.5 size-4 text-[var(--fom-teal)]" />
              <p className="text-sm leading-6 text-muted-foreground">
                Backend auth, RBAC, orders, summaries, templates, and deliveries are already in place.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[var(--fom-admin-surface)] px-3.5 py-3">
              <MessagesSquare className="mt-0.5 size-4 text-[var(--fom-teal)]" />
              <p className="text-sm leading-6 text-muted-foreground">
                The web app now uses backend-backed sign-in and registration flows for both shop and platform access.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[var(--fom-admin-surface)] px-3.5 py-3">
              <AlertTriangle className="mt-0.5 size-4 text-[var(--fom-orange)]" />
              <p className="text-sm leading-6 text-muted-foreground">
                Dashboard data is still mocked. The next major step is wiring platform pages to live backend tenant and subscription APIs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

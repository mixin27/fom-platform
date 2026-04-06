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
    <div className="flex flex-col gap-6">
      <PageIntro
        eyebrow="Support"
        title="Support queue and operational follow-up"
        description="This section is for tenant issues, onboarding blockers, and product incidents that the platform owner needs to track."
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardDescription>Open queue</CardDescription>
            <CardTitle>Current operator tasks</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              "One Pro shop has overdue payment follow-up this week.",
              "Two trial shops need activation help after registration.",
              "One tenant reported parsing issues with pasted multi-item chats.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-black/6 bg-white p-4 text-sm leading-7 text-muted-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Release posture</CardDescription>
            <CardTitle>Current platform health</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-2xl bg-[var(--fom-admin-surface)] p-4">
              <CheckCircle2 className="mt-0.5 size-4 text-[var(--fom-teal)]" />
              <p className="text-sm leading-7 text-muted-foreground">
                Backend auth, RBAC, orders, summaries, templates, and deliveries are already in place.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-[var(--fom-admin-surface)] p-4">
              <MessagesSquare className="mt-0.5 size-4 text-[var(--fom-teal)]" />
              <p className="text-sm leading-7 text-muted-foreground">
                The web app now has separate route trees for marketing, auth, shop app, and platform app.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-[var(--fom-admin-surface)] p-4">
              <AlertTriangle className="mt-0.5 size-4 text-[var(--fom-orange)]" />
              <p className="text-sm leading-7 text-muted-foreground">
                Real backend auth integration and subscription-aware frontend gating still need to replace the temporary cookie scaffold.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

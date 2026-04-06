import { PageIntro } from "@/components/page-intro"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function ShopSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        eyebrow="Settings"
        title="Shop settings and access"
        description="A real SaaS app needs a dedicated settings route for team access, billing, and profile changes instead of burying everything inside one HTML page."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Profile</CardDescription>
            <CardTitle>Shop identity</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">
            Manage shop name, contact details, timezone, and delivery defaults.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Staff</CardDescription>
            <CardTitle>Role-based access</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">
            Invite staff, review assigned permissions, and keep owner-only actions restricted.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Billing</CardDescription>
            <CardTitle>Subscription state</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">
            Surface plan status, renewal state, and future invoice history here once billing is wired.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

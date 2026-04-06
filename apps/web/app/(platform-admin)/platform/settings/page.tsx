import { PageIntro } from "@/components/page-intro"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function PlatformSettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Settings"
        title="Platform settings"
        description="The platform operator needs a separate settings surface for admin identity, environment setup, and future internal controls."
      />

      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="border border-black/6 shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Account</CardDescription>
            <CardTitle>Platform admin identity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
            Reserved for the single platform admin account. This route should later connect to the backend auth profile and security settings.
          </CardContent>
        </Card>
        <Card className="border border-black/6 shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Environment</CardDescription>
            <CardTitle>Operational configuration</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
            API base URLs, billing settings, notifications, and internal platform toggles belong here.
          </CardContent>
        </Card>
        <Card className="border border-black/6 shadow-none">
          <CardHeader className="pb-3">
            <CardDescription>Access policy</CardDescription>
            <CardTitle>Restricted admin surface</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
            Only the dedicated platform admin account should access the `/platform/*` route tree.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

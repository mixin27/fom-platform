import { PageIntro } from "@/components/page-intro"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const templates = [
  {
    title: "COD Reminder",
    shortcut: "/cod",
    body: "Thanks for your order. Please keep your phone available for delivery confirmation.",
  },
  {
    title: "Out for Delivery",
    shortcut: "/out",
    body: "Your order is now out for delivery. The driver will contact you shortly.",
  },
  {
    title: "Payment Received",
    shortcut: "/paid",
    body: "We have received your payment and your order is moving into dispatch.",
  },
]

export default function TemplatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        eyebrow="Templates"
        title="Message templates"
        description="Owners and staff should have a stand-alone route for message templates instead of burying them inside a single dashboard."
        actions={<Button variant="outline">New template</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.title}>
            <CardHeader>
              <CardDescription>{template.shortcut}</CardDescription>
              <CardTitle>{template.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">
                {template.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { PageIntro } from "@/components/page-intro"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const deliveryColumns = [
  {
    title: "Assigned",
    description: "Orders packed and handed to a driver.",
    items: [
      "ORD-2403 · Sanchaung · Ko Min",
      "ORD-2402 · Hlaing · Ko Toe",
    ],
  },
  {
    title: "Out for delivery",
    description: "Drivers currently on route.",
    items: [
      "ORD-2399 · Yankin · Ko Min",
      "ORD-2397 · Bahan · Ma Su",
    ],
  },
  {
    title: "Delivered today",
    description: "Completed routes already counted into revenue.",
    items: [
      "ORD-2396 · North Dagon",
      "ORD-2395 · Sanchaung",
      "ORD-2394 · Kamayut",
    ],
  },
]

export default function DeliveriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        eyebrow="Deliveries"
        title="Delivery coordination"
        description="This route is ready for the backend deliveries API and gives the shop a focused space for dispatch and driver progress."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {deliveryColumns.map((column) => (
          <Card key={column.title}>
            <CardHeader>
              <CardDescription>{column.description}</CardDescription>
              <CardTitle>{column.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {column.items.map((item) => (
                <div key={item} className="rounded-2xl border border-black/6 bg-[var(--fom-portal-surface)] p-4 text-sm leading-7 text-muted-foreground">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

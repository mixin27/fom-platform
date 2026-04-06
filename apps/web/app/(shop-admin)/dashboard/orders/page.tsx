import { Plus } from "lucide-react"

import { PageIntro } from "@/components/page-intro"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

const orders = [
  ["ORD-2403", "Daw Khin Myat", "Silk Longyi x2", "New", "Sanchaung", "45,000 MMK"],
  ["ORD-2402", "Ko Zaw Lin", "Men Shirt x1", "On the way", "Hlaing", "21,500 MMK"],
  ["ORD-2401", "Ma Thin Zar", "Handbag x1", "Confirmed", "Yankin", "32,000 MMK"],
  ["ORD-2398", "Daw Aye Aye", "Summer Dress x3", "Delivered", "Bahan", "54,000 MMK"],
]

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        eyebrow="Orders"
        title="Order management"
        description="This route tree is separate from the dashboard and ready to map directly to the backend list, filter, status, and parse-message APIs."
        actions={
          <Button className="bg-[var(--fom-orange)] text-white hover:bg-[var(--fom-orange-dark)]">
            <Plus data-icon="inline-start" />
            Add order
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge>All 23</Badge>
        <Badge variant="outline">New 4</Badge>
        <Badge variant="outline">Confirmed 6</Badge>
        <Badge variant="outline">On the way 2</Badge>
        <Badge variant="outline">Delivered 11</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Order queue</CardDescription>
          <CardTitle>All active and recent orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Township</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order[0]}>
                  <TableCell className="px-4 font-medium">{order[0]}</TableCell>
                  <TableCell>{order[1]}</TableCell>
                  <TableCell>{order[2]}</TableCell>
                  <TableCell>{order[3]}</TableCell>
                  <TableCell>{order[4]}</TableCell>
                  <TableCell>{order[5]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

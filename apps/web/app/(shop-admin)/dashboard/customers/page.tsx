import { PageIntro } from "@/components/page-intro"
import { DashboardStatCard } from "@/components/dashboard-stat-card"
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
import { HeartHandshake, MapPinned, Users } from "lucide-react"

const customers = [
  ["Daw Khin Myat", "09 7812 3456", "4 orders", "Sanchaung", "168,000 MMK"],
  ["Ko Zaw Lin", "09 4556 7890", "2 orders", "Hlaing", "49,500 MMK"],
  ["Ma Thin Zar", "09 2234 5678", "1 order", "Yankin", "32,000 MMK"],
]

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        eyebrow="Customers"
        title="Customer relationships"
        description="The shop portal keeps customer data and order history close to daily operations so owners do not need a separate CRM product."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard
          title="Repeat buyers"
          value="34%"
          detail="Share of delivered orders from returning customers."
          icon={HeartHandshake}
          accent="sunset"
        />
        <DashboardStatCard
          title="Known contacts"
          value="246"
          detail="Saved customers with usable phone history."
          icon={Users}
          accent="teal"
        />
        <DashboardStatCard
          title="Top township"
          value="Sanchaung"
          detail="Highest recent order density by delivery address."
          icon={MapPinned}
          accent="ink"
        />
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Customer list</CardDescription>
          <CardTitle>Recent buyer activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Township</TableHead>
                <TableHead>Total spend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer[0]}>
                  <TableCell className="px-4 font-medium">{customer[0]}</TableCell>
                  <TableCell>{customer[1]}</TableCell>
                  <TableCell>{customer[2]}</TableCell>
                  <TableCell>{customer[3]}</TableCell>
                  <TableCell>{customer[4]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

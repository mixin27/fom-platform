import { PageIntro } from "@/components/page-intro"
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

const shops = [
  ["Ma Aye Shop", "Pro", "Active", "847", "Sanchaung", "2 min ago"],
  ["Aung Beauty Store", "Lifetime", "Active", "1,243", "Mandalay", "1 hr ago"],
  ["Ko Zaw Electronics", "Trial", "Trial", "34", "Bago", "Yesterday"],
  ["Phyo Cosmetics", "Pro", "Overdue", "290", "Dagon", "2 days ago"],
]

export default function PlatformShopsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageIntro
        eyebrow="Shops"
        title="Tenant management"
        description="Scan tenant health, plan state, and activity from a dedicated shop operations route."
      />

      <Card className="border border-black/6 shadow-none">
        <CardHeader className="pb-3">
          <CardDescription>Registered shops</CardDescription>
          <CardTitle>Shop list and health</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2.5">Shop</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Township</TableHead>
                <TableHead>Last active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.map((shop) => (
                <TableRow key={shop[0]}>
                  <TableCell className="px-4 py-3 font-medium">{shop[0]}</TableCell>
                  <TableCell className="py-3">{shop[1]}</TableCell>
                  <TableCell className="py-3">{shop[2]}</TableCell>
                  <TableCell className="py-3">{shop[3]}</TableCell>
                  <TableCell className="py-3">{shop[4]}</TableCell>
                  <TableCell className="py-3">{shop[5]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

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
    <div className="flex flex-col gap-6">
      <PageIntro
        eyebrow="Shops"
        title="Tenant management"
        description="A dedicated tenant route makes more sense than trying to bury shop operations inside a single admin dashboard."
      />

      <Card>
        <CardHeader>
          <CardDescription>Registered shops</CardDescription>
          <CardTitle>Shop list and health</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Shop</TableHead>
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
                  <TableCell className="px-4 font-medium">{shop[0]}</TableCell>
                  <TableCell>{shop[1]}</TableCell>
                  <TableCell>{shop[2]}</TableCell>
                  <TableCell>{shop[3]}</TableCell>
                  <TableCell>{shop[4]}</TableCell>
                  <TableCell>{shop[5]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

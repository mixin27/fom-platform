import { PlatformPaymentDetailScreen } from "@/features/platform/payments/components/platform-payment-detail-screen"
import { toClientSafe } from "@/features/shared/server/to-client-safe"
import { getPlatformPayment } from "@/lib/platform/api"
import { type PlatformSearchParams } from "@/lib/platform/query"

type PlatformPaymentPageProps = {
  params: Promise<{
    invoiceId: string
  }>
  searchParams?: Promise<PlatformSearchParams>
}

export default async function PlatformPaymentPage({
  params,
  searchParams: _searchParams,
}: PlatformPaymentPageProps) {
  const { invoiceId } = await params
  const returnTo = `/platform/payments/${invoiceId}`
  const response = await getPlatformPayment(invoiceId, returnTo)

  return (
    <PlatformPaymentDetailScreen
      invoiceId={invoiceId}
      initialData={toClientSafe(response.data)}
    />
  )
}

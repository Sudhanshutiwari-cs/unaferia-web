import { AdminShell } from "@/components/admin/admin-shell"
import { PaymentsManager } from "@/components/admin/payments-manager"
import { getPayments, getPaymentStats } from "@/app/actions/admin-payments"

export const dynamic = "force-dynamic"
export const metadata = { title: "Payments — Admin" }

export default async function AdminPaymentsPage() {
  const [payments, stats] = await Promise.all([getPayments(), getPaymentStats()])
  return (
    <AdminShell title="Payment Management">
      <PaymentsManager payments={payments} stats={stats} />
    </AdminShell>
  )
}

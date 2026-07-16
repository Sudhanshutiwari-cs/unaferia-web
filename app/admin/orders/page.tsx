import { AdminShell } from "@/components/admin/admin-shell"
import { OrdersManager } from "@/components/admin/orders-manager"
import { getAdminOrderRows } from "@/app/actions/admin-order"

export const dynamic = "force-dynamic"

export default async function AdminOrdersPage() {
  const orders = await getAdminOrderRows()
  return (
    <AdminShell title="Orders">
      <OrdersManager 
        initialOrders={orders} 
        refreshOrdersAction={getAdminOrderRows}
      />
    </AdminShell>
  )
}
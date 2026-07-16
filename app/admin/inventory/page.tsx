import { AdminShell } from "@/components/admin/admin-shell"
import { InventoryManager } from "@/components/admin/inventory-manager"
import { getInventory } from "@/app/actions/admin-inventory"

export const dynamic = "force-dynamic"
export const metadata = { title: "Inventory — Admin" }

export default async function AdminInventoryPage() {
  const inventory = await getInventory()
  return (
    <AdminShell title="Inventory Management">
      <InventoryManager initial={inventory} />
    </AdminShell>
  )
}

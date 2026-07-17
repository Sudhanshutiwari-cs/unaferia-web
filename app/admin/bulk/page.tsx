import { AdminShell } from "@/components/admin/admin-shell"
import { BulkManager } from "@/components/admin/bulk-manager"

export const metadata = { title: "Bulk Import / Export — Admin | Unaferia" }

export default function AdminBulkPage() {
  return (
    <AdminShell title="Bulk Import / Export">
      <BulkManager />
    </AdminShell>
  )
}

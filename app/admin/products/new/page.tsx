import { AdminShell } from "@/components/admin/admin-shell"
import { ProductForm } from "@/components/admin/product-form"

export const dynamic = "force-dynamic"

export default function AdminNewProductPage() {
  return (
    <AdminShell title="Add New Product">
      <ProductForm mode="create" />
    </AdminShell>
  )
}

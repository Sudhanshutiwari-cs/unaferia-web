import { AdminShell } from "@/components/admin/admin-shell"
import { ProductsManager } from "@/components/admin/products-manager"
import { getAllProducts } from "@/lib/queries"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  const products = await getAllProducts()

  return (
    <AdminShell title="Products">
      <ProductsManager initialProducts={products} />
    </AdminShell>
  )
}

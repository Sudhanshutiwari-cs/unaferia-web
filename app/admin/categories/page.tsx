import { AdminShell } from "@/components/admin/admin-shell"
import { CategoriesManager } from "@/components/admin/categories-manager"
import { getCategories, getBrands } from "@/app/actions/admin-categories"

export const dynamic = "force-dynamic"
export const metadata = { title: "Categories & Brands — Admin" }

export default async function AdminCategoriesPage() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()])
  return (
    <AdminShell title="Categories & Brands">
      <CategoriesManager initialCategories={categories} initialBrands={brands} />
    </AdminShell>
  )
}

import { AdminShell } from "@/components/admin/admin-shell"
import { SeoManager } from "@/components/admin/seo-manager"
import { getSeoPages, getCategoriesSeo, getProductsSeo } from "@/app/actions/admin-seo"

export const dynamic = "force-dynamic"
export const metadata = { title: "SEO Manager — Admin" }

export default async function AdminSeoPage() {
  const [pages, categories, products] = await Promise.all([
    getSeoPages(),
    getCategoriesSeo(),
    getProductsSeo(),
  ])

  return (
    <AdminShell title="SEO Manager">
      <SeoManager pages={pages} categories={categories} products={products} />
    </AdminShell>
  )
}

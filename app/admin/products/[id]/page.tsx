import { notFound } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"
import { ProductForm } from "@/components/admin/product-form"
import { getProductForEdit } from "@/app/actions/admin-product"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminEditProductPage({ params }: Props) {
  const { id } = await params
  const product = await getProductForEdit(id)
  if (!product) notFound()

  return (
    <AdminShell title={`Edit: ${product.title}`}>
      <ProductForm mode="edit" product={product} />
    </AdminShell>
  )
}

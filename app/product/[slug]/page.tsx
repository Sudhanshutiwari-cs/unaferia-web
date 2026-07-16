import { notFound, redirect } from "next/navigation"
import { getProductBySlug } from "@/lib/queries"
import { productHref } from "@/lib/slug"

// Legacy route: redirect /product/[slug] to the canonical
// /category/subcategory/slug URL.
export default async function LegacyProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  redirect(
    productHref({
      category: product.category,
      subCategory: product.subCategory,
      slug: product.id,
    }),
  )
}

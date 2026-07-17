import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { ProductDetailView } from "@/components/product-detail-view"
import { ProductSpecifications } from "@/components/product-specifications"
import { ProductReviews } from "@/components/product-reviews"
import { ProductCarousel } from "@/components/product-carousel"
import { getProductBySlug, getRelatedProducts, getProductReviews } from "@/lib/queries"
import { productHref, slugify } from "@/lib/slug"
import { createClient } from "@/lib/supabase/server"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; subcategory: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("title, description, thumbnail, meta_title, meta_description, meta_keywords")
    .eq("slug", slug)
    .maybeSingle()

  const title = (data?.meta_title as string | null) || (data?.title ? `${data.title} | Unaferia` : "Product | Unaferia")
  const description = (data?.meta_description as string | null) || (data?.description as string | null) || ""
  const keywords = (data?.meta_keywords as string | null) || ""
  const image = data?.thumbnail as string | null

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      siteName: "Unaferia",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; subcategory: string; slug: string }>
}) {
  const { category, subcategory, slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  // Enforce the canonical URL: if the category/subcategory in the path don't
  // match the product's real taxonomy, redirect to the correct URL.
  const canonical = productHref({
    category: product.category,
    subCategory: product.subCategory,
    slug: product.id,
  })
  if (`/${category}/${subcategory}/${slug}` !== canonical) {
    redirect(canonical)
  }

  const [related, { reviews, summary }] = await Promise.all([
    getRelatedProducts(product.category, slug, product.subCategory || undefined),
    getProductReviews(product.productId),
  ])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-3 py-3 pb-20 sm:px-4 sm:pb-3">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-link hover:underline">
            Home
          </Link>
          {product.category && (
            <>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              <Link
                href={`/search?category=${encodeURIComponent(product.category)}`}
                className="hover:text-link hover:underline"
              >
                {product.category}
              </Link>
            </>
          )}
          {product.subCategory && (
            <>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              <Link
                href={`/search?category=${encodeURIComponent(product.subCategory)}`}
                className="hover:text-link hover:underline"
              >
                {product.subCategory}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <span className="line-clamp-1 max-w-[50vw] text-foreground">{product.name}</span>
        </nav>

        <ProductDetailView product={product} />

        <div className="mt-4">
          <ProductSpecifications product={product} />
        </div>

        <div className="mt-4">
          <ProductReviews
            productId={product.productId}
            productPath={canonical}
            reviews={reviews}
            summary={summary}
          />
        </div>

        {related.length > 0 && (
          <div className="mt-6">
            <ProductCarousel title="Products related to this item" products={related} />
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}

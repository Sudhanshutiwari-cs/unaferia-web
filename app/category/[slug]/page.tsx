import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ChevronRight, SlidersHorizontal, SearchX } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { ProductCard } from "@/components/product-card"
import { SortSelect } from "@/components/search-controls"
import { getCategoryBySlug, getProductsByCategory } from "@/lib/queries"
import { Suspense } from "react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: catRow } = await supabase
    .from("categories")
    .select("name, meta_title, meta_description, meta_keywords")
    .eq("slug", slug)
    .maybeSingle()

  const name = (catRow?.name as string) ?? ""
  const metaTitle =
    (catRow?.meta_title as string | null) ||
    (name ? `${name} | Unaferia` : "Category | Unaferia")
  const metaDescription =
    (catRow?.meta_description as string | null) ||
    (name ? `Shop ${name} products on Unaferia` : "")
  const metaKeywords =
    (catRow?.meta_keywords as string | null) ||
    (name ? `${name.toLowerCase()}, online shopping, unaferia` : "")

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      siteName: "Unaferia",
    },
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sub?: string; sort?: string }>
}) {
  const { slug } = await params
  const { sub = "", sort = "relevance" } = await searchParams

  const cat = await getCategoryBySlug(slug)
  if (!cat) notFound()

  // If this is a subcategory (has a parent), show products for it directly.
  // If it's a parent category, show products filtered by optional sub.
  const isParent = cat.parentId === null
  const activeSub = isParent
    ? cat.children.find((c) => c.slug === sub) ?? null
    : null

  // Build the list of category_ids to match against.
  // Parent with no filter → include self + all children.
  // Parent with sub filter → only that child's id.
  // Subcategory page → only its own id.
  const categoryIds: string[] = activeSub
    ? [activeSub.id]
    : isParent
      ? [cat.id, ...cat.children.map((c) => c.id)]
      : [cat.id]

  const products = await getProductsByCategory({
    categoryIds,
    sort: sort as "relevance" | "price-asc" | "price-desc" | "rating",
  })

  // Build breadcrumb
  const breadcrumb = cat.parentName
    ? [
        { label: "Home", href: "/" },
        { label: cat.parentName, href: `/category/${cat.parentSlug}` },
        { label: cat.name, href: null },
      ]
    : [
        { label: "Home", href: "/" },
        { label: cat.name, href: null },
      ]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-4">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-link hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Mobile subcategory chips — above main content, below desktop threshold */}
        {isParent && cat.children.length > 0 && (
          <div className="mb-3 lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                href={`/category/${cat.slug}`}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  !sub
                    ? "border-navy bg-navy text-white"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                All
              </Link>
              {cat.children.map((child) => (
                <Link
                  key={child.slug}
                  href={`/category/${cat.slug}?sub=${child.slug}`}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    sub === child.slug
                      ? "border-navy bg-navy text-white"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {/* Sidebar — subcategories (only for parent categories, desktop only) */}
          {isParent && cat.children.length > 0 && (
            <aside className="hidden w-52 shrink-0 lg:block" aria-label="Subcategories">
              <div className="rounded-md bg-card p-3">
                <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Department
                </h2>
                <ul className="space-y-0.5">
                  <li>
                    <Link
                      href={`/category/${cat.slug}`}
                      className={`block rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted hover:text-link ${
                        !sub ? "bg-muted font-semibold text-link" : "text-foreground"
                      }`}
                    >
                      All {cat.name}
                    </Link>
                  </li>
                  {cat.children.map((child) => (
                    <li key={child.slug}>
                      <Link
                        href={`/category/${cat.slug}?sub=${child.slug}`}
                        className={`block rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted hover:text-link ${
                          sub === child.slug ? "bg-muted font-semibold text-link" : "text-foreground"
                        }`}
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          {/* Main content */}
          <div className="min-w-0 flex-1">
            {/* Header bar */}
            <div className="mb-3 flex flex-col gap-2 rounded-md bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {activeSub ? activeSub.name : cat.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {products.length} {products.length === 1 ? "result" : "results"}
                </p>
              </div>
              <Suspense>
                <SortSelect current={sort} />
              </Suspense>
            </div>

            {products.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-md bg-card py-20 text-center">
                <SearchX className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                <p className="text-lg font-medium text-foreground">No products found</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Try browsing another subcategory or{" "}
                  <Link href="/" className="text-link hover:underline">
                    return home
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

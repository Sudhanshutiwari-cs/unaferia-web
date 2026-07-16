import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchX } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { getPageSeo, buildMetadata } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("search")
  return buildMetadata(seo, "/search")
}
import { ProductCard } from "@/components/product-card"
import { SortSelect, CategoryChips } from "@/components/search-controls"
import { SearchFilterDrawer } from "@/components/search-filter-drawer"
import { SearchFiltersPanel, ActiveFilterChips } from "@/components/search-filters"
import { searchProducts, getCategoryNames, getBrands } from "@/lib/queries"

type SearchParams = {
  q?: string
  category?: string
  sort?: string
  minPrice?: string
  maxPrice?: string
  brands?: string
  minRating?: string
  minDiscount?: string
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams

  const {
    q = "",
    category = "",
    sort = "relevance",
    minPrice,
    maxPrice,
    brands,
    minRating,
    minDiscount,
  } = sp

  const brandsArr = brands ? brands.split(",").filter(Boolean) : []

  const [products, categories, allBrands] = await Promise.all([
    searchProducts({
      query: q,
      category,
      sort: sort as "relevance" | "price-asc" | "price-desc" | "rating" | "discount",
      minPrice:    minPrice    ? Number(minPrice)    : undefined,
      maxPrice:    maxPrice    ? Number(maxPrice)    : undefined,
      brands:      brandsArr.length > 0 ? brandsArr : undefined,
      minRating:   minRating   ? Number(minRating)   : undefined,
      minDiscount: minDiscount ? Number(minDiscount) : undefined,
    }),
    getCategoryNames(),
    getBrands(category || undefined),
  ])

  const heading = q
    ? `Results for "${q}"`
    : category
    ? category
    : "All Products"

  const hasActiveFilters =
    minPrice || maxPrice || brands || minRating || minDiscount

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-4">
        <div className="flex gap-4">

          {/* ── Desktop filter sidebar ── */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-4 rounded-xl border border-border bg-card p-4">
              {/* Department */}
              <div className="border-b border-border pb-3">
                <h2 className="mb-2 text-sm font-bold text-foreground">Department</h2>
                <Suspense>
                  <CategoryChips categories={categories} active={category} />
                </Suspense>
              </div>
              {/* All other filters */}
              <div className="pt-1">
                <Suspense>
                  <SearchFiltersPanel brands={allBrands} />
                </Suspense>
              </div>
            </div>
          </aside>

          {/* ── Results area ── */}
          <div className="min-w-0 flex-1">

            {/* Results header bar */}
            <div className="mb-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-base font-bold text-balance text-foreground sm:text-lg">
                    {heading}
                  </h1>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {products.length} result{products.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Mobile filter button */}
                  <div className="lg:hidden">
                    <Suspense>
                      <SearchFilterDrawer
                        categories={categories}
                        active={category}
                        brands={allBrands}
                      />
                    </Suspense>
                  </div>
                  <Suspense>
                    <SortSelect current={sort} />
                  </Suspense>
                </div>
              </div>

              {/* Active filter chips */}
              {hasActiveFilters && (
                <div className="mt-2.5 border-t border-border pt-2.5">
                  <Suspense>
                    <ActiveFilterChips current={sp} />
                  </Suspense>
                </div>
              )}
            </div>

            {/* Product grid or empty state */}
            {products.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card py-20 text-center">
                <SearchX className="h-14 w-14 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-lg font-semibold text-foreground">No results found</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Try adjusting your filters, changing the search term, or browsing a different
                    category.
                  </p>
                </div>
                {hasActiveFilters && (
                  <a
                    href={`/search?${q ? `q=${encodeURIComponent(q)}` : ""}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
                    className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    Clear all filters
                  </a>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
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

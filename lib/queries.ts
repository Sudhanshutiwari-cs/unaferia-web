import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { Product, ShopCategory } from "@/lib/mock-data"
import { productHref } from "@/lib/slug"

type ProductRow = {
  id: string
  title: string
  slug: string
  thumbnail: string
  category: string | null
  sub_category: string | null
  price: number | string
  compare_price: number | string | null
  rating: number | string | null
  total_reviews: number | null
  is_featured: boolean | null
  created_at: string
}

function toNum(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0
  return typeof v === "number" ? v : Number(v)
}

// Map a DB product row to the UI Product shape used by ProductCard.
function mapProduct(row: ProductRow): Product {
  const price = toNum(row.price)
  const mrp = toNum(row.compare_price) || price
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0
  return {
    id: row.slug,
    productId: row.id, // real UUID — used for wishlist toggling
    name: row.title,
    image: row.thumbnail || "/placeholder.svg",
    price,
    mrp,
    discount,
    rating: toNum(row.rating),
    ratingCount: row.total_reviews ?? 0,
    category: row.category ?? undefined,
    subCategory: row.sub_category ?? undefined,
    href: productHref({ category: row.category, subCategory: row.sub_category, slug: row.slug }),
  }
}

const PRODUCT_COLUMNS =
  "id, title, slug, thumbnail, category, sub_category, price, compare_price, rating, total_reviews, is_featured, created_at"

// Recommended deals: admin-flagged products shown in the homepage deal shelf.
export type RecommendedDeal = Product & {
  dealDiscount: number // final effective discount % to show on the badge
}

export async function getRecommendedDeals(): Promise<RecommendedDeal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS + ", is_deal, deal_discount")
    .eq("is_active", true)
    .eq("is_deal", true)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error || !data) {
    console.log("[v0] getRecommendedDeals error:", error?.message)
    return []
  }

  return (data as unknown as (ProductRow & { is_deal: boolean; deal_discount: number | null })[]).map((row) => {
    const base = mapProduct(row)
    // Admin-set deal_discount takes priority over computed discount
    const dealDiscount = row.deal_discount != null ? row.deal_discount : base.discount
    return { ...base, dealDiscount }
  })
}

// Deals of the Day: products with the biggest discount.
export async function getDeals(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .order("compare_price", { ascending: false })
    .limit(12)

  if (error || !data) {
    console.log("[v0] getDeals error:", error?.message)
    return []
  }
  return (data as ProductRow[])
    .map(mapProduct)
    .filter((p) => p.discount > 0)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 8)
}

// Best Sellers: featured products, most reviewed first.
export async function getBestSellers(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .order("total_reviews", { ascending: false })
    .limit(8)

  if (error || !data) {
    console.log("[v0] getBestSellers error:", error?.message)
    return []
  }
  return (data as ProductRow[]).map(mapProduct)
}

// All products for the admin products table (newest first, including inactive).
export async function getAllProducts(): Promise<(Product & { _active: boolean })[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS + ", is_active, is_deal, deal_discount")
    .order("created_at", { ascending: false })

  if (error || !data) {
    console.log("[v0] getAllProducts error:", error?.message)
    return []
  }
  return (data as unknown as (ProductRow & { is_active: boolean | null; is_deal: boolean | null; deal_discount: number | null })[]).map((row) => ({
    ...mapProduct(row),
    _active: row.is_active !== false,
    isDeal: row.is_deal ?? false,
    dealDiscount: row.deal_discount ?? null,
  }))
}

// Shop-by-category circles.
export async function getShopCategories(): Promise<ShopCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("name, image, display_order")
    .is("parent_id", null)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(8)

  if (error || !data) {
    console.log("[v0] getShopCategories error:", error?.message)
    return []
  }

  const CATEGORY_IMAGES: Record<string, string> = {
    "electronics": "/images/cat-electronics.png",
    "mobiles": "/images/cat-mobiles.png",
    "mobiles & accessories": "/images/cat-mobiles.png",
    "computers": "/images/cat-computers.png",
    "computers & accessories": "/images/cat-computers.png",
    "video games": "/images/cat-videogames.png",
    "cameras": "/images/cat-cameras.png",
    "audio": "/images/cat-audio.png",
    "musical instruments": "/images/cat-musical.png",
    "office products": "/images/cat-office.png",
    "fashion": "/images/cat-fashion.png",
    "home & kitchen": "/images/cat-home.png",
    "beauty": "/images/cat-beauty.png",
    "sports": "/images/cat-sports.png",
    "books": "/images/cat-books.png",
    "automotive": "/images/cat-automotive.png",
  }

  return data.map((c) => {
    const name = c.name as string
    const dbImage = c.image as string | null
    const fallback = CATEGORY_IMAGES[name.toLowerCase()] ?? "/images/cat-electronics.png"
    return { name, image: dbImage || fallback }
  })
}

// -----------------------------------------------------------------------------
// Product detail
// -----------------------------------------------------------------------------

// A spec value is either a single string (flat) or a group of key/value pairs (nested).
export type SpecValue = string | Record<string, string>

export type ProductDetail = Product & {
  productId: string
  description: string
  brand: string
  category: string
  subCategory: string
  stock: number
  images: string[]
  features: string[]
  specifications: Record<string, SpecValue> | null
  boxContents: string[]
}

const DETAIL_COLUMNS =
  "id, title, slug, description, brand, category, sub_category, thumbnail, images, features, specifications, box_contents, price, compare_price, stock, rating, total_reviews, is_featured, created_at"

type DetailRow = ProductRow & {
  description: string | null
  brand: string | null
  images: string[] | null
  features: string[] | null
  specifications: Record<string, SpecValue> | null
  box_contents: string[] | null
  stock: number | null
}

function mapDetail(row: DetailRow): ProductDetail {
  const base = mapProduct(row)
  const gallery = (row.images && row.images.length > 0 ? row.images : [row.thumbnail]).filter(Boolean) as string[]
  return {
    ...base,
    productId: row.id,
    description: row.description || "",
    brand: row.brand || "",
    category: row.category || "",
    subCategory: row.sub_category || "",
    stock: row.stock ?? 0,
    images: gallery,
    features: row.features || [],
    specifications: row.specifications,
    boxContents: row.box_contents || [],
  }
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(DETAIL_COLUMNS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()

  if (error || !data) {
    console.log("[v0] getProductBySlug error:", error?.message)
    return null
  }
  return mapDetail(data as DetailRow)
}

// Related products from the same sub-category (falls back to category), excludes current slug.
export async function getRelatedProducts(
  category: string,
  excludeSlug: string,
  subCategory?: string,
): Promise<Product[]> {
  const supabase = await createClient()
  let q = supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .neq("slug", excludeSlug)

  if (subCategory) q = q.eq("sub_category", subCategory)
  else q = q.eq("category", category)

  const { data, error } = await q.limit(6)
  if (error || !data) return []
  return (data as ProductRow[]).map(mapProduct)
}

// -----------------------------------------------------------------------------
// Reviews
// -----------------------------------------------------------------------------

export type ProductReview = {
  id: string
  rating: number
  title: string
  comment: string
  reviewerName: string
  isVerified: boolean
  createdAt: string
}

export type ReviewSummary = {
  average: number
  total: number
  // Count of reviews for each star level, index 0 = 1 star ... index 4 = 5 stars.
  distribution: [number, number, number, number, number]
}

export async function getProductReviews(
  productId: string,
): Promise<{ reviews: ProductReview[]; summary: ReviewSummary }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, title, comment, reviewer_name, is_verified, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })

  const empty: ReviewSummary = { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] }
  if (error || !data) {
    if (error) console.log("[v0] getProductReviews error:", error.message)
    return { reviews: [], summary: empty }
  }

  const reviews: ProductReview[] = data.map((r) => ({
    id: r.id as string,
    rating: (r.rating as number) ?? 0,
    title: (r.title as string) || "",
    comment: (r.comment as string) || "",
    reviewerName: (r.reviewer_name as string) || "Unaferia Customer",
    isVerified: Boolean(r.is_verified),
    createdAt: r.created_at as string,
  }))

  const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0]
  let sum = 0
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) distribution[r.rating - 1] += 1
    sum += r.rating
  }
  const total = reviews.length
  const average = total > 0 ? sum / total : 0
  return { reviews, summary: { average, total, distribution } }
}

// -----------------------------------------------------------------------------
// Search & category browsing
// -----------------------------------------------------------------------------

export type SearchOpts = {
  query?: string
  category?: string
  sort?: "relevance" | "price-asc" | "price-desc" | "rating" | "discount"
  minPrice?: number
  maxPrice?: number
  brands?: string[]   // comma-separated in URL, array here
  minRating?: number  // 1-5
  minDiscount?: number // 0-75 (percent)
}

export async function searchProducts(opts: SearchOpts): Promise<Product[]> {
  const supabase = await createClient()
  let q = supabase.from("products").select(PRODUCT_COLUMNS).eq("is_active", true)

  // Full-text / partial match on title, brand, category
  if (opts.query && opts.query.trim()) {
    const term = opts.query.trim()
    q = q.or(`title.ilike.%${term}%,brand.ilike.%${term}%,category.ilike.%${term}%,sub_category.ilike.%${term}%`)
  }
  if (opts.category && opts.category !== "All") {
    q = q.ilike("category", opts.category)
  }

  // Price range
  if (opts.minPrice != null && opts.minPrice > 0) {
    q = q.gte("price", opts.minPrice)
  }
  if (opts.maxPrice != null && opts.maxPrice > 0) {
    q = q.lte("price", opts.maxPrice)
  }

  // Brand filter (multi-select OR)
  if (opts.brands && opts.brands.length > 0) {
    q = q.in("brand", opts.brands)
  }

  // Minimum rating
  if (opts.minRating != null && opts.minRating > 0) {
    q = q.gte("rating", opts.minRating)
  }

  // Sort
  if (opts.sort === "price-asc")   q = q.order("price",         { ascending: true })
  else if (opts.sort === "price-desc") q = q.order("price",     { ascending: false })
  else if (opts.sort === "rating") q = q.order("rating",        { ascending: false })
  else if (opts.sort === "discount") q = q.order("compare_price", { ascending: false })
  else                             q = q.order("total_reviews", { ascending: false })

  const { data, error } = await q.limit(120)
  if (error || !data) {
    console.log("[v0] searchProducts error:", error?.message)
    return []
  }

  let results = (data as ProductRow[]).map(mapProduct)

  // Discount filter is post-processed (no DB column for computed discount %)
  if (opts.minDiscount != null && opts.minDiscount > 0) {
    results = results.filter((p) => p.discount >= opts.minDiscount!)
  }

  return results
}

// All distinct brands — used to populate the brand filter list.
export async function getBrands(category?: string): Promise<string[]> {
  const supabase = await createClient()
  let q = supabase
    .from("products")
    .select("brand")
    .eq("is_active", true)
    .not("brand", "is", null)
    .neq("brand", "")

  if (category && category !== "All") {
    q = q.ilike("category", category)
  }

  const { data, error } = await q.order("brand", { ascending: true })
  if (error || !data) return []

  // Deduplicate
  const seen = new Set<string>()
  const brands: string[] = []
  for (const row of data as { brand: string }[]) {
    if (row.brand && !seen.has(row.brand)) {
      seen.add(row.brand)
      brands.push(row.brand)
    }
  }
  return brands
}

// Category names for filter chips.
export async function getCategoryNames(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("name, display_order")
    .is("parent_id", null)
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  if (error || !data) return []
  return data.map((c) => c.name as string)
}

// Single category by slug (returns the row + its parent info).
export type CategoryInfo = {
  id: string
  name: string
  slug: string
  parentId: string | null
  parentName: string | null
  parentSlug: string | null
  children: { id: string; name: string; slug: string }[]
}

export async function getCategoryBySlug(slug: string): Promise<CategoryInfo | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, is_active")
    .eq("is_active", true)

  if (error || !data) {
    console.log("[v0] getCategoryBySlug error:", error?.message)
    return null
  }

  type Row = { id: string; name: string; slug: string; parent_id: string | null }
  const rows = data as Row[]
  const cat = rows.find((r) => r.slug === slug)
  if (!cat) return null

  const parent = cat.parent_id ? rows.find((r) => r.id === cat.parent_id) ?? null : null
  const children = rows.filter((r) => r.parent_id === cat.id)

  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parentId: cat.parent_id,
    parentName: parent?.name ?? null,
    parentSlug: parent?.slug ?? null,
    children: children.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
  }
}

// Products for a category page.
// categoryIds: all category IDs to include (parent + all its children, or just a single subcategory).
export async function getProductsByCategory(opts: {
  categoryIds: string[]
  sort?: "relevance" | "price-asc" | "price-desc" | "rating"
}): Promise<Product[]> {
  if (opts.categoryIds.length === 0) return []

  const supabase = await createClient()

  let q = supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .in("category_id", opts.categoryIds)

  if (opts.sort === "price-asc") q = q.order("price", { ascending: true })
  else if (opts.sort === "price-desc") q = q.order("price", { ascending: false })
  else if (opts.sort === "rating") q = q.order("rating", { ascending: false })
  else q = q.order("total_reviews", { ascending: false })

  const { data, error } = await q.limit(120)
  if (error || !data) {
    console.log("[v0] getProductsByCategory error:", error?.message)
    return []
  }
  return (data as ProductRow[]).map(mapProduct)
}

// Full category tree: top-level categories each with their subcategories.
export type CategoryMenuItem = {
  name: string
  slug: string
  children: { name: string; slug: string }[]
}

export async function getCategoryMenu(): Promise<CategoryMenuItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, display_order, is_active")
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  if (error || !data) {
    console.log("[v0] getCategoryMenu error:", error?.message)
    return []
  }

  type Row = { id: string; name: string; slug: string; parent_id: string | null }
  const rows = data as Row[]
  const parents = rows.filter((r) => r.parent_id === null)
  return parents.map((p) => ({
    name: p.name,
    slug: p.slug,
    children: rows
      .filter((r) => r.parent_id === p.id)
      .map((c) => ({ name: c.name, slug: c.slug })),
  }))
}

// Seeds products from a JSON file into Supabase using the service-role key.
// Usage: node scripts/seed-products.mjs scripts/data/<file>.json
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("[seed] Missing Supabase env vars")
  process.exit(1)
}

const file = process.argv[2]
if (!file) {
  console.error("[seed] Usage: node scripts/seed-products.mjs <path-to-json>")
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const items = JSON.parse(readFileSync(file, "utf8"))

// Resolve category_id for each subcategory slug up front.
const subSlugs = [...new Set(items.map((i) => i.subSlug))]
const { data: cats, error: catErr } = await supabase
  .from("categories")
  .select("id, slug")
  .in("slug", subSlugs)

if (catErr) {
  console.error("[seed] Failed to load categories:", catErr.message)
  process.exit(1)
}
const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]))

const missing = subSlugs.filter((s) => !catBySlug[s])
if (missing.length) {
  console.error("[seed] No category found for subSlugs:", missing.join(", "))
  process.exit(1)
}

const rows = items.map((i) => ({
  title: i.title,
  slug: i.slug,
  description: i.description,
  category: i.category,
  sub_category: i.subCategory,
  brand: i.brand,
  price: i.price,
  compare_price: i.comparePrice,
  stock: i.stock ?? 100,
  thumbnail: `/products/${i.subSlug}.png`,
  images: [`/products/${i.subSlug}.png`],
  features: i.features,
  specifications: i.specifications,
  box_contents: i.boxContents,
  rating: i.rating ?? 4.2,
  total_reviews: i.reviews ?? 0,
  is_featured: i.featured ?? false,
  is_active: true,
  category_id: catBySlug[i.subSlug],
}))

const { error } = await supabase.from("products").upsert(rows, { onConflict: "slug" })
if (error) {
  console.error("[seed] Insert error:", error.message)
  process.exit(1)
}

const { count } = await supabase.from("products").select("id", { count: "exact", head: true })
console.log(`[seed] Inserted ${rows.length} products from ${file}. Total products now: ${count}`)

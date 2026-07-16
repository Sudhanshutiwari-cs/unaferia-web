"use server"

import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/lib/mock-data"
import { productHref } from "@/lib/slug"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WishlistProduct = Product & { wishlistId: string }

// ---------------------------------------------------------------------------
// Get all wishlist items for the logged-in user (joined with products)
// ---------------------------------------------------------------------------

export async function getWishlistItems(): Promise<WishlistProduct[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("wishlist_items")
    .select(
      `id, created_at,
       products (
         id, title, slug, thumbnail, category, sub_category,
         price, compare_price, rating, total_reviews
       )`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error || !data) {
    console.error("[wishlist] getWishlistItems error:", error?.message)
    return []
  }

  const results: WishlistProduct[] = []
  for (const row of data as any[]) {
    const p = row.products
    if (!p) continue
    const price = Number(p.price) || 0
    const mrp = Number(p.compare_price) || price
    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0
    results.push({
      wishlistId: row.id as string,
      id: p.slug as string,
      name: p.title as string,
      image: (p.thumbnail as string) || "/placeholder.svg",
      price,
      mrp,
      discount,
      rating: Number(p.rating) || 0,
      ratingCount: (p.total_reviews as number) ?? 0,
      category: (p.category as string) ?? undefined,
      subCategory: (p.sub_category as string) ?? undefined,
      href: productHref({
        category: p.category,
        subCategory: p.sub_category,
        slug: p.slug,
      }),
    })
  }
  return results
}

// ---------------------------------------------------------------------------
// Get the set of product UUIDs that the user has wishlisted
// (used client-side to quickly check if a product is wishlisted)
// ---------------------------------------------------------------------------

export async function getWishlistedProductIds(): Promise<string[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("user_id", user.id)

  if (error || !data) return []
  return (data as { product_id: string }[]).map((r) => r.product_id)
}

// ---------------------------------------------------------------------------
// Toggle a product in/out of the wishlist. Returns the new wishlisted state.
// productId here is the real UUID from the products table.
// ---------------------------------------------------------------------------

export async function toggleWishlistItem(productId: string): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  // Check if already wishlisted
  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle()

  if (existing) {
    await supabase.from("wishlist_items").delete().eq("id", existing.id)
    return false // removed
  } else {
    await supabase
      .from("wishlist_items")
      .insert({ user_id: user.id, product_id: productId })
    return true // added
  }
}

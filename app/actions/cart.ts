"use server"

import { createClient } from "@/lib/supabase/server"

export type DbCartItem = {
  id: string
  product_id: string
  quantity: number
  variant: Record<string, string> | null
  products: {
    id: string
    title: string
    slug: string
    thumbnail: string | null
    price: number
    compare_price: number | null
    category: string | null
    sub_category: string | null
  } | null
}

// ── Fetch all cart items for the logged-in user ─────────────────────────────
export async function getDbCartItems(): Promise<DbCartItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      id,
      product_id,
      quantity,
      variant,
      products (
        id, title, slug, thumbnail, price, compare_price,
        category, sub_category
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[cart] getDbCartItems error:", error.message)
    return []
  }
  return (data as unknown as DbCartItem[]) ?? []
}

// ── Upsert a cart item (insert or update quantity) ──────────────────────────
export async function upsertCartItem(
  productId: string,
  quantity: number,
  variant?: Record<string, string> | null,
): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  // Find existing row for this product+variant combo
  let query = supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)

  if (variant && Object.keys(variant).length > 0) {
    query = query.eq("variant", variant as any)
  } else {
    query = query.is("variant", null)
  }

  const { data: existing } = await query.maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
    return { ok: !error }
  }

  const { error } = await supabase
    .from("cart_items")
    .insert({
      user_id: user.id,
      product_id: productId,
      quantity,
      variant: variant && Object.keys(variant).length > 0 ? variant : null,
    })
  return { ok: !error }
}

// ── Remove a single cart item by product_id ─────────────────────────────────
export async function removeCartItem(
  productId: string,
  variant?: Record<string, string> | null,
): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  let query = supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId)

  if (variant && Object.keys(variant).length > 0) {
    query = query.eq("variant", variant as any)
  }

  const { error } = await query
  return { ok: !error }
}

// ── Replace the entire cart in DB (used for merging local → DB on login) ────
export async function replaceDbCart(
  items: Array<{ productId: string; quantity: number; variant?: Record<string, string> | null }>,
): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  // Delete all existing
  await supabase.from("cart_items").delete().eq("user_id", user.id)

  if (items.length === 0) return { ok: true }

  const rows = items.map((i) => ({
    user_id: user.id,
    product_id: i.productId,
    quantity: i.quantity,
    variant: i.variant && Object.keys(i.variant).length > 0 ? i.variant : null,
  }))

  const { error } = await supabase.from("cart_items").insert(rows)
  return { ok: !error }
}

// ── Clear the entire cart ────────────────────────────────────────────────────
export async function clearDbCart(): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)
  return { ok: !error }
}

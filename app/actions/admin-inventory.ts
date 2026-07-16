"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"

export type InventoryRow = {
  id: string
  title: string
  sku: string | null
  thumbnail: string | null
  category: string | null
  brand: string | null
  stock: number
  price: number
  cost_price: number | null
  is_active: boolean
  updated_at: string
}

export async function getInventory(): Promise<InventoryRow[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("products")
    .select("id, title, sku, thumbnail, category, brand, stock, price, cost_price, is_active, updated_at")
    .order("title", { ascending: true })
  return (data as InventoryRow[]) ?? []
}

export async function updateStock(id: string, stock: number): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("products")
    .update({ stock, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/inventory")
  revalidatePath("/admin/products")
  return { ok: true }
}

export async function bulkUpdateStock(
  updates: { id: string; stock: number }[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const results = await Promise.all(
    updates.map((u) =>
      supabase.from("products").update({ stock: u.stock, updated_at: now }).eq("id", u.id)
    )
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, error: failed.error.message }
  revalidatePath("/admin/inventory")
  return { ok: true }
}

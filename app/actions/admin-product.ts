"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"

// ------------------------------------------------------------------ types ---

export type ProductFormData = {
  title: string
  slug: string
  description: string
  brand: string
  category: string
  sub_category: string
  sku: string
  price: number
  compare_price: number | null
  cost_price: number | null
  stock: number
  thumbnail: string
  images: string[]
  features: string[]
  box_contents: string[]
  specifications: Record<string, string>
  is_active: boolean
  is_featured: boolean
  meta_title: string
  meta_description: string
  meta_keywords: string
  weight: number | null
}

export type ProductEditRow = ProductFormData & { id: string; created_at: string }

// ---------------------------------------------------- fetch for edit form ---

export async function getProductForEdit(id: string): Promise<ProductEditRow | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, slug, description, brand, category, sub_category, sku, price, compare_price, cost_price, stock, thumbnail, images, features, box_contents, specifications, is_active, is_featured, meta_title, meta_description, meta_keywords, weight, created_at",
    )
    .eq("id", id)
    .single()

  if (error || !data) {
    console.log("[v0] getProductForEdit error:", error?.message)
    return null
  }

  const row = data as Record<string, unknown>
  // Flatten specifications from nested jsonb to flat Record<string,string>
  const rawSpecs = (row.specifications ?? {}) as Record<string, unknown>
  const flatSpecs: Record<string, string> = {}
  for (const [k, v] of Object.entries(rawSpecs)) {
    flatSpecs[k] = typeof v === "object" ? JSON.stringify(v) : String(v ?? "")
  }

  return {
    id: row.id as string,
    title: (row.title as string) ?? "",
    slug: (row.slug as string) ?? "",
    description: (row.description as string) ?? "",
    brand: (row.brand as string) ?? "",
    category: (row.category as string) ?? "",
    sub_category: (row.sub_category as string) ?? "",
    sku: (row.sku as string) ?? "",
    price: Number(row.price ?? 0),
    compare_price: row.compare_price != null ? Number(row.compare_price) : null,
    cost_price: row.cost_price != null ? Number(row.cost_price) : null,
    stock: Number(row.stock ?? 0),
    thumbnail: (row.thumbnail as string) ?? "",
    images: (row.images as string[]) ?? [],
    features: (row.features as string[]) ?? [],
    box_contents: (row.box_contents as string[]) ?? [],
    specifications: flatSpecs,
    is_active: Boolean(row.is_active ?? true),
    is_featured: Boolean(row.is_featured ?? false),
    meta_title: (row.meta_title as string) ?? "",
    meta_description: (row.meta_description as string) ?? "",
    meta_keywords: (row.meta_keywords as string) ?? "",
    weight: row.weight != null ? Number(row.weight) : null,
    created_at: (row.created_at as string) ?? "",
  }
}

// ------------------------------------------------------------- update product ---

export async function updateProduct(
  id: string,
  data: ProductFormData,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // Re-expand flat spec Record<string,string> back into jsonb
  const specEntries = Object.entries(data.specifications).filter(([k]) => k.trim())
  const specifications =
    specEntries.length > 0 ? Object.fromEntries(specEntries) : null

  const { error } = await supabase
    .from("products")
    .update({
      title: data.title.trim(),
      slug: data.slug.trim(),
      description: data.description.trim(),
      brand: data.brand.trim(),
      category: data.category.trim(),
      sub_category: data.sub_category.trim(),
      sku: data.sku.trim() || null,
      price: data.price,
      compare_price: data.compare_price || null,
      cost_price: data.cost_price || null,
      stock: data.stock,
      thumbnail: data.thumbnail.trim(),
      images: data.images.filter(Boolean),
      features: data.features.filter(Boolean),
      box_contents: data.box_contents.filter(Boolean),
      specifications,
      is_active: data.is_active,
      is_featured: data.is_featured,
      meta_title: data.meta_title.trim() || null,
      meta_description: data.meta_description.trim() || null,
      meta_keywords: data.meta_keywords.trim() || null,
      weight: data.weight || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.log("[v0] updateProduct error:", error.message)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/products")
  revalidatePath(`/admin/products/${id}`)
  revalidatePath("/")
  return { success: true }
}

// ------------------------------------------------------------- create product ---

export async function createProduct(
  data: ProductFormData,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = createAdminClient()

  const specEntries = Object.entries(data.specifications).filter(([k]) => k.trim())
  const specifications =
    specEntries.length > 0 ? Object.fromEntries(specEntries) : null

  const { data: row, error } = await supabase
    .from("products")
    .insert({
      title: data.title.trim(),
      slug: data.slug.trim(),
      description: data.description.trim(),
      brand: data.brand.trim(),
      category: data.category.trim(),
      sub_category: data.sub_category.trim(),
      sku: data.sku.trim() || null,
      price: data.price,
      compare_price: data.compare_price || null,
      cost_price: data.cost_price || null,
      stock: data.stock,
      thumbnail: data.thumbnail.trim(),
      images: data.images.filter(Boolean),
      features: data.features.filter(Boolean),
      box_contents: data.box_contents.filter(Boolean),
      specifications,
      is_active: data.is_active,
      is_featured: data.is_featured,
      meta_title: data.meta_title.trim() || null,
      meta_description: data.meta_description.trim() || null,
      meta_keywords: data.meta_keywords.trim() || null,
      weight: data.weight || null,
    })
    .select("id")
    .single()

  if (error) {
    console.log("[v0] createProduct error:", error.message)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/products")
  revalidatePath("/")
  return { success: true, id: (row as { id: string }).id }
}

// ------------------------------------------------------------- delete product ---

export async function deleteProduct(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) {
    console.log("[v0] deleteProduct error:", error.message)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/products")
  revalidatePath("/")
  return { success: true }
}

// ------------------------------------------------- toggle active / featured ---

export async function toggleProductFeatured(
  id: string,
  is_featured: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("products")
    .update({ is_featured, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  revalidatePath("/admin/products")
  return { success: true }
}

export async function toggleProductActive(
  id: string,
  is_active: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("products")
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  revalidatePath("/admin/products")
  return { success: true }
}

// ------------------------------------------------------------ deal flagging ---

export async function toggleProductDeal(
  id: string,
  is_deal: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("products")
    .update({ is_deal, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  revalidatePath("/admin/products")
  revalidatePath("/")
  return { success: true }
}

export async function setDealDiscount(
  id: string,
  deal_discount: number | null,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("products")
    .update({ deal_discount, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  revalidatePath("/admin/products")
  revalidatePath("/")
  return { success: true }
}

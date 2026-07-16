"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SeoPage = {
  id: string
  page_slug: string
  page_label: string
  meta_title: string
  meta_description: string
  meta_keywords: string
  og_image: string | null
  updated_at: string
}

export type CategorySeoRow = {
  id: string
  name: string
  slug: string
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
}

export type ProductSeoRow = {
  id: string
  title: string
  slug: string
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
}

// ---------------------------------------------------------------------------
// Static Pages
// ---------------------------------------------------------------------------

export async function getSeoPages(): Promise<SeoPage[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("seo_pages")
    .select("*")
    .order("page_label", { ascending: true })
  return (data as SeoPage[]) ?? []
}

export async function updateSeoPage(
  pageSlug: string,
  payload: {
    meta_title: string
    meta_description: string
    meta_keywords: string
    og_image?: string | null
  },
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("seo_pages")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("page_slug", pageSlug)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  revalidatePath(`/${pageSlug === "home" ? "" : pageSlug}`)
  revalidatePath("/admin/seo")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategoriesSeo(): Promise<CategorySeoRow[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, meta_title, meta_description, meta_keywords")
    .order("name", { ascending: true })
  return (data as CategorySeoRow[]) ?? []
}

export async function updateCategorySeo(
  categoryId: string,
  payload: {
    meta_title: string
    meta_description: string
    meta_keywords: string
  },
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("categories")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", categoryId)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/category/[slug]", "page")
  revalidatePath("/admin/seo")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function getProductsSeo(): Promise<ProductSeoRow[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("products")
    .select("id, title, slug, meta_title, meta_description, meta_keywords")
    .order("title", { ascending: true })
  return (data as ProductSeoRow[]) ?? []
}

export async function updateProductSeo(
  productId: string,
  payload: {
    meta_title: string
    meta_description: string
    meta_keywords: string
  },
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("products")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", productId)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/[category]/[subcategory]/[slug]", "page")
  revalidatePath("/admin/seo")
  return { ok: true }
}

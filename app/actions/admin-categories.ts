"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  icon: string | null
  parent_id: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export type Brand = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  is_active: boolean
  created_at: string
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true })
  return (data as Category[]) ?? []
}

export async function upsertCategory(cat: Partial<Category> & { name: string }): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  const payload = { ...cat, slug, updated_at: new Date().toISOString() }
  const { error } = cat.id
    ? await supabase.from("categories").update(payload).eq("id", cat.id)
    : await supabase.from("categories").insert({ ...payload, created_at: new Date().toISOString() })
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/categories")
  return { ok: true }
}

export async function deleteCategory(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/categories")
  return { ok: true }
}

export async function getBrands(): Promise<Brand[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true })
    .limit(200)
  return (data as Brand[]) ?? []
}

export async function upsertBrand(brand: Partial<Brand> & { name: string }): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const slug = brand.slug || brand.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  const payload = { ...brand, slug, updated_at: new Date().toISOString() }
  const { error } = brand.id
    ? await supabase.from("brands").update(payload).eq("id", brand.id)
    : await supabase.from("brands").insert({ ...payload, created_at: new Date().toISOString() })
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/categories")
  return { ok: true }
}

export async function deleteBrand(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("brands").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/categories")
  return { ok: true }
}

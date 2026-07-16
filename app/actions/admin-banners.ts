"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type Banner = {
  id: string
  title: string
  subtitle: string | null
  button_label: string | null
  button_url: string | null
  image_url: string | null
  bg_color: string
  text_color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

// Public — used on the storefront
export async function getActiveBanners(): Promise<Banner[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.log("[v0] getActiveBanners error:", error.message)
    return []
  }
  return (data ?? []) as Banner[]
}

// Admin — all banners including inactive
export async function getAllBanners(): Promise<Banner[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("banners")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.log("[v0] getAllBanners error:", error.message)
    return []
  }
  return (data ?? []) as Banner[]
}

export type BannerFormData = {
  image_url?: string
  bg_color: string
  sort_order: number
  is_active: boolean
}

export async function createBanner(form: BannerFormData): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from("banners").insert({
    ...form,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  revalidatePath("/admin/banners")
  return { ok: true }
}

export async function updateBanner(id: string, form: Partial<BannerFormData>): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from("banners")
    .update({ ...form, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  revalidatePath("/admin/banners")
  return { ok: true }
}

export async function deleteBanner(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from("banners").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  revalidatePath("/admin/banners")
  return { ok: true }
}

export async function toggleBannerActive(id: string, is_active: boolean): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from("banners")
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  revalidatePath("/admin/banners")
  return { ok: true }
}

"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type QuickLink = {
  id: string
  label: string
  icon_url: string | null
  bg_color: string
  href: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type QuickLinkFormData = {
  label: string
  icon_url?: string
  bg_color: string
  href: string
  sort_order: number
  is_active: boolean
}

// Public — storefront
export async function getActiveQuickLinks(): Promise<QuickLink[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("quick_links")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  if (error) return []
  return (data ?? []) as QuickLink[]
}

// Admin — all rows including inactive
export async function getAllQuickLinks(): Promise<QuickLink[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("quick_links")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) return []
  return (data ?? []) as QuickLink[]
}

export async function createQuickLink(form: QuickLinkFormData): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from("quick_links").insert({
    ...form,
    icon_url: form.icon_url || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  revalidatePath("/admin/quick-links")
  return { ok: true }
}

export async function updateQuickLink(
  id: string,
  form: Partial<QuickLinkFormData>,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()
  const payload: Record<string, unknown> = {
    ...form,
    updated_at: new Date().toISOString(),
  }
  if ("icon_url" in form) payload.icon_url = form.icon_url || null
  const { error } = await admin.from("quick_links").update(payload).eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  revalidatePath("/admin/quick-links")
  return { ok: true }
}

export async function deleteQuickLink(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from("quick_links").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  revalidatePath("/admin/quick-links")
  return { ok: true }
}

export async function toggleQuickLinkActive(
  id: string,
  is_active: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from("quick_links")
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  revalidatePath("/admin/quick-links")
  return { ok: true }
}

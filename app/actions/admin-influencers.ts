"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type Influencer = {
  id: string
  name: string
  handle: string
  avatar_url: string | null
  href: string
  bg_color: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type InfluencerFormData = {
  name: string
  handle: string
  avatar_url?: string
  href: string
  bg_color: string
  sort_order: number
  is_active: boolean
}

// Public — storefront (active only, ordered)
export async function getActiveInfluencers(): Promise<Influencer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("influencers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  if (error) return []
  return (data ?? []) as Influencer[]
}

// Admin — all rows
export async function getAllInfluencers(): Promise<Influencer[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("influencers")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) return []
  return (data ?? []) as Influencer[]
}

export async function createInfluencer(
  form: InfluencerFormData,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from("influencers").insert({
    ...form,
    avatar_url: form.avatar_url || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  revalidatePath("/admin/influencers")
  return { ok: true }
}

export async function updateInfluencer(
  id: string,
  form: Partial<InfluencerFormData>,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()
  const payload: Record<string, unknown> = {
    ...form,
    updated_at: new Date().toISOString(),
  }
  if ("avatar_url" in form) payload.avatar_url = form.avatar_url || null
  const { error } = await admin.from("influencers").update(payload).eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  revalidatePath("/admin/influencers")
  return { ok: true }
}

export async function deleteInfluencer(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from("influencers").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  revalidatePath("/admin/influencers")
  return { ok: true }
}

export async function toggleInfluencerActive(
  id: string,
  is_active: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from("influencers")
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/")
  revalidatePath("/admin/influencers")
  return { ok: true }
}

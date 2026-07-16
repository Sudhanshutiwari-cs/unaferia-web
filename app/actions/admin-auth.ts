"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"

export type AdminAuthResult = { ok: true } | { ok: false; error: string }

/** Sign in with email + password and verify the user has is_admin = true. */
export async function signInAdmin(formData: {
  email: string
  password: string
}): Promise<AdminAuthResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
  })

  if (error || !data.user) {
    return { ok: false, error: "Invalid email or password." }
  }

  // Use service-role client so the profile check is never blocked by RLS
  const adminClient = createAdminClient()
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .single()

  if (!profile?.is_admin) {
    await supabase.auth.signOut()
    return { ok: false, error: "Access denied. This account does not have admin privileges." }
  }

  return { ok: true }
}

/** Sign out the current admin session. */
export async function signOutAdmin(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/admin/login")
}

/** Get the currently signed-in admin user (returns null if not authenticated). */
export async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Use service-role client to bypass RLS for the is_admin check
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_admin, full_name, email")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) return null
  return { id: user.id, fullName: profile.full_name, email: profile.email }
}

'use server'

import { createClient } from '@/lib/supabase/server'

export interface ProfileData {
  id: string
  fullName: string
  email: string
  phone: string
  avatarUrl: string | null
  createdAt: string
}

export async function getProfile(): Promise<ProfileData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, avatar_url, created_at')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) {
    // Profile row may not exist yet — build from auth metadata
    return {
      id: user.id,
      fullName: (user.user_metadata?.full_name as string) ?? '',
      email: user.email ?? '',
      phone: (user.user_metadata?.phone as string) ?? '',
      avatarUrl: null,
      createdAt: user.created_at,
    }
  }

  return {
    id: data.id,
    fullName: data.full_name ?? '',
    email: data.email ?? user.email ?? '',
    phone: data.phone ?? (user.user_metadata?.phone as string) ?? '',
    avatarUrl: data.avatar_url ?? null,
    createdAt: data.created_at,
  }
}

export async function updateProfile(input: {
  fullName: string
  phone: string
  email: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const fullName = input.fullName.trim()
  const phone = input.phone.trim()
  const email = input.email.trim()

  if (!fullName) return { ok: false, error: 'Name cannot be empty.' }

  // Upsert into profiles table
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: fullName,
      phone,
      email,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

  if (error) {
    console.log('[v0] updateProfile error:', error.message)
    return { ok: false, error: 'Could not update profile. Please try again.' }
  }

  // Also update auth user metadata so the header picks it up
  await supabase.auth.updateUser({ data: { full_name: fullName, phone } })

  return { ok: true }
}

export async function changePassword(input: {
  currentPassword: string
  newPassword: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  if (input.newPassword.length < 6) {
    return { ok: false, error: 'New password must be at least 6 characters.' }
  }
  if (input.newPassword === input.currentPassword) {
    return { ok: false, error: 'New password must differ from the current one.' }
  }

  const { error } = await supabase.auth.updateUser({ password: input.newPassword })
  if (error) {
    console.log('[v0] changePassword error:', error.message)
    return { ok: false, error: 'Could not update password. Please try again.' }
  }

  return { ok: true }
}

export async function deleteAddressById(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: 'Could not delete address.' }
  return { ok: true }
}

export async function setDefaultAddress(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  // Clear existing default first
  await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', user.id)

  const { error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: 'Could not set default address.' }
  return { ok: true }
}

export async function addAddress(addr: {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  if (!addr.fullName.trim() || !addr.phone.trim() || !addr.addressLine1.trim() || !addr.city.trim() || !addr.state.trim() || !addr.pincode.trim()) {
    return { ok: false, error: 'Please fill all required fields.' }
  }

  const { count } = await supabase
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { error } = await supabase.from('addresses').insert({
    user_id: user.id,
    full_name: addr.fullName.trim(),
    phone: addr.phone.trim(),
    address_line1: addr.addressLine1.trim(),
    address_line2: addr.addressLine2?.trim() || null,
    city: addr.city.trim(),
    state: addr.state.trim(),
    pincode: addr.pincode.trim(),
    country: 'India',
    is_default: (count ?? 0) === 0,
  })

  if (error) {
    console.log('[v0] addAddress error:', error.message)
    return { ok: false, error: 'Could not save address. Please try again.' }
  }
  return { ok: true }
}

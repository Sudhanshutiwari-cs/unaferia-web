'use server'

import { createClient } from '@/lib/supabase/server'

export interface SavedAddress {
  id: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export async function getUserAddresses(): Promise<SavedAddress[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('addresses')
    .select('id, full_name, phone, address_line1, address_line2, city, state, pincode, is_default')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row: any) => ({
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 ?? '',
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    isDefault: row.is_default ?? false,
  }))
}

export async function saveAddressForUser(addr: Omit<SavedAddress, 'id' | 'isDefault'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Check if an identical address already exists — avoid duplicates
  const { data: existing } = await supabase
    .from('addresses')
    .select('id')
    .eq('user_id', user.id)
    .eq('address_line1', addr.addressLine1)
    .eq('pincode', addr.pincode)
    .eq('phone', addr.phone)
    .maybeSingle()

  if (existing) return // already saved — no-op

  // Count existing addresses to decide default
  const { count } = await supabase
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const isFirst = (count ?? 0) === 0

  await supabase.from('addresses').insert({
    user_id: user.id,
    full_name: addr.fullName,
    phone: addr.phone,
    address_line1: addr.addressLine1,
    address_line2: addr.addressLine2 || null,
    city: addr.city,
    state: addr.state,
    pincode: addr.pincode,
    country: 'India',
    is_default: isFirst,
  })
}

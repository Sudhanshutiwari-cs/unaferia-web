'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type Coupon = {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'flat'
  discount_value: number
  min_order_value: number
  max_discount: number | null
  usage_limit: number | null
  used_count: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export type AppliedCoupon = {
  coupon: Coupon
  discountAmount: number
}

// ── Public: validate & calculate discount ──────────────────────────────────
export async function validateCoupon(
  code: string,
  orderSubtotal: number,
): Promise<{ success: true; coupon: Coupon; discountAmount: number } | { success: false; error: string }> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return { success: false, error: 'Coupon not found or no longer valid.' }

  const coupon = data as Coupon

  // Expiry check
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { success: false, error: 'This coupon has expired.' }
  }

  // Start date check
  if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
    return { success: false, error: 'This coupon is not yet active.' }
  }

  // Usage limit check
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return { success: false, error: 'This coupon has reached its usage limit.' }
  }

  // Minimum order check
  if (orderSubtotal < coupon.min_order_value) {
    return {
      success: false,
      error: `Minimum order of ₹${coupon.min_order_value.toLocaleString('en-IN')} required for this coupon.`,
    }
  }

  // Calculate discount
  let discountAmount: number
  if (coupon.discount_type === 'percentage') {
    discountAmount = (orderSubtotal * coupon.discount_value) / 100
    if (coupon.max_discount !== null) {
      discountAmount = Math.min(discountAmount, coupon.max_discount)
    }
  } else {
    discountAmount = coupon.discount_value
  }

  discountAmount = Math.min(discountAmount, orderSubtotal)

  return { success: true, coupon, discountAmount: Math.round(discountAmount) }
}

// ── Admin: list all coupons ────────────────────────────────────────────────
export async function adminGetCoupons(): Promise<Coupon[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as Coupon[]
}

// ── Admin: create coupon ───────────────────────────────────────────────────
export async function adminCreateCoupon(input: {
  code: string
  description: string
  discount_type: 'percentage' | 'flat'
  discount_value: number
  min_order_value: number
  max_discount: number | null
  usage_limit: number | null
  expires_at: string | null
}): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from('coupons').insert({
    ...input,
    code: input.code.trim().toUpperCase(),
    is_active: true,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Admin: toggle active ───────────────────────────────────────────────────
export async function adminToggleCoupon(id: string, is_active: boolean): Promise<void> {
  const admin = createAdminClient()
  await admin.from('coupons').update({ is_active, updated_at: new Date().toISOString() }).eq('id', id)
}

// ── Admin: delete coupon ───────────────────────────────────────────────────
export async function adminDeleteCoupon(id: string): Promise<void> {
  const admin = createAdminClient()
  await admin.from('coupons').delete().eq('id', id)
}

// ── Increment used_count after successful order ────────────────────────────
export async function incrementCouponUsage(couponId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.rpc('increment_coupon_usage', { coupon_id: couponId }).then(async (res) => {
    if (res.error) {
      // Fallback if RPC doesn't exist: read current, then update
      const { data } = await admin.from('coupons').select('used_count').eq('id', couponId).single()
      const current = (data as { used_count: number } | null)?.used_count ?? 0
      await admin.from('coupons').update({ used_count: current + 1 }).eq('id', couponId)
    }
  })
}

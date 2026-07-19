'use server'

import { createClient } from '@/lib/supabase/server'

export interface PendingOrderPayload {
  items: {
    productId: string
    productTitle: string
    productImage: string
    price: number
    quantity: number
  }[]
  shippingAddress: {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
  }
  subtotal: number
  tax: number
  total: number
  couponCode?: string
  couponDiscount?: number
}

export async function createRazorpaySession(payload: PendingOrderPayload) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { success: false as const, error: 'Not authenticated' }

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    return { success: false as const, error: 'Payment gateway is not configured. Please contact support.' }
  }

  const receipt = `SQ${Date.now().toString(36).toUpperCase()}`

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
    },
    body: JSON.stringify({
      amount: Math.round(payload.total * 100), // paise
      currency: 'INR',
      receipt,
      notes: { user_id: user.id },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('[create-razorpay-session] Razorpay API error:', errText)
    return { success: false as const, error: 'Payment gateway error. Please try again.' }
  }

  const rz = await res.json()

  return {
    success: true as const,
    razorpayOrderId: rz.id as string,
    receipt,
  }
}

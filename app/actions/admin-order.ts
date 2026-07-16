'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export type OrderDetailStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type OrderDetail = {
  id: string
  order_number: string
  status: OrderDetailStatus
  payment_status: string
  payment_method: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  coupon_code: string | null
  shipping_address: {
    fullName?: string
    phone?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    pincode?: string
  } | null
  tracking_carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  estimated_delivery: string | null
  admin_notes: string | null
  placed_at: string | null
  created_at: string
  user_id: string | null
  order_items: {
    id: string
    product_title: string
    product_image: string | null
    price: number
    quantity: number
    subtotal: number
  }[]
  customer: {
    full_name: string | null
    email: string | null
    phone: string | null
  } | null
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail | null> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('orders')
    .select(`
      id, order_number, status, payment_status, payment_method,
      subtotal, discount, tax, total, coupon_code,
      shipping_address, tracking_carrier, tracking_number,
      tracking_url, estimated_delivery, admin_notes,
      placed_at, created_at, user_id,
      order_items(id, product_title, product_image, price, quantity, subtotal)
    `)
    .eq('id', orderId)
    .single()

  if (error || !data) return null

  // Fetch customer profile separately
  let customer = null
  if (data.user_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', data.user_id)
      .single()
    customer = profile ?? null
  }

  return { ...(data as Omit<OrderDetail, 'customer'>), customer }
}

export type ProcessOrderInput = {
  orderId: string
  status: OrderDetailStatus
  trackingCarrier?: string
  trackingNumber?: string
  trackingUrl?: string
  estimatedDelivery?: string
  adminNotes?: string
  paymentStatus?: string
}

export async function processOrder(input: ProcessOrderInput): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()

  const updates: Record<string, unknown> = {
    status: input.status,
    updated_at: new Date().toISOString(),
  }

  if (input.trackingCarrier !== undefined) updates.tracking_carrier = input.trackingCarrier || null
  if (input.trackingNumber  !== undefined) updates.tracking_number  = input.trackingNumber  || null
  if (input.trackingUrl     !== undefined) updates.tracking_url     = input.trackingUrl     || null
  if (input.adminNotes      !== undefined) updates.admin_notes      = input.adminNotes      || null
  if (input.paymentStatus   !== undefined) updates.payment_status   = input.paymentStatus
  if (input.estimatedDelivery !== undefined) {
    updates.estimated_delivery = input.estimatedDelivery || null
  }

  // Set delivered_at timestamp when marking as delivered
  if (input.status === 'delivered') {
    updates.delivered_at = new Date().toISOString()
  }

  const { error } = await admin
    .from('orders')
    .update(updates)
    .eq('id', input.orderId)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/orders')
  revalidatePath('/orders')
  return { ok: true }
}

// Updated getAdminOrders that includes tracking + new statuses
export type AdminOrderRow = {
  id: string
  order_number: string
  customer: string
  email: string
  phone: string
  date: string
  items: number
  total: number
  status: OrderDetailStatus
  tracking_number: string | null
  tracking_carrier: string | null
  payment_method: string | null
  payment_status: string
}

export async function getAdminOrderRows(): Promise<AdminOrderRow[]> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('orders')
    .select(`
      id, order_number, status, total, created_at, user_id,
      shipping_address, payment_method, payment_status,
      tracking_number, tracking_carrier,
      order_items(quantity)
    `)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  // Fetch profiles for customer names
  const userIds = [...new Set((data as { user_id: string | null }[]).map((r) => r.user_id).filter(Boolean))] as string[]
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, email, phone')
    .in('id', userIds)

  const profileMap = Object.fromEntries(
    ((profiles as { id: string; full_name: string | null; email: string | null; phone: string | null }[]) ?? []).map(
      (p) => [p.id, p]
    )
  )

  return (data as {
    id: string
    order_number: string | null
    status: string
    total: number | string
    created_at: string
    user_id: string | null
    shipping_address: { fullName?: string; phone?: string } | null
    payment_method: string | null
    payment_status: string
    tracking_number: string | null
    tracking_carrier: string | null
    order_items: { quantity: number }[] | null
  }[]).map((row) => {
    const profile = row.user_id ? profileMap[row.user_id] : null
    const items = (row.order_items ?? []).reduce((s, i) => s + (i.quantity ?? 0), 0)
    return {
      id: row.id,
      order_number: row.order_number || row.id.slice(0, 8).toUpperCase(),
      customer: profile?.full_name || row.shipping_address?.fullName || 'Guest',
      email: profile?.email || '—',
      phone: profile?.phone || row.shipping_address?.phone || '—',
      date: row.created_at.slice(0, 10),
      items,
      total: Number(row.total),
      status: row.status as OrderDetailStatus,
      tracking_number: row.tracking_number,
      tracking_carrier: row.tracking_carrier,
      payment_method: row.payment_method,
      payment_status: row.payment_status,
    }
  })
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveAddressForUser } from '@/app/actions/address'

interface OrderItem {
  productId: string
  productTitle: string
  productImage: string
  price: number
  quantity: number
}

interface CreateOrderInput {
  items: OrderItem[]
  shippingAddress: {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
  }
  paymentMethod: 'razorpay' | 'cod'
  subtotal: number
  tax: number
  total: number
  couponCode?: string
  couponDiscount?: number
}

export async function createOrder(input: CreateOrderInput) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return { success: false, error: 'Not authenticated' }

    // Generate a readable order number
    const orderNumber = `SQ${Date.now().toString(36).toUpperCase()}`

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'pending',
        payment_method: input.paymentMethod,
        subtotal: input.subtotal,
        discount: input.couponDiscount ?? 0,
        coupon_code: input.couponCode ?? null,
        tax: input.tax,
        total: input.total,
        shipping_address: input.shippingAddress,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('[create-order] order insert error:', orderError)
      return { success: false, error: 'Failed to create order' }
    }

    // Persist shipping address to the user's saved addresses (non-fatal)
    try {
      await saveAddressForUser({
        fullName: input.shippingAddress.fullName,
        phone: input.shippingAddress.phone,
        addressLine1: input.shippingAddress.addressLine1,
        addressLine2: input.shippingAddress.addressLine2 ?? '',
        city: input.shippingAddress.city,
        state: input.shippingAddress.state,
        pincode: input.shippingAddress.pincode,
      })
    } catch (addrErr) {
      console.error('[create-order] address save error:', addrErr)
    }

    // Resolve real product UUIDs from slugs (productId holds the slug)
    const admin = createAdminClient()
    const slugs = input.items.map((i) => i.productId)
    const { data: prodRows } = await admin
      .from('products')
      .select('id, slug, stock, total_sales')
      .in('slug', slugs)

    const slugToRow = Object.fromEntries(
      ((prodRows as { id: string; slug: string; stock: number | null; total_sales: number | null }[]) ?? []).map(
        (r) => [r.slug, r],
      ),
    )

    const lineItems = input.items.map((item) => ({
      order_id: order.id,
      product_id: slugToRow[item.productId]?.id ?? null,
      product_title: item.productTitle,
      product_image: item.productImage,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(lineItems)
    if (itemsError) {
      console.error('[create-order] order_items insert error:', itemsError)
      return { success: false, error: 'Failed to save order items' }
    }

    // Update inventory & sales counts using the already-fetched prodRows
    try {
      for (const item of input.items) {
        const row = slugToRow[item.productId]
        if (!row) continue
        await admin
          .from('products')
          .update({
            stock: Math.max(0, (row.stock ?? 0) - item.quantity),
            total_sales: (row.total_sales ?? 0) + item.quantity,
          })
          .eq('id', row.id)
      }
    } catch (invErr) {
      console.error('[create-order] inventory update error:', invErr)
      // Non-fatal — the order is still valid.
    }

    // COD — confirm immediately
    if (input.paymentMethod === 'cod') {
      await supabase
        .from('orders')
        .update({ status: 'confirmed', payment_status: 'pending' })
        .eq('id', order.id)

      await supabase.from('payments').insert({
        order_id: order.id,
        user_id: user.id,
        amount: input.total,
        currency: 'INR',
        method: 'cod',
        provider: 'cod',
        status: 'pending',
      })
    }
    // For Razorpay: payment is already verified before this function is called.
    // The verify-payment route inserts the payments row after signature check.

    return { success: true, orderId: order.id, orderNumber }
  } catch (err) {
    console.error('[create-order] unexpected error:', err)
    return { success: false, error: 'Unexpected error. Please try again.' }
  }
}

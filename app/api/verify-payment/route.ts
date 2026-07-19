import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createOrder } from '@/app/actions/create-order'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      // Full order payload passed from the client after successful payment
      orderPayload,
    } = body

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET

    // Verify Razorpay signature (skip only in test mode without keys)
    if (razorpaySecret) {
      const shasum = crypto.createHmac('sha256', razorpaySecret)
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`)
      const digest = shasum.digest('hex')

      if (digest !== razorpay_signature) {
        return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 })
      }
    } else {
      console.warn('[verify-payment] Razorpay secret not configured — skipping signature check (test mode)')
    }

    // Payment is verified — now create the DB order
    const result = await createOrder({ ...orderPayload, paymentMethod: 'razorpay' })

    if (!result.success || !result.orderId) {
      console.error('[verify-payment] createOrder failed after payment verification:', result.error)
      return NextResponse.json({ success: false, error: result.error ?? 'Failed to create order' }, { status: 500 })
    }

    // Insert the verified payment record
    const supabase = createAdminClient()
    await supabase.from('payments').insert({
      order_id: result.orderId,
      amount: orderPayload.total,
      currency: 'INR',
      method: 'online',
      provider: 'razorpay',
      transaction_id: razorpay_payment_id,
      status: 'success',
      paid_at: new Date().toISOString(),
    })

    // Mark the order as paid + confirmed
    await supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'confirmed' })
      .eq('id', result.orderId)

    return NextResponse.json({ success: true, orderId: result.orderId })
  } catch (error) {
    console.error('[verify-payment] unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 })
  }
}

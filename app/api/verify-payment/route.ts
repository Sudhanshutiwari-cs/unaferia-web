import { createAdminClient as createClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, order_id } = body

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET

    if (!razorpaySecret) {
      console.warn('[v0] Razorpay secret not configured, accepting test payments')
      // In test mode without Razorpay keys, just mark as paid
      const supabase = await createClient()
      await supabase
        .from('payments')
        .update({ status: 'success', paid_at: new Date().toISOString() })
        .eq('order_id', order_id)

      await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', order_id)

      return NextResponse.json({ success: true })
    }

    // Verify signature
    const shasum = crypto.createHmac('sha256', razorpaySecret)
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`)
    const digest = shasum.digest('hex')

    if (digest !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 })
    }

    // Update order and payment status
    const supabase = await createClient()

    await supabase
      .from('payments')
      .update({
        status: 'success',
        paid_at: new Date().toISOString(),
        transaction_id: razorpay_payment_id,
      })
      .eq('order_id', order_id)

    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
      })
      .eq('id', order_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Payment verification error:', error)
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 })
  }
}

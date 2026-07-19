'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const CANCELLABLE_STATUSES = ['pending', 'confirmed']

export async function cancelOrder(
  orderId: string,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  // Verify the caller is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { ok: false, error: 'You must be signed in to cancel an order.' }
  }

  // Fetch the order to verify ownership, current status, and payment method
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, user_id, payment_method')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    return { ok: false, error: 'Order not found.' }
  }

  if (order.user_id !== user.id) {
    return { ok: false, error: 'You do not have permission to cancel this order.' }
  }

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return {
      ok: false,
      error: `This order cannot be cancelled because it is already ${order.status}. Please contact support for help.`,
    }
  }

  // Perform the cancellation
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      admin_notes: `Cancelled by customer. Reason: ${reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  // If the cancelled order was COD, block COD for this customer going forward
  if (order.payment_method === 'cod') {
    await supabase
      .from('profiles')
      .update({ cod_blocked: true, updated_at: new Date().toISOString() })
      .eq('id', user.id)
  }

  revalidatePath('/orders')
  revalidatePath('/profile')
  revalidatePath('/admin/orders')

  return { ok: true }
}

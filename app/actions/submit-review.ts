'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface SubmitReviewInput {
  productId: string
  rating: number
  title: string
  comment: string
  productPath?: string
}

export async function submitReview(input: SubmitReviewInput) {
  try {
    if (input.rating < 1 || input.rating > 5) {
      return { success: false, error: 'Please select a rating between 1 and 5 stars.' }
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) return { success: false, error: 'Please sign in to write a review.' }

    const reviewerName = (user.user_metadata?.full_name as string) || 'Unaferia Customer'

    // Determine "verified purchase": does this user have an order line item
    // matching the product title? Order items store the product title.
    let isVerified = false
    const { data: product } = await supabase
      .from('products')
      .select('title')
      .eq('id', input.productId)
      .maybeSingle()

    if (product?.title) {
      const { data: orders } = await supabase.from('orders').select('id').eq('user_id', user.id)
      const orderIds = (orders ?? []).map((o) => o.id as string)
      if (orderIds.length > 0) {
        const { data: items } = await supabase
          .from('order_items')
          .select('id')
          .in('order_id', orderIds)
          .eq('product_title', product.title)
          .limit(1)
        isVerified = Boolean(items && items.length > 0)
      }
    }

    // Upsert on the (product_id, user_id) unique constraint so a user can edit
    // their existing review rather than being blocked by the unique index.
    const { error: upsertError } = await supabase.from('reviews').upsert(
      {
        product_id: input.productId,
        user_id: user.id,
        rating: input.rating,
        title: input.title.trim().slice(0, 120),
        comment: input.comment.trim().slice(0, 2000),
        reviewer_name: reviewerName,
        is_verified: isVerified,
      },
      { onConflict: 'product_id,user_id' },
    )

    if (upsertError) {
      console.error('[submit-review] upsert error:', upsertError)
      return { success: false, error: 'Could not save your review. Please try again.' }
    }

    // Recompute the product's rating aggregate (admin client bypasses RLS on products).
    try {
      const admin = createAdminClient()
      const { data: allReviews } = await admin
        .from('reviews')
        .select('rating')
        .eq('product_id', input.productId)

      const ratings = (allReviews ?? []).map((r) => r.rating as number)
      const total = ratings.length
      const avg = total > 0 ? ratings.reduce((a, b) => a + b, 0) / total : 0
      await admin
        .from('products')
        .update({ rating: Math.round(avg * 10) / 10, total_reviews: total })
        .eq('id', input.productId)
    } catch (aggErr) {
      console.error('[submit-review] aggregate update error:', aggErr)
      // Non-fatal — the review itself is saved.
    }

    if (input.productPath) revalidatePath(input.productPath)
    return { success: true }
  } catch (err) {
    console.error('[submit-review] unexpected error:', err)
    return { success: false, error: 'Unexpected error. Please try again.' }
  }
}

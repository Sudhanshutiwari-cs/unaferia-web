'use server'

import { createClient } from '@/lib/supabase/server'

export type NewsletterResult =
  | { success: true; alreadySubscribed: boolean }
  | { success: false; error: string }

export async function subscribeToNewsletter(
  email: string,
  name?: string,
): Promise<NewsletterResult> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const supabase = await createClient()

  // Check if already subscribed
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (existing) {
    return { success: true, alreadySubscribed: true }
  }

  const { error } = await supabase.from('newsletter_subscribers').insert({
    email: email.toLowerCase().trim(),
    name: name?.trim() || null,
  })

  if (error) {
    console.error('[newsletter] insert error:', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  return { success: true, alreadySubscribed: false }
}

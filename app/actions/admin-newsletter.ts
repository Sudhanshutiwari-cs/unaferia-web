'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type Subscriber = {
  id: string
  email: string
  name: string | null
  subscribed_at: string
}

export type NewsletterStats = {
  total: number
  thisMonth: number
  thisWeek: number
  today: number
}

export async function getNewsletterSubscribers(): Promise<{
  subscribers: Subscriber[]
  stats: NewsletterStats
}> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('newsletter_subscribers')
    .select('id, email, name, subscribed_at')
    .order('subscribed_at', { ascending: false })

  if (error || !data) {
    return { subscribers: [], stats: { total: 0, thisMonth: 0, thisWeek: 0, today: 0 } }
  }

  const subscribers = data as Subscriber[]
  const now = new Date()

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const stats: NewsletterStats = {
    total: subscribers.length,
    today: subscribers.filter(s => new Date(s.subscribed_at) >= startOfToday).length,
    thisWeek: subscribers.filter(s => new Date(s.subscribed_at) >= startOfWeek).length,
    thisMonth: subscribers.filter(s => new Date(s.subscribed_at) >= startOfMonth).length,
  }

  return { subscribers, stats }
}

export async function deleteSubscriber(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from('newsletter_subscribers').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/newsletter')
  return { ok: true }
}

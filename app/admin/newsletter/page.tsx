import { AdminShell } from "@/components/admin/admin-shell"
import { getNewsletterSubscribers } from '@/app/actions/admin-newsletter'
import { NewsletterManager } from '@/components/admin/newsletter-manager'

export const dynamic = 'force-dynamic'

export default async function AdminNewsletterPage() {
  const { subscribers, stats } = await getNewsletterSubscribers()

  return (
    <AdminShell title="Newsletter">
      <NewsletterManager initialSubscribers={subscribers} stats={stats} />
    </AdminShell>
  )
}
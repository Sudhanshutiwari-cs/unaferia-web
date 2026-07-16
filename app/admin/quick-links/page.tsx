import { AdminShell } from "@/components/admin/admin-shell"
import { QuickLinksManager } from "@/components/admin/quick-links-manager"
import { getAllQuickLinks } from "@/app/actions/admin-quick-links"

export const dynamic = "force-dynamic"

export default async function AdminQuickLinksPage() {
  const links = await getAllQuickLinks()
  return (
    <AdminShell title="Mobile Quick Links">
      <QuickLinksManager initialLinks={links} />
    </AdminShell>
  )
}

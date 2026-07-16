import { AdminShell } from "@/components/admin/admin-shell"
import { WebsiteSettingsManager } from "@/components/admin/website-settings-manager"

export const metadata = { title: "Website Settings — Admin" }

export default function AdminSettingsPage() {
  return (
    <AdminShell title="Website Content & Settings">
      <WebsiteSettingsManager />
    </AdminShell>
  )
}

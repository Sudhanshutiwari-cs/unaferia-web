import { AdminShell } from "@/components/admin/admin-shell"
import { BannersManager } from "@/components/admin/banners-manager"
import { getAllBanners } from "@/app/actions/admin-banners"

export const dynamic = "force-dynamic"

export default async function AdminBannersPage() {
  const banners = await getAllBanners()
  return (
    <AdminShell title="Banners">
      <BannersManager initialBanners={banners} />
    </AdminShell>
  )
}

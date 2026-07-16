import { AdminShell } from "@/components/admin/admin-shell"
import { CouponsManager } from "@/components/admin/coupons-manager"
import { adminGetCoupons } from "@/app/actions/coupon"

export const metadata = { title: "Coupons — Admin | Shourya Quest" }

export default async function AdminCouponsPage() {
  const coupons = await adminGetCoupons()
  return (
    <AdminShell title="Coupons & Discounts">
      <CouponsManager initialCoupons={coupons} />
    </AdminShell>
  )
}

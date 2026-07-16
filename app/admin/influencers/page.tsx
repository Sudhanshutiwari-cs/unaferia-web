import { AdminShell } from "@/components/admin/admin-shell"
import { getAllInfluencers } from "@/app/actions/admin-influencers"
import { InfluencersManager } from "@/components/admin/influencers-manager"

export const dynamic = "force-dynamic"
export const metadata = { title: "Influencers | Admin" }

export default async function InfluencersPage() {
  const influencers = await getAllInfluencers()
  
  return (
    <AdminShell title="Featured Creators">
      <div className="flex flex-col gap-6">
       
        <InfluencersManager initial={influencers} />
      </div>
    </AdminShell>
  )
}
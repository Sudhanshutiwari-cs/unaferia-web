import { NextResponse } from "next/server"
import { getActiveInfluencers } from "@/app/actions/admin-influencers"

export const dynamic = "force-dynamic"

export async function GET() {
  const influencers = await getActiveInfluencers()
  return NextResponse.json(influencers)
}

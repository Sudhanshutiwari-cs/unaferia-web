import { NextResponse } from "next/server"
import { getActiveQuickLinks } from "@/app/actions/admin-quick-links"

export const dynamic = "force-dynamic"

export async function GET() {
  const links = await getActiveQuickLinks()
  return NextResponse.json(links)
}

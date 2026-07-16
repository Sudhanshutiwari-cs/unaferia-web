import { NextResponse } from "next/server"
import { getCategoryMenu } from "@/lib/queries"

export async function GET() {
  const menu = await getCategoryMenu()
  return NextResponse.json({ menu })
}

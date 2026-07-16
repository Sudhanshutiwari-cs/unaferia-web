import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const ALLOWED_BUCKETS = ["products", "banners", "quick-links", "influencers"] as const
type Bucket = (typeof ALLOWED_BUCKETS)[number]

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"]
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const bucket = (formData.get("bucket") as string | null) ?? "products"

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 })
  }

  if (!ALLOWED_BUCKETS.includes(bucket as Bucket)) {
    return NextResponse.json({ error: `Invalid bucket. Allowed: ${ALLOWED_BUCKETS.join(", ")}.` }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, WebP, GIF, AVIF, or SVG." }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large. Max 5 MB." }, { status: 400 })
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const admin = createAdminClient()
  const { error } = await admin.storage
    .from(bucket)
    .upload(filename, file, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(filename)
  return NextResponse.json({ url: data.publicUrl })
}

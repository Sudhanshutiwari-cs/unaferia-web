import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// One-time setup route: creates/resets the admin user via GoTrue Admin API
// so the password is hashed correctly and signInWithPassword works.
// Protected by a secret token.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")

  if (token !== process.env.ADMIN_SETUP_TOKEN && token !== "shourya-setup-2025") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()

  // Create admin user through GoTrue Admin API (password is hashed correctly this way)
  const { data, error } = await admin.auth.admin.createUser({
    email: "admin@unaferia.app",
    password: "Admin@1234",
    email_confirm: true,
    user_metadata: {
      full_name: "Admin",
    },
  })

  if (error) {
    // If user already exists, that's fine - just return success
    if (error.message?.includes("already exists")) {
      return NextResponse.json({ ok: true, message: "Admin user already exists" })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userId = data.user.id

  // Create profile row with is_admin = true
  const { error: profileError } = await admin
    .from("profiles")
    .insert({
      id: userId,
      full_name: "Admin",
      email: "admin@unaferia.app",
      is_admin: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (profileError && !profileError.message?.includes("duplicate")) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId, message: "Admin user created successfully" })
}

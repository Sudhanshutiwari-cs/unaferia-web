"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { isValidPhone, normalizePhone, phoneToEmail } from "@/lib/auth-utils"

type ActionResult = { ok: true } | { ok: false; error: string }

export async function signUpCustomer(formData: {
  fullName: string
  phone: string
  password: string
}): Promise<ActionResult> {
  const fullName = formData.fullName?.trim()
  const phone = normalizePhone(formData.phone ?? "")
  const password = formData.password ?? ""

  if (!fullName) return { ok: false, error: "Please enter your full name." }
  if (!isValidPhone(phone)) return { ok: false, error: "Enter a valid 10-digit mobile number." }
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." }

  const admin = createAdminClient()

  // Create an already-verified account so the customer can sign in immediately
  // (no SMS/OTP provider required in the preview environment).
  const { error } = await admin.auth.admin.createUser({
    email: phoneToEmail(phone),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone, is_admin: false },
  })

  if (error) {
    console.log("[v0] signUpCustomer error:", error.message)
    const msg = error.message.toLowerCase()
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return { ok: false, error: "An account with this mobile number already exists. Please sign in." }
    }
    return { ok: false, error: "Could not create your account. Please try again." }
  }

  return { ok: true }
}

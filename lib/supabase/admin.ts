import { createClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client using the service role key.
 * Bypasses RLS — never import this into client components.
 * Used to create verified customer accounts (mobile + password)
 * without requiring an SMS/OTP provider.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

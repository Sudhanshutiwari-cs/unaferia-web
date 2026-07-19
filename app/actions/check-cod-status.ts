'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Returns whether the signed-in customer has COD blocked.
 * Blocked customers must pay online — they cancelled a COD order previously.
 */
export async function checkCodStatus(): Promise<{ blocked: boolean }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { blocked: false }

  const { data } = await supabase
    .from('profiles')
    .select('cod_blocked')
    .eq('id', user.id)
    .single()

  return { blocked: !!(data?.cod_blocked) }
}

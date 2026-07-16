"use client"

import useSWR from "swr"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export type CustomerUser = {
  id: string
  fullName: string
  phone: string
}

const supabase = createClient()

async function fetchUser(): Promise<CustomerUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return {
    id: user.id,
    fullName: (user.user_metadata?.full_name as string) ?? "Customer",
    phone: (user.user_metadata?.phone as string) ?? "",
  }
}

export function useUser() {
  const { data, isLoading, mutate } = useSWR("customer-user", fetchUser, {
    revalidateOnFocus: false,
  })

  // Keep SWR in sync with Supabase auth state changes.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      mutate()
    })
    return () => subscription.unsubscribe()
  }, [mutate])

  async function signOut() {
    await supabase.auth.signOut()
    mutate(null)
    // Hard-navigate to home so all server components and cookies are refreshed
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }

  return { user: data ?? null, isLoading, signOut, refresh: () => mutate() }
}

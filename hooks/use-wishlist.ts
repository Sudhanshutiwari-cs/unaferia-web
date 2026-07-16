"use client"

import useSWR from "swr"
import { useCallback } from "react"
import { getWishlistedProductIds, toggleWishlistItem } from "@/app/actions/wishlist"
import { useUser } from "@/hooks/use-user"

const SWR_KEY = "wishlist-ids"

export function useWishlist() {
  const { user } = useUser()

  const { data: ids = [], mutate } = useSWR<string[]>(
    user ? SWR_KEY : null,
    () => getWishlistedProductIds(),
    { revalidateOnFocus: false },
  )

  const isWishlisted = useCallback(
    (productId: string) => ids.includes(productId),
    [ids],
  )

  const toggle = useCallback(
    async (productId: string) => {
      if (!user) return false
      // Optimistic update
      const wasIn = ids.includes(productId)
      mutate(
        wasIn ? ids.filter((id) => id !== productId) : [...ids, productId],
        false,
      )
      const result = await toggleWishlistItem(productId)
      mutate() // revalidate from server
      return result
    },
    [user, ids, mutate],
  )

  return { ids, count: ids.length, isWishlisted, toggle }
}

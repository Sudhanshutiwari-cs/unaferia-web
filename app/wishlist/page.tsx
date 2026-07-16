"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { useCart } from "@/components/cart-provider"
import { getWishlistItems } from "@/app/actions/wishlist"
import type { WishlistProduct } from "@/app/actions/wishlist"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/client"

function formatINR(v: number) {
  return "₹" + v.toLocaleString("en-IN")
}

export default function WishlistPage() {
  const { user, isLoading: userLoading } = useUser()
  const { addItem } = useCart()
  const [items, setItems] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getWishlistItems().then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [user])

  const handleRemoveDirect = async (item: WishlistProduct) => {
    setRemoving(item.wishlistId)
    // Delete via wishlist_id directly using a targeted server action
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    await supabase.from("wishlist_items").delete().eq("id", item.wishlistId)
    setItems((prev) => prev.filter((i) => i.wishlistId !== item.wishlistId))
    setRemoving(null)
  }

  const handleAddToCart = (item: WishlistProduct) => {
    addItem(item)
  }

  if (userLoading || loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1400px] px-4 py-12">
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
        <SiteFooter />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center gap-6 px-4 py-24 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-muted">
            <Heart className="size-10 text-muted-foreground" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Wishlist</h1>
            <p className="mt-2 text-muted-foreground">Sign in to save products you love.</p>
          </div>
          <Link
            href="/login?redirect=/wishlist"
            className="rounded-full bg-brand px-8 py-3 font-semibold text-brand-foreground transition hover:brightness-95"
          >
            Sign In
          </Link>
        </div>
        <SiteFooter />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back to Home"
              className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-muted"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">My Wishlist</h1>
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-border bg-card py-24 text-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-muted">
              <Heart className="size-10 text-muted-foreground" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-foreground">Nothing saved yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tap the heart icon on any product to save it here.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full bg-brand px-8 py-3 font-semibold text-brand-foreground transition hover:brightness-95"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {items.map((item) => (
              <div
                key={item.wishlistId}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:shadow-sm"
              >
                {/* Product image */}
                <Link href={item.href ?? `/product/${item.id}`} className="shrink-0">
                  <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg border border-border bg-background p-2 sm:size-24">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="h-full w-auto object-contain"
                    />
                  </div>
                </Link>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <Link
                    href={item.href ?? `/product/${item.id}`}
                    className="line-clamp-2 text-sm font-medium text-foreground hover:text-link sm:text-base"
                  >
                    {item.name}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                    <span className="text-base font-bold text-price sm:text-lg">
                      {formatINR(item.price)}
                    </span>
                    {item.mrp > item.price && (
                      <>
                        <span className="text-xs text-muted-foreground line-through">
                          {formatINR(item.mrp)}
                        </span>
                        <span className="text-xs font-semibold text-deal">
                          {item.discount}% off
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground transition hover:brightness-95 sm:text-sm"
                  >
                    <ShoppingCart className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Add to Cart</span>
                    <span className="sm:hidden">Cart</span>
                  </button>
                  <button
                    onClick={() => handleRemoveDirect(item)}
                    disabled={removing === item.wishlistId}
                    aria-label={`Remove ${item.name} from wishlist`}
                    className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-destructive hover:bg-destructive/5 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}



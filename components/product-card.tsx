"use client"

import Link from "next/link"
import { Star, StarHalf, Heart, Clock } from "lucide-react"
import type { Product } from "@/lib/mock-data"
import { useCart } from "@/components/cart-provider"
import { useWishlist } from "@/hooks/use-wishlist"
import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

function formatINR(value: number) {
  return "₹" + value.toLocaleString("en-IN")
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75
  const total = 5
  return (
    <span className="flex items-center" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: total }).map((_, i) => {
        if (i < full) {
          return <Star key={i} className="h-4 w-4 fill-star text-star" aria-hidden="true" />
        }
        if (i === full && hasHalf) {
          return <StarHalf key={i} className="h-4 w-4 fill-star text-star" aria-hidden="true" />
        }
        return <Star key={i} className="h-4 w-4 text-neutral-300" aria-hidden="true" />
      })}
    </span>
  )
}

export function ProductCard({
  product,
  showDealLabel = false,
  dealDiscount,
}: {
  product: Product
  showDealLabel?: boolean
  dealDiscount?: number | null
}) {
  const { addItem } = useCart()
  const { user } = useUser()
  const { isWishlisted, toggle } = useWishlist()
  const router = useRouter()
  const href = product.href ?? `/product/${product.id}`

  const wishlisted = product.productId ? isWishlisted(product.productId) : false
  const discount = dealDiscount ?? product.discount

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { router.push("/login?redirect=/wishlist"); return }
    if (!product.productId) return
    const wasWishlisted = wishlisted
    await toggle(product.productId)
    if (wasWishlisted) {
      toast("Removed from wishlist", { description: product.name })
    } else {
      toast.success("Added to wishlist", { description: product.name })
    }
  }

  return (
    <div className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md text-left">
      {/* Image area */}
      <Link href={href} className="relative block bg-muted/20">
        {/* Wishlist heart — top right */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-white/80 shadow-sm transition
            ${wishlisted ? "text-rose-500" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`}
        >
          <Heart className="size-4" fill={wishlisted ? "currentColor" : "none"} aria-hidden="true" />
        </button>

        <div className="flex h-40 items-center justify-center overflow-hidden p-3">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </div>

        {/* Discount badge — bottom left of image, red pill */}
        {discount > 0 && (
          <span className="absolute bottom-2 left-2 z-10 rounded-md bg-deal px-2 py-0.5 text-xs font-bold text-white shadow">
            {discount}% off
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2">
        <Link href={href} className="line-clamp-2 min-h-[2.5rem] text-sm text-foreground hover:text-link">
          {product.name}
        </Link>

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-base font-bold text-price">{formatINR(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-muted-foreground line-through">{formatINR(product.mrp)}</span>
          )}
        </div>

        {/* Limited time deal label */}
        {showDealLabel && (
          <div className="mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0 text-deal" aria-hidden="true" />
            <span className="text-xs font-medium text-deal">Limited time deal</span>
          </div>
        )}

        <button
          onClick={() => {
            addItem(product)
            toast.success("Added to cart", { description: product.name })
          }}
          className="mt-auto pt-2.5 w-full rounded-md bg-brand py-1.5 text-sm font-semibold text-brand-foreground transition hover:brightness-95"
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}

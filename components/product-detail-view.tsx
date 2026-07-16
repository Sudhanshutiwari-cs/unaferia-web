"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Star, StarHalf, Check, Truck, ShieldCheck, RotateCcw, MapPin, ChevronLeft, ChevronRight, Heart, Share2 } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import { useUser } from "@/hooks/use-user"
import { useWishlist } from "@/hooks/use-wishlist"
import type { ProductDetail } from "@/lib/queries"
import { toast } from "sonner"

function formatINR(value: number) {
  return "₹" + value.toLocaleString("en-IN")
}

// ---------------------------------------------------------------------------
// Social share helpers
// ---------------------------------------------------------------------------
function WhatsAppShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}
function FacebookShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
    </svg>
  )
}
function TwitterShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.97 6.82H1.66l7.73-8.84L1.24 2.25H8.06l4.71 6.23 5.47-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z" />
    </svg>
  )
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75
  return (
    <span className="flex items-center" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <Star key={i} className="h-4 w-4 fill-star text-star" aria-hidden="true" />
        if (i === full && hasHalf) return <StarHalf key={i} className="h-4 w-4 fill-star text-star" aria-hidden="true" />
        return <Star key={i} className="h-4 w-4 text-neutral-300" aria-hidden="true" />
      })}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Image Gallery
// ---------------------------------------------------------------------------

function ProductImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0)

  // mobile: swipe helpers
  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) {
      if (dx < 0) setActive((a) => Math.min(images.length - 1, a + 1))
      else setActive((a) => Math.max(0, a - 1))
    }
    touchStartX.current = null
  }

  const src = images[active] ?? "/placeholder.svg"

  return (
    <div className="flex gap-2 sm:gap-3">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-card p-1 transition sm:h-14 sm:w-14 ${
                active === i
                  ? "border-brand ring-1 ring-brand"
                  : "border-border hover:border-brand/50"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={img || "/placeholder.svg"}
                alt=""
                width={48}
                height={48}
                className="h-full w-auto object-contain"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden rounded-lg border border-border bg-card p-3 sm:p-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={src}
          alt={name}
          width={500}
          height={500}
          className="h-52 w-auto object-contain sm:h-72 md:h-96"
          priority
        />

        {/* Mobile prev/next arrows */}
        {images.length > 1 && (
          <>
            {active > 0 && (
              <button
                onClick={() => setActive((a) => a - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1 text-white backdrop-blur-sm md:hidden"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {active < images.length - 1 && (
              <button
                onClick={() => setActive((a) => a + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1 text-white backdrop-blur-sm md:hidden"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
            {/* Dot indicators on mobile */}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 md:hidden">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`block h-1.5 w-1.5 rounded-full transition-colors ${
                    i === active ? "bg-brand" : "bg-black/25"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

export function ProductDetailView({ product }: { product: ProductDetail }) {
  const { addItem } = useCart()
  const { user } = useUser()
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { isWishlisted, toggle } = useWishlist()
  const wishlisted = isWishlisted(product.productId)

  const handleWishlist = async () => {
    if (!user) { router.push("/login?redirect=" + encodeURIComponent(`/product/${product.id}`)); return }
    const wasWishlisted = wishlisted
    await toggle(product.productId)
    if (wasWishlisted) {
      toast("Removed from wishlist", { description: product.name })
    } else {
      toast.success("Added to wishlist", { description: product.name })
    }
  }

  const inStock = product.stock > 0
  const brandHref = product.brand ? `/search?q=${encodeURIComponent(product.brand)}` : undefined

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
    toast.success("Added to cart", { description: `${product.name}${qty > 1 ? ` × ${qty}` : ""}` })
  }

  const handleBuyNow = () => {
    for (let i = 0; i < qty; i++) addItem(product)
    router.push(user ? "/checkout" : "/login?redirect=/checkout")
  }

  return (
    <>
    <div className="grid gap-4 rounded-lg bg-card p-3 sm:p-5 sm:gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_300px] lg:p-6">
      {/* Gallery */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <ProductImageGallery images={product.images} name={product.name} />
      </div>

      {/* Info */}
      <div className="min-w-0">
        <h1 className="text-xl font-medium leading-snug text-foreground sm:text-2xl">{product.name}</h1>
        {brandHref && (
          <Link href={brandHref} className="mt-1 inline-block text-sm text-link hover:text-brand hover:underline">
            Visit the {product.brand} Store
          </Link>
        )}

        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{product.rating.toFixed(1)}</span>
          <Stars rating={product.rating} />
          <span className="text-sm text-link">{product.ratingCount.toLocaleString("en-IN")} ratings</span>
        </div>

        <hr className="my-3 border-border" />

        <div className="flex items-baseline gap-3">
          {product.discount > 0 && <span className="text-2xl font-light text-deal">-{product.discount}%</span>}
          <span className="text-3xl font-medium text-price">{formatINR(product.price)}</span>
        </div>
        {product.mrp > product.price && (
          <p className="mt-1 text-sm text-muted-foreground">
            M.R.P.: <span className="line-through">{formatINR(product.mrp)}</span>
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">Inclusive of all taxes</p>

        {product.description && (
          <>
            <hr className="my-3 border-border" />
            <p className="text-sm leading-relaxed text-foreground">{product.description}</p>
          </>
        )}

        {product.features.length > 0 && (
          <div className="mt-4">
            <h2 className="mb-2 text-base font-bold text-foreground">About this item</h2>
            <ul className="space-y-1.5">
              {product.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Buy box — hidden on mobile (sticky bar below handles mobile CTA), shown tablet+ */}
      <div className="hidden h-fit rounded-lg border border-border bg-card p-4 sm:block lg:sticky lg:top-4 lg:col-start-3">
        <p className="text-2xl font-medium text-price">{formatINR(product.price)}</p>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-foreground">
          <Truck className="h-4 w-4 text-success" aria-hidden="true" />
          FREE delivery in 2–4 days
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          Deliver to India
        </p>

        <p className={`mt-3 text-lg font-medium ${inStock ? "text-success" : "text-destructive"}`}>
          {inStock ? "In stock" : "Out of stock"}
        </p>
        {inStock && product.stock <= 10 && (
          <p className="text-sm text-deal">Only {product.stock} left — order soon.</p>
        )}

        {inStock && (
          <div className="mt-3 flex items-center gap-2">
            <label htmlFor="qty" className="text-sm text-foreground">
              Qty:
            </label>
            <select
              id="qty"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              {Array.from({ length: Math.min(product.stock, 10) }).map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-2.5 text-sm font-semibold text-brand-foreground transition hover:brightness-95 disabled:opacity-50"
        >
          {added ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" /> Added to Cart
            </>
          ) : (
            "Add to Cart"
          )}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={!inStock}
          className="mt-2 w-full rounded-full bg-navy py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          Buy Now
        </button>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-semibold transition
            ${wishlisted
              ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
              : "border-border bg-card text-foreground hover:bg-muted"
            }`}
        >
          <Heart
            className="size-4"
            fill={wishlisted ? "currentColor" : "none"}
            aria-hidden="true"
          />
          {wishlisted ? "Wishlisted" : "Add to Wishlist"}
        </button>

        {/* Social share */}
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <Share2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">Share:</span>
          {(() => {
            const pageUrl = typeof window !== "undefined" ? window.location.href : ""
            const text = encodeURIComponent(`Check out ${product.name} on Shourya Quest!`)
            const url = encodeURIComponent(pageUrl)
            return (
              <>
                <a
                  href={`https://wa.me/?text=${text}%20${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on WhatsApp"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] transition hover:bg-[#25D366]/20"
                >
                  <WhatsAppShareIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Facebook"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1877F2]/10 text-[#1877F2] transition hover:bg-[#1877F2]/20"
                >
                  <FacebookShareIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${text}&url=${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on X"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/5 text-foreground transition hover:bg-foreground/10"
                >
                  <TwitterShareIcon className="h-3.5 w-3.5" />
                </a>
              </>
            )
          })()}
        </div>

        <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
          <p className="flex justify-between">
            <span>Ships from</span>
            <span className="text-foreground">Shourya Quest</span>
          </p>
          <p className="flex justify-between">
            <span>Sold by</span>
            <span className="text-foreground">{product.brand || "Shourya Quest"}</span>
          </p>
        </div>
        <div className="mt-3 space-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" /> Secure transaction
          </p>
          <p className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-success" aria-hidden="true" /> 7-day replacement
          </p>
        </div>
      </div>
    </div>

    {/* Mobile sticky buy bar — only visible on xs/sm screens */}
    <div className="fixed inset-x-0 bottom-14 z-30 flex items-center gap-2 border-t border-border bg-card px-3 py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] sm:hidden">
      <div className="flex flex-col leading-tight">
        <span className="text-base font-bold text-price">{formatINR(product.price)}</span>
        {product.discount > 0 && (
          <span className="text-[10px] font-semibold text-deal">{product.discount}% off</span>
        )}
      </div>
      <button
        onClick={handleAddToCart}
        disabled={!inStock}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand py-2.5 text-sm font-semibold text-brand-foreground transition hover:brightness-95 disabled:opacity-50"
      >
        {added ? <><Check className="h-4 w-4" /> Added</> : "Add to Cart"}
      </button>
      <button
        onClick={handleBuyNow}
        disabled={!inStock}
        className="flex flex-1 items-center justify-center rounded-full bg-navy py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        Buy Now
      </button>
    </div>
    </>
  )
}

'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Minus, Plus, ChevronDown, ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { useUser } from '@/hooks/use-user'
import type { Product } from '@/lib/mock-data'

const FREE_DELIVERY_THRESHOLD = 499
const SAVED_KEY = 'sq_saved'

export default function CartPage() {
  const { items, setQty, removeItem, addItem } = useCart()
  const { user } = useUser()

  // Per-item selection (Amazon lets you check/uncheck items).
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [gifts, setGifts] = useState<Record<string, boolean>>({})
  const [orderIsGift, setOrderIsGift] = useState(false)
  const [saved, setSaved] = useState<Product[]>([])
  const [savedTab, setSavedTab] = useState<'saved' | 'again'>('saved')

  // Default every cart item to selected when it first appears.
  useEffect(() => {
    setSelected((prev) => {
      const next = { ...prev }
      for (const { product } of items) {
        if (!(product.id in next)) next[product.id] = true
      }
      return next
    })
  }, [items])

  // Load / persist the "Saved for later" list.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY)
      if (raw) setSaved(JSON.parse(raw))
    } catch {
      /* ignore */
    }
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved))
    } catch {
      /* ignore */
    }
  }, [saved])

  const allSelected = items.length > 0 && items.every((i) => selected[i.product.id])

  const { selectedCount, selectedSubtotal } = useMemo(() => {
    let count = 0
    let sub = 0
    for (const { product, qty } of items) {
      if (selected[product.id]) {
        count += qty
        sub += product.price * qty
      }
    }
    return { selectedCount: count, selectedSubtotal: sub }
  }, [items, selected])

  const deliveryProgress = Math.min(100, (selectedSubtotal / FREE_DELIVERY_THRESHOLD) * 100)
  const eligibleForFreeDelivery = selectedSubtotal >= FREE_DELIVERY_THRESHOLD

  const toggleAll = () => {
    const value = !allSelected
    const next: Record<string, boolean> = {}
    for (const { product } of items) next[product.id] = value
    setSelected(next)
  }

  const saveForLater = (product: Product) => {
    removeItem(product.id)
    setSaved((prev) => (prev.some((p) => p.id === product.id) ? prev : [product, ...prev]))
  }

  const moveToCart = (product: Product) => {
    addItem(product)
    setSaved((prev) => prev.filter((p) => p.id !== product.id))
  }

  if (items.length === 0 && saved.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center gap-6 px-4 py-24">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Your Shourya Quest Cart is empty</h1>
            <p className="mt-1 text-muted-foreground">Add items from the store to get started</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-brand px-8 py-3 font-semibold text-brand-foreground hover:opacity-90"
          >
            Shop Now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 lg:px-6 pb-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
          {/* Left column */}
          <div className="order-2 space-y-3 lg:order-1">
            {/* Cart items card */}
            <section className="rounded-sm bg-card p-4 sm:p-6">
              <h1 className="text-2xl font-medium text-foreground sm:text-[28px]">Cart Items</h1>
              {items.length > 0 && (
                <button
                  onClick={toggleAll}
                  className="mt-1 text-sm text-link hover:text-deal hover:underline"
                >
                  {allSelected ? 'Deselect all items' : 'Select all items'}
                </button>
              )}

              <div className="mt-3 flex justify-end border-b border-border pb-2">
                <span className="text-sm text-muted-foreground">price</span>
              </div>

              {items.length === 0 && (
                <p className="py-6 text-sm text-muted-foreground">
                  No items in your cart. Check your saved items below.
                </p>
              )}

              {items.map(({ product, qty }, idx) => (
                <div
                  key={product.id}
                  className={`flex gap-2 py-4 sm:gap-4 ${idx !== items.length - 1 ? 'border-b border-border' : ''}`}
                >
                  {/* Checkbox */}
                  <label className="flex shrink-0 items-start pt-1">
                    <input
                      type="checkbox"
                      checked={!!selected[product.id]}
                      onChange={() =>
                        setSelected((prev) => ({ ...prev, [product.id]: !prev[product.id] }))
                      }
                      className="h-4 w-4 accent-[#007185]"
                      aria-label={`Select ${product.name}`}
                    />
                  </label>

                  {/* Image */}
                  <Link
                    href={`/product/${product.id}`}
                    className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded sm:h-28 sm:w-28 md:w-32"
                  >
                    <Image
                      src={product.image || '/placeholder.svg'}
                      alt={product.name}
                      width={128}
                      height={128}
                      className="h-full w-full object-contain"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${product.id}`}
                        className="line-clamp-2 flex-1 text-sm font-medium leading-snug text-foreground hover:text-deal hover:underline sm:text-base"
                      >
                        {product.name}
                      </Link>
                      {/* Price — shown inline on mobile */}
                      <div className="shrink-0 text-right sm:hidden">
                        <p className="text-sm font-bold text-foreground">
                          ₹{(product.price * qty).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs font-medium text-green-700">In stock</p>

                    <div className="flex items-center gap-1">
                      <span className="rounded-sm bg-navy px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        a
                      </span>
                      <span className="text-xs text-muted-foreground">Fulfilled</span>
                    </div>

                    <label className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                      <input
                        type="checkbox"
                        checked={!!gifts[product.id]}
                        onChange={() =>
                          setGifts((prev) => ({ ...prev, [product.id]: !prev[product.id] }))
                        }
                        className="h-3.5 w-3.5 accent-[#007185]"
                      />
                      This is a gift
                      <span className="text-link">Learn more</span>
                    </label>

                    {/* Controls */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs sm:gap-x-3 sm:text-sm">
                      {/* Quantity pill */}
                      <div className="flex items-center gap-1 rounded-full border border-brand bg-card px-1.5 py-0.5 shadow-sm ring-1 ring-brand/40">
                        <button
                          onClick={() => setQty(product.id, qty - 1)}
                          className="flex h-5 w-5 items-center justify-center rounded-full text-foreground hover:bg-muted sm:h-6 sm:w-6"
                          aria-label={qty <= 1 ? 'Remove item' : 'Decrease quantity'}
                        >
                          {qty <= 1 ? (
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          ) : (
                            <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          )}
                        </button>
                        <span className="min-w-[1.25rem] text-center font-medium tabular-nums text-xs sm:min-w-[1.5rem]">
                          {qty}
                        </span>
                        <button
                          onClick={() => setQty(product.id, qty + 1)}
                          className="flex h-5 w-5 items-center justify-center rounded-full text-foreground hover:bg-muted sm:h-6 sm:w-6"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>

                      <span className="text-border" aria-hidden="true">|</span>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="text-link hover:text-deal hover:underline"
                      >
                        Delete
                      </button>
                      <span className="text-border" aria-hidden="true">|</span>
                      <button
                        onClick={() => saveForLater(product)}
                        className="text-link hover:text-deal hover:underline"
                      >
                        Save
                      </button>
                      <span className="hidden text-border sm:inline" aria-hidden="true">|</span>
                      <button className="hidden text-link hover:text-deal hover:underline sm:inline">More like it</button>
                    </div>
                  </div>

                  {/* Price — hidden on mobile (shown inline above) */}
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-base font-bold text-foreground sm:text-lg">
                      ₹{(product.price * qty).toLocaleString('en-IN')}
                    </p>
                    {product.mrp > product.price && (
                      <p className="text-xs text-muted-foreground line-through">
                        ₹{(product.mrp * qty).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {items.length > 0 && (
                <div className="mt-2 border-t border-border pt-3 text-right text-lg text-foreground">
                  Subtotal ({selectedCount} {selectedCount === 1 ? 'item' : 'items'}):{' '}
                  <span className="font-bold">₹{selectedSubtotal.toLocaleString('en-IN')}</span>
                </div>
              )}
            </section>

            {/* Your items / Saved for later */}
            <section className="rounded-sm bg-card p-4 sm:p-6">
              <h2 className="text-xl font-bold text-foreground">Your items</h2>
              <div className="mt-2 flex gap-6 border-b border-border">
                <button
                  onClick={() => setSavedTab('saved')}
                  className={`-mb-px border-b-2 pb-2 text-sm font-medium ${
                    savedTab === 'saved'
                      ? 'border-brand text-link'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Saved for later ({saved.length})
                </button>
                <button
                  onClick={() => setSavedTab('again')}
                  className={`-mb-px border-b-2 pb-2 text-sm font-medium ${
                    savedTab === 'again'
                      ? 'border-brand text-link'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Buy it again
                </button>
              </div>

              {savedTab === 'saved' ? (
                saved.length === 0 ? (
                  <p className="py-6 text-sm text-muted-foreground">
                    You have no items saved for later.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {saved.map((product) => (
                      <div
                        key={product.id}
                        className="flex flex-col rounded-md border border-border p-3"
                      >
                        <div className="flex h-28 items-center justify-center">
                          <Image
                            src={product.image || '/placeholder.svg'}
                            alt={product.name}
                            width={112}
                            height={112}
                            className="h-full w-auto object-contain"
                          />
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-foreground">{product.name}</p>
                        <p className="mt-1 font-bold text-foreground">
                          ₹{product.price.toLocaleString('en-IN')}
                        </p>
                        <button
                          onClick={() => moveToCart(product)}
                          className="mt-2 rounded-full border border-border bg-brand py-1.5 text-xs font-semibold text-brand-foreground hover:opacity-90"
                        >
                          Move to cart
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="py-6 text-sm text-muted-foreground">
                  Items you order will show up here so you can quickly buy them again.
                </p>
              )}
            </section>
          </div>

          {/* Right sidebar — shown above cart items on mobile */}
          <div className="order-1 space-y-3 lg:order-2">
            <div className="rounded-sm bg-card p-4">
              {/* Free delivery progress */}
              <div className="flex items-start gap-2">
                {eligibleForFreeDelivery ? (
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600">
                    <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                  </span>
                ) : (
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-green-600" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-green-600 transition-all"
                      style={{ width: `${deliveryProgress}%` }}
                    />
                    <span className="absolute -top-0.5 right-1 text-[10px] font-semibold text-green-700">
                      ₹{FREE_DELIVERY_THRESHOLD}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-snug text-foreground">
                    {eligibleForFreeDelivery ? (
                      <>Your order is eligible for free delivery.</>
                    ) : (
                      <>Add ₹{(FREE_DELIVERY_THRESHOLD - selectedSubtotal).toLocaleString('en-IN')} more to be eligible for free delivery.</>
                    )}{' '}
                    <span className="text-muted-foreground">
                      Select <span className="text-link underline">the free delivery</span> option at checkout.
                    </span>
                  </p>
                </div>
              </div>

              <p className="mt-4 text-lg text-foreground">
                Subtotal ({selectedCount} {selectedCount === 1 ? 'item' : 'items'}):{' '}
                <span className="font-bold">₹{selectedSubtotal.toLocaleString('en-IN')}</span>
              </p>

              <label className="mt-2 flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={orderIsGift}
                  onChange={() => setOrderIsGift((v) => !v)}
                  className="h-4 w-4 accent-[#007185]"
                />
                This order includes a gift
              </label>

              {user ? (
                <Link
                  href="/checkout"
                  className={`mt-4 block w-full rounded-full py-2.5 text-center text-sm font-semibold text-brand-foreground ${
                    selectedCount > 0 ? 'bg-brand hover:opacity-90' : 'pointer-events-none bg-brand/50'
                  }`}
                  aria-disabled={selectedCount === 0}
                >
                  Proceed to purchase
                </Link>
              ) : (
                <Link
                  href="/login?redirect=/checkout"
                  className="mt-4 block w-full rounded-full bg-brand py-2.5 text-center text-sm font-semibold text-brand-foreground hover:opacity-90"
                >
                  Sign in to purchase
                </Link>
              )}

              <button className="mt-3 flex w-full items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm text-foreground hover:bg-muted">
                EMI available
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </button>
            </div>

            {/* Prime promo */}
            <div className="rounded-sm bg-[#0d74c4] p-4 text-white">
              <p className="text-lg font-semibold leading-snug">
                Pay for shipping with every order Join Prime now for FREE shipping, cancel anytime
              </p>
              <button className="mt-4 w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-brand-foreground hover:opacity-90">
                Join Prime Shopping Edition at ₹399/year
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



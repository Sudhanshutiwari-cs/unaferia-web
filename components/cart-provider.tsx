"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react"
import { createClient } from "@/lib/supabase/client"
import {
  getDbCartItems,
  upsertCartItem,
  removeCartItem,
  replaceDbCart,
  clearDbCart,
  type DbCartItem,
} from "@/app/actions/cart"
import type { Product } from "@/lib/mock-data"
import { productHref } from "@/lib/slug"

// ── Types ─────────────────────────────────────────────────────────────────────

export type CartItem = { product: Product; qty: number }

export interface CartItemWithDetails {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  variant?: Record<string, string>
}

type CartContextValue = {
  items: CartItem[]
  itemsFlat?: CartItemWithDetails[]
  count: number
  subtotal: number
  savings: number
  tax: number
  total: number
  addItem: (product: Product) => void
  removeItem: (id: string, variant?: Record<string, string>) => void
  updateQuantity: (id: string, qty: number, variant?: Record<string, string>) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  clearCart: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "sq_cart"

function saveLocal(items: CartItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

function loadLocal(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function clearLocal() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

/** Convert a DB row into the internal CartItem shape */
function dbRowToCartItem(row: DbCartItem): CartItem | null {
  const p = row.products
  if (!p) return null
  const price = Number(p.price) || 0
  const mrp = Number(p.compare_price) || price
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0
  return {
    qty: row.quantity,
    product: {
      id: p.id,           // real UUID — used for DB operations
      name: p.title,
      image: p.thumbnail || "/placeholder.svg",
      price,
      mrp,
      discount,
      rating: 0,
      ratingCount: 0,
      category: p.category ?? undefined,
      subCategory: p.sub_category ?? undefined,
      href: productHref({ category: p.category, subCategory: p.sub_category, slug: p.slug }),
      slug: p.slug,
    } as Product,
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const prevUserIdRef = useRef<string | null>(null)
  const supabase = createClient()

  // ── Step 1: hydrate from localStorage on mount ──────────────────────────
  useEffect(() => {
    setItems(loadLocal())
    setHydrated(true)
  }, [])

  // ── Step 2: watch auth state ─────────────────────────────────────────────
  useEffect(() => {
    // Get current session immediately
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Step 3: react to userId changes ─────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return
    const prev = prevUserIdRef.current
    prevUserIdRef.current = userId

    if (userId && !prev) {
      // User just logged IN → merge local cart into DB then load DB
      handleLogin(userId)
    } else if (!userId && prev) {
      // User just logged OUT → clear state and local storage
      setItems([])
      clearLocal()
    } else if (userId && prev && userId !== prev) {
      // Different user (account switch) → load new user's DB cart
      loadFromDb()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, hydrated])

  const handleLogin = useCallback(async (uid: string) => {
    const localItems = loadLocal()
    const dbRows = await getDbCartItems()
    const dbItems: CartItem[] = dbRows.flatMap((r) => {
      const item = dbRowToCartItem(r)
      return item ? [item] : []
    })

    if (localItems.length === 0) {
      // No local cart — just use DB
      setItems(dbItems)
      clearLocal()
      return
    }

    // Merge: local items take priority; add any DB-only items on top
    const merged = [...localItems]
    for (const dbItem of dbItems) {
      const exists = merged.find((m) => m.product.id === dbItem.product.id)
      if (!exists) merged.push(dbItem)
    }

    // Persist merged cart to DB
    await replaceDbCart(
      merged.map((i) => ({ productId: i.product.id, quantity: i.qty }))
    )
    setItems(merged)
    clearLocal()
  }, [])

  const loadFromDb = useCallback(async () => {
    const rows = await getDbCartItems()
    const loaded: CartItem[] = rows.flatMap((r) => {
      const item = dbRowToCartItem(r)
      return item ? [item] : []
    })
    setItems(loaded)
    clearLocal()
  }, [])

  // ── Persist to localStorage when logged out ──────────────────────────────
  useEffect(() => {
    if (!hydrated || userId) return
    saveLocal(items)
  }, [items, hydrated, userId])

  // ── Mutations ────────────────────────────────────────────────────────────

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      const next = existing
        ? prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { product, qty: 1 }]

      if (userId) {
        const newQty = existing ? existing.qty + 1 : 1
        upsertCartItem(product.id, newQty)
      }
      return next
    })
  }, [userId])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.product.id !== id)
      if (userId) removeCartItem(id)
      return next
    })
  }, [userId])

  const setQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) { removeItem(id); return }
    setItems((prev) => {
      const next = prev.map((i) => i.product.id === id ? { ...i, qty } : i)
      if (userId) upsertCartItem(id, qty)
      return next
    })
  }, [userId, removeItem])

  const clear = useCallback(() => {
    setItems([])
    if (userId) clearDbCart()
    else clearLocal()
  }, [userId])

  // ── Computed ─────────────────────────────────────────────────────────────

  const count    = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items])
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.product.price * i.qty, 0), [items])
  const savings  = useMemo(() => items.reduce((s, i) => s + (i.product.mrp - i.product.price) * i.qty, 0), [items])
  const tax      = useMemo(() => Math.round(subtotal * 0.18 * 100) / 100, [subtotal])
  const total    = useMemo(() => subtotal + tax, [subtotal, tax])

  // Aliases for compatibility with checkout/cart pages
  const updateQuantity = useCallback(
    (id: string, qty: number) => setQty(id, qty),
    [setQty],
  )
  const clearCart = clear

  return (
    <CartContext.Provider value={{
      items, count, subtotal, savings, tax, total,
      addItem,
      removeItem,
      updateQuantity,
      setQty,
      clear,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}

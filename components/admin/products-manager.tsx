"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, Plus, Pencil, Trash2, Eye, EyeOff, Star, Tag } from "lucide-react"
import type { Product } from "@/lib/mock-data"
import { deleteProduct, toggleProductActive, toggleProductFeatured, toggleProductDeal, setDealDiscount } from "@/app/actions/admin-product"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function ProductsManager({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [query, setQuery] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[]
    return cats.sort()
  }, [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q)
      const matchCat = catFilter === "all" || p.category === catFilter
      return matchQ && matchCat
    })
  }, [products, query, catFilter])

  function handleEdit(product: Product) {
    if (!product.productId) return
    router.push(`/admin/products/${product.productId}`)
  }

  function handleAdd() {
    router.push("/admin/products/new")
  }

  function requestDelete(product: Product) {
    setConfirmId(product.productId ?? product.id)
  }

  async function confirmDelete(product: Product) {
    const id = product.productId ?? product.id
    setDeletingId(id)
    setConfirmId(null)
    const result = await deleteProduct(id)
    setDeletingId(null)
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete product.")
      return
    }
    setProducts((prev) => prev.filter((p) => (p.productId ?? p.id) !== id))
    toast.success("Product deleted")
  }

  function handleToggleFeatured(product: Product) {
    const id = product.productId ?? product.id
    const newFeatured = !(product as Product & { _featured?: boolean })._featured
    setProducts((prev) =>
      prev.map((p) => (p.productId ?? p.id) === id ? { ...p, _featured: newFeatured } as Product : p)
    )
    startTransition(async () => {
      const result = await toggleProductFeatured(id, newFeatured)
      if (!result.success) {
        setProducts((prev) =>
          prev.map((p) => (p.productId ?? p.id) === id ? { ...p, _featured: !newFeatured } as Product : p)
        )
        toast.error(result.error ?? "Failed to update product.")
      } else {
        toast.success(newFeatured ? "Marked as featured" : "Removed from featured")
      }
    })
  }

  function handleToggleActive(product: Product) {
    const id = product.productId ?? product.id
    const nextActive = product.discount === -1 // use a flag via optimistic update
    // optimistic — flip in UI immediately
    const newActive = !isActive(product)
    setProducts((prev) =>
      prev.map((p) =>
        (p.productId ?? p.id) === id ? { ...p, _active: newActive } as Product : p,
      ),
    )
    startTransition(async () => {
      const result = await toggleProductActive(id, newActive)
      if (!result.success) {
        // revert
        setProducts((prev) =>
          prev.map((p) =>
            (p.productId ?? p.id) === id ? { ...p, _active: !newActive } as Product : p,
          ),
        )
        toast.error(result.error ?? "Failed to update product.")
      } else {
        toast.success(newActive ? "Product activated" : "Product deactivated")
      }
    })
  }

  // Products fetched from DB have no _active flag; treat undefined as active
  function isActive(p: Product & { _active?: boolean }) {
    return p._active !== false
  }

  function handleToggleDeal(product: Product) {
    const id = product.productId ?? product.id
    const newDeal = !product.isDeal
    setProducts((prev) =>
      prev.map((p) => (p.productId ?? p.id) === id ? { ...p, isDeal: newDeal } : p)
    )
    startTransition(async () => {
      const result = await toggleProductDeal(id, newDeal)
      if (!result.success) {
        setProducts((prev) =>
          prev.map((p) => (p.productId ?? p.id) === id ? { ...p, isDeal: !newDeal } : p)
        )
        toast.error(result.error ?? "Failed to update deal status.")
      } else {
        toast.success(newDeal ? "Marked as deal" : "Removed from deals")
      }
    })
  }

  function handleDealDiscount(product: Product, value: string) {
    const id = product.productId ?? product.id
    const discount = value === "" ? null : Math.min(99, Math.max(1, parseInt(value, 10)))
    setProducts((prev) =>
      prev.map((p) => (p.productId ?? p.id) === id ? { ...p, dealDiscount: discount } : p)
    )
    startTransition(async () => {
      await setDealDiscount(id, isNaN(discount as number) ? null : discount)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search products…"
              className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{filtered.length} of {products.length}</span>
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90"
            >
              <Plus className="size-4" />
              Add Product
            </button>
          </div>
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {["all", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${catFilter === cat ? "border-brand bg-brand text-white" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            No products found.
          </p>
        ) : (
          filtered.map((product) => {
            const id = product.productId ?? product.id
            const isConfirming = confirmId === id
            const isDeleting = deletingId === id

            return (
              <div
                key={id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="h-9 w-9 object-contain"
                    unoptimized
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-foreground">{product.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                    <span className="font-semibold text-foreground">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    {product.mrp > product.price && (
                      <span className="text-muted-foreground line-through">
                        ₹{product.mrp.toLocaleString("en-IN")}
                      </span>
                    )}
                    {product.discount > 0 && (
                      <span className="text-green-600">{product.discount}% off</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {isConfirming ? (
                    <>
                      <button
                        type="button"
                        onClick={() => confirmDelete(product)}
                        className="rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        aria-label={`Edit ${product.name}`}
                        onClick={() => handleEdit(product)}
                        className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => requestDelete(product)}
                        disabled={isDeleting}
                        className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card sm:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium">Deal</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((product) => {
              const id = product.productId ?? product.id
              const isConfirming = confirmId === id
              const isDeleting = deletingId === id
              const active = isActive(product as Product & { _active?: boolean })

              return (
                <tr key={id} className={cn("transition hover:bg-muted/50", !active && "opacity-60")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          width={32}
                          height={32}
                          className="h-8 w-8 object-contain"
                          unoptimized
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="line-clamp-1 max-w-xs font-medium text-foreground">{product.name}</p>
                        {product.category && (
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-semibold text-foreground">₹{product.price.toLocaleString("en-IN")}</span>
                      {product.mrp > product.price && (
                        <span className="ml-1.5 text-xs text-muted-foreground line-through">₹{product.mrp.toLocaleString("en-IN")}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {(product as any).stock != null ? (
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${(product as any).stock === 0 ? "bg-red-100 text-red-700" : (product as any).stock < 10 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                        {(product as any).stock}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(product)}
                      disabled={isPending}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition disabled:opacity-60",
                        active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-muted text-muted-foreground hover:bg-muted/70",
                      )}
                    >
                      {active ? (
                        <><Eye className="h-3 w-3" /> Active</>
                      ) : (
                        <><EyeOff className="h-3 w-3" /> Inactive</>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(product)}
                      disabled={isPending}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition disabled:opacity-60",
                        (product as any)._featured
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          : "bg-muted text-muted-foreground hover:bg-muted/70",
                      )}
                    >
                      <Star className="h-3 w-3" />
                      {(product as any)._featured ? "Yes" : "No"}
                    </button>
                  </td>
                  {/* Deal column */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleDeal(product)}
                        disabled={isPending}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition disabled:opacity-60",
                          product.isDeal
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-muted text-muted-foreground hover:bg-muted/70",
                        )}
                      >
                        <Tag className="h-3 w-3" />
                        {product.isDeal ? "Active" : "Off"}
                      </button>
                      {product.isDeal && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={product.dealDiscount ?? ""}
                            onChange={(e) => handleDealDiscount(product, e.target.value)}
                            placeholder="Auto"
                            className="w-16 rounded-md border border-input bg-background px-2 py-0.5 text-xs text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {isConfirming ? (
                        <>
                          <button
                            type="button"
                            onClick={() => confirmDelete(product)}
                            className="rounded-md bg-red-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            aria-label={`Edit ${product.name}`}
                            onClick={() => handleEdit(product)}
                            className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${product.name}`}
                            onClick={() => requestDelete(product)}
                            disabled={isDeleting}
                            className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

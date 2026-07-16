"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useTransition } from "react"
import { ChevronDown, ChevronUp, Star, RotateCcw } from "lucide-react"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function useFilterRouter() {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString())
      if (value === null || value === "") next.delete(key)
      else next.set(key, value)
      startTransition(() => router.push(`/search?${next.toString()}`))
    },
    [router, params],
  )

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key)
        else next.set(key, value)
      }
      startTransition(() => router.push(`/search?${next.toString()}`))
    },
    [router, params],
  )

  return { params, setParam, setParams, isPending }
}

// ---------------------------------------------------------------------------
// Section wrapper with collapse toggle
// ---------------------------------------------------------------------------
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border pb-3 pt-3 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
      >
        {title}
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </button>
      {open && <div className="mt-2.5">{children}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Price range filter
// ---------------------------------------------------------------------------
const PRICE_BUCKETS = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 – ₹1,000", min: 500, max: 1000 },
  { label: "₹1,000 – ₹5,000", min: 1000, max: 5000 },
  { label: "₹5,000 – ₹10,000", min: 5000, max: 10000 },
  { label: "₹10,000 – ₹25,000", min: 10000, max: 25000 },
  { label: "Over ₹25,000", min: 25000, max: 0 },
]

function PriceFilter() {
  const { params, setParams } = useFilterRouter()
  const currentMin = Number(params.get("minPrice") ?? 0)
  const currentMax = Number(params.get("maxPrice") ?? 0)

  const isActive = (min: number, max: number) =>
    currentMin === min && currentMax === max

  const select = (min: number, max: number) => {
    if (isActive(min, max)) {
      setParams({ minPrice: null, maxPrice: null })
    } else {
      setParams({
        minPrice: min > 0 ? String(min) : null,
        maxPrice: max > 0 ? String(max) : null,
      })
    }
  }

  return (
    <FilterSection title="Price">
      <ul className="space-y-1">
        {PRICE_BUCKETS.map((b) => {
          const active = isActive(b.min, b.max)
          return (
            <li key={b.label}>
              <button
                type="button"
                onClick={() => select(b.min, b.max)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-sm transition ${
                  active
                    ? "bg-brand/10 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border transition ${
                    active ? "border-brand bg-brand" : "border-muted-foreground"
                  }`}
                  aria-hidden="true"
                />
                {b.label}
              </button>
            </li>
          )
        })}
      </ul>
    </FilterSection>
  )
}

// ---------------------------------------------------------------------------
// Brand filter (multi-select checkboxes)
// ---------------------------------------------------------------------------
function BrandFilter({ brands }: { brands: string[] }) {
  const { params, setParam } = useFilterRouter()
  const [showAll, setShowAll] = useState(false)

  const activeBrands = new Set(
    (params.get("brands") ?? "").split(",").filter(Boolean),
  )

  const toggle = (brand: string) => {
    const next = new Set(activeBrands)
    if (next.has(brand)) next.delete(brand)
    else next.add(brand)
    setParam("brands", next.size > 0 ? [...next].join(",") : null)
  }

  const visible = showAll ? brands : brands.slice(0, 8)

  return (
    <FilterSection title="Brand">
      <ul className="space-y-1">
        {visible.map((brand) => {
          const checked = activeBrands.has(brand)
          return (
            <li key={brand}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm transition hover:bg-muted">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(brand)}
                  className="h-3.5 w-3.5 accent-brand"
                />
                <span className={checked ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {brand}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      {brands.length > 8 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-1 px-2 text-xs font-medium text-link hover:underline"
        >
          {showAll ? "Show less" : `See all ${brands.length} brands`}
        </button>
      )}
    </FilterSection>
  )
}

// ---------------------------------------------------------------------------
// Rating filter
// ---------------------------------------------------------------------------
const RATINGS = [4, 3, 2, 1]

function RatingFilter() {
  const { params, setParam } = useFilterRouter()
  const current = Number(params.get("minRating") ?? 0)

  return (
    <FilterSection title="Avg. Customer Review">
      <ul className="space-y-1">
        {RATINGS.map((r) => {
          const active = current === r
          return (
            <li key={r}>
              <button
                type="button"
                onClick={() => setParam("minRating", active ? null : String(r))}
                className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm transition ${
                  active
                    ? "bg-brand/10 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                aria-label={`${r} stars and above`}
              >
                <span className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < r ? "fill-star text-star" : "fill-muted text-muted"}`}
                      aria-hidden="true"
                    />
                  ))}
                </span>
                <span>& Up</span>
              </button>
            </li>
          )
        })}
      </ul>
    </FilterSection>
  )
}

// ---------------------------------------------------------------------------
// Discount filter
// ---------------------------------------------------------------------------
const DISCOUNT_BUCKETS = [
  { label: "10% or more", value: 10 },
  { label: "25% or more", value: 25 },
  { label: "50% or more", value: 50 },
  { label: "75% or more", value: 75 },
]

function DiscountFilter() {
  const { params, setParam } = useFilterRouter()
  const current = Number(params.get("minDiscount") ?? 0)

  return (
    <FilterSection title="Discount">
      <ul className="space-y-1">
        {DISCOUNT_BUCKETS.map((b) => {
          const active = current === b.value
          return (
            <li key={b.value}>
              <button
                type="button"
                onClick={() => setParam("minDiscount", active ? null : String(b.value))}
                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-sm transition ${
                  active
                    ? "bg-brand/10 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border transition ${
                    active ? "border-brand bg-brand" : "border-muted-foreground"
                  }`}
                  aria-hidden="true"
                />
                {b.label}
              </button>
            </li>
          )
        })}
      </ul>
    </FilterSection>
  )
}

// ---------------------------------------------------------------------------
// Active filter chips shown in results header
// ---------------------------------------------------------------------------
export function ActiveFilterChips({
  current,
}: {
  current: {
    q?: string
    category?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
    brands?: string
    minRating?: string
    minDiscount?: string
  }
}) {
  const { params, setParam, setParams } = useFilterRouter()

  const chips: { label: string; onRemove: () => void }[] = []

  if (current.minPrice || current.maxPrice) {
    const min = Number(current.minPrice ?? 0)
    const max = Number(current.maxPrice ?? 0)
    const label = min > 0 && max > 0
      ? `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}`
      : min > 0
      ? `From ₹${min.toLocaleString("en-IN")}`
      : `Up to ₹${max.toLocaleString("en-IN")}`
    chips.push({ label, onRemove: () => setParams({ minPrice: null, maxPrice: null }) })
  }

  if (current.brands) {
    for (const b of current.brands.split(",").filter(Boolean)) {
      chips.push({ label: b, onRemove: () => {
        const next = current.brands!.split(",").filter((x) => x !== b)
        setParam("brands", next.length > 0 ? next.join(",") : null)
      }})
    }
  }

  if (current.minRating) {
    chips.push({
      label: `${current.minRating}★ & up`,
      onRemove: () => setParam("minRating", null),
    })
  }

  if (current.minDiscount) {
    chips.push({
      label: `${current.minDiscount}% off or more`,
      onRemove: () => setParam("minDiscount", null),
    })
  }

  if (chips.length === 0) return null

  const clearAll = () => {
    setParams({
      minPrice: null,
      maxPrice: null,
      brands: null,
      minRating: null,
      minDiscount: null,
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={chip.onRemove}
          className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-foreground transition hover:border-destructive hover:text-destructive"
        >
          {chip.label}
          <span className="text-muted-foreground">×</span>
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition hover:text-destructive"
      >
        <RotateCcw className="h-3 w-3" aria-hidden="true" />
        Clear all
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export — composed filter sidebar panel
// ---------------------------------------------------------------------------
export function SearchFiltersPanel({ brands }: { brands: string[] }) {
  const { params, setParams } = useFilterRouter()

  const hasFilters =
    params.get("minPrice") ||
    params.get("maxPrice") ||
    params.get("brands") ||
    params.get("minRating") ||
    params.get("minDiscount")

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">Filters</h2>
        {hasFilters && (
          <button
            type="button"
            onClick={() =>
              setParams({
                minPrice: null,
                maxPrice: null,
                brands: null,
                minRating: null,
                minDiscount: null,
              })
            }
            className="text-xs font-medium text-link hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
      <PriceFilter />
      <BrandFilter brands={brands} />
      <RatingFilter />
      <DiscountFilter />
    </div>
  )
}

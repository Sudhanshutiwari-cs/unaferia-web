"use client"

import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

const sorts = [
  { value: "relevance",  label: "Featured" },
  { value: "price-asc",  label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating",     label: "Avg. Customer Review" },
  { value: "discount",   label: "Best Discount" },
]

export function SortSelect({ current }: { current: string }) {
  const router = useRouter()
  const params = useSearchParams()

  const onChange = (value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value === "relevance") next.delete("sort")
    else next.set("sort", value)
    router.push(`/search?${next.toString()}`)
  }

  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <span className="hidden sm:inline text-muted-foreground">Sort by:</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
      >
        {sorts.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </label>
  )
}

export function CategoryChips({ categories, active }: { categories: string[]; active: string }) {
  const params = useSearchParams()

  const buildHref = (cat: string) => {
    const next = new URLSearchParams(params.toString())
    if (cat === "All") next.delete("category")
    else next.set("category", cat)
    return `/search?${next.toString()}`
  }

  return (
    <div className="flex flex-col gap-1">
      {["All", ...categories].map((cat) => {
        const isActive = cat === active || (cat === "All" && !active)
        return (
          <Link
            key={cat}
            href={buildHref(cat)}
            className={`rounded-md px-2 py-1.5 text-sm transition ${
              isActive ? "bg-brand/15 font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {cat}
          </Link>
        )
      })}
    </div>
  )
}

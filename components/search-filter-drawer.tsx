"use client"

import { useState } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { CategoryChips } from "@/components/search-controls"
import { SearchFiltersPanel } from "@/components/search-filters"

export function SearchFilterDrawer({
  categories,
  active,
  brands,
}: {
  categories: string[]
  active: string
  brands: string[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        aria-label="Open filters"
        aria-expanded={open}
        aria-controls="mobile-filter-panel"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filters
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Product filters" id="mobile-filter-panel">
          {/* Backdrop */}
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 flex h-full w-80 max-w-[90vw] flex-col bg-card shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <span className="font-bold text-foreground">Filters</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="rounded-md p-1 hover:bg-muted"
              >
                <X className="h-5 w-5 text-foreground" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3" onClick={(e) => {
              // Close when a filter link is clicked (navigation will close naturally)
              const target = e.target as HTMLElement
              if (target.tagName === "A") setOpen(false)
            }}>
              {/* Department */}
              <div className="mb-1 text-sm font-semibold text-foreground">Department</div>
              <div className="mb-4">
                <CategoryChips categories={categories} active={active} />
              </div>

              {/* All other filters */}
              <SearchFiltersPanel brands={brands} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

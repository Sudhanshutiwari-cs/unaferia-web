"use client"

import Link from "next/link"
import { Clock } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import type { RecommendedDeal } from "@/lib/queries"

export function RecommendedDeals({ deals }: { deals: RecommendedDeal[] }) {
  return (
    <section aria-label="Recommended deals for you" className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-deal text-[11px] font-bold text-white">
            %
          </span>
          <h2 className="text-xl font-bold text-foreground">Recommended deals for you</h2>
        </div>
        <Link href="/search?sort=discount" className="text-sm font-medium text-link hover:underline">
          View all
        </Link>
      </div>

      {deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-deal/10">
            <Clock className="h-6 w-6 text-deal" />
          </div>
          <p className="text-sm font-semibold text-foreground">No recommended deals yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Go to <span className="font-medium text-foreground">Admin → Products</span> and toggle the{" "}
            <span className="font-medium text-foreground">Deal</span> flag on any product to feature it here.
          </p>
        </div>
      ) : (
        <div className="flex snap-x gap-2 overflow-x-auto scroll-smooth touch-pan-x pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="w-[42vw] max-w-[180px] shrink-0 snap-start sm:w-44 md:w-48 lg:w-[calc((100%-3rem)/5)]"
            >
              <ProductCard product={deal} showDealLabel dealDiscount={deal.dealDiscount} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

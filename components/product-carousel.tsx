"use client"

import type { Product } from "@/lib/mock-data"
import { ProductCard } from "@/components/product-card"

export function ProductCarousel({
  title,
  products,
}: {
  title: string
  products: Product[]
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <a href="#" className="text-sm font-medium text-link hover:underline">
          View all
        </a>
      </div>

      <div className="flex snap-x gap-2 overflow-x-auto scroll-smooth touch-pan-x pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="w-[42vw] max-w-[180px] shrink-0 snap-start sm:w-44 md:w-48 lg:w-[calc((100%-3rem)/5)]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}

"use client"

import { HeroBanner } from "@/components/hero-banner"
import { FeatureStrip } from "@/components/feature-strip"
import { ProductCarousel } from "@/components/product-carousel"
import { ShopByCategory } from "@/components/shop-by-category"
import { PromoBanner } from "@/components/promo-banner"
import { TopBrands } from "@/components/top-brands"
import { WhyShop } from "@/components/why-shop"
import { SiteFooter } from "@/components/site-footer"
import { RecommendedDeals } from "@/components/recommended-deals"
import type { Product, ShopCategory } from "@/lib/mock-data"
import type { RecommendedDeal } from "@/lib/queries"

export function StoreShell({
  deals,
  bestSellers,
  categories,
  recommendedDeals,
}: {
  deals: Product[]
  bestSellers: Product[]
  categories: ShopCategory[]
  recommendedDeals: RecommendedDeal[]
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-2 py-3 sm:px-4">
        <div className="flex gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <HeroBanner />
            <FeatureStrip />
            <RecommendedDeals deals={recommendedDeals} />
            <ProductCarousel title="Deals of the Day" products={deals} />
            <ShopByCategory categories={categories} />
            <PromoBanner />
            <ProductCarousel title="Best Sellers" products={bestSellers} />
            <TopBrands />
            <WhyShop />
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

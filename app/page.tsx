import type { Metadata } from "next"
import { StoreShell } from "@/components/store-shell"
import { BannerCarousel } from "@/components/banner-carousel"
import { getDeals, getBestSellers, getShopCategories, getRecommendedDeals } from "@/lib/queries"
import { getActiveBanners } from "@/app/actions/admin-banners"
import { getPageSeo, buildMetadata } from "@/lib/seo"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("home")
  return buildMetadata(seo, "/")
}

export default async function Page() {
  const [deals, bestSellers, categories, banners, recommendedDeals] = await Promise.all([
    getDeals(),
    getBestSellers(),
    getShopCategories(),
    getActiveBanners(),
    getRecommendedDeals(),
  ])

  return (
    <>
      {banners.length > 0 && <BannerCarousel banners={banners} />}
      <StoreShell deals={deals} bestSellers={bestSellers} categories={categories} recommendedDeals={recommendedDeals} />
    </>
  )
}

import type { Metadata } from "next"
import { getPageSeo, buildMetadata } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("cart")
  return buildMetadata(seo, "/cart")
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from "next"
import { getPageSeo, buildMetadata } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("contact")
  return buildMetadata(seo, "/contact")
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

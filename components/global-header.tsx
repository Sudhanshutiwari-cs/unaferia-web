"use client"

import { usePathname } from "next/navigation"
import { SiteHeader } from "@/components/site-header"

// Renders the shared storefront header on every route except the admin panel.
export function GlobalHeader() {
  const pathname = usePathname()
  if (pathname?.startsWith("/admin")) return null
  return <SiteHeader />
}

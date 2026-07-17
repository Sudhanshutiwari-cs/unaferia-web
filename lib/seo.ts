import "server-only"
import { createClient } from "@/lib/supabase/server"

export type SeoData = {
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  ogImage: string | null
}

const SITE_NAME = "Unaferia"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://unaferia.in"

const FALLBACK: SeoData = {
  metaTitle: `${SITE_NAME} - Online Shopping for Electronics, Fashion & More`,
  metaDescription:
    "Unaferia is your one-stop destination for online shopping in India. Best deals, secure payments and fast delivery.",
  metaKeywords: "online shopping, electronics, fashion, deals, india",
  ogImage: null,
}

/**
 * Fetch SEO data for a static page by its slug (e.g. "home", "about", "contact").
 * Falls back to sensible defaults if the row is missing.
 */
export async function getPageSeo(slug: string): Promise<SeoData> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("seo_pages")
      .select("meta_title, meta_description, meta_keywords, og_image")
      .eq("page_slug", slug)
      .maybeSingle()

    if (error || !data) return FALLBACK

    return {
      metaTitle: data.meta_title || FALLBACK.metaTitle,
      metaDescription: data.meta_description || FALLBACK.metaDescription,
      metaKeywords: data.meta_keywords || FALLBACK.metaKeywords,
      ogImage: (data.og_image as string | null) ?? null,
    }
  } catch {
    return FALLBACK
  }
}

/**
 * Build a Next.js Metadata object from SeoData.
 * Pass an optional canonicalPath (e.g. "/about") for og:url.
 */
export function buildMetadata(
  seo: SeoData,
  canonicalPath?: string,
) {
  const url = canonicalPath ? `${SITE_URL}${canonicalPath}` : SITE_URL
  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    keywords: seo.metaKeywords,
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      url,
      siteName: SITE_NAME,
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image" as const,
      title: seo.metaTitle,
      description: seo.metaDescription,
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
  }
}

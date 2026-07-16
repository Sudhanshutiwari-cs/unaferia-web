// Shared helpers for building canonical product URLs of the form:
//   /category-slug/subcategory-slug/product-slug

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

// Build the canonical product path from category, sub-category, and product slug.
// Falls back to sensible defaults so a URL is always well-formed.
export function productHref(opts: {
  category?: string | null
  subCategory?: string | null
  slug: string
}): string {
  const cat = opts.category ? slugify(opts.category) : "shop"
  const sub = opts.subCategory ? slugify(opts.subCategory) : "all"
  return `/${cat}/${sub}/${opts.slug}`
}

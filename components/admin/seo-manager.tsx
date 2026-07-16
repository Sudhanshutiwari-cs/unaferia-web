"use client"

import { useState, useTransition } from "react"
import { Search, ChevronDown, ChevronUp, Save, CheckCircle2, AlertCircle, Globe, Tag, Package } from "lucide-react"
import { updateSeoPage, updateCategorySeo, updateProductSeo } from "@/app/actions/admin-seo"
import type { SeoPage, CategorySeoRow, ProductSeoRow } from "@/app/actions/admin-seo"

// ---------------------------------------------------------------------------
// SERP Preview
// ---------------------------------------------------------------------------

function SerpPreview({ title, url, description }: { title: string; url: string; description: string }) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-card p-4">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Google Preview</p>
      <div className="space-y-0.5">
        <p className="truncate text-[13px] font-medium text-[#1a0dab] dark:text-[#8ab4f8]">
          {title || <span className="italic text-muted-foreground">No title set</span>}
        </p>
        <p className="truncate text-xs text-[#006621] dark:text-[#34a853]">{url}</p>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {description || <span className="italic">No description set</span>}
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared SEO field form (used across all three tabs)
// ---------------------------------------------------------------------------

type SeoFormData = {
  meta_title: string
  meta_description: string
  meta_keywords: string
}

function SeoFieldsForm({
  initial,
  previewUrl,
  onSave,
}: {
  initial: SeoFormData
  previewUrl: string
  onSave: (data: SeoFormData) => Promise<{ ok: boolean; error?: string }>
}) {
  const [form, setForm] = useState<SeoFormData>(initial)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const titleLen = form.meta_title.length
  const descLen = form.meta_description.length

  function update(field: keyof SeoFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
    setErr(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await onSave(form)
      if (result.ok) {
        setSaved(true)
        setErr(null)
      } else {
        setErr(result.error ?? "Failed to save")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Meta Title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Meta Title</label>
          <span className={`text-xs tabular-nums ${titleLen > 60 ? "text-red-500" : titleLen > 50 ? "text-amber-500" : "text-muted-foreground"}`}>
            {titleLen} / 60
          </span>
        </div>
        <input
          type="text"
          value={form.meta_title}
          onChange={(e) => update("meta_title", e.target.value)}
          placeholder="Page title shown in search results…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>

      {/* Meta Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Meta Description</label>
          <span className={`text-xs tabular-nums ${descLen > 160 ? "text-red-500" : descLen > 140 ? "text-amber-500" : "text-muted-foreground"}`}>
            {descLen} / 160
          </span>
        </div>
        <textarea
          rows={3}
          value={form.meta_description}
          onChange={(e) => update("meta_description", e.target.value)}
          placeholder="A short summary shown below the title in search results…"
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>

      {/* Meta Keywords */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Meta Keywords</label>
        <input
          type="text"
          value={form.meta_keywords}
          onChange={(e) => update("meta_keywords", e.target.value)}
          placeholder="Comma-separated keywords, e.g. electronics, mobiles, deals"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <p className="text-xs text-muted-foreground">Separate keywords with commas. Not a strong ranking signal but still useful for organisation.</p>
      </div>

      {/* SERP Preview */}
      <SerpPreview
        title={form.meta_title}
        url={previewUrl}
        description={form.meta_description}
      />

      {/* Save row */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground transition hover:brightness-95 disabled:opacity-60"
        >
          <Save className="size-4" />
          {isPending ? "Saving…" : "Save Changes"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="size-4" /> Saved
          </span>
        )}
        {err && (
          <span className="flex items-center gap-1.5 text-sm text-red-500">
            <AlertCircle className="size-4" /> {err}
          </span>
        )}
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Expandable row wrapper
// ---------------------------------------------------------------------------

function ExpandableRow({
  label,
  badge,
  children,
}: {
  label: string
  badge?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-muted/40"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="truncate font-medium text-foreground">{label}</span>
          {badge && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Static Pages
// ---------------------------------------------------------------------------

function PagesTab({ pages }: { pages: SeoPage[] }) {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://shouryaquest.in"
  return (
    <div className="space-y-3">
      {pages.map((page) => (
        <ExpandableRow key={page.page_slug} label={page.page_label} badge={`/${page.page_slug === "home" ? "" : page.page_slug}`}>
          <SeoFieldsForm
            initial={{
              meta_title: page.meta_title,
              meta_description: page.meta_description,
              meta_keywords: page.meta_keywords,
            }}
            previewUrl={`${SITE}/${page.page_slug === "home" ? "" : page.page_slug}`}
            onSave={(data) => updateSeoPage(page.page_slug, data)}
          />
        </ExpandableRow>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Categories
// ---------------------------------------------------------------------------

function CategoriesTab({ categories }: { categories: CategorySeoRow[] }) {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://shouryaquest.in"
  const [search, setSearch] = useState("")
  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Filter categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No categories match your search.</p>
        )}
        {filtered.map((cat) => (
          <ExpandableRow key={cat.id} label={cat.name} badge={`/category/${cat.slug}`}>
            <SeoFieldsForm
              initial={{
                meta_title: cat.meta_title ?? "",
                meta_description: cat.meta_description ?? "",
                meta_keywords: cat.meta_keywords ?? "",
              }}
              previewUrl={`${SITE}/category/${cat.slug}`}
              onSave={(data) => updateCategorySeo(cat.id, data)}
            />
          </ExpandableRow>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Products
// ---------------------------------------------------------------------------

function ProductsTab({ products }: { products: ProductSeoRow[] }) {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://shouryaquest.in"
  const [search, setSearch] = useState("")
  const filtered = products.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {products.length} products
      </p>
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No products match your search.</p>
        )}
        {filtered.map((product) => (
          <ExpandableRow key={product.id} label={product.title} badge={`/…/${product.slug}`}>
            <SeoFieldsForm
              initial={{
                meta_title: product.meta_title ?? "",
                meta_description: product.meta_description ?? "",
                meta_keywords: product.meta_keywords ?? "",
              }}
              previewUrl={`${SITE}/p/${product.slug}`}
              onSave={(data) => updateProductSeo(product.id, data)}
            />
          </ExpandableRow>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

type Tab = "pages" | "categories" | "products"

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "pages", label: "Pages", icon: Globe },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "products", label: "Products", icon: Package },
]

export function SeoManager({
  pages,
  categories,
  products,
}: {
  pages: SeoPage[]
  categories: CategorySeoRow[]
  products: ProductSeoRow[]
}) {
  const [tab, setTab] = useState<Tab>("pages")

  return (
    <div>
      {/* Info banner */}
      <div className="mb-6 rounded-xl border border-brand/20 bg-brand/5 px-5 py-4">
        <p className="text-sm text-foreground">
          <span className="font-semibold">SEO controls every page.</span> Changes here update the{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">meta title</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">meta description</code>, and{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">meta keywords</code> that search engines and social networks read.
          The live Google SERP preview shows exactly how each page will appear in results.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="size-4" />
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${tab === t.id ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"}`}>
              {t.id === "pages" ? pages.length : t.id === "categories" ? categories.length : products.length}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "pages" && <PagesTab pages={pages} />}
      {tab === "categories" && <CategoriesTab categories={categories} />}
      {tab === "products" && <ProductsTab products={products} />}
    </div>
  )
}

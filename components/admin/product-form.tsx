"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Star,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { updateProduct, createProduct } from "@/app/actions/admin-product"
import type { ProductFormData, ProductEditRow } from "@/app/actions/admin-product"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { SupabaseImageUpload } from "@/components/admin/supabase-image-upload"

const CATEGORIES = [
  "Arts, Crafts & Sewing", "Audio", "Automotive", "Baby Products", "Beauty",
  "Books", "Cameras", "Clothing", "Collectibles", "Computers & Accessories",
  "Electronics", "Garden & Outdoor", "Gift Cards", "Grocery", "Handbags",
  "Health & Personal Care", "Home & Kitchen", "Industrial & Scientific",
  "Jewellery", "Luggage", "Mobiles & Accessories", "Musical Instruments",
  "Office Products", "Pet Supplies", "Shoes", "Sports & Outdoors",
  "Sunglasses", "Tools & Home Improvement", "Toys & Games", "Video Games",
]

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

// ----------------------------------------------------------------- section ---
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </div>
  )
}

// ------------------------------------------------------------------ field ----
function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground disabled:opacity-60"

// ------------------------------------------------- string-list editor -------
function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string
  items: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  function update(i: number, val: string) {
    const next = [...items]
    next[i] = val
    onChange(next)
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i))
  }
  function add() {
    onChange([...items, ""])
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-foreground hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </div>
  )
}

// ------------------------------------------- specifications key-value -------
function SpecsEditor({
  specs,
  onChange,
}: {
  specs: Record<string, string>
  onChange: (next: Record<string, string>) => void
}) {
  const entries = Object.entries(specs)

  function updateKey(oldKey: string, newKey: string) {
    const next: Record<string, string> = {}
    for (const [k, v] of Object.entries(specs)) {
      next[k === oldKey ? newKey : k] = v
    }
    onChange(next)
  }
  function updateVal(key: string, val: string) {
    onChange({ ...specs, [key]: val })
  }
  function remove(key: string) {
    const next = { ...specs }
    delete next[key]
    onChange(next)
  }
  function add() {
    const key = `Spec ${entries.length + 1}`
    onChange({ ...specs, [key]: "" })
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">Specifications</span>
      {entries.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <input
            value={k}
            onChange={(e) => updateKey(k, e.target.value)}
            placeholder="Key"
            className={cn(inputCls, "sm:w-40 sm:shrink-0")}
          />
          <input
            value={v}
            onChange={(e) => updateVal(k, e.target.value)}
            placeholder="Value"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => remove(k)}
            className="flex h-8 w-8 shrink-0 items-center justify-center self-end rounded-md border border-border text-muted-foreground hover:bg-red-50 hover:text-red-600 sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex w-fit items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-foreground hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Add spec
      </button>
    </div>
  )
}

// --------------------------------------------------------- images editor ----
function ImagesEditor({
  images,
  onChange,
}: {
  images: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-foreground">Gallery Images</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((url, i) => (
          <div key={i} className="group relative">
            <SupabaseImageUpload
              value={url}
              onChange={(next) => {
                const arr = [...images]
                if (next === "") {
                  arr.splice(i, 1)
                } else {
                  arr[i] = next
                }
                onChange(arr)
              }}
              bucket="products"
              aspectClass="aspect-square"
              placeholder="Upload image"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...images, ""])}
          className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-brand/60 hover:text-brand"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}

// ================================================================ MAIN FORM ==

type Props = {
  mode: "create" | "edit"
  product?: ProductEditRow
}

function buildDefaults(product?: ProductEditRow): ProductFormData {
  if (!product) {
    return {
      title: "", slug: "", description: "", brand: "", category: "",
      sub_category: "", sku: "", price: 0, compare_price: null,
      cost_price: null, stock: 0, thumbnail: "", images: [],
      features: [], box_contents: [], specifications: {},
      is_active: true, is_featured: false, meta_title: "",
      meta_description: "", meta_keywords: "", weight: null,
    }
  }
  return {
    title: product.title, slug: product.slug, description: product.description,
    brand: product.brand, category: product.category,
    sub_category: product.sub_category, sku: product.sku,
    price: product.price, compare_price: product.compare_price,
    cost_price: product.cost_price, stock: product.stock,
    thumbnail: product.thumbnail, images: product.images,
    features: product.features, box_contents: product.box_contents,
    specifications: product.specifications, is_active: product.is_active,
    is_featured: product.is_featured,     meta_title: product.meta_title,
    meta_description: product.meta_description,
    meta_keywords: product.meta_keywords ?? "",
    weight: product.weight,
  }
}

export function ProductForm({ mode, product }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ProductFormData>(() => buildDefaults(product))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const set = useCallback(<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
    setSuccess(false)
  }, [])

  // Auto-slug from title on create
  function handleTitleChange(title: string) {
    set("title", title)
    if (mode === "create") {
      set("slug", slugify(title))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError("Title is required."); return }
    if (!form.slug.trim()) { setError("Slug is required."); return }
    if (form.price <= 0) { setError("Price must be greater than 0."); return }

    setSaving(true)
    setError(null)

    let result
    if (mode === "edit" && product) {
      result = await updateProduct(product.id, form)
    } else {
      result = await createProduct(form)
    }

    setSaving(false)

    if (!result.success) {
      setError(result.error ?? "Something went wrong.")
      toast.error(result.error ?? "Something went wrong.")
      return
    }

    setSuccess(true)
    toast.success(mode === "edit" ? "Product saved" : "Product created")
    if (mode === "create" && "id" in result && result.id) {
      router.push(`/admin/products/${result.id}`)
    }
  }

  const discount =
    form.compare_price && form.compare_price > form.price
      ? Math.round(((form.compare_price - form.price) / form.compare_price) * 100)
      : 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Active toggle */}
          <button
            type="button"
            onClick={() => set("is_active", !form.is_active)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
              form.is_active
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {form.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {form.is_active ? "Active" : "Inactive"}
          </button>

          {/* Featured toggle */}
          <button
            type="button"
            onClick={() => set("is_featured", !form.is_featured)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
              form.is_featured
                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            <Star className="h-3.5 w-3.5" />
            {form.is_featured ? "Featured" : "Not Featured"}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : mode === "create" ? "Create Product" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Error / success banners */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Product saved successfully.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT — main fields */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Basic info */}
          <Section title="Basic Information">
            <div className="flex flex-col gap-4">
              <Field label="Product Title" required>
                <input
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Samsung Galaxy S24 Ultra"
                  className={inputCls}
                  required
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Slug" required hint="Used in the product URL">
                  <input
                    value={form.slug}
                    onChange={(e) => set("slug", e.target.value)}
                    placeholder="samsung-galaxy-s24-ultra"
                    className={inputCls}
                    required
                  />
                </Field>
                <Field label="SKU">
                  <input
                    value={form.sku}
                    onChange={(e) => set("sku", e.target.value)}
                    placeholder="SKU-001"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Brand">
                  <input
                    value={form.brand}
                    onChange={(e) => set("brand", e.target.value)}
                    placeholder="Samsung"
                    className={inputCls}
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— Select category —</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Sub-category">
                <input
                  value={form.sub_category}
                  onChange={(e) => set("sub_category", e.target.value)}
                  placeholder="Smartphones"
                  className={inputCls}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Detailed product description…"
                  rows={5}
                  className={cn(inputCls, "resize-y")}
                />
              </Field>
            </div>
          </Section>

          {/* Media */}
          <Section title="Media">
            <div className="flex flex-col gap-5">
              <Field label="Thumbnail" required hint="Main product image shown in listing cards">
                <SupabaseImageUpload
                  value={form.thumbnail}
                  onChange={(url) => set("thumbnail", url)}
                  bucket="products"
                  aspectClass="aspect-video"
                  placeholder="Upload thumbnail image"
                />
              </Field>
              <ImagesEditor images={form.images} onChange={(v) => set("images", v)} />
            </div>
          </Section>

          {/* Features & contents */}
          <Section title="Features & Box Contents">
            <div className="flex flex-col gap-6">
              <ListEditor
                label="Key Features"
                items={form.features}
                onChange={(v) => set("features", v)}
                placeholder="e.g. 200MP Camera"
              />
              <ListEditor
                label="Box Contents"
                items={form.box_contents}
                onChange={(v) => set("box_contents", v)}
                placeholder="e.g. 1x USB-C Cable"
              />
            </div>
          </Section>

          {/* Specifications */}
          <Section title="Specifications">
            <SpecsEditor
              specs={form.specifications}
              onChange={(v) => set("specifications", v)}
            />
          </Section>

          {/* SEO */}
          <Section title="SEO">
            <div className="flex flex-col gap-4">
              <Field label="Meta Title" hint="Defaults to product title if left empty">
                <input
                  value={form.meta_title}
                  onChange={(e) => set("meta_title", e.target.value)}
                  placeholder={form.title || "Meta title"}
                  className={inputCls}
                />
              </Field>
              <Field label="Meta Description">
                <textarea
                  value={form.meta_description}
                  onChange={(e) => set("meta_description", e.target.value)}
                  placeholder="Brief description for search engines…"
                  rows={3}
                  className={cn(inputCls, "resize-y")}
                />
              </Field>
              <Field label="Meta Keywords" hint="Comma-separated keywords, e.g. smartphone, samsung, android">
                <input
                  value={form.meta_keywords}
                  onChange={(e) => set("meta_keywords", e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* RIGHT — pricing, stock, shipping */}
        <div className="flex flex-col gap-6">
          {/* Pricing */}
          <Section title="Pricing">
            <div className="flex flex-col gap-4">
              <Field label="Selling Price (₹)" required>
                <input
                  type="number"
                  value={form.price || ""}
                  onChange={(e) => set("price", Number(e.target.value))}
                  placeholder="0"
                  min={0}
                  step={0.01}
                  className={inputCls}
                  required
                />
              </Field>
              <Field label="MRP / Compare Price (₹)" hint="Show as strikethrough price">
                <input
                  type="number"
                  value={form.compare_price ?? ""}
                  onChange={(e) =>
                    set("compare_price", e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="0"
                  min={0}
                  step={0.01}
                  className={inputCls}
                />
              </Field>
              <Field label="Cost Price (₹)" hint="Internal use only">
                <input
                  type="number"
                  value={form.cost_price ?? ""}
                  onChange={(e) =>
                    set("cost_price", e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="0"
                  min={0}
                  step={0.01}
                  className={inputCls}
                />
              </Field>

              {/* Live discount indicator */}
              {discount > 0 && (
                <div className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                  {discount}% off — customers save ₹{((form.compare_price ?? 0) - form.price).toLocaleString("en-IN")}
                </div>
              )}
            </div>
          </Section>

          {/* Inventory */}
          <Section title="Inventory">
            <div className="flex flex-col gap-4">
              <Field label="Stock" required>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => set("stock", Number(e.target.value))}
                  placeholder="0"
                  min={0}
                  className={inputCls}
                />
              </Field>

              {/* Stock level indicator */}
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-medium",
                  form.stock === 0
                    ? "bg-red-50 text-red-700"
                    : form.stock < 10
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-green-50 text-green-700",
                )}
              >
                {form.stock === 0
                  ? "Out of stock"
                  : form.stock < 10
                  ? `Low stock — only ${form.stock} left`
                  : `${form.stock} units in stock`}
              </div>
            </div>
          </Section>

          {/* Shipping */}
          <Section title="Shipping">
            <Field label="Weight (kg)">
              <input
                type="number"
                value={form.weight ?? ""}
                onChange={(e) => set("weight", e.target.value ? Number(e.target.value) : null)}
                placeholder="0.0"
                min={0}
                step={0.001}
                className={inputCls}
              />
            </Field>
          </Section>

          {mode === "edit" && product && (
            <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground">ID:</span> {product.id}</p>
              <p className="mt-1"><span className="font-medium text-foreground">Created:</span>{" "}
                {new Date(product.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom save */}
      <div className="flex justify-end border-t border-border pt-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : mode === "create" ? "Create Product" : "Save Changes"}
        </button>
      </div>
    </form>
  )
}

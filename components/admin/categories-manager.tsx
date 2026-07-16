"use client"

import { useState, useTransition } from "react"
import {
  Plus, Pencil, Trash2, Check, X, Tag, Layers,
  ChevronRight, ChevronDown, FolderOpen, Folder,
} from "lucide-react"
import type { Category, Brand } from "@/app/actions/admin-categories"
import { upsertCategory, deleteCategory, upsertBrand, deleteBrand } from "@/app/actions/admin-categories"
import { toast } from "sonner"

type Tab = "categories" | "brands"

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

// ─── Inline editable name field ───────────────────────────────────────────────
function InlineEdit({
  value,
  onSave,
  onCancel,
  pending,
}: {
  value: string
  onSave: (v: string) => void
  onCancel: () => void
  pending: boolean
}) {
  const [v, setV] = useState(value)
  return (
    <div className="flex flex-1 items-center gap-2">
      <input
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (!e.nativeEvent.isComposing && e.key === "Enter") onSave(v)
          if (e.key === "Escape") onCancel()
        }}
        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <button
        onClick={() => onSave(v)}
        disabled={pending || !v.trim()}
        className="flex size-7 items-center justify-center rounded-lg bg-brand text-white transition hover:bg-brand/80 disabled:opacity-50"
        aria-label="Save"
      >
        <Check className="size-3.5" />
      </button>
      <button
        onClick={onCancel}
        className="flex size-7 items-center justify-center rounded-lg border border-border transition hover:bg-muted"
        aria-label="Cancel"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

// ─── Add inline row ───────────────────────────────────────────────────────────
function AddInline({
  placeholder,
  onAdd,
  onCancel,
}: {
  placeholder: string
  onAdd: (name: string) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState("")
  const [pending, start] = useTransition()

  function submit() {
    if (!name.trim()) return
    start(async () => { await onAdd(name.trim()); setName(""); onCancel() })
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-brand/40 bg-brand/5 px-3 py-2">
      <Plus className="size-4 shrink-0 text-brand" />
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (!e.nativeEvent.isComposing && e.key === "Enter") submit()
          if (e.key === "Escape") onCancel()
        }}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <button
        onClick={submit}
        disabled={pending || !name.trim()}
        className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand/80 disabled:opacity-50"
      >
        Add
      </button>
      <button onClick={onCancel} className="rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground">
        Cancel
      </button>
    </div>
  )
}

// ─── Sub-category row ─────────────────────────────────────────────────────────
function SubCategoryRow({
  cat,
  onDelete,
  onUpdate,
}: {
  cat: Category
  onDelete: (id: string) => void
  onUpdate: (id: string, name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [pending, start] = useTransition()

  function save(name: string) {
    start(async () => {
      await upsertCategory({ id: cat.id, name, slug: slugify(name), is_active: cat.is_active, parent_id: cat.parent_id })
      onUpdate(cat.id, name)
      setEditing(false)
      toast.success("Subcategory updated")
    })
  }

  function remove() {
    if (!confirm(`Delete subcategory "${cat.name}"?`)) return
    start(async () => { await deleteCategory(cat.id); onDelete(cat.id); toast.success("Subcategory deleted") })
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <div className="ml-1 h-4 w-px shrink-0 rounded-full bg-border" />
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
        <Tag className="size-3 text-muted-foreground" />
      </div>

      {editing ? (
        <InlineEdit value={cat.name} onSave={save} onCancel={() => setEditing(false)} pending={pending} />
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm text-foreground">{cat.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">{cat.slug}</p>
          </div>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${cat.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
            {cat.is_active ? "Active" : "Off"}
          </span>
          <div className="flex shrink-0 gap-1">
            <button onClick={() => setEditing(true)} className="flex size-6 items-center justify-center rounded-md border border-border transition hover:bg-muted" aria-label="Edit subcategory"><Pencil className="size-3" /></button>
            <button onClick={remove} disabled={pending} className="flex size-6 items-center justify-center rounded-md border border-destructive/30 text-destructive transition hover:bg-destructive/10 disabled:opacity-50" aria-label="Delete subcategory"><Trash2 className="size-3" /></button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Root category row (accordion) ───────────────────────────────────────────
function CategoryRow({
  cat,
  subcategories,
  onDeleteCat,
  onUpdateCat,
  onAddSub,
  onDeleteSub,
  onUpdateSub,
}: {
  cat: Category
  subcategories: Category[]
  onDeleteCat: (id: string) => void
  onUpdateCat: (id: string, name: string) => void
  onAddSub: (parentId: string, sub: Category) => void
  onDeleteSub: (id: string) => void
  onUpdateSub: (id: string, name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [addingSub, setAddingSub] = useState(false)
  const [pending, start] = useTransition()

  function save(name: string) {
    start(async () => {
      await upsertCategory({ id: cat.id, name, slug: slugify(name), is_active: cat.is_active })
      onUpdateCat(cat.id, name)
      setEditing(false)
      toast.success("Category updated")
    })
  }

  function remove() {
    if (!confirm(`Delete "${cat.name}" and all its subcategories?`)) return
    start(async () => { await deleteCategory(cat.id); onDeleteCat(cat.id); toast.success("Category deleted") })
  }

  async function addSub(name: string) {
    const res = await upsertCategory({ name, slug: slugify(name), is_active: true, parent_id: cat.id, display_order: subcategories.length + 1 })
    if (res.ok) {
      // Optimistic placeholder — real ID comes on next page load
      const newSub: Category = {
        id: `tmp-${Date.now()}`,
        name,
        slug: slugify(name),
        description: null,
        image: null,
        icon: null,
        parent_id: cat.id,
        display_order: subcategories.length + 1,
        is_active: true,
        created_at: new Date().toISOString(),
      }
      onAddSub(cat.id, newSub)
      setOpen(true)
      toast.success("Subcategory added")
    } else {
      toast.error("Failed to add subcategory")
    }
  }

  const ChevronIcon = open ? ChevronDown : ChevronRight
  const FolderIcon = open ? FolderOpen : Folder

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-muted"
          aria-label={open ? "Collapse" : "Expand"}
        >
          <ChevronIcon className="size-4 text-muted-foreground" />
        </button>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10">
          <FolderIcon className="size-4 text-brand" />
        </div>

        {editing ? (
          <InlineEdit value={cat.name} onSave={save} onCancel={() => setEditing(false)} pending={pending} />
        ) : (
          <>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setOpen((o) => !o)}>
              <p className="truncate text-sm font-semibold text-foreground">{cat.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {cat.slug} &middot; {subcategories.length} sub{subcategories.length === 1 ? "" : "s"}
              </p>
            </div>
            <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${cat.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {cat.is_active ? "Active" : "Off"}
            </span>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => { setAddingSub(true); setOpen(true) }}
                className="flex items-center gap-1 rounded-lg border border-brand/30 bg-brand/5 px-2 py-1 text-xs font-medium text-brand transition hover:bg-brand/10"
                aria-label="Add subcategory"
              >
                <Plus className="size-3" /> Sub
              </button>
              <button onClick={() => setEditing(true)} className="flex size-7 items-center justify-center rounded-lg border border-border transition hover:bg-muted" aria-label="Edit"><Pencil className="size-3.5" /></button>
              <button onClick={remove} disabled={pending} className="flex size-7 items-center justify-center rounded-lg border border-destructive/30 text-destructive transition hover:bg-destructive/10 disabled:opacity-50" aria-label="Delete"><Trash2 className="size-3.5" /></button>
            </div>
          </>
        )}
      </div>

      {/* Subcategories panel */}
      {open && (
        <div className="flex flex-col gap-2 border-t border-border bg-muted/20 px-4 py-3">
          {subcategories.length === 0 && !addingSub && (
            <p className="py-2 text-center text-xs text-muted-foreground">No subcategories yet.</p>
          )}
          {subcategories.map((sub) => (
            <SubCategoryRow
              key={sub.id}
              cat={sub}
              onDelete={onDeleteSub}
              onUpdate={onUpdateSub}
            />
          ))}
          {addingSub && (
            <AddInline
              placeholder={`New subcategory under "${cat.name}"…`}
              onAdd={addSub}
              onCancel={() => setAddingSub(false)}
            />
          )}
          {!addingSub && (
            <button
              onClick={() => setAddingSub(true)}
              className="mt-1 flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-brand hover:text-brand"
            >
              <Plus className="size-3.5" /> Add subcategory
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Brand Row ────────────────────────────────────────────────────────────────
function BrandRow({ brand, onSaved, onDelete }: { brand: Brand; onSaved: () => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  const [pending, start] = useTransition()

  function save(name: string) {
    start(async () => {
      await upsertBrand({ id: brand.id, name, slug: slugify(name), is_active: brand.is_active })
      setEditing(false)
      onSaved()
    })
  }

  function remove() {
    if (!confirm(`Delete brand "${brand.name}"?`)) return
    start(async () => { await deleteBrand(brand.id); onDelete() })
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Layers className="size-4 text-muted-foreground" />
      </div>
      {editing ? (
        <InlineEdit value={brand.name} onSave={save} onCancel={() => setEditing(false)} pending={pending} />
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{brand.name}</p>
            <p className="truncate text-xs text-muted-foreground">{brand.slug}</p>
          </div>
          <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${brand.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
            {brand.is_active ? "Active" : "Off"}
          </span>
          <div className="flex shrink-0 gap-1">
            <button onClick={() => setEditing(true)} className="flex size-7 items-center justify-center rounded-lg border border-border transition hover:bg-muted" aria-label="Edit"><Pencil className="size-3.5" /></button>
            <button onClick={remove} disabled={pending} className="flex size-7 items-center justify-center rounded-lg border border-destructive/30 text-destructive transition hover:bg-destructive/10 disabled:opacity-50" aria-label="Delete"><Trash2 className="size-3.5" /></button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function CategoriesManager({
  initialCategories,
  initialBrands,
}: {
  initialCategories: Category[]
  initialBrands: Brand[]
}) {
  const [tab, setTab] = useState<Tab>("categories")
  const [categories, setCategories] = useState(initialCategories)
  const [brands, setBrands] = useState(initialBrands)
  const [addingRoot, setAddingRoot] = useState(false)

  // Build tree: roots + map of parent_id → children
  const roots = categories.filter((c) => !c.parent_id)
  const subsOf = (parentId: string) => categories.filter((c) => c.parent_id === parentId)

  function handleDeleteCat(id: string) {
    // Remove the category AND any of its children
    setCategories((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id))
  }

  function handleUpdateCat(id: string, name: string) {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, name, slug: slugify(name) } : c))
  }

  function handleAddSub(parentId: string, sub: Category) {
    setCategories((prev) => [...prev, sub])
  }

  function handleDeleteSub(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  function handleUpdateSub(id: string, name: string) {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, name, slug: slugify(name) } : c))
  }

  async function addRootCategory(name: string) {
    const res = await upsertCategory({ name, slug: slugify(name), is_active: true, display_order: roots.length + 1 })
    if (res.ok) {
      setCategories((prev) => [
        ...prev,
        {
          id: `tmp-${Date.now()}`,
          name,
          slug: slugify(name),
          description: null,
          image: null,
          icon: null,
          parent_id: null,
          display_order: prev.length + 1,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
      toast.success("Category created")
    } else {
      toast.error("Failed to create category")
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "categories", label: "Categories", count: roots.length },
    { key: "brands", label: "Brands", count: brands.length },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-medium transition ${
              tab === t.key ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Categories ── */}
      {tab === "categories" && (
        <div className="flex flex-col gap-3">
          {/* Add root category */}
          {addingRoot ? (
            <AddInline
              placeholder="New top-level category name…"
              onAdd={addRootCategory}
              onCancel={() => setAddingRoot(false)}
            />
          ) : (
            <button
              onClick={() => setAddingRoot(true)}
              className="flex items-center gap-2 self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/80"
            >
              <Plus className="size-4" /> Add Category
            </button>
          )}

          {roots.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No categories yet. Add one above.</p>
          ) : (
            roots.map((cat) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                subcategories={subsOf(cat.id)}
                onDeleteCat={handleDeleteCat}
                onUpdateCat={handleUpdateCat}
                onAddSub={handleAddSub}
                onDeleteSub={handleDeleteSub}
                onUpdateSub={handleUpdateSub}
              />
            ))
          )}
        </div>
      )}

      {/* ── Brands ── */}
      {tab === "brands" && (
        <div className="flex flex-col gap-4">
          <button
            onClick={async () => {
              const name = prompt("New brand name:")
              if (name?.trim()) {
                await upsertBrand({ name: name.trim(), is_active: true })
                setBrands((p) => [...p, { id: `tmp-${Date.now()}`, name: name.trim(), slug: slugify(name.trim()), logo_url: null, is_active: true, created_at: new Date().toISOString() }])
              }
            }}
            className="flex items-center gap-2 self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/80"
          >
            <Plus className="size-4" /> Add Brand
          </button>
          <div className="flex flex-col gap-2">
            {brands.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No brands yet.</p>
            ) : (
              brands.map((brand) => (
                <BrandRow
                  key={brand.id}
                  brand={brand}
                  onSaved={() => {}}
                  onDelete={() => setBrands((p) => p.filter((b) => b.id !== brand.id))}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

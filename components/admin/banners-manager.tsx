"use client"

import { useState, useTransition } from "react"
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, Image as ImageIcon } from "lucide-react"
import { SupabaseImageUpload } from "@/components/admin/supabase-image-upload"
import {
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
  type Banner,
  type BannerFormData,
} from "@/app/actions/admin-banners"
import { toast } from "sonner"


const EMPTY_FORM: BannerFormData = {
  image_url: "",
  bg_color: "#1b2341",
  sort_order: 99,
  is_active: true,
}

function BannerPreview({ form }: { form: BannerFormData }) {
  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{ backgroundColor: form.bg_color, aspectRatio: "16/9" }}
    >
      {form.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={form.image_url}
          alt="Banner preview"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="h-10 w-10 text-white/20" />
        </div>
      )}
    </div>
  )
}

function BannerFormModal({
  banner,
  onClose,
  onSaved,
}: {
  banner: Banner | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!banner
  const [form, setForm] = useState<BannerFormData>(
    isEdit
      ? {
          image_url: banner.image_url ?? "",
          bg_color: banner.bg_color,
          sort_order: banner.sort_order,
          is_active: banner.is_active,
        }
      : EMPTY_FORM,
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const set = (k: keyof BannerFormData, v: string | boolean | number) =>
    setForm((f) => ({ ...f, [k]: v }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const res = isEdit
        ? await updateBanner(banner.id, form)
        : await createBanner(form)
      if (!res.ok) { setError(res.error ?? "Something went wrong."); toast.error(res.error ?? "Something went wrong."); return }
      toast.success(isEdit ? "Banner updated" : "Banner created")
      onSaved()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">
            {isEdit ? "Edit Banner" : "Add Banner"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-5 p-6">
            {/* Live preview */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
              <BannerPreview form={form} />
            </div>

            {/* Image upload */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Banner Image</label>
              <SupabaseImageUpload
                value={form.image_url ?? ""}
                onChange={(url) => set("image_url", url)}
                bucket="banners"
                aspectClass="aspect-video"
                placeholder="Click or drag banner image here"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Recommended: 1920 × 1080 px (16:9). Leave empty for a solid color banner.
              </p>
            </div>

            {/* Sort order + active */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Sort Order</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => set("sort_order", Number(e.target.value))}
                  min={1}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2.5">
                  <span className="text-sm font-medium text-foreground">Active</span>
                  <div className="relative ml-auto">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.is_active}
                      onChange={(e) => set("is_active", e.target.checked)}
                    />
                    <div className={`h-6 w-10 rounded-full transition ${form.is_active ? "bg-brand" : "bg-muted-foreground/30"}`} />
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.is_active ? "left-[1.375rem]" : "left-0.5"}`} />
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand px-6 py-2 text-sm font-bold text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Saving…" : isEdit ? "Save Changes" : "Add Banner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function BannersManager({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners)
  const [editing, setEditing] = useState<Banner | null | "new">(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function refresh() {
    // Re-fetch by reloading; the page is force-dynamic so data stays fresh
    window.location.reload()
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await deleteBanner(id)
      setDeletingId(null)
      setBanners((b) => b.filter((x) => x.id !== id))
      toast.success("Banner deleted")
    })
  }

  function handleToggle(id: string, current: boolean) {
    setBanners((b) => b.map((x) => (x.id === id ? { ...x, is_active: !current } : x)))
    startTransition(async () => {
      await toggleBannerActive(id, !current)
      toast.success(!current ? "Banner activated" : "Banner deactivated")
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Banners</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage homepage carousel banners. Drag to reorder, toggle to show/hide.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-brand-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Banner
        </button>
      </div>

      {/* Banner list */}
      {banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No banners yet</p>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-bold text-brand-foreground hover:opacity-90"
          >
            Add your first banner
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {banners.map((banner, idx) => (
            <div
              key={banner.id}
              className={`flex items-stretch gap-0 overflow-hidden rounded-xl border transition ${
                banner.is_active ? "border-border bg-card" : "border-dashed border-border bg-muted/40 opacity-60"
              }`}
            >
              {/* Color swatch */}
              <div
                className="w-3 shrink-0"
                style={{ backgroundColor: banner.bg_color }}
              />

              {/* Drag handle */}
              <div className="flex items-center px-2 text-muted-foreground/40">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Order number */}
              <div className="flex w-8 shrink-0 items-center justify-center text-sm font-bold text-muted-foreground">
                {idx + 1}
              </div>

              {/* Thumbnail */}
              <div className="flex items-center py-2 pl-1 pr-3">
                <div
                  className="h-14 w-24 shrink-0 overflow-hidden rounded-md border border-border"
                  style={{ backgroundColor: banner.bg_color }}
                >
                  {banner.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={banner.image_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-1 flex-col justify-center gap-1 py-3 pr-2">
                <p className="text-sm font-semibold text-foreground">
                  Banner {idx + 1}
                </p>
                <span className={`w-fit rounded px-2 py-0.5 text-[10px] font-medium ${
                  banner.image_url
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {banner.image_url ? "Image uploaded" : "No image"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1 px-3">
                {/* Active toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(banner.id, banner.is_active)}
                  title={banner.is_active ? "Deactivate" : "Activate"}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {banner.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => setEditing(banner)}
                  title="Edit banner"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(banner.id)}
                  disabled={deletingId === banner.id}
                  title="Delete banner"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live preview strip */}
      {banners.filter((b) => b.is_active).length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active banners preview
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {banners.filter((b) => b.is_active).map((b) => (
              <div key={b.id} className="w-64 shrink-0">
                <BannerPreview
                  form={{
                    image_url: b.image_url ?? "",
                    bg_color: b.bg_color,
                    sort_order: b.sort_order,
                    is_active: b.is_active,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {editing !== null && (
        <BannerFormModal
          banner={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh() }}
        />
      )}
    </div>
  )
}
